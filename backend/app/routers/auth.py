"""Auth router — login, OTP, token refresh, logout, Google OAuth."""
import redis as redis_lib
from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.core.deps import get_db, get_current_user
from app.core.security import verify_password, create_access_token, create_refresh_token, decode_token, generate_otp
from app.core.rate_limit import auth_rate_limit, otp_rate_limit
from app.core.config import settings
from app.models.merchant import MerchantUser, Merchant
from app.schemas import LoginRequest, EmailLoginRequest, OtpRequest, OtpVerifyRequest, LoginResponse, AuthUserOut, RefreshRequest
import redis as redis_lib

router = APIRouter(prefix="/auth", tags=["auth"])


# Redis for OTP storage
def _get_redis():
    return redis_lib.from_url(settings.redis_url, decode_responses=True)


def _build_login_response(user: MerchantUser, db: Session) -> LoginResponse:
    merchant_name = None
    if user.merchant_id:
        m = db.query(Merchant).filter(Merchant.id == user.merchant_id).first()
        merchant_name = m.business_name if m else None

    token_data = {"sub": user.id, "merchant_id": user.merchant_id, "role": user.role}
    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)

    return LoginResponse(
        user=AuthUserOut(
            id=user.id, name=user.name, phone=user.phone, role=user.role,
            merchant_id=user.merchant_id, merchant_name=merchant_name,
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
    try:
        r = _get_redis()
        r.setex(f"otp:{phone}", 300, otp)  # OTP expires in 5 minutes
    except Exception:
        pass  # Redis unavailable — still succeed (OTP won't work, but don't crash)

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

    try:
        r = _get_redis()
        stored_otp = r.get(f"otp:{phone}")
    except Exception:
        stored_otp = None

    if not stored_otp or stored_otp != payload.otp:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired OTP")

    user = db.query(MerchantUser).filter(MerchantUser.phone == phone).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")

    try:
        r.delete(f"otp:{phone}")  # Consume OTP after successful use
    except Exception:
        pass

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
    # JWT is stateless — client discards the token. For true invalidation,
    # add token ID to a Redis blacklist here.
    return {"message": "Logged out successfully"}


# ── Google OAuth (via Supabase) ───────────────────────────────────────────────

class GoogleLoginRequest(BaseModel):
    supabase_token: str


@router.post("/google", response_model=LoginResponse)
def google_login(payload: GoogleLoginRequest, request: Request, db: Session = Depends(get_db)):
    """
    Accept a Supabase JWT from the frontend (after Google OAuth).
    Validate it with Supabase, extract the user email, find the matching
    MerchantUser, and return our app JWT + user profile.
    """
    auth_rate_limit(request)

    # Validate Supabase token by calling Supabase's /auth/v1/user endpoint
    supabase_url = settings.supabase_url
    supabase_service_key = settings.supabase_service_key
    if not supabase_url:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Google login is not configured on this server."
        )

    try:
        import httpx
        resp = httpx.get(
            f"{supabase_url}/auth/v1/user",
            headers={
                "Authorization": f"Bearer {payload.supabase_token}",
                "apikey": supabase_service_key,
            },
            timeout=10,
        )
        if resp.status_code != 200:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid Google token")

        supabase_user = resp.json()
        email = supabase_user.get("email")
        if not email:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="No email in Google account")

    except httpx.RequestError:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Could not verify Google token")

    # Find the MerchantUser by email
    user = db.query(MerchantUser).filter(MerchantUser.email == email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found. Contact Metro Cardz support to get onboarded."
        )

    return _build_login_response(user, db)
