"""
Metro Cardz — Google Wallet Pass ORM Models
Stores Google Wallet Loyalty Class (per merchant) and
Loyalty Object (per member) identifiers for server-push updates.
"""
import uuid
from sqlalchemy import Column, String, Text, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from app.core.database import Base


class MerchantWalletClass(Base):
    """
    Google Wallet Loyalty Class — one per merchant.
    Stores the class ID provisioned via the Google Wallet API.
    This class defines the visual template (logo, colors, issuer name)
    shared by all members of a given merchant.
    """
    __tablename__ = "merchant_wallet_classes"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    merchant_id = Column(
        String,
        ForeignKey("merchants.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
    )
    # Google Wallet-assigned class ID e.g. "issuer_id.merchant_uuid"
    google_class_id = Column(Text, nullable=False, unique=True)
    # Optional branding overrides (merchant-level)
    logo_url = Column(Text, nullable=True)
    background_color = Column(Text, nullable=True, default="#1A1A1A")

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    merchant = relationship("Merchant", backref="wallet_class")
    passes = relationship("MemberWalletPass", back_populates="wallet_class", cascade="all, delete-orphan")


class MemberWalletPass(Base):
    """
    Google Wallet Loyalty Object — one per member.
    References the parent MerchantWalletClass and stores the
    per-member Google object ID used for server-push updates.
    Status lifecycle: not_added → added → update_pending → added
    """
    __tablename__ = "member_wallet_passes"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    member_id = Column(
        String,
        ForeignKey("members.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
    )
    wallet_class_id = Column(
        String,
        ForeignKey("merchant_wallet_classes.id", ondelete="CASCADE"),
        nullable=False,
    )
    # Google Wallet-assigned object ID e.g. "issuer_id.member_uuid"
    google_object_id = Column(Text, nullable=False, unique=True)
    # not_added | added | update_pending | error
    status = Column(Text, default="not_added", nullable=False)

    last_synced_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    member = relationship("Member", backref="wallet_pass")
    wallet_class = relationship("MerchantWalletClass", back_populates="passes")
