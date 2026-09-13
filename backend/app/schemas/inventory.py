from pydantic import BaseModel


class InventoryResponse(BaseModel):
    id: int
    sku: str
    product_name: str
    quantity: int
    low_stock_threshold: int
    price: float
    category: str
    description: str | None

    model_config = {"from_attributes": True}


class InventoryCreate(BaseModel):
    sku: str
    product_name: str
    quantity: int = 0
    low_stock_threshold: int = 5
    price: float = 0
    category: str = "Uncategorized"
    description: str | None = None


class InventoryUpdate(BaseModel):
    quantity: int | None = None
    low_stock_threshold: int | None = None
    price: float | None = None
    category: str | None = None
    description: str | None = None
