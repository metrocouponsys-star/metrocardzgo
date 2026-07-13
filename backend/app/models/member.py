"""Member, MembershipType, MemberOfferState, and MembershipTypeOffer ORM models."""
import uuid
from sqlalchemy import Column, String, Text, Numeric, Date, DateTime, ForeignKey, func, Enum
from sqlalchemy.orm import relationship
from app.core.database import Base


class MembershipType(Base):
    __tablename__ = "membership_types"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    merchant_id = Column(String, ForeignKey("merchants.id", ondelete="CASCADE"), nullable=False)
    name = Column(Text, nullable=False)
    description = Column(Text, default="")

    # Relationships
    merchant = relationship("Merchant", back_populates="membership_types")
    members = relationship("Member", back_populates="membership_type")
    offer_links = relationship("MembershipTypeOffer", back_populates="membership_type", cascade="all, delete-orphan")


class MembershipTypeOffer(Base):
    """Many-to-many: which offers are bundled into which membership type."""
    __tablename__ = "membership_type_offers"

    membership_type_id = Column(
        String, ForeignKey("membership_types.id", ondelete="CASCADE"), primary_key=True
    )
    offer_template_id = Column(
        String, ForeignKey("offer_templates.id", ondelete="CASCADE"), primary_key=True
    )
    # Default qty when a new member is enrolled (null = unlimited)
    default_qty = Column(Numeric, nullable=True)

    membership_type = relationship("MembershipType", back_populates="offer_links")
    offer = relationship("OfferTemplate", back_populates="membership_type_links")


class Member(Base):
    __tablename__ = "members"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    merchant_id = Column(String, ForeignKey("merchants.id", ondelete="CASCADE"), nullable=False)
    member_code = Column(Text, nullable=False)           # e.g. SAL001 — human readable
    public_token = Column(Text, nullable=False, unique=True)  # HMAC token for QR / public URL
    physical_card_number = Column(Text, nullable=True)   # 16-digit physical card if linked
    name = Column(Text, nullable=False)
    phone = Column(Text, nullable=False)
    date_of_birth = Column(Date, nullable=True)
    anniversary_date = Column(Date, nullable=True)
    membership_type_id = Column(String, ForeignKey("membership_types.id"), nullable=False)
    joined_date = Column(Date, nullable=False)
    expiry_date = Column(Date, nullable=False)
    loyalty_points = Column(Numeric, default=0)   # renamed from wallet_balance — IS the loyalty points balance
    status = Column(
        Enum("active", "expiring_soon", "expired", "deactivated", name="member_status"),
        default="active",
        nullable=False,
    )
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    merchant = relationship("Merchant", back_populates="members")
    membership_type = relationship("MembershipType", back_populates="members")
    offer_states = relationship("MemberOfferState", back_populates="member", cascade="all, delete-orphan")
    redemptions = relationship("RedemptionLog", back_populates="member")
    message_logs = relationship("MessageLog", back_populates="member")
    loyalty_transactions = relationship("LoyaltyTransaction", back_populates="member")


class MemberOfferState(Base):
    """Tracks the per-member state of each offer (remaining uses, exhausted, etc.)"""
    __tablename__ = "member_offer_state"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    member_id = Column(String, ForeignKey("members.id", ondelete="CASCADE"), nullable=False)
    offer_template_id = Column(String, ForeignKey("offer_templates.id"), nullable=False)
    remaining_qty = Column(Numeric, nullable=True)    # null = unlimited (e.g. % discounts)
    initial_qty = Column(Numeric, nullable=True)
    status = Column(
        Enum("active", "exhausted", name="offer_state_status"),
        default="active",
        nullable=False,
    )

    member = relationship("Member", back_populates="offer_states")
    offer_template = relationship("OfferTemplate", back_populates="member_offer_states")
