from pydantic import BaseModel


class StatWithDelta(BaseModel):
    value: float
    delta_pct: float


class DashboardSummary(BaseModel):
    period: str
    start_date: str
    end_date: str
    total_revenue: StatWithDelta
    total_orders: StatWithDelta
    units_sold: StatWithDelta
    new_customers: StatWithDelta
    average_order_value: StatWithDelta


class DailySales(BaseModel):
    date: str
    total_revenue: float
    order_count: int


class OrderStatusCount(BaseModel):
    status: str
    count: int


class TopProductTrend(BaseModel):
    product_name: str
    total_quantity: int
    total_revenue: float
    trend_pct: float


class RevenueSummary(BaseModel):
    total_revenue: float
    total_quantity: int
    total_orders: int
    average_order_value: float


class ProductPerformance(BaseModel):
    product_name: str
    total_quantity: int
    total_orders: int
    total_revenue: float


class MonthlySales(BaseModel):
    month: str  # "YYYY-MM"
    total_quantity: int
    order_count: int
    total_revenue: float


class LocationSales(BaseModel):
    location: str
    total_quantity: int
    order_count: int
    total_revenue: float
