"""Campaign, ReminderRule, and MessageLog ORM models."""
import uuid
from sqlalchemy import Column, String, Text, Numeric, Boolean, DateTime, Time, Integer, ForeignKey, func, Enum
from sqlalchemy.orm import relationship
from app.core.database import Base


class ReminderRule(Base):
    __tablename__ = "reminder_rules"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    merchant_id = Column(String, ForeignKey("merchants.id", ondelete="CASCADE"), nullable=False)
    trigger_type = Column(
        Enum("birthday", "anniversary", "loyalty_threshold", "expiry", name="reminder_trigger"),
        nullable=False,
    )
    channel = Column(Enum("sms", "whatsapp", name="message_channel"), nullable=False)
    template_text = Column(Text, nullable=False)
    threshold_value = Column(Numeric, nullable=True)  # For loyalty_threshold type
    active = Column(Boolean, default=True)
    # Feature 2: merchant-configurable reminder timing
    send_time = Column(Time, nullable=True)          # e.g. 09:00:00 — what time of day to send
    days_before = Column(Integer, default=0, nullable=False)  # N days before event (0=on the day, 7=week before)
    timezone = Column(Text, default="Asia/Kolkata", nullable=False)

    merchant = relationship("Merchant", back_populates="reminder_rules")
    message_logs = relationship("MessageLog", back_populates="reminder_rule")


class Campaign(Base):
    __tablename__ = "campaigns"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    merchant_id = Column(String, ForeignKey("merchants.id", ondelete="CASCADE"), nullable=False)
    name = Column(Text, nullable=False)
    target_audience = Column(
        Enum("all", "by_membership_type", "expiring_soon", name="campaign_audience"),
        nullable=False,
    )
    target_membership_type_id = Column(String, ForeignKey("membership_types.id"), nullable=True)
    channel = Column(Enum("sms", "whatsapp", name="campaign_channel"), nullable=False)
    template_text = Column(Text, nullable=False)
    scheduled_at = Column(DateTime(timezone=True), nullable=True)
    status = Column(
        Enum("draft", "scheduled", "sending", "sent", name="campaign_status"),
        default="draft",
        nullable=False,
    )
    audience_size = Column(Numeric, default=0)
    sent_count = Column(Numeric, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    merchant = relationship("Merchant", back_populates="campaigns")
    message_logs = relationship("MessageLog", back_populates="campaign")


class MessageLog(Base):
    __tablename__ = "message_log"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    member_id = Column(String, ForeignKey("members.id", ondelete="CASCADE"), nullable=False)
    campaign_id = Column(String, ForeignKey("campaigns.id"), nullable=True)
    reminder_rule_id = Column(String, ForeignKey("reminder_rules.id"), nullable=True)
    channel = Column(Text, nullable=False)
    status = Column(
        Enum("sent", "failed", "delivered", name="message_delivery_status"),
        default="sent",
        nullable=False,
    )
    sent_at = Column(DateTime(timezone=True), server_default=func.now())

    member = relationship("Member", back_populates="message_logs")
    campaign = relationship("Campaign", back_populates="message_logs")
    reminder_rule = relationship("ReminderRule", back_populates="message_logs")
