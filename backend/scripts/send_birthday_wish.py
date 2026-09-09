#!/usr/bin/env python3
"""
send_birthday_wish.py — Send birthday or anniversary greetings directly on WhatsApp.

Usage examples:
  # 1. Send directly to a phone number:
  python send_birthday_wish.py --phone 9876543210 --name "Rahul Sharma" --store "Metro Fashion"

  # 2. Send with custom message:
  python send_birthday_wish.py --phone 9876543210 --message "Happy Birthday Rahul! Enjoy 20% off today!"

  # 3. Look up a member by ID in database and send:
  python send_birthday_wish.py --member-id mem-001

  # 4. Automatically find and wish all members celebrating their birthday TODAY:
  python send_birthday_wish.py --today

  # 5. Open WhatsApp Web directly in your browser:
  python send_birthday_wish.py --phone 9876543210 --name "Priya" --browser
"""
import os
import sys
import argparse
import webbrowser
from datetime import date
from pathlib import Path

# Ensure console supports UTF-8 on Windows
if sys.stdout and hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

# Add backend to sys.path so app modules can be imported
backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

# Try loading .env
try:
    from dotenv import load_dotenv
    env_path = backend_dir / ".env"
    if env_path.exists():
        load_dotenv(env_path)
except ImportError:
    pass

from app.utils.whatsapp import (
    clean_phone_number,
    get_whatsapp_web_url,
    build_celebration_message,
    send_whatsapp_message,
)


def send_wish_to_recipient(
    phone: str,
    name: str,
    store_name: str = "Metro Cardz",
    event_type: str = "birthday",
    member_code: str = "",
    points: int = 0,
    custom_message: str = None,
    open_browser: bool = False,
) -> dict:
    """Send a single birthday or anniversary wish via WhatsApp."""
    message = build_celebration_message(
        member_name=name,
        event_type=event_type,
        merchant_name=store_name,
        member_code=member_code,
        loyalty_points=points,
        custom_message=custom_message,
    )
    result = send_whatsapp_message(phone=phone, message=message)
    clean = clean_phone_number(phone)
    web_url = get_whatsapp_web_url(clean, message)

    print("\n" + "=" * 60)
    print(f"🎉 Sending {event_type.title()} Wish via WhatsApp")
    print("=" * 60)
    print(f"Recipient: {name}")
    print(f"Phone:     +{clean}")
    print(f"Store:     {store_name}")
    print(f"Status:    {result.get('status', 'unknown').upper()} (via {result.get('provider', 'simulated')})")
    print(f"Message:\n  \"{message}\"")
    print(f"WhatsApp Web Link:\n  {web_url}")
    print("=" * 60)

    if open_browser:
        print("🌐 Opening WhatsApp Web in your browser...")
        try:
            webbrowser.open(web_url)
        except Exception as e:
            print(f"Could not open browser: {e}")

    return result


def send_wish_by_member_id(member_id: str, custom_message: str = None, open_browser: bool = False):
    """Look up member and merchant from DB and send WhatsApp wish."""
    from app.core.database import SessionLocal
    from app.models.member import Member
    from app.models.merchant import Merchant
    from app.models.campaign import MessageLog

    db = SessionLocal()
    try:
        member = db.query(Member).filter(Member.id == member_id).first()
        if not member:
            print(f"❌ Error: Member with ID '{member_id}' not found.")
            return

        merchant = db.query(Merchant).filter(Merchant.id == member.merchant_id).first()
        store_name = merchant.business_name if merchant else "Metro Cardz"

        # Determine if birthday or anniversary
        today = date.today()
        event_type = "birthday"
        if member.anniversary_date and member.anniversary_date.month == today.month and member.anniversary_date.day == today.day:
            event_type = "anniversary"

        res = send_wish_to_recipient(
            phone=member.phone,
            name=member.name,
            store_name=store_name,
            event_type=event_type,
            member_code=member.member_code,
            points=int(member.loyalty_points or 0),
            custom_message=custom_message,
            open_browser=open_browser,
        )

        # Audit log in database
        try:
            log = MessageLog(
                member_id=member.id,
                channel="whatsapp",
                status=res.get("status", "sent"),
            )
            db.add(log)
            db.commit()
            print("✅ Logged in MessageLog audit history.")
        except Exception as log_err:
            db.rollback()
            print(f"⚠️ Could not write to MessageLog: {log_err}")

    finally:
        db.close()


def send_today_celebrations(merchant_id: str = None, open_browser: bool = False):
    """Find all members whose birthday or anniversary is TODAY and send them wishes."""
    from app.core.database import SessionLocal
    from app.models.member import Member
    from app.models.merchant import Merchant
    from app.models.campaign import MessageLog

    db = SessionLocal()
    try:
        today = date.today()
        query = db.query(Member).filter(Member.status != "deactivated")
        if merchant_id:
            query = query.filter(Member.merchant_id == merchant_id)

        all_members = query.all()
        celebrating = []
        for m in all_members:
            if m.date_of_birth and m.date_of_birth.month == today.month and m.date_of_birth.day == today.day:
                celebrating.append((m, "birthday"))
            elif m.anniversary_date and m.anniversary_date.month == today.month and m.anniversary_date.day == today.day:
                celebrating.append((m, "anniversary"))

        if not celebrating:
            print(f"ℹ️ No members found with a birthday or anniversary today ({today.strftime('%d %B')}).")
            return

        print(f"🎈 Found {len(celebrating)} celebration(s) today ({today.strftime('%d %B')})!")
        for member, event_type in celebrating:
            merchant = db.query(Merchant).filter(Merchant.id == member.merchant_id).first()
            store_name = merchant.business_name if merchant else "Metro Cardz"

            res = send_wish_to_recipient(
                phone=member.phone,
                name=member.name,
                store_name=store_name,
                event_type=event_type,
                member_code=member.member_code,
                points=int(member.loyalty_points or 0),
                open_browser=open_browser,
            )

            try:
                log = MessageLog(
                    member_id=member.id,
                    channel="whatsapp",
                    status=res.get("status", "sent"),
                )
                db.add(log)
                db.commit()
            except Exception:
                db.rollback()

        print(f"\n✅ Finished sending wishes to all {len(celebrating)} members celebrating today!")
    finally:
        db.close()


def main():
    parser = argparse.ArgumentParser(
        description="Send WhatsApp birthday or anniversary wishes to members directly.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python send_birthday_wish.py --phone 9876543210 --name "Rahul Sharma"
  python send_birthday_wish.py --phone 9876543210 --name "Ananya" --store "Bliss Spa" --browser
  python send_birthday_wish.py --member-id mem-1234
  python send_birthday_wish.py --today
        """,
    )
    parser.add_argument("--phone", "-p", help="Recipient phone number (e.g. 9876543210)")
    parser.add_argument("--name", "-n", default="Valued Member", help="Recipient name")
    parser.add_argument("--store", "-s", default="Metro Cardz", help="Merchant / Store business name")
    parser.add_argument("--type", "-t", choices=["birthday", "anniversary"], default="birthday", help="Celebration event type")
    parser.add_argument("--message", "-m", help="Custom wish message text (overrides default template)")
    parser.add_argument("--member-id", help="Database Member ID to fetch and wish")
    parser.add_argument("--today", action="store_true", help="Send wishes to all members celebrating today")
    parser.add_argument("--merchant-id", help="Filter by merchant ID when using --today")
    parser.add_argument("--browser", "-b", action="store_true", help="Automatically open WhatsApp Web in browser")

    args = parser.parse_args()

    if args.today:
        send_today_celebrations(merchant_id=args.merchant_id, open_browser=args.browser)
    elif args.member_id:
        send_wish_by_member_id(member_id=args.member_id, custom_message=args.message, open_browser=args.browser)
    elif args.phone:
        send_wish_to_recipient(
            phone=args.phone,
            name=args.name,
            store_name=args.store,
            event_type=args.type,
            custom_message=args.message,
            open_browser=args.browser,
        )
    else:
        parser.print_help()
        print("\n❌ Error: Please specify either --phone, --member-id, or --today.")
        sys.exit(1)


if __name__ == "__main__":
    main()
