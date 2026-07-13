"""CardInventoryItem ORM model — physical card lifecycle management."""
import uuid
from sqlalchemy import Column, String, Text, DateTime, ForeignKey, func, Enum
from sqlalchemy.orm import relationship
from app.core.database import Base


class CardInventoryItem(Base):
    __tablename__ = "card_inventory"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    # 16-digit printed on the physical card, e.g. "4821 6739 0012 3847"
    card_number = Column(Text, nullable=False, unique=True)
    status = Column(
        Enum("unassigned", "merchant_allocated", "member_linked", "deactivated", name="card_status"),
        default="unassigned",
        nullable=False,
    )
    # Allocation to a merchant
    allocated_merchant_id = Column(String, ForeignKey("merchants.id"), nullable=True)
    allocated_at = Column(DateTime(timezone=True), nullable=True)

    # Linking to a member
    linked_member_id = Column(String, ForeignKey("members.id"), nullable=True)
    linked_at = Column(DateTime(timezone=True), nullable=True)

    # Created by admin
    created_by_admin_id = Column(String, ForeignKey("merchant_users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
