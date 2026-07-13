"""
Metro Cardz — JWT + Password Security Utilities
"""
from datetime import datetime, timedelta, timezone
from typing import Optional
import hmac
import hashlib
import secrets

import bcrypt
from jose import JWTError, jwt

from app.core.config import settings

# ── Password Hashing (Direct Bcrypt) ──────────────────────────────────────────
def hash_password(password: str) -> str:
    pwd_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(pwd_bytes, salt)
    return hashed.decode('utf-8')


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode('utf-8'), hashed.encode('utf-8'))
    except Exception:
        return False


# ── JWT Tokens ────────────────────────────────────────────────────────────────
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    payload = data.copy()
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=settings.access_token_expire_minutes)
    )
    payload.update({"exp": expire, "type": "access"})
    return jwt.encode(payload, settings.secret_key, algorithm=settings.jwt_algorithm)


def create_refresh_token(data: dict) -> str:
    payload = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(days=settings.refresh_token_expire_days)
    payload.update({"exp": expire, "type": "refresh"})
    return jwt.encode(payload, settings.secret_key, algorithm=settings.jwt_algorithm)


def decode_token(token: str) -> Optional[dict]:
    try:
        return jwt.decode(token, settings.secret_key, algorithms=[settings.jwt_algorithm])
    except JWTError:
        return None


# ── Member Public Token ───────────────────────────────────────────────────────
def generate_public_token(member_id: str, merchant_secret_salt: str) -> str:
    """
    Generate an HMAC-signed, opaque public token for a member's QR code.
    This is the token embedded in the public self-check URL: /m/<token>
    It is non-sequential and cannot be guessed or enumerated.
    """
    key = merchant_secret_salt.encode()
    msg = member_id.encode()
    # hmac.new() is the correct Python API (not hmac.HMAC directly)
    mac = hmac.new(key, msg, digestmod=hashlib.sha256)
    return mac.hexdigest()[:24]


# ── OTP ──────────────────────────────────────────────────────────────────────
def generate_otp(length: int = 6) -> str:
    """
    Generate a cryptographically secure OTP.
    Uses secrets.choice instead of random.choices to avoid predictable sequences.
    """
    import string
    return "".join(secrets.choice(string.digits) for _ in range(length))
