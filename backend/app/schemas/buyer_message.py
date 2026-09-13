from datetime import datetime

from pydantic import BaseModel

from app.models.buyer_message import MessageStatus


class BuyerMessageResponse(BaseModel):
    id: int
    order_id: int
    message_text: str
    received_at: datetime
    draft_reply: str | None
    status: MessageStatus

    model_config = {"from_attributes": True}


class BuyerMessageUpdate(BaseModel):
    draft_reply: str | None = None
    status: MessageStatus | None = None
