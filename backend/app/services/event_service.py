"""Event service — write EventLog rows in the same DB transaction as the state change.

Usage:
    from app.services.event_service import emit

    # Inside a route handler or service, before db.commit():
    emit(db, merchant_id="abc", event_type="offer.redeemed", payload={...}, member_id="xyz", actor_id=user.id)
    db.commit()  # event row committed atomically with the state change

Never call emit() after commit() — that would allow the state to persist
without an event record if the second write fails.
"""
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from app.models.event_log import EventLog


# Canonical event type constants — use these, never raw strings
MEMBER_ENROLLED = "member.enrolled"
OFFER_REDEEMED = "offer.redeemed"
POINTS_EARNED = "points.earned"
POINTS_REDEEMED = "points.redeemed"
REFERRAL_APPLIED = "referral.applied"
MEMBER_RENEWED = "member.renewed"
MEMBER_DEACTIVATED = "member.deactivated"
TIER_CHANGED = "tier.changed"
CARD_LINKED = "card.linked"
CARD_UNLINKED = "card.unlinked"


def emit(
    db: Session,
    merchant_id: str,
    event_type: str,
    payload: Dict[str, Any],
    member_id: Optional[str] = None,
    actor_id: Optional[str] = None,
) -> EventLog:
    """
    Write an EventLog row — MUST be called before db.commit() so the event
    is committed atomically with the state change it describes.

    Returns the un-committed EventLog instance (for testing / assertions).
    """
    event = EventLog(
        merchant_id=merchant_id,
        member_id=member_id,
        event_type=event_type,
        payload=payload,
        actor_id=actor_id,
    )
    db.add(event)
    return event
