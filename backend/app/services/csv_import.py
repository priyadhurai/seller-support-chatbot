"""CSV import helpers: map common seller-export column names onto our schema."""

import csv
import io
import re
from datetime import date, datetime

ORDER_COLUMN_VARIANTS: dict[str, list[str]] = {
    "order_number": ["ordernumber", "orderid", "orderno", "order", "ordernum"],
    "product_name": ["productname", "product", "item", "itemname", "title"],
    "quantity": ["quantity", "qty", "units"],
    "status": ["status", "orderstatus"],
    "order_date": ["orderdate", "date", "purchasedate"],
    "buyer_name": ["buyername", "buyer", "customername", "customer", "buyerid"],
    "buyer_location": ["buyerlocation", "shipcity", "shippingcity", "city", "location", "deliverycity"],
}

INVENTORY_COLUMN_VARIANTS: dict[str, list[str]] = {
    "sku": ["sku", "skuid", "productcode", "code"],
    "product_name": ["productname", "product", "item", "itemname", "title"],
    "quantity": ["quantity", "qty", "stock", "stockqty", "unitsinstock"],
    "low_stock_threshold": ["lowstockthreshold", "threshold", "reorderlevel", "reorderpoint", "minstock"],
    "price": ["price", "unitprice", "mrp", "sellingprice"],
    "category": ["category", "productcategory", "type"],
    "description": ["description", "productdescription", "details"],
}

_DATE_FORMATS = ["%Y-%m-%d", "%m/%d/%Y", "%d/%m/%Y", "%d-%m-%Y", "%m-%d-%Y", "%d %b %Y"]


def _normalize_header(header: str) -> str:
    return re.sub(r"[^a-z0-9]", "", header.strip().lower())


def _build_reverse_map(variants: dict[str, list[str]]) -> dict[str, str]:
    reverse: dict[str, str] = {}
    for canonical, aliases in variants.items():
        reverse[canonical] = canonical
        for alias in aliases:
            reverse[alias] = canonical
    return reverse


_ORDER_REVERSE_MAP = _build_reverse_map(ORDER_COLUMN_VARIANTS)
_INVENTORY_REVERSE_MAP = _build_reverse_map(INVENTORY_COLUMN_VARIANTS)


def _parse_date(value: str) -> date:
    value = value.strip()
    for fmt in _DATE_FORMATS:
        try:
            return datetime.strptime(value, fmt).date()
        except ValueError:
            continue
    try:
        return date.fromisoformat(value)
    except ValueError:
        return date.today()


def _parse_int(value: str, default: int = 0) -> int:
    try:
        return int(float(value.strip()))
    except (ValueError, AttributeError):
        return default


def _parse_float(value: str, default: float = 0.0) -> float:
    try:
        return round(float(value.strip()), 2)
    except (ValueError, AttributeError):
        return default


def _rows_with_canonical_keys(content: bytes, reverse_map: dict[str, str]) -> list[dict[str, str]]:
    text = content.decode("utf-8-sig")
    reader = csv.DictReader(io.StringIO(text))
    rows = []
    for raw_row in reader:
        canonical_row: dict[str, str] = {}
        for header, value in raw_row.items():
            if header is None:
                continue
            normalized = _normalize_header(header)
            canonical_field = reverse_map.get(normalized)
            if canonical_field:
                canonical_row[canonical_field] = (value or "").strip()
        rows.append(canonical_row)
    return rows


def parse_orders_csv(content: bytes) -> list[dict]:
    rows = _rows_with_canonical_keys(content, _ORDER_REVERSE_MAP)
    parsed = []
    for row in rows:
        if not row.get("order_number"):
            continue
        status = row.get("status", "pending").lower()
        if status not in {"pending", "shipped", "delivered", "cancelled"}:
            status = "pending"
        parsed.append(
            {
                "order_number": row["order_number"],
                "product_name": row.get("product_name", ""),
                "quantity": _parse_int(row.get("quantity", "1"), default=1),
                "status": status,
                "order_date": _parse_date(row.get("order_date", "")),
                "buyer_name": row.get("buyer_name", ""),
                "buyer_location": row.get("buyer_location") or "Unknown",
            }
        )
    return parsed


def parse_inventory_csv(content: bytes) -> list[dict]:
    rows = _rows_with_canonical_keys(content, _INVENTORY_REVERSE_MAP)
    parsed = []
    for row in rows:
        if not row.get("sku"):
            continue
        parsed.append(
            {
                "sku": row["sku"],
                "product_name": row.get("product_name", ""),
                "quantity": _parse_int(row.get("quantity", "0"), default=0),
                "low_stock_threshold": _parse_int(row.get("low_stock_threshold", "5"), default=5),
                "price": _parse_float(row.get("price", "0"), default=0.0),
                "category": row.get("category") or "Uncategorized",
                "description": row.get("description") or None,
            }
        )
    return parsed
