"""Redemptions router — thin wrappers over redemption_service.

Route handlers ONLY:
  1. Extract request parameters
  2. Call the service function
  3. Handle ServiceError → HTTPException
  4. Commit and return the response

No business logic lives here — it's all in app/services/redemption_service.py.
"""
import json
from datetime import datetime, timezone, timedelta
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, Request, Header, status
from sqlalchemy.orm import Session
from typing import List, Optional

from app.core.deps import get_db, get_current_active_user, get_merchant_id
from app.models.member import Member
from app.models.redemption import RedemptionLog
from app.models.loyalty import LoyaltyTransaction
from app.models.idempotency import IdempotencyRecord
from app.schemas import RedeemRequest, RedemptionOut, LoyaltyTransactionOut
from app.services.redemption_service import redeem_offer_atomic, redeem_points_atomic
from app.services.exceptions import ServiceError

router = APIRouter(prefix="/redemptions", tags=["redemptions"])


# ── Idempotency Helper ─────────────────────────────────────────────────────────

def _check_idempotency(
    db: Session,
    key: Optional[str],
    merchant_id: str,
    endpoint: str,
) -> Optional[dict]:
    """
    If idempotency key is provided, check if we've already processed this request.
    Returns the cached response dict if found, None otherwise.
    Inserts a 'processing' row if this is the first time we see this key.
    """
    if not key:
        return None

    record = db.query(IdempotencyRecord).filter(
        IdempotencyRecord.idempotency_key == key,
        IdempotencyRecord.merchant_id == merchant_id,
        IdempotencyRecord.endpoint == endpoint,
    ).first()

    if record:
        if record.status == "completed" and record.response_body:
            return json.loads(record.response_body)
        if record.status == "processing":
            raise HTTPException(
                status_code=409,
                detail="A request with this idempotency key is already being processed.",
            )

    # First time seeing this key — insert processing record
    expires = datetime.now(timezone.utc) + timedelta(hours=24)
    new_record = IdempotencyRecord(
        idempotency_key=key,
        merchant_id=merchant_id,
        endpoint=endpoint,
        status="processing",
        expires_at=expires,
    )
    db.add(new_record)
    db.flush()
    return None


def _save_idempotency_response(
    db: Session,
    key: Optional[str],
    merchant_id: str,
    endpoint: str,
    status_code: int,
    response_body: dict,
) -> None:
    if not key:
        return
    record = db.query(IdempotencyRecord).filter(
        IdempotencyRecord.idempotency_key == key,
        IdempotencyRecord.merchant_id == merchant_id,
        IdempotencyRecord.endpoint == endpoint,
    ).first()
    if record:
        record.status = "completed"
        record.status_code = status_code
        record.response_body = json.dumps(response_body, default=str)


def _build_redemption_out(redemption: RedemptionLog, member: Member, staff_name: str) -> RedemptionOut:
    offer_template = redemption.offer_template
    offer_info = None
    if offer_template:
        offer_info = {
            "title": offer_template.title,
            "offer_type": offer_template.offer_type,
        }
    return RedemptionOut(
        id=redemption.id,
        member_id=redemption.member_id,
        offer_template_id=redemption.offer_template_id,
        merchant_user_id=redemption.merchant_user_id,
        staff_name=staff_name,
        amount=redemption.amount,
        created_at=redemption.created_at,
        member={"name": member.name, "member_code": member.member_code},
        offer=offer_info,
    )


# ── Endpoints ──────────────────────────────────────────────────────────────────

@router.post("", response_model=RedemptionOut, status_code=status.HTTP_201_CREATED)
def redeem_offer(
    payload: RedeemRequest,
    request: Request,
    merchant_id: str = Depends(get_merchant_id),
    current_user=Depends(get_current_active_user),
    db: Session = Depends(get_db),
    x_idempotency_key: Optional[str] = Header(None, alias="X-Idempotency-Key"),
):
    """
    Atomically redeem an offer for a member.

    Idempotency: send the same X-Idempotency-Key to safely retry on network failure.
    The same request will return the same response without double-processing.
    """
    endpoint = "POST /redemptions"

    # Check idempotency — returns cached response if already processed
    cached = _check_idempotency(db, x_idempotency_key, merchant_id, endpoint)
    if cached:
        return RedemptionOut(**cached)

    try:
        client_ip = request.client.host if request.client else None
        redemption = redeem_offer_atomic(
            db=db,
            member_id=payload.member_id,
            offer_state_id=payload.offer_state_id,
            merchant_id=merchant_id,
            actor_id=current_user.id,
            client_ip=client_ip,
            amount=Decimal(str(payload.amount)) if payload.amount else None,
        )
        db.flush()

        # Save idempotency response before commit
        member = db.query(Member).filter(Member.id == payload.member_id).first()
        response = _build_redemption_out(redemption, member, current_user.name)
        _save_idempotency_response(db, x_idempotency_key, merchant_id, endpoint, 201, response.model_dump())

        db.commit()
        db.refresh(redemption)
        return response

    except ServiceError as e:
        db.rollback()
        raise HTTPException(status_code=e.status_hint, detail=e.message)
    except Exception:
        db.rollback()
        raise


@router.post("/redeem-points", response_model=RedemptionOut, status_code=status.HTTP_201_CREATED)
def redeem_points(
    payload: RedeemRequest,
    request: Request,
    merchant_id: str = Depends(get_merchant_id),
    current_user=Depends(get_current_active_user),
    db: Session = Depends(get_db),
    x_idempotency_key: Optional[str] = Header(None, alias="X-Idempotency-Key"),
):
    """
    Atomically redeem loyalty points for a points_redemption offer.

    Idempotency: send the same X-Idempotency-Key to safely retry on network failure.
    """
    endpoint = "POST /redemptions/redeem-points"

    cached = _check_idempotency(db, x_idempotency_key, merchant_id, endpoint)
    if cached:
        return RedemptionOut(**cached)

    try:
        client_ip = request.client.host if request.client else None
        redemption = redeem_points_atomic(
            db=db,
            member_id=payload.member_id,
            offer_state_id=payload.offer_state_id,
            merchant_id=merchant_id,
            actor_id=current_user.id,
            client_ip=client_ip,
            amount=Decimal(str(payload.amount)) if payload.amount else None,
        )
        db.flush()

        member = db.query(Member).filter(Member.id == payload.member_id).first()
        response = _build_redemption_out(redemption, member, current_user.name)
        _save_idempotency_response(db, x_idempotency_key, merchant_id, endpoint, 201, response.model_dump())

        db.commit()
        db.refresh(redemption)
        return response

    except ServiceError as e:
        db.rollback()
        raise HTTPException(status_code=e.status_hint, detail=e.message)
    except Exception:
        db.rollback()
        raise


@router.get("/member/{member_id}", response_model=List[RedemptionOut])
def get_member_redemptions(
    member_id: str,
    merchant_id: str = Depends(get_merchant_id),
    db: Session = Depends(get_db),
):
    member = db.query(Member).filter(
        Member.id == member_id, Member.merchant_id == merchant_id
    ).first()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")

    redemptions = (
        db.query(RedemptionLog)
        .filter(RedemptionLog.member_id == member_id)
        .order_by(RedemptionLog.created_at.desc())
        .limit(50)
        .all()
    )
    results = []
    for r in redemptions:
        results.append(RedemptionOut(
            id=r.id,
            member_id=r.member_id,
            offer_template_id=r.offer_template_id,
            merchant_user_id=r.merchant_user_id,
            staff_name=r.staff_user.name if r.staff_user else None,
            amount=r.amount,
            created_at=r.created_at,
            member={"name": member.name, "member_code": member.member_code},
            offer={
                "title": r.offer_template.title,
                "offer_type": r.offer_template.offer_type,
            } if r.offer_template else None,
        ))
    return results


@router.get("/member/{member_id}/loyalty-history", response_model=List[LoyaltyTransactionOut])
def get_member_loyalty_history(
    member_id: str,
    merchant_id: str = Depends(get_merchant_id),
    db: Session = Depends(get_db),
):
    """Return the full loyalty points history for a member."""
    member = db.query(Member).filter(
        Member.id == member_id, Member.merchant_id == merchant_id
    ).first()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")

    txs = (
        db.query(LoyaltyTransaction)
        .filter(
            LoyaltyTransaction.member_id == member_id,
            LoyaltyTransaction.merchant_id == merchant_id,
        )
        .order_by(LoyaltyTransaction.created_at.desc())
        .limit(100)
        .all()
    )
    results = []
    for tx in txs:
        offer_title = tx.source_offer.title if tx.source_offer else None
        results.append(LoyaltyTransactionOut(
            id=tx.id,
            member_id=tx.member_id,
            merchant_id=tx.merchant_id,
            type=tx.type,
            points=tx.points,
            source_redemption_id=tx.source_redemption_id,
            source_offer_id=tx.source_offer_id,
            source_offer_title=offer_title,
            note=tx.note,
            balance_after=tx.balance_after,
            created_at=tx.created_at,
        ))
    return results
