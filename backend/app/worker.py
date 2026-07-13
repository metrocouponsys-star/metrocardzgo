"""
Metro Cardz — Celery Background Worker
Handles async tasks: hourly reminder scans (Feature 2), message dispatch, PDF generation.
On free tier (Render.com), these are triggered via GitHub Actions cron webhooks
instead of a persistent worker process.

Feature 2 — Merchant-Configurable Reminder Timing:
  The daily cron is replaced with an hourly sweep. Each reminder rule now has:
  - send_time (TIME): what time of day to send
  - days_before (INTEGER): how many days before the event to send
  The hourly sweep fires for a rule if the current hour matches the rule's send_time hour.
  Minute-level precision is not required — reminders don't need to fire at the exact second.
"""
from celery import Celery
from celery.schedules import crontab

from app.core.config import settings

celery_app = Celery(
    "metrocardz",
    broker=settings.redis_url,
    backend=settings.redis_url,
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="Asia/Kolkata",
    enable_utc=True,
    task_acks_late=True,           # Tasks are acknowledged AFTER completion (safer for retries)
    task_reject_on_worker_lost=True,
    worker_prefetch_multiplier=1,  # Process one task at a time (important for rate-limited SMS)
    # Retry policy: exponential backoff, max 3 attempts
    task_default_retry_delay=60,
    task_max_retries=3,
    # Feature 2: hourly sweep instead of once-daily fixed time
    # Runs every hour on the hour — checks per-rule send_time to decide whether to fire
    beat_schedule={
        "hourly-reminder-scan": {
            "task": "app.worker.hourly_reminder_scan",
            "schedule": crontab(minute=0),   # every hour on the :00
        },
    },
)


@celery_app.task(bind=True, name="app.worker.hourly_reminder_scan", max_retries=3)
def hourly_reminder_scan(self):
    """
    Feature 2: Hourly reminder sweep.
    Instead of a single platform-wide 8 AM cron, this runs every hour and
    checks each rule's send_time. A rule fires in the current hour if
    the current IST hour matches the rule's send_time hour.
    days_before controls how far in advance the event is matched.

    This approach allows each merchant to configure their own send time
    without requiring per-merchant scheduled jobs.
    """
    from app.core.database import SessionLocal
    from app.models.merchant import Merchant
    from app.models.campaign import ReminderRule
    from app.models.member import Member
    from datetime import date, timedelta, datetime
    import pytz

    db = SessionLocal()
    try:
        merchants = db.query(Merchant).filter(Merchant.status == "active").all()
        dispatched = 0

        for merchant in merchants:
            rules = db.query(ReminderRule).filter(
                ReminderRule.merchant_id == merchant.id,
                ReminderRule.active == True,
            ).all()

            for rule in rules:
                # Feature 2: check if this rule should fire in the current hour
                rule_tz_name = rule.timezone or "Asia/Kolkata"
                try:
                    rule_tz = pytz.timezone(rule_tz_name)
                except Exception:
                    rule_tz = pytz.timezone("Asia/Kolkata")

                now_local = datetime.now(rule_tz)
                current_hour = now_local.hour

                # Determine the rule's configured send hour (default: 9 AM)
                if rule.send_time:
                    rule_hour = rule.send_time.hour
                else:
                    rule_hour = 9  # default: 9 AM

                # Only process this rule if it's the right hour
                if current_hour != rule_hour:
                    continue

                days_before = rule.days_before or 0
                today = date.today()
                # The "target date" is today + days_before days away from now
                # e.g. for expiry 7 days before: target event date = today + 7
                target_event_date = today + timedelta(days=days_before)

                members_to_notify = []

                if rule.trigger_type == "birthday":
                    # Send to members whose birthday month/day matches target_event_date
                    all_members = db.query(Member).filter(
                        Member.merchant_id == merchant.id,
                        Member.status == "active",
                    ).all()
                    members_to_notify = [
                        m for m in all_members
                        if m.date_of_birth and
                        m.date_of_birth.month == target_event_date.month and
                        m.date_of_birth.day == target_event_date.day
                    ]

                elif rule.trigger_type == "expiry":
                    # Send to members whose membership expires on target_event_date
                    members_to_notify = db.query(Member).filter(
                        Member.merchant_id == merchant.id,
                        Member.status == "active",
                        Member.expiry_date == target_event_date,
                    ).all()

                elif rule.trigger_type == "anniversary":
                    all_members = db.query(Member).filter(
                        Member.merchant_id == merchant.id,
                        Member.status == "active",
                    ).all()
                    members_to_notify = [
                        m for m in all_members
                        if m.anniversary_date and
                        m.anniversary_date.month == target_event_date.month and
                        m.anniversary_date.day == target_event_date.day
                    ]

                elif rule.trigger_type == "loyalty_threshold":
                    # threshold_value = the balance that triggers the reminder
                    threshold = float(rule.threshold_value or 0)
                    if threshold > 0:
                        all_members = db.query(Member).filter(
                            Member.merchant_id == merchant.id,
                            Member.status == "active",
                        ).all()
                        members_to_notify = [
                            m for m in all_members
                            if float(m.loyalty_points or 0) >= threshold
                        ]

                for member in members_to_notify:
                    dispatch_message.apply_async(
                        kwargs={
                            "member_id": member.id,
                            "rule_id": rule.id,
                            "channel": rule.channel,
                            "template_text": rule.template_text,
                            "member_name": member.name,
                            "merchant_name": merchant.business_name,
                        },
                        countdown=dispatched * 2,  # Stagger sends to avoid rate limits
                    )
                    dispatched += 1

        print(f"✅ Hourly reminder scan complete. Dispatched {dispatched} messages.")
        return {"dispatched": dispatched}
    except Exception as exc:
        raise self.retry(exc=exc, countdown=300)
    finally:
        db.close()


@celery_app.task(bind=True, name="app.worker.dispatch_message", max_retries=3)
def dispatch_message(self, member_id: str, rule_id: str, channel: str,
                     template_text: str, member_name: str, merchant_name: str):
    """
    Send a single SMS or WhatsApp message to one member.
    Retried up to 3 times with exponential backoff on failure.
    """
    from app.core.database import SessionLocal
    from app.models.member import Member
    from app.models.campaign import MessageLog

    db = SessionLocal()
    try:
        member = db.query(Member).filter(Member.id == member_id).first()
        if not member:
            return {"status": "skipped", "reason": "member_not_found"}

        # Render template placeholders
        message = (
            template_text
            .replace("{name}", member_name)
            .replace("{business_name}", merchant_name)
            .replace("{balance}", str(int(member.loyalty_points or 0)))
        )

        delivery_status = "failed"
        if channel == "sms":
            delivery_status = _send_sms(member.phone, message)
        elif channel == "whatsapp":
            delivery_status = _send_whatsapp(member.phone, message)
        elif channel == "email":
            if member.email:
                delivery_status = _send_email_message(member.email, message, merchant_name)
            else:
                delivery_status = "skipped_no_email"

        # Log the result
        log = MessageLog(
            member_id=member_id,
            reminder_rule_id=rule_id,
            channel=channel,
            status=delivery_status,
        )
        db.add(log)
        db.commit()
        return {"status": delivery_status, "member_id": member_id}

    except Exception as exc:
        db.rollback()
        raise self.retry(exc=exc, countdown=60 * (self.request.retries + 1))
    finally:
        db.close()



def _send_sms(phone: str, message: str) -> str:
    """Send SMS via Msg91. Returns 'sent' or 'failed'."""
    from app.core.config import settings
    if not settings.msg91_api_key:
        print(f"[DEV] SMS to {phone}: {message}")
        return "sent"
    try:
        import httpx
        resp = httpx.post(
            "https://api.msg91.com/api/v5/flow/",
            json={
                "template_id": settings.msg91_template_id_otp,
                "short_url": "0",
                "recipients": [{"mobiles": f"91{phone}", "var1": message}],
            },
            headers={"authkey": settings.msg91_api_key, "content-type": "application/json"},
            timeout=10,
        )
        return "sent" if resp.status_code == 200 else "failed"
    except Exception:
        return "failed"


def _send_whatsapp(phone: str, message: str) -> str:
    """Send WhatsApp via AiSensy. Returns 'sent' or 'failed'."""
    from app.core.config import settings
    if not settings.aisensy_api_key:
        print(f"[DEV] WhatsApp to {phone}: {message}")
        return "sent"
    try:
        import httpx
        resp = httpx.post(
            "https://backend.aisensy.com/campaign/t1/api",
            json={
                "apiKey": settings.aisensy_api_key,
                "campaignName": settings.aisensy_campaign_name,
                "destination": f"91{phone}",
                "userName": "Metro Cardz",
                "templateParams": [message],
            },
            timeout=10,
        )
        return "sent" if resp.status_code == 200 else "failed"
    except Exception:
        return "failed"



def _send_email_message(email: str, message: str, merchant_name: str) -> str:
    """Send Email via SendGrid. Returns 'sent' or 'failed'."""
    from app.utils.email_utils import send_email
    subject = f"Notification from {merchant_name}"
    html_body = f"""
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px">
      <h2 style="color:#6366f1">{merchant_name}</h2>
      <p>{message}</p>
      <hr style="border:1px solid #e5e7eb;margin:24px 0"/>
      <p style="color:#9ca3af;font-size:12px">Metro Cardz — Loyalty Platform</p>
    </div>
    """
    success = send_email(to_email=email, subject=subject, html_body=html_body, plain_text=message)
    return "sent" if success else "failed"

