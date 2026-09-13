from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth import get_current_seller
from app.database import get_db
from app.models.return_request import Return, ReturnStatus
from app.models.seller import Seller
from app.schemas.return_request import ReturnResponse, ReturnUpdate

router = APIRouter(prefix="/returns", tags=["returns"])


@router.get("", response_model=list[ReturnResponse])
def list_returns(
    status: ReturnStatus | None = None,
    db: Session = Depends(get_db),
    current_seller: Seller = Depends(get_current_seller),
):
    query = db.query(Return).filter(Return.seller_id == current_seller.id)
    if status is not None:
        query = query.filter(Return.status == status)
    return query.order_by(Return.requested_at.desc()).all()


@router.patch("/{return_id}", response_model=ReturnResponse)
def update_return(
    return_id: int,
    payload: ReturnUpdate,
    db: Session = Depends(get_db),
    current_seller: Seller = Depends(get_current_seller),
):
    ret = (
        db.query(Return)
        .filter(Return.id == return_id, Return.seller_id == current_seller.id)
        .first()
    )
    if not ret:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Return not found")

    if payload.status is not None:
        # Marking a return approved/refunded/rejected only updates our own
        # database — it never triggers a real refund payment. See the note
        # on app/models/return_request.py.
        ret.status = payload.status
    if payload.refund_amount is not None:
        ret.refund_amount = payload.refund_amount

    db.commit()
    db.refresh(ret)
    return ret
