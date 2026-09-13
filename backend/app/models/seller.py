import enum
from datetime import datetime

from sqlalchemy import String, Enum, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Marketplace(str, enum.Enum):
    amazon = "amazon"
    flipkart = "flipkart"


class Seller(Base):
    __tablename__ = "sellers"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    marketplace: Mapped[Marketplace] = mapped_column(Enum(Marketplace, name="marketplace_enum"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    orders: Mapped[list["Order"]] = relationship(back_populates="seller", cascade="all, delete-orphan")
    inventory_items: Mapped[list["Inventory"]] = relationship(back_populates="seller", cascade="all, delete-orphan")
    buyer_messages: Mapped[list["BuyerMessage"]] = relationship(back_populates="seller", cascade="all, delete-orphan")
    returns: Mapped[list["Return"]] = relationship(back_populates="seller", cascade="all, delete-orphan")
