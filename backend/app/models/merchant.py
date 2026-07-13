"""Merchant and MerchantUser ORM models."""
import uuid
from sqlalchemy import Column, String, Text, DateTime, ForeignKey, func, Enum
from sqlalchemy.orm import relationship
from app.core.database import Base


class Merchant(Base):
    __tablename__ = "merchants"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    business_name = Column(Text, nullable=False)
    category = Column(Text)
    plan_tier = Column(Text, default="Starter")
    whatsapp_number = Column(Text)
    logo_url = Column(Text)
    address = Column(Text)
    secret_salt = Column(Text, nullable=False, default=lambda: str(uuid.uuid4()))
    status = Column(
        Enum("active", "suspended", name="merchant_status"),
        default="active",
        nullable=False,
    )
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    users = relationship("MerchantUser", back_populates="merchant", cascade="all, delete-orphan")
    members = relationship("Member", back_populates="merchant", cascade="all, delete-orphan")
    membership_types = relationship("MembershipType", back_populates="merchant", cascade="all, delete-orphan")
    offer_templates = relationship("OfferTemplate", back_populates="merchant", cascade="all, delete-orphan")
    campaigns = relationship("Campaign", back_populates="merchant", cascade="all, delete-orphan")
    reminder_rules = relationship("ReminderRule", back_populates="merchant", cascade="all, delete-orphan")
    loyalty_transactions = relationship("LoyaltyTransaction", back_populates="merchant", cascade="all, delete-orphan")


class MerchantUser(Base):
    __tablename__ = "merchant_users"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    merchant_id = Column(String, ForeignKey("merchants.id", ondelete="CASCADE"), nullable=True)
    name = Column(Text, nullable=False)
    phone = Column(Text, nullable=False, unique=True)
    role = Column(
        Enum("super_admin", "owner", "staff", name="user_role"),
        default="staff",
        nullable=False,
    )
    password_hash = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    merchant = relationship("Merchant", back_populates="users")
    redemptions = relationship("RedemptionLog", back_populates="staff_user")
