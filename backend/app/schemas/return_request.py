from datetime import datetime

from pydantic import BaseModel

from app.models.return_request import ReturnStatus


class ReturnResponse(BaseModel):
    id: int
    order_id: int
    reason: str
    status: ReturnStatus
    refund_amount: float | None
    requested_at: datetime

    model_config = {"from_attributes": True}


class ReturnUpdate(BaseModel):
    status: ReturnStatus | None = None
    refund_amount: float | None = None
