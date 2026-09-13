import enum
from datetime import datetime

from sqlalchemy import String, Text, Enum, DateTime, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class MessageStatus(str, enum.Enum):
    pending = "pending"
    drafted = "drafted"
    approved = "approved"


class BuyerMessage(Base):
    __tablename__ = "buyer_messages"

    id: Mapped[int] = mapped_column(primary_key=True)
    seller_id: Mapped[int] = mapped_column(ForeignKey("sellers.id"), nullable=False, index=True)
    order_id: Mapped[int] = mapped_column(ForeignKey("orders.id"), nullable=False)
    message_text: Mapped[str] = mapped_column(Text, nullable=False)
    received_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    # Suggestion only. Approving a draft here NEVER sends anything to a real
    # buyer or calls a live marketplace API — see app/routers/chat.py.
    draft_reply: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[MessageStatus] = mapped_column(Enum(MessageStatus, name="message_status_enum"), nullable=False, default=MessageStatus.pending)

    seller: Mapped["Seller"] = relationship(back_populates="buyer_messages")
    order: Mapped["Order"] = relationship(back_populates="buyer_messages")
