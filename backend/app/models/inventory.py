from sqlalchemy import String, Integer, Numeric, Text, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Inventory(Base):
    __tablename__ = "inventory"

    id: Mapped[int] = mapped_column(primary_key=True)
    seller_id: Mapped[int] = mapped_column(ForeignKey("sellers.id"), nullable=False, index=True)
    sku: Mapped[str] = mapped_column(String(100), nullable=False)
    product_name: Mapped[str] = mapped_column(String(255), nullable=False)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    low_stock_threshold: Mapped[int] = mapped_column(Integer, nullable=False, default=5)
    price: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False, default=0)
    category: Mapped[str] = mapped_column(String(100), nullable=False, default="Uncategorized")
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    seller: Mapped["Seller"] = relationship(back_populates="inventory_items")
