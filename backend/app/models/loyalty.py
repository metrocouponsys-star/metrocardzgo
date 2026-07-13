"""LoyaltyTransaction ORM model — immutable audit trail for loyalty points earn/redeem."""
import uuid
from sqlalchemy import Column, String, Text, Numeric, DateTime, ForeignKey, func, Enum
from sqlalchemy.orm import relationship
from app.core.database import Base


class LoyaltyTransaction(Base):
    """
    Every loyalty points movement is logged here — never update loyalty_points
    without a corresponding LoyaltyTransaction row.  This is the audit trail
    if a merchant or customer disputes a balance.

    Earn:  type='earn',  points=+X, source_redemption_id set, source_offer_id set
    Redeem: type='redeem', points=-X, source_offer_id set (the points_redemption offer)
    """
    __tablename__ = "loyalty_transactions"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    member_id = Column(String, ForeignKey("members.id", ondelete="CASCADE"), nullable=False)
    merchant_id = Column(String, ForeignKey("merchants.id", ondelete="CASCADE"), nullable=False)
    type = Column(
        Enum("earn", "redeem", name="loyalty_tx_type"),
        nullable=False,
    )
    points = Column(Numeric, nullable=False)        # positive for earn, negative for redeem
    source_redemption_id = Column(String, ForeignKey("redemption_log.id"), nullable=True)
    source_offer_id = Column(String, ForeignKey("offer_templates.id"), nullable=True)
    balance_after = Column(Numeric, nullable=False)  # running balance snapshot for audit
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    member = relationship("Member", back_populates="loyalty_transactions")
    merchant = relationship("Merchant", back_populates="loyalty_transactions")
    source_redemption = relationship("RedemptionLog", back_populates="loyalty_transaction")
    source_offer = relationship("OfferTemplate", back_populates="loyalty_transactions")
