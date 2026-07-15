"""
Metro Cardz — Google Wallet Pass Router
Endpoints for generating signed Google Wallet JWT save URLs,
fetching pass status, and triggering server-push updates.

NOTE: In production, populate GOOGLE_WALLET_ISSUER_ID and mount a service account
key at GOOGLE_WALLET_SERVICE_ACCOUNT_JSON_PATH. While those env vars are absent,
the router returns a demo URL so the front-end works in development.
"""
import json
import uuid
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.deps import get_db, get_current_active_user, get_merchant_id
from app.core.config import settings
from app.models.member import Member
from app.models.merchant import Merchant
from app.models.wallet import MerchantWalletClass, MemberWalletPass
from app.schemas import WalletSaveUrlOut, MerchantWalletClassOut, MemberWalletPassOut

wallet_router = APIRouter(prefix="/wallet", tags=["wallet"])


# ── Helpers ───────────────────────────────────────────────────────────────────

def _build_save_url(member: Member, merchant: Merchant, wallet_class: MerchantWalletClass) -> str:
    """
    Build a signed Google Wallet 'Add to Wallet' URL.
    In production: sign a JWT with the Google service account key and embed it
    in https://pay.google.com/gp/v/save/<jwt>.
    In development: return a preview URL stub so the UI works without credentials.
    """
    issuer_id = getattr(settings, "google_wallet_issuer_id", "")
    sa_path = getattr(settings, "google_wallet_sa_json_path", "")

    if issuer_id and sa_path:
        try:
            from google.oauth2 import service_account
            from google.auth.transport.requests import Request
            import jwt as pyjwt

            with open(sa_path) as f:
                sa_info = json.load(f)

            object_id = f"{issuer_id}.{member.id}"
            loyalty_object = {
                "id": object_id,
                "classId": wallet_class.google_class_id,
                "state": "ACTIVE",
                "accountId": member.member_code,
                "accountName": member.name,
                "loyaltyPoints": {
                    "balance": {"int": int(member.loyalty_points or 0)},
                    "label": "Points",
                },
                "validTimeInterval": {
                    "end": {"date": str(member.expiry_date)},
                },
                "barcode": {
                    "type": "QR_CODE",
                    "value": member.public_token,
                    "alternateText": member.member_code,
                },
                "hexBackgroundColor": wallet_class.background_color or "#1A1A1A",
            }

            payload = {
                "iss": sa_info["client_email"],
                "aud": "google",
                "origins": ["https://metrocardz.in"],
                "typ": "savetowallet",
                "payload": {"loyaltyObjects": [loyalty_object]},
            }

            creds = service_account.Credentials.from_service_account_info(
                sa_info,
                scopes=["https://www.googleapis.com/auth/wallet_object.issuer"],
            )
            signed_jwt = pyjwt.encode(payload, sa_info["private_key"], algorithm="RS256")
            return f"https://pay.google.com/gp/v/save/{signed_jwt}"
        except Exception as exc:
            # Log and fall through to demo URL — don't crash merchant portal
            print(f"⚠️  Google Wallet JWT signing failed: {exc}")

    # Development / misconfigured — return a detectable stub URL
    return f"https://pay.google.com/gp/v/save/DEMO_TOKEN_{member.public_token}"


def _get_or_create_wallet_class(merchant: Merchant, db: Session) -> MerchantWalletClass:
    """Return existing wallet class for merchant, or create a placeholder one."""
    wc = db.query(MerchantWalletClass).filter(
        MerchantWalletClass.merchant_id == merchant.id
    ).first()
    if wc:
        return wc

    issuer_id = getattr(settings, "google_wallet_issuer_id", "DEMO_ISSUER")
    wc = MerchantWalletClass(
        merchant_id=merchant.id,
        google_class_id=f"{issuer_id}.{merchant.id}",
        logo_url=getattr(merchant, "logo_url", None),
        background_color="#1A1A1A",
    )
    db.add(wc)
    db.commit()
    db.refresh(wc)
    return wc


# ── Endpoints ─────────────────────────────────────────────────────────────────

@wallet_router.post(
    "/members/{member_id}/google",
    response_model=WalletSaveUrlOut,
    summary="Generate Google Wallet save URL for a member",
)
def generate_wallet_save_url(
    member_id: str,
    merchant_id: str = Depends(get_merchant_id),
    db: Session = Depends(get_db),
):
    """
    Generate (or return cached) signed Google Wallet JWT for a member.
    The URL can be embedded as a button href or served as a deep-link.
    - Creates the MerchantWalletClass if this is the first pass for this merchant.
    - Creates or updates the MemberWalletPass record.
    """
    member = db.query(Member).filter(
        Member.id == member_id, Member.merchant_id == merchant_id
    ).first()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")

    merchant = db.query(Merchant).filter(Merchant.id == merchant_id).first()
    if not merchant:
        raise HTTPException(status_code=404, detail="Merchant not found")

    wallet_class = _get_or_create_wallet_class(merchant, db)
    save_url = _build_save_url(member, merchant, wallet_class)

    # Upsert the MemberWalletPass record
    issuer_id = getattr(settings, "google_wallet_issuer_id", "DEMO_ISSUER")
    google_object_id = f"{issuer_id}.{member.id}"

    wallet_pass = db.query(MemberWalletPass).filter(
        MemberWalletPass.member_id == member_id
    ).first()

    if wallet_pass:
        wallet_pass.status = "added"
        wallet_pass.last_synced_at = datetime.now(timezone.utc)
    else:
        wallet_pass = MemberWalletPass(
            member_id=member_id,
            wallet_class_id=wallet_class.id,
            google_object_id=google_object_id,
            status="added",
            last_synced_at=datetime.now(timezone.utc),
        )
        db.add(wallet_pass)

    db.commit()
    db.refresh(wallet_pass)

    return WalletSaveUrlOut(
        save_url=save_url,
        google_object_id=wallet_pass.google_object_id,
        status=wallet_pass.status,
    )


@wallet_router.get(
    "/members/{member_id}/google/status",
    response_model=MemberWalletPassOut,
    summary="Get Google Wallet pass status for a member",
)
def get_wallet_pass_status(
    member_id: str,
    merchant_id: str = Depends(get_merchant_id),
    db: Session = Depends(get_db),
):
    """Return current wallet pass status — used by the member profile card."""
    member = db.query(Member).filter(
        Member.id == member_id, Member.merchant_id == merchant_id
    ).first()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")

    wallet_pass = db.query(MemberWalletPass).filter(
        MemberWalletPass.member_id == member_id
    ).first()
    if not wallet_pass:
        raise HTTPException(status_code=404, detail="No wallet pass found for this member")

    return wallet_pass


@wallet_router.get(
    "/merchant/class",
    response_model=MerchantWalletClassOut,
    summary="Get the merchant's Google Wallet class config",
)
def get_merchant_wallet_class(
    merchant_id: str = Depends(get_merchant_id),
    db: Session = Depends(get_db),
):
    """
    Returns the merchant's Google Wallet Loyalty Class configuration.
    Used by the Settings page to show if Wallet is configured.
    """
    wc = db.query(MerchantWalletClass).filter(
        MerchantWalletClass.merchant_id == merchant_id
    ).first()
    if not wc:
        raise HTTPException(
            status_code=404,
            detail="Google Wallet class not yet configured for this merchant.",
        )
    return wc


@wallet_router.post(
    "/merchant/class/sync",
    summary="Trigger push update for all active wallet passes (for this merchant)",
    status_code=202,
)
def sync_all_wallet_passes(
    merchant_id: str = Depends(get_merchant_id),
    db: Session = Depends(get_db),
):
    """
    Mark all active member passes as 'update_pending' so the background worker
    can flush the updates to Google's Wallet Object API via server-push.
    Returns count of passes queued for update.
    """
    wc = db.query(MerchantWalletClass).filter(
        MerchantWalletClass.merchant_id == merchant_id
    ).first()
    if not wc:
        raise HTTPException(status_code=404, detail="No wallet class configured for this merchant")

    updated = (
        db.query(MemberWalletPass)
        .filter(
            MemberWalletPass.wallet_class_id == wc.id,
            MemberWalletPass.status == "added",
        )
        .update({"status": "update_pending"}, synchronize_session=False)
    )
    db.commit()
    return {"queued": updated, "message": f"{updated} wallet passes queued for sync"}
