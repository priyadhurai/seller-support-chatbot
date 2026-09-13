from datetime import date

from pydantic import BaseModel

from app.models.order import OrderStatus


class OrderResponse(BaseModel):
    id: int
    order_number: str
    product_name: str
    quantity: int
    status: OrderStatus
    order_date: date
    buyer_name: str
    buyer_location: str

    model_config = {"from_attributes": True}
