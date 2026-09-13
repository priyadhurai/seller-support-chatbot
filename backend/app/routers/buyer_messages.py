from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth import get_current_seller
from app.database import get_db
from app.models.buyer_message import BuyerMessage, MessageStatus
from app.models.seller import Seller
from app.schemas.buyer_message import BuyerMessageResponse, BuyerMessageUpdate

router = APIRouter(prefix="/buyer-messages", tags=["buyer-messages"])


@router.get("", response_model=list[BuyerMessageResponse])
def list_buyer_messages(
    status: MessageStatus | None = None,
    db: Session = Depends(get_db),
    current_seller: Seller = Depends(get_current_seller),
):
    query = db.query(BuyerMessage).filter(BuyerMessage.seller_id == current_seller.id)
    if status is not None:
        query = query.filter(BuyerMessage.status == status)
    return query.order_by(BuyerMessage.received_at.desc()).all()


@router.patch("/{message_id}", response_model=BuyerMessageResponse)
def update_buyer_message(
    message_id: int,
    payload: BuyerMessageUpdate,
    db: Session = Depends(get_db),
    current_seller: Seller = Depends(get_current_seller),
):
    message = (
        db.query(BuyerMessage)
        .filter(BuyerMessage.id == message_id, BuyerMessage.seller_id == current_seller.id)
        .first()
    )
    if not message:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Message not found")

    if payload.draft_reply is not None:
        message.draft_reply = payload.draft_reply
    if payload.status is not None:
        # Approving here only updates status in our own database. It never
        # sends anything to the buyer or calls a marketplace API — see the
        # note in app/routers/chat.py for the Phase 2 plan.
        message.status = payload.status

    db.commit()
    db.refresh(message)
    return message
