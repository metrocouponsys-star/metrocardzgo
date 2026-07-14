"""MemberFeedback ORM model — public feedback submitted by members."""
import uuid
from sqlalchemy import Column, String, Text, Integer, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from app.core.database import Base


class MemberFeedback(Base):
    """Customer feedback submitted via the public self-check page. No auth required."""
    __tablename__ = "member_feedback"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    member_id = Column(String, ForeignKey("members.id", ondelete="CASCADE"), nullable=False)
    merchant_id = Column(String, ForeignKey("merchants.id", ondelete="CASCADE"), nullable=False)
    rating = Column(Integer, nullable=False)     # 1–5 stars
    comment = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    member = relationship("Member")
    merchant = relationship("Merchant")
