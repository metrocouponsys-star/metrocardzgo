"""OfferTemplate ORM model."""
import uuid
from sqlalchemy import Column, String, Text, Numeric, Integer, Boolean, DateTime, ForeignKey, func, Enum
from sqlalchemy.orm import relationship
from app.core.database import Base


class OfferTemplate(Base):
    __tablename__ = "offer_templates"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    merchant_id = Column(String, ForeignKey("merchants.id", ondelete="CASCADE"), nullable=False)
    title = Column(Text, nullable=False)
    description = Column(Text, default="")
    offer_type = Column(
        Enum(
            "percent_off", "free_service", "wallet_points", "referral", "birthday",
            "points_redemption", "visit_milestone",
            name="offer_type",
        ),
        nullable=False,
    )
    value = Column(Numeric, default=0)
    active = Column(Boolean, default=True)

    # Loyalty points configuration
    loyalty_points_earn = Column(Numeric, nullable=True)   # points earned when redeemed
    is_points_redemption = Column(Boolean, default=False, nullable=False)
    loyalty_points_cost = Column(Numeric, nullable=True)   # points cost for points_redemption offers

    # Visit-milestone & amount-based reward thresholds (null = no threshold)
    min_visits = Column(Integer, nullable=True)            # offer unlocks after N total visits
    min_purchase_amount = Column(Numeric, nullable=True)   # offer unlocks after spending ₹X total

    # Relationships
    merchant = relationship("Merchant", back_populates="offer_templates")
    membership_type_links = relationship("MembershipTypeOffer", back_populates="offer")
    member_offer_states = relationship("MemberOfferState", back_populates="offer_template")
    redemptions = relationship("RedemptionLog", back_populates="offer_template")
    loyalty_transactions = relationship("LoyaltyTransaction", back_populates="source_offer")
