from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.auth import get_current_seller
from app.database import get_db
from app.models.order import Order, OrderStatus
from app.models.seller import Seller
from app.schemas.order import OrderResponse

router = APIRouter(prefix="/orders", tags=["orders"])


@router.get("", response_model=list[OrderResponse])
def list_orders(
    status: OrderStatus | None = None,
    db: Session = Depends(get_db),
    current_seller: Seller = Depends(get_current_seller),
):
    query = db.query(Order).filter(Order.seller_id == current_seller.id)
    if status is not None:
        query = query.filter(Order.status == status)
    return query.order_by(Order.order_date.desc()).all()
