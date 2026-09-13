from typing import Literal

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.auth import get_current_seller
from app.database import get_db
from app.models.seller import Seller
from app.schemas.analytics import (
    DailySales,
    DashboardSummary,
    LocationSales,
    MonthlySales,
    OrderStatusCount,
    ProductPerformance,
    RevenueSummary,
    TopProductTrend,
)
from app.services import analytics as analytics_service

router = APIRouter(prefix="/analytics", tags=["analytics"])

Period = Literal["7d", "30d", "90d"]


@router.get("/dashboard-summary", response_model=DashboardSummary)
def dashboard_summary(
    period: Period = "7d",
    db: Session = Depends(get_db),
    current_seller: Seller = Depends(get_current_seller),
):
    return analytics_service.dashboard_summary(db, current_seller.id, period)


@router.get("/daily-sales", response_model=list[DailySales])
def daily_sales(
    period: Period = "7d",
    db: Session = Depends(get_db),
    current_seller: Seller = Depends(get_current_seller),
):
    return analytics_service.daily_sales(db, current_seller.id, period)


@router.get("/order-status-breakdown", response_model=list[OrderStatusCount])
def order_status_breakdown(
    period: Period = "7d",
    db: Session = Depends(get_db),
    current_seller: Seller = Depends(get_current_seller),
):
    return analytics_service.order_status_breakdown(db, current_seller.id, period)


@router.get("/top-products", response_model=list[TopProductTrend])
def top_products(
    period: Period = "7d",
    limit: int = 5,
    db: Session = Depends(get_db),
    current_seller: Seller = Depends(get_current_seller),
):
    return analytics_service.top_products_for_period(db, current_seller.id, period, limit)


@router.get("/revenue-summary", response_model=RevenueSummary)
def revenue_summary(
    db: Session = Depends(get_db),
    current_seller: Seller = Depends(get_current_seller),
):
    return analytics_service.revenue_summary(db, current_seller.id)


@router.get("/product-performance", response_model=list[ProductPerformance])
def product_performance(
    db: Session = Depends(get_db),
    current_seller: Seller = Depends(get_current_seller),
):
    return analytics_service.product_performance(db, current_seller.id)


@router.get("/monthly-sales", response_model=list[MonthlySales])
def monthly_sales(
    db: Session = Depends(get_db),
    current_seller: Seller = Depends(get_current_seller),
):
    return analytics_service.monthly_sales(db, current_seller.id)


@router.get("/sales-by-location", response_model=list[LocationSales])
def sales_by_location(
    db: Session = Depends(get_db),
    current_seller: Seller = Depends(get_current_seller),
):
    return analytics_service.sales_by_location(db, current_seller.id)
