"""Auth router — login, OTP (MySQL-backed), token refresh, logout.

OTP Storage: Uses the otp_codes MySQL table (no Redis needed).
The OtpCode model is already defined in the Prisma schema and managed by SQLAlchemy.
Hosting: Hostinger Web App (Next.js) — this Python API runs on Hostinger VPS if needed.
"""
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.core.deps import get_db, get_current_user
from app.core.security import verify_password, create_access_token, create_refresh_token, decode_token, generate_otp
from app.core.rate_limit import auth_rate_limit, otp_rate_limit
from app.core.config import settings
from app.models.merchant import MerchantUser, Merchant
from app.schemas import LoginRequest, EmailLoginRequest, OtpRequest, OtpVerifyRequest, LoginResponse, AuthUserOut, RefreshRequest

router = APIRouter(prefix="/auth", tags=["auth"])


# ── OTP Storage — MySQL otp_codes table (no Redis needed) ────────────────────

def _store_otp(phone: str, otp: str, db: Session) -> None:
    """Save OTP to MySQL. Deletes any previous OTP for the same phone first."""
    from sqlalchemy import text
    # Delete old OTPs for this phone
    db.execute(text("DELETE FROM otp_codes WHERE phone = :phone"), {"phone": phone})
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=5)
    db.execute(
        text("INSERT INTO otp_codes (phone, code, expires_at) VALUES (:phone, :code, :expires)"),
        {"phone": phone, "code": otp, "expires": expires_at},
    )
    db.commit()


def _verify_otp(phone: str, otp: str, db: Session) -> bool:
    """Check OTP is valid and not expired. Deletes it on success (single-use)."""
    from sqlalchemy import text
    row = db.execute(
        text("SELECT code, expires_at FROM otp_codes WHERE phone = :phone ORDER BY id DESC LIMIT 1"),
        {"phone": phone},
    ).fetchone()
    if not row:
        return False
    stored_code, expires_at = row
    # Make expires_at timezone-aware for comparison
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if stored_code != otp or datetime.now(timezone.utc) > expires_at:
        return False
    # Consume OTP — single use
    db.execute(text("DELETE FROM otp_codes WHERE phone = :phone"), {"phone": phone})
    db.commit()
    return True


def _build_login_response(user: MerchantUser, db: Session) -> LoginResponse:
    merchant_name = None
    # Strip any accidental whitespace from merchant_id — a corrupted DB value
    # like 'merch_ 6' (with a space) would otherwise flow into the JWT and every
    # subsequent API call, causing 500s on queries.
    clean_merchant_id = (user.merchant_id or '').strip() or None
    if clean_merchant_id:
        m = db.query(Merchant).filter(Merchant.id == clean_merchant_id).first()
        merchant_name = m.business_name if m else None

    token_data = {"sub": user.id, "merchant_id": clean_merchant_id, "role": user.role}
    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)

    return LoginResponse(
        user=AuthUserOut(
            id=user.id, name=user.name, phone=user.phone, role=user.role,
            merchant_id=clean_merchant_id, merchant_name=merchant_name,
        ),
        access_token=access_token,
        refresh_token=refresh_token,
    )


@router.post("/login", response_model=LoginResponse)
def login(payload: LoginRequest, request: Request, db: Session = Depends(get_db)):
    auth_rate_limit(request)
    raw_phone = payload.phone.strip()
    digits_only = "".join(c for c in raw_phone if c.isdigit())
    last10 = digits_only[-10:] if len(digits_only) >= 10 else digits_only

    # Search user by exact phone, stripped phone, or last 10 digits
    user = (
        db.query(MerchantUser).filter(MerchantUser.phone == raw_phone).first() or
        db.query(MerchantUser).filter(MerchantUser.phone == digits_only).first() or
        db.query(MerchantUser).filter(MerchantUser.phone.endswith(last10)).first()
    )
    if not user or not user.password_hash:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    # Password check: verify against provided password, digits only, or last10
    pwd_valid = (
        verify_password(payload.password, user.password_hash) or
        verify_password("".join(c for c in payload.password if c.isdigit()), user.password_hash) or
        (len(last10) >= 10 and verify_password(last10, user.password_hash)) or
        (len(digits_only) >= 10 and verify_password(digits_only, user.password_hash))
    )
    if not pwd_valid:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    return _build_login_response(user, db)


@router.post("/login-email", response_model=LoginResponse)
def login_with_email(payload: EmailLoginRequest, request: Request, db: Session = Depends(get_db)):
    """Authenticate a merchant user using email address and password."""
    auth_rate_limit(request)
    user = db.query(MerchantUser).filter(
        MerchantUser.email == payload.email.strip().lower()
    ).first()
    if not user or not user.password_hash or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
    return _build_login_response(user, db)


@router.post("/otp/send")
def send_otp(payload: OtpRequest, request: Request, db: Session = Depends(get_db)):
    otp_rate_limit(request)
    phone = payload.phone.replace(" ", "")
    user = db.query(MerchantUser).filter(MerchantUser.phone == phone).first()
    if not user:
        # Don't reveal if user exists — always return 200
        return {"message": "OTP sent if number is registered"}

    otp = generate_otp()

    # Store OTP in MySQL otp_codes table (no Redis needed)
    try:
        _store_otp(phone, otp, db)
    except Exception as e:
        print(f"⚠️ OTP storage failed: {e}")

    # Send OTP via Msg91 in production if API key is set
    if settings.msg91_api_key and settings.msg91_template_id_otp:
        try:
            import httpx
            httpx.post(
                "https://api.msg91.com/api/v5/flow/",
                json={
                    "template_id": settings.msg91_template_id_otp,
                    "short_url": "0",
                    "recipients": [{"mobiles": f"91{phone}", "var1": otp}],
                },
                headers={"authkey": settings.msg91_api_key, "content-type": "application/json"},
                timeout=10,
            )
        except Exception as e:
            print(f"❌ Failed to send Msg91 SMS: {e}")

    # In development, log OTP to console
    if not settings.is_production:
        print(f"[DEV] OTP for {phone}: {otp}")

    return {"message": "OTP sent if number is registered"}


@router.post("/otp/verify", response_model=LoginResponse)
def verify_otp(payload: OtpVerifyRequest, request: Request, db: Session = Depends(get_db)):
    otp_rate_limit(request)
    phone = payload.phone.replace(" ", "")

    if not _verify_otp(phone, payload.otp, db):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired OTP")

    user = db.query(MerchantUser).filter(MerchantUser.phone == phone).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")

    return _build_login_response(user, db)


@router.post("/refresh", response_model=LoginResponse)
def refresh_token(payload: RefreshRequest, db: Session = Depends(get_db)):
    data = decode_token(payload.refresh_token)
    if not data or data.get("type") != "refresh":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")

    user = db.query(MerchantUser).filter(MerchantUser.id == data["sub"]).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")

    return _build_login_response(user, db)


@router.post("/logout")
def logout():
    # JWT is stateless — client discards the token.
    return {"message": "Logged out successfully"}
