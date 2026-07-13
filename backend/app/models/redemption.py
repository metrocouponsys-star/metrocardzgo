"""RedemptionLog ORM model — the core transactional record."""
import uuid
from sqlalchemy import Column, String, Text, Numeric, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from app.core.database import Base


class RedemptionLog(Base):
    __tablename__ = "redemption_log"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    member_id = Column(String, ForeignKey("members.id", ondelete="CASCADE"), nullable=False)
    offer_template_id = Column(String, ForeignKey("offer_templates.id"), nullable=False)
    merchant_user_id = Column(String, ForeignKey("merchant_users.id"), nullable=False)
    amount = Column(Numeric, default=0)
    ip_address = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    member = relationship("Member", back_populates="redemptions")
    offer_template = relationship("OfferTemplate", back_populates="redemptions")
    staff_user = relationship("MerchantUser", back_populates="redemptions")
    loyalty_transaction = relationship("LoyaltyTransaction", back_populates="source_redemption", uselist=False)
