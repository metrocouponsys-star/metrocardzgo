"""
Metro Cardz — FastAPI Dependencies
Reusable dependency functions injected into route handlers.
"""
from typing import Generator, Optional
from fastapi import Depends, HTTPException, status, Cookie, Header
from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.core.security import decode_token
from app.models.merchant import MerchantUser, Merchant


# ── Database Session ──────────────────────────────────────────────────────────
def get_db() -> Generator[Session, None, None]:
    """Yield a database session, automatically closing it after use."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ── Current User ──────────────────────────────────────────────────────────────
def get_current_user(
    authorization: Optional[str] = Header(default=None),
    db: Session = Depends(get_db),
) -> MerchantUser:
    """
    Extract and validate JWT from Authorization: Bearer <token> header.
    Returns the authenticated MerchantUser (owner, staff, or super_admin).
    Raises 401 if token is missing, invalid, or expired.
    """
    credentials_exc = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if not authorization or not authorization.startswith("Bearer "):
        raise credentials_exc

    token = authorization[len("Bearer "):]
    payload = decode_token(token)
    if not payload or payload.get("type") != "access":
        raise credentials_exc

    user_id: str = payload.get("sub")
    if not user_id:
        raise credentials_exc

    user = db.query(MerchantUser).filter(MerchantUser.id == user_id).first()
    if not user:
        raise credentials_exc

    return user


def get_current_active_user(
    current_user: MerchantUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> MerchantUser:
    """
    Additionally validates that the merchant account is active (not suspended).
    All merchant-scoped endpoints use this instead of get_current_user.
    This is the CRITICAL tenant isolation check — a suspended merchant's staff
    cannot access the API even with a valid, non-expired JWT.
    """
    if current_user.role != "super_admin":
        merchant = db.query(Merchant).filter(
            Merchant.id == current_user.merchant_id
        ).first()
        if not merchant or merchant.status != "active":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Merchant account is suspended",
            )
    return current_user


def require_super_admin(
    current_user: MerchantUser = Depends(get_current_user),
) -> MerchantUser:
    """Only allow super_admin role. Used for admin-panel endpoints."""
    if current_user.role != "super_admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Super admin access required",
        )
    return current_user


def get_merchant_id(
    current_user: MerchantUser = Depends(get_current_active_user),
) -> str:
    """
    Convenience dependency: returns the merchant_id from the JWT.
    NEVER use a merchant_id from the request body/params — use this instead.
    This enforces tenant isolation — JWT-claimed merchant_id cannot be spoofed.
    """
    if not current_user.merchant_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No merchant associated with this account",
        )
    return current_user.merchant_id
