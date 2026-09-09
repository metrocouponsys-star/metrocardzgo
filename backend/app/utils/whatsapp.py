"""
WhatsApp messaging service for Metro Cardz.
Supports AiSensy, Meta WhatsApp Cloud API, UltraMsg, Twilio, and direct wa.me link generation.
"""
import os
import re
import sys
import urllib.parse
from typing import Optional, Dict, Any
import httpx

# Ensure console supports UTF-8 on Windows
if sys.stdout and hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

try:
    from app.core.config import settings
except Exception:
    settings = None


def clean_phone_number(phone: str) -> str:
    """Normalize phone number to international format (defaulting to India country code 91 if 10 digits)."""
    if not phone:
        return ""
    digits = re.sub(r"\D", "", str(phone))
    if len(digits) == 10:
        return f"91{digits}"
    elif len(digits) == 11 and digits.startswith("0"):
        return f"91{digits[1:]}"
    elif len(digits) == 12 and digits.startswith("91"):
        return digits
    return digits


def get_whatsapp_web_url(phone: str, message: str) -> str:
    """Generate wa.me direct chat link with pre-filled message."""
    clean = clean_phone_number(phone)
    encoded = urllib.parse.quote(message)
    return f"https://wa.me/{clean}?text={encoded}"


def build_celebration_message(
    member_name: str,
    event_type: str = "birthday",
    merchant_name: str = "Metro Cardz",
    member_code: Optional[str] = None,
    loyalty_points: Optional[int] = None,
    custom_message: Optional[str] = None,
) -> str:
    """Construct a warm, personalized greeting message for celebrations."""
    if custom_message and custom_message.strip():
        return custom_message.strip()

    name = member_name.strip() if member_name else "Valued Member"
    store = merchant_name.strip() if merchant_name else "our store"
    code_text = f" (Member #{member_code})" if member_code else ""
    pts_text = f" Your current points balance: {loyalty_points} pts." if loyalty_points is not None and loyalty_points > 0 else ""

    if event_type == "anniversary":
        return (
            f"Dear {name}, Happy Anniversary from all of us at {store}! 💍💐 "
            f"We wish you continued joy, love, and happiness! Visit us today to celebrate "
            f"with your special anniversary membership perks{code_text}.{pts_text}"
        )

    # Default is birthday
    return (
        f"Dear {name}, wishing you a very Happy Birthday from all of us at {store}! 🎂🎉 "
        f"May your day be filled with happiness and celebration! Enjoy your exclusive birthday rewards "
        f"on your membership{code_text}.{pts_text} We look forward to celebrating with you!"
    )


def send_whatsapp_message(phone: str, message: str) -> Dict[str, Any]:
    """
    Send WhatsApp message using available gateway.
    Priority:
      1. AiSensy (if AISENSY_API_KEY is configured)
      2. UltraMsg (if ULTRAMSG_INSTANCE_ID and ULTRAMSG_TOKEN are configured)
      3. Meta WhatsApp Cloud API (if WHATSAPP_API_TOKEN and WHATSAPP_PHONE_NUMBER_ID are configured)
      4. Twilio (if TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN are configured)
      5. Dev / Simulated Fallback (logs message and succeeds so app continues smoothly)
    """
    clean_phone = clean_phone_number(phone)
    web_url = get_whatsapp_web_url(phone, message)

    if not clean_phone:
        return {
            "status": "failed",
            "error": "Invalid or missing phone number",
            "phone": phone,
            "whatsapp_url": "",
        }

    # 1. AiSensy Gateway
    aisensy_key = getattr(settings, "aisensy_api_key", "") or os.getenv("AISENSY_API_KEY", "")
    if aisensy_key:
        campaign_name = getattr(settings, "aisensy_campaign_name", "metrocardz_reminder") or "metrocardz_reminder"
        try:
            resp = httpx.post(
                "https://backend.aisensy.com/campaign/t1/api",
                json={
                    "apiKey": aisensy_key,
                    "campaignName": campaign_name,
                    "destination": clean_phone,
                    "userName": "Metro Cardz",
                    "templateParams": [message],
                },
                timeout=10,
            )
            if resp.status_code in (200, 201):
                return {
                    "status": "sent",
                    "provider": "aisensy",
                    "phone": clean_phone,
                    "whatsapp_url": web_url,
                }
        except Exception as e:
            print(f"[WhatsApp] AiSensy error: {e}")

    # 2. UltraMsg Gateway (popular for direct unapproved template messages)
    ultramsg_instance = os.getenv("ULTRAMSG_INSTANCE_ID", "")
    ultramsg_token = os.getenv("ULTRAMSG_TOKEN", "")
    if ultramsg_instance and ultramsg_token:
        try:
            resp = httpx.post(
                f"https://api.ultramsg.com/{ultramsg_instance}/messages/chat",
                data={
                    "token": ultramsg_token,
                    "to": f"+{clean_phone}",
                    "body": message,
                },
                timeout=10,
            )
            if resp.status_code == 200:
                return {
                    "status": "sent",
                    "provider": "ultramsg",
                    "phone": clean_phone,
                    "whatsapp_url": web_url,
                }
        except Exception as e:
            print(f"[WhatsApp] UltraMsg error: {e}")

    # 3. Meta WhatsApp Cloud API
    meta_token = os.getenv("WHATSAPP_API_TOKEN", "")
    meta_phone_id = os.getenv("WHATSAPP_PHONE_NUMBER_ID", "")
    if meta_token and meta_phone_id:
        try:
            resp = httpx.post(
                f"https://graph.facebook.com/v18.0/{meta_phone_id}/messages",
                headers={
                    "Authorization": f"Bearer {meta_token}",
                    "Content-Type": "application/json",
                },
                json={
                    "messaging_product": "whatsapp",
                    "to": clean_phone,
                    "type": "text",
                    "text": {"body": message},
                },
                timeout=10,
            )
            if resp.status_code in (200, 201):
                return {
                    "status": "sent",
                    "provider": "meta_cloud_api",
                    "phone": clean_phone,
                    "whatsapp_url": web_url,
                }
        except Exception as e:
            print(f"[WhatsApp] Meta API error: {e}")

    # 4. Twilio
    twilio_sid = os.getenv("TWILIO_ACCOUNT_SID", "")
    twilio_token = os.getenv("TWILIO_AUTH_TOKEN", "")
    twilio_from = os.getenv("TWILIO_WHATSAPP_NUMBER", "")
    if twilio_sid and twilio_token and twilio_from:
        try:
            resp = httpx.post(
                f"https://api.twilio.com/2010-04-01/Accounts/{twilio_sid}/Messages.json",
                auth=(twilio_sid, twilio_token),
                data={
                    "From": f"whatsapp:{twilio_from}",
                    "To": f"whatsapp:+{clean_phone}",
                    "Body": message,
                },
                timeout=10,
            )
            if resp.status_code in (200, 201):
                return {
                    "status": "sent",
                    "provider": "twilio",
                    "phone": clean_phone,
                    "whatsapp_url": web_url,
                }
        except Exception as e:
            print(f"[WhatsApp] Twilio error: {e}")

    # 5. Dev / Simulated Fallback (no external gateway credentials yet)
    print(f"[WhatsApp DEV/DIRECT] To: {clean_phone} | Msg: {message}")
    return {
        "status": "sent",
        "provider": "simulated",
        "phone": clean_phone,
        "whatsapp_url": web_url,
        "note": "Message prepared and logged. Open whatsapp_url to view or send in WhatsApp Web/App.",
    }
