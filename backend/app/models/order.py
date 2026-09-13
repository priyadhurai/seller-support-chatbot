import enum
from datetime import date

from sqlalchemy import String, Integer, Enum, Date, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class OrderStatus(str, enum.Enum):
    pending = "pending"
    shipped = "shipped"
    delivered = "delivered"
    cancelled = "cancelled"


class Order(Base):
    __tablename__ = "orders"

    id: Mapped[int] = mapped_column(primary_key=True)
    seller_id: Mapped[int] = mapped_column(ForeignKey("sellers.id"), nullable=False, index=True)
    order_number: Mapped[str] = mapped_column(String(100), nullable=False)
    product_name: Mapped[str] = mapped_column(String(255), nullable=False)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    status: Mapped[OrderStatus] = mapped_column(Enum(OrderStatus, name="order_status_enum"), nullable=False, default=OrderStatus.pending)
    order_date: Mapped[date] = mapped_column(Date, nullable=False)
    buyer_name: Mapped[str] = mapped_column(String(255), nullable=False)
    buyer_location: Mapped[str] = mapped_column(String(255), nullable=False, default="Unknown")

    seller: Mapped["Seller"] = relationship(back_populates="orders")
    buyer_messages: Mapped[list["BuyerMessage"]] = relationship(back_populates="order")
    returns: Mapped[list["Return"]] = relationship(back_populates="order")
