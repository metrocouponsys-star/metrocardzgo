"""Idempotency record — prevents double-processing on network retries.

Flow:
  1. Client generates a UUID v4 and sends it as X-Idempotency-Key header.
  2. Before processing, the handler checks this table:
       - If found AND status='completed': return cached response immediately.
       - If found AND status='processing': return 409 (concurrent duplicate).
       - If not found: insert a 'processing' row and proceed.
  3. After processing: update the row to 'completed' with the serialised response.

Key uniqueness: (idempotency_key, merchant_id, endpoint) — the same key
can be reused safely across different merchants or endpoints without conflict.

Records expire after 24 hours (cleaned up by the hourly worker).
"""
import uuid
from sqlalchemy import Column, String, Text, DateTime, Integer, func, UniqueConstraint
from app.core.database import Base


class IdempotencyRecord(Base):
    __tablename__ = "idempotency_records"
    __table_args__ = (
        UniqueConstraint("idempotency_key", "merchant_id", "endpoint", name="uq_idempotency"),
    )

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    idempotency_key = Column(Text, nullable=False, index=True)
    merchant_id = Column(String, nullable=False, index=True)
    endpoint = Column(Text, nullable=False)          # e.g. "POST /redemptions"
    status = Column(Text, nullable=False, default="processing")   # processing | completed | failed
    status_code = Column(Integer, nullable=True)
    response_body = Column(Text, nullable=True)      # JSON-serialised response
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    expires_at = Column(DateTime(timezone=True), nullable=True)  # for TTL cleanup
