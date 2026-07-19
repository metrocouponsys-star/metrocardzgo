"""EventLog ORM model — immutable audit trail of every meaningful state change.

Every time a member enrolls, points are earned or redeemed, an offer is
redeemed, or a membership renews, one row is written here in the SAME
transaction as the state change.

This table drives:
  - Admin audit UI (who did what, when)
  - Future webhook delivery to merchant-configured URLs
  - Analytics / reporting without touching core tables

Events:
  member.enrolled        — new member created
  offer.redeemed         — offer redeemed (RedemptionLog row inserted)
  points.earned          — loyalty points credited to member
  points.redeemed        — loyalty points spent on a points_redemption offer
  referral.applied       — referral code applied, bonus points credited
  member.renewed         — membership extended by 1 year
  member.deactivated     — member status set to deactivated
  tier.changed           — membership_type_id changed
"""
import uuid
from sqlalchemy import Column, String, Text, DateTime, JSON, ForeignKey, func
from sqlalchemy.orm import relationship
from app.core.database import Base


class EventLog(Base):
    __tablename__ = "event_logs"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    merchant_id = Column(String, ForeignKey("merchants.id", ondelete="CASCADE"), nullable=False, index=True)
    member_id = Column(String, ForeignKey("members.id", ondelete="SET NULL"), nullable=True, index=True)
    event_type = Column(Text, nullable=False, index=True)  # e.g. "offer.redeemed"
    payload = Column(JSON, nullable=False, default=dict)    # full event context
    actor_id = Column(String, nullable=True)               # merchant_user_id who triggered it (null for system)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)

    merchant = relationship("Merchant")
