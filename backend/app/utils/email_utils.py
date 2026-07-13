"""
Metro Cardz — Email Utility (SendGrid)
Graceful: if SENDGRID_API_KEY is not set, emails are logged to console (dev mode).
Free tier: 100 emails/day — sufficient for birthday/anniversary/expiry notifications.
"""
import logging
from typing import Optional

log = logging.getLogger(__name__)


def send_email(
    to_email: str,
    subject: str,
    html_body: str,
    plain_text: Optional[str] = None,
) -> bool:
    """
    Send a transactional email via SendGrid.
    Returns True on success, False on failure. Never raises — errors are logged.
    """
    from app.core.config import settings

    if not settings.sendgrid_api_key:
        log.info("[DEV] Email to %s | Subject: %s | Body: %s", to_email, subject, plain_text or html_body[:100])
        return True

    try:
        import httpx
        resp = httpx.post(
            "https://api.sendgrid.com/v3/mail/send",
            json={
                "personalizations": [{"to": [{"email": to_email}]}],
                "from": {"email": settings.sendgrid_from_email, "name": "Metro Cardz"},
                "subject": subject,
                "content": [
                    {"type": "text/plain", "value": plain_text or subject},
                    {"type": "text/html", "value": html_body},
                ],
            },
            headers={
                "Authorization": f"Bearer {settings.sendgrid_api_key}",
                "Content-Type": "application/json",
            },
            timeout=10,
        )
        if resp.status_code in (200, 202):
            return True
        log.error("SendGrid error %s: %s", resp.status_code, resp.text)
        return False
    except Exception as exc:
        log.error("Email send failed: %s", exc)
        return False


def build_birthday_email(member_name: str, business_name: str, points_balance: int) -> str:
    return f"""
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px">
      <h2 style="color:#6366f1">🎂 Happy Birthday, {member_name}!</h2>
      <p>{business_name} wishes you a wonderful birthday.</p>
      <p>Your current loyalty points: <strong>{points_balance} pts</strong></p>
      <p>Visit us today for your birthday offer!</p>
      <hr style="border:1px solid #e5e7eb;margin:24px 0"/>
      <p style="color:#9ca3af;font-size:12px">Metro Cardz — Loyalty Platform</p>
    </div>
    """


def build_expiry_email(member_name: str, business_name: str, expiry_date: str) -> str:
    return f"""
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px">
      <h2 style="color:#f59e0b">⚠️ Your Membership is Expiring Soon</h2>
      <p>Hi {member_name},</p>
      <p>Your membership at <strong>{business_name}</strong> expires on <strong>{expiry_date}</strong>.</p>
      <p>Renew now to keep your loyalty points and offers!</p>
      <hr style="border:1px solid #e5e7eb;margin:24px 0"/>
      <p style="color:#9ca3af;font-size:12px">Metro Cardz — Loyalty Platform</p>
    </div>
    """
