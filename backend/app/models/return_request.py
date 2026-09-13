import enum
from datetime import datetime

from sqlalchemy import Text, Enum, Numeric, DateTime, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class ReturnStatus(str, enum.Enum):
    requested = "requested"
    approved = "approved"
    refunded = "refunded"
    rejected = "rejected"


class Return(Base):
    __tablename__ = "returns"

    id: Mapped[int] = mapped_column(primary_key=True)
    seller_id: Mapped[int] = mapped_column(ForeignKey("sellers.id"), nullable=False, index=True)
    order_id: Mapped[int] = mapped_column(ForeignKey("orders.id"), nullable=False)
    reason: Mapped[str] = mapped_column(Text, nullable=False)
    # Marking a return "refunded" here only records the outcome in our own
    # database — it never triggers a real payment/refund transaction. Actually
    # issuing money back to a buyer is a Phase 2 feature gated on Amazon
    # SP-API / Flipkart Seller API approval, same as buyer message sending.
    status: Mapped[ReturnStatus] = mapped_column(Enum(ReturnStatus, name="return_status_enum"), nullable=False, default=ReturnStatus.requested)
    refund_amount: Mapped[float | None] = mapped_column(Numeric(10, 2), nullable=True)
    requested_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    seller: Mapped["Seller"] = relationship(back_populates="returns")
    order: Mapped["Order"] = relationship(back_populates="returns")
