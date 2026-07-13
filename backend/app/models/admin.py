"""AdminAuditLog ORM model — tracks all super-admin actions."""
import uuid
from sqlalchemy import Column, String, Text, DateTime, ForeignKey, func
from app.core.database import Base


class AdminAuditLog(Base):
    __tablename__ = "admin_audit_log"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    admin_user_id = Column(String, ForeignKey("merchant_users.id"), nullable=False)
    merchant_id = Column(String, ForeignKey("merchants.id"), nullable=True)
    action = Column(Text, nullable=False)  # e.g. 'impersonate_login', 'suspend_merchant'
    detail = Column(Text, nullable=True)   # JSON or text with extra context
    ip_address = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
