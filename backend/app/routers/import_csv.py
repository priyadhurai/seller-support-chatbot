from fastapi import APIRouter, Depends, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.auth import get_current_seller
from app.database import get_db
from app.models.inventory import Inventory
from app.models.order import Order
from app.models.seller import Seller
from app.services.csv_import import parse_inventory_csv, parse_orders_csv

router = APIRouter(prefix="/import", tags=["import"])


@router.post("/orders", status_code=status.HTTP_201_CREATED)
async def import_orders(
    file: UploadFile,
    db: Session = Depends(get_db),
    current_seller: Seller = Depends(get_current_seller),
):
    if not file.filename or not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="File must be a .csv")

    content = await file.read()
    rows = parse_orders_csv(content)
    if not rows:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No valid order rows found")

    orders = [Order(seller_id=current_seller.id, **row) for row in rows]
    db.add_all(orders)
    db.commit()
    return {"imported": len(orders)}


@router.post("/inventory", status_code=status.HTTP_201_CREATED)
async def import_inventory(
    file: UploadFile,
    db: Session = Depends(get_db),
    current_seller: Seller = Depends(get_current_seller),
):
    if not file.filename or not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="File must be a .csv")

    content = await file.read()
    rows = parse_inventory_csv(content)
    if not rows:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No valid inventory rows found")

    items = [Inventory(seller_id=current_seller.id, **row) for row in rows]
    db.add_all(items)
    db.commit()
    return {"imported": len(items)}
