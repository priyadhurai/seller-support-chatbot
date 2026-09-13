"""Seller-scoped sales analytics, aggregated from orders.

Cancelled orders are excluded from every revenue/quantity aggregate here
since they didn't result in an actual sale (order-status breakdown is the
one exception — it counts cancelled orders too, since it's showing status
mix, not sales).

Revenue is computed as quantity x the product's CURRENT inventory price,
matched by product name (case-insensitive). Orders don't store a
price-at-time-of-sale, so this is a current-price approximation, not
historical revenue — and an order whose product name doesn't match any
current inventory item contributes 0 revenue (its quantity still counts
everywhere else).
"""

from datetime import date, timedelta

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.inventory import Inventory
from app.models.order import Order, OrderStatus
from app.models.return_request import Return

_ZERO = 0

_PERIOD_DAYS = {"7d": 7, "30d": 30, "90d": 90}


def _revenue_expr():
    return func.coalesce(func.sum(Order.quantity * Inventory.price), _ZERO)


def _with_price_join(db: Session, seller_id: int):
    return (
        db.query(Order)
        .select_from(Order)
        .outerjoin(
            Inventory,
            (Inventory.seller_id == Order.seller_id) & (func.lower(Inventory.product_name) == func.lower(Order.product_name)),
        )
        .filter(Order.seller_id == seller_id, Order.status != OrderStatus.cancelled)
    )


def period_bounds(period: str) -> tuple[date, date, date, date]:
    """Returns (start, end, prev_start, prev_end) for a period key like '7d'."""
    days = _PERIOD_DAYS.get(period, 7)
    end = date.today()
    start = end - timedelta(days=days - 1)
    prev_end = start - timedelta(days=1)
    prev_start = prev_end - timedelta(days=days - 1)
    return start, end, prev_start, prev_end


def _delta_pct(current: float, previous: float) -> float:
    if previous == 0:
        return 100.0 if current > 0 else 0.0
    return round((current - previous) / previous * 100, 1)


def revenue_summary(db: Session, seller_id: int) -> dict:
    row = (
        db.query(
            _revenue_expr().label("total_revenue"),
            func.sum(Order.quantity).label("total_quantity"),
            func.count(Order.id).label("total_orders"),
        )
        .select_from(Order)
        .outerjoin(
            Inventory,
            (Inventory.seller_id == Order.seller_id) & (func.lower(Inventory.product_name) == func.lower(Order.product_name)),
        )
        .filter(Order.seller_id == seller_id, Order.status != OrderStatus.cancelled)
        .one()
    )
    total_orders = row.total_orders or 0
    total_revenue = float(row.total_revenue or 0)
    return {
        "total_revenue": total_revenue,
        "total_quantity": int(row.total_quantity or 0),
        "total_orders": total_orders,
        "average_order_value": round(total_revenue / total_orders, 2) if total_orders else 0.0,
    }


def product_performance(db: Session, seller_id: int) -> list[dict]:
    rows = (
        _with_price_join(db, seller_id)
        .with_entities(
            Order.product_name,
            func.sum(Order.quantity).label("total_quantity"),
            func.count(Order.id).label("total_orders"),
            _revenue_expr().label("total_revenue"),
        )
        .group_by(Order.product_name)
        .order_by(_revenue_expr().desc())
        .all()
    )
    return [
        {
            "product_name": r.product_name,
            "total_quantity": int(r.total_quantity),
            "total_orders": r.total_orders,
            "total_revenue": float(r.total_revenue),
        }
        for r in rows
    ]


def monthly_sales(db: Session, seller_id: int) -> list[dict]:
    month_expr = func.to_char(Order.order_date, "YYYY-MM")
    rows = (
        _with_price_join(db, seller_id)
        .with_entities(
            month_expr.label("month"),
            func.sum(Order.quantity).label("total_quantity"),
            func.count(Order.id).label("order_count"),
            _revenue_expr().label("total_revenue"),
        )
        .group_by(month_expr)
        .order_by(month_expr.asc())
        .all()
    )
    return [
        {
            "month": r.month,
            "total_quantity": int(r.total_quantity),
            "order_count": r.order_count,
            "total_revenue": float(r.total_revenue),
        }
        for r in rows
    ]


def sales_by_location(db: Session, seller_id: int) -> list[dict]:
    rows = (
        _with_price_join(db, seller_id)
        .with_entities(
            Order.buyer_location,
            func.sum(Order.quantity).label("total_quantity"),
            func.count(Order.id).label("order_count"),
            _revenue_expr().label("total_revenue"),
        )
        .group_by(Order.buyer_location)
        .order_by(_revenue_expr().desc())
        .all()
    )
    return [
        {
            "location": r.buyer_location,
            "total_quantity": int(r.total_quantity),
            "order_count": r.order_count,
            "total_revenue": float(r.total_revenue),
        }
        for r in rows
    ]


def _period_totals(db: Session, seller_id: int, start: date, end: date) -> dict:
    row = (
        _with_price_join(db, seller_id)
        .filter(Order.order_date >= start, Order.order_date <= end)
        .with_entities(
            _revenue_expr().label("total_revenue"),
            func.sum(Order.quantity).label("total_quantity"),
            func.count(Order.id).label("total_orders"),
        )
        .one()
    )
    return {
        "total_revenue": float(row.total_revenue or 0),
        "total_quantity": int(row.total_quantity or 0),
        "total_orders": int(row.total_orders or 0),
    }


def _new_customers_count(db: Session, seller_id: int, start: date, end: date) -> int:
    # A buyer's first-ever order date for this seller determines when they
    # "became a customer" — count those whose first order falls in [start, end].
    first_order_subq = (
        db.query(Order.buyer_name, func.min(Order.order_date).label("first_order_date"))
        .filter(Order.seller_id == seller_id)
        .group_by(Order.buyer_name)
        .subquery()
    )
    return (
        db.query(func.count())
        .select_from(first_order_subq)
        .filter(first_order_subq.c.first_order_date >= start, first_order_subq.c.first_order_date <= end)
        .scalar()
        or 0
    )


def dashboard_summary(db: Session, seller_id: int, period: str) -> dict:
    start, end, prev_start, prev_end = period_bounds(period)
    current = _period_totals(db, seller_id, start, end)
    previous = _period_totals(db, seller_id, prev_start, prev_end)
    new_customers = _new_customers_count(db, seller_id, start, end)
    prev_new_customers = _new_customers_count(db, seller_id, prev_start, prev_end)

    current_aov = current["total_revenue"] / current["total_orders"] if current["total_orders"] else 0.0
    previous_aov = previous["total_revenue"] / previous["total_orders"] if previous["total_orders"] else 0.0

    return {
        "period": period,
        "start_date": start.isoformat(),
        "end_date": end.isoformat(),
        "total_revenue": {"value": current["total_revenue"], "delta_pct": _delta_pct(current["total_revenue"], previous["total_revenue"])},
        "total_orders": {"value": current["total_orders"], "delta_pct": _delta_pct(current["total_orders"], previous["total_orders"])},
        "units_sold": {"value": current["total_quantity"], "delta_pct": _delta_pct(current["total_quantity"], previous["total_quantity"])},
        "new_customers": {"value": new_customers, "delta_pct": _delta_pct(new_customers, prev_new_customers)},
        "average_order_value": {"value": round(current_aov, 2), "delta_pct": _delta_pct(current_aov, previous_aov)},
    }


def daily_sales(db: Session, seller_id: int, period: str) -> list[dict]:
    start, end, _, _ = period_bounds(period)
    rows = (
        _with_price_join(db, seller_id)
        .filter(Order.order_date >= start, Order.order_date <= end)
        .with_entities(
            Order.order_date.label("day"),
            _revenue_expr().label("total_revenue"),
            func.count(Order.id).label("order_count"),
        )
        .group_by(Order.order_date)
        .all()
    )
    by_day = {r.day: {"total_revenue": float(r.total_revenue), "order_count": r.order_count} for r in rows}

    result = []
    current = start
    while current <= end:
        day_data = by_day.get(current, {"total_revenue": 0.0, "order_count": 0})
        result.append({"date": current.isoformat(), **day_data})
        current += timedelta(days=1)
    return result


def order_status_breakdown(db: Session, seller_id: int, period: str) -> list[dict]:
    start, end, _, _ = period_bounds(period)
    rows = (
        db.query(Order.status, func.count(Order.id).label("count"))
        .filter(Order.seller_id == seller_id, Order.order_date >= start, Order.order_date <= end)
        .group_by(Order.status)
        .all()
    )
    breakdown = [{"status": r.status.value, "count": r.count} for r in rows]

    returned_count = (
        db.query(func.count(Return.id))
        .filter(Return.seller_id == seller_id, Return.requested_at >= start, Return.requested_at <= end + timedelta(days=1))
        .scalar()
        or 0
    )
    if returned_count:
        breakdown.append({"status": "returned", "count": returned_count})

    return breakdown


def top_products_for_period(db: Session, seller_id: int, period: str, limit: int = 5) -> list[dict]:
    start, end, prev_start, prev_end = period_bounds(period)

    def _totals_by_product(range_start: date, range_end: date) -> dict[str, dict]:
        rows = (
            _with_price_join(db, seller_id)
            .filter(Order.order_date >= range_start, Order.order_date <= range_end)
            .with_entities(
                Order.product_name,
                func.sum(Order.quantity).label("total_quantity"),
                _revenue_expr().label("total_revenue"),
            )
            .group_by(Order.product_name)
            .all()
        )
        return {r.product_name: {"total_quantity": int(r.total_quantity), "total_revenue": float(r.total_revenue)} for r in rows}

    current = _totals_by_product(start, end)
    previous = _totals_by_product(prev_start, prev_end)

    ranked = sorted(current.items(), key=lambda kv: kv[1]["total_revenue"], reverse=True)[:limit]
    return [
        {
            "product_name": name,
            "total_quantity": data["total_quantity"],
            "total_revenue": data["total_revenue"],
            "trend_pct": _delta_pct(data["total_revenue"], previous.get(name, {}).get("total_revenue", 0.0)),
        }
        for name, data in ranked
    ]
