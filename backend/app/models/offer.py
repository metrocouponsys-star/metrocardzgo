"""OfferTemplate ORM model."""
import uuid
from sqlalchemy import Column, String, Text, Numeric, Boolean, DateTime, ForeignKey, func, Enum
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
            "points_redemption",
            name="offer_type",
        ),
        nullable=False,
    )
    value = Column(Numeric, default=0)
    active = Column(Boolean, default=True)
    # Loyalty: how many points this offer earns when redeemed (null = earns nothing)
    loyalty_points_earn = Column(Numeric, nullable=True)
    # If True, this offer is a "points redemption reward" — costs loyalty_points_cost points
    is_points_redemption = Column(Boolean, default=False, nullable=False)
    # For points_redemption offers: how many points this reward costs the member
    loyalty_points_cost = Column(Numeric, nullable=True)

    # Relationships
    merchant = relationship("Merchant", back_populates="offer_templates")
    membership_type_links = relationship("MembershipTypeOffer", back_populates="offer")
    member_offer_states = relationship("MemberOfferState", back_populates="offer_template")
    redemptions = relationship("RedemptionLog", back_populates="offer_template")
    loyalty_transactions = relationship("LoyaltyTransaction", back_populates="source_offer")
