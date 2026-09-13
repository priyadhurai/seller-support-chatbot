from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth import get_current_seller
from app.database import get_db
from app.models.inventory import Inventory
from app.models.seller import Seller
from app.schemas.inventory import InventoryCreate, InventoryResponse, InventoryUpdate

router = APIRouter(prefix="/inventory", tags=["inventory"])


@router.get("", response_model=list[InventoryResponse])
def list_inventory(
    db: Session = Depends(get_db),
    current_seller: Seller = Depends(get_current_seller),
):
    return (
        db.query(Inventory)
        .filter(Inventory.seller_id == current_seller.id)
        .order_by(Inventory.product_name.asc())
        .all()
    )


@router.get("/low-stock", response_model=list[InventoryResponse])
def low_stock(
    db: Session = Depends(get_db),
    current_seller: Seller = Depends(get_current_seller),
):
    return (
        db.query(Inventory)
        .filter(
            Inventory.seller_id == current_seller.id,
            Inventory.quantity <= Inventory.low_stock_threshold,
        )
        .order_by(Inventory.quantity.asc())
        .all()
    )


@router.post("", response_model=InventoryResponse, status_code=status.HTTP_201_CREATED)
def create_inventory_item(
    payload: InventoryCreate,
    db: Session = Depends(get_db),
    current_seller: Seller = Depends(get_current_seller),
):
    item = Inventory(seller_id=current_seller.id, **payload.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.patch("/{item_id}", response_model=InventoryResponse)
def update_inventory_item(
    item_id: int,
    payload: InventoryUpdate,
    db: Session = Depends(get_db),
    current_seller: Seller = Depends(get_current_seller),
):
    item = (
        db.query(Inventory)
        .filter(Inventory.id == item_id, Inventory.seller_id == current_seller.id)
        .first()
    )
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Inventory item not found")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(item, field, value)

    db.commit()
    db.refresh(item)
    return item


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_inventory_item(
    item_id: int,
    db: Session = Depends(get_db),
    current_seller: Seller = Depends(get_current_seller),
):
    item = (
        db.query(Inventory)
        .filter(Inventory.id == item_id, Inventory.seller_id == current_seller.id)
        .first()
    )
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Inventory item not found")

    db.delete(item)
    db.commit()
