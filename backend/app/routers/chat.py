from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.auth import get_current_seller
from app.database import get_db
from app.models.seller import Seller
from app.schemas.chat import ChatRequest, ChatResponse
from app.services.gemini_service import run_chat

router = APIRouter(tags=["chat"])


@router.post("/chat", response_model=ChatResponse)
def chat(
    payload: ChatRequest,
    db: Session = Depends(get_db),
    current_seller: Seller = Depends(get_current_seller),
):
    # seller_id always comes from the authenticated JWT, never from the
    # request body or from Gemini's function-call arguments — this is what
    # keeps per-seller data scoped correctly.
    reply, card = run_chat(db, current_seller.id, payload.message)
    return ChatResponse(reply=reply, card=card)
