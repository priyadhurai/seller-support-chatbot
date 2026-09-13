const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const TOKEN_KEY = "seller_support_token";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    ...(options.body && !(options.body instanceof FormData) ? { "Content-Type": "application/json" } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string> | undefined),
  };

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });

  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      detail = body.detail || detail;
    } catch {
      // ignore non-JSON error bodies
    }
    throw new ApiError(res.status, detail);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

// ---- Types -----------------------------------------------------------

export type Marketplace = "amazon" | "flipkart";
export type OrderStatus = "pending" | "shipped" | "delivered" | "cancelled";
export type MessageStatus = "pending" | "drafted" | "approved";
export type ReturnStatus = "requested" | "approved" | "refunded" | "rejected";

export interface Seller {
  id: number;
  name: string;
  email: string;
  marketplace: Marketplace;
}

export interface Order {
  id: number;
  order_number: string;
  product_name: string;
  quantity: number;
  status: OrderStatus;
  order_date: string;
  buyer_name: string;
  buyer_location: string;
}

export interface InventoryItem {
  id: number;
  sku: string;
  product_name: string;
  quantity: number;
  low_stock_threshold: number;
  price: number;
  category: string;
  description: string | null;
}

export interface BuyerMessage {
  id: number;
  order_id: number;
  message_text: string;
  received_at: string;
  draft_reply: string | null;
  status: MessageStatus;
}

export interface ReturnRequest {
  id: number;
  order_id: number;
  reason: string;
  status: ReturnStatus;
  refund_amount: number | null;
  requested_at: string;
}

export interface RevenueSummary {
  total_revenue: number;
  total_quantity: number;
  total_orders: number;
  average_order_value: number;
}

export interface ProductPerformance {
  product_name: string;
  total_quantity: number;
  total_orders: number;
  total_revenue: number;
}

export interface MonthlySales {
  month: string;
  total_quantity: number;
  order_count: number;
  total_revenue: number;
}

export interface LocationSales {
  location: string;
  total_quantity: number;
  order_count: number;
  total_revenue: number;
}

export type Period = "7d" | "30d" | "90d";

export interface StatWithDelta {
  value: number;
  delta_pct: number;
}

export interface DashboardSummary {
  period: Period;
  start_date: string;
  end_date: string;
  total_revenue: StatWithDelta;
  total_orders: StatWithDelta;
  units_sold: StatWithDelta;
  new_customers: StatWithDelta;
  average_order_value: StatWithDelta;
}

export interface DailySales {
  date: string;
  total_revenue: number;
  order_count: number;
}

export interface OrderStatusCount {
  status: string;
  count: number;
}

export interface TopProductTrend {
  product_name: string;
  total_quantity: number;
  total_revenue: number;
  trend_pct: number;
}

export interface SalesSummaryCard extends DashboardSummary {
  type: "sales_summary";
}

// ---- Auth --------------------------------------------------------------

export function signup(data: { name: string; email: string; password: string; marketplace: Marketplace }) {
  return request<{ access_token: string; token_type: string }>("/auth/signup", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function login(data: { email: string; password: string }) {
  return request<{ access_token: string; token_type: string }>("/auth/login", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function getMe() {
  return request<Seller>("/auth/me");
}

// ---- Orders / Inventory / Messages -------------------------------------

export function getOrders(status?: OrderStatus) {
  const qs = status ? `?status=${status}` : "";
  return request<Order[]>(`/orders${qs}`);
}

export function getInventory() {
  return request<InventoryItem[]>("/inventory");
}

export function getLowStockInventory() {
  return request<InventoryItem[]>("/inventory/low-stock");
}

export function createInventoryItem(data: {
  sku: string;
  product_name: string;
  quantity?: number;
  low_stock_threshold?: number;
  price?: number;
  category?: string;
  description?: string | null;
}) {
  return request<InventoryItem>("/inventory", { method: "POST", body: JSON.stringify(data) });
}

export function updateInventoryItem(
  id: number,
  data: Partial<{ quantity: number; low_stock_threshold: number; price: number; category: string; description: string | null }>
) {
  return request<InventoryItem>(`/inventory/${id}`, { method: "PATCH", body: JSON.stringify(data) });
}

export function deleteInventoryItem(id: number) {
  return request<void>(`/inventory/${id}`, { method: "DELETE" });
}

export function getBuyerMessages(status?: MessageStatus) {
  const qs = status ? `?status=${status}` : "";
  return request<BuyerMessage[]>(`/buyer-messages${qs}`);
}

export function updateBuyerMessage(id: number, data: { draft_reply?: string; status?: MessageStatus }) {
  return request<BuyerMessage>(`/buyer-messages/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

// ---- Returns ------------------------------------------------------------

export function getReturns(status?: ReturnStatus) {
  const qs = status ? `?status=${status}` : "";
  return request<ReturnRequest[]>(`/returns${qs}`);
}

export function updateReturn(id: number, data: { status?: ReturnStatus; refund_amount?: number }) {
  return request<ReturnRequest>(`/returns/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

// ---- Analytics ------------------------------------------------------------

export function getRevenueSummary() {
  return request<RevenueSummary>("/analytics/revenue-summary");
}

export function getProductPerformance() {
  return request<ProductPerformance[]>("/analytics/product-performance");
}

export function getMonthlySales() {
  return request<MonthlySales[]>("/analytics/monthly-sales");
}

export function getSalesByLocation() {
  return request<LocationSales[]>("/analytics/sales-by-location");
}

export function getDashboardSummary(period: Period = "7d") {
  return request<DashboardSummary>(`/analytics/dashboard-summary?period=${period}`);
}

export function getDailySales(period: Period = "7d") {
  return request<DailySales[]>(`/analytics/daily-sales?period=${period}`);
}

export function getOrderStatusBreakdown(period: Period = "7d") {
  return request<OrderStatusCount[]>(`/analytics/order-status-breakdown?period=${period}`);
}

export function getTopProducts(period: Period = "7d", limit = 5) {
  return request<TopProductTrend[]>(`/analytics/top-products?period=${period}&limit=${limit}`);
}

// ---- Chat ----------------------------------------------------------------

export function sendChatMessage(message: string) {
  return request<{ reply: string; card: SalesSummaryCard | null }>("/chat", {
    method: "POST",
    body: JSON.stringify({ message }),
  });
}

// ---- CSV import ------------------------------------------------------

export function importOrdersCsv(file: File) {
  const form = new FormData();
  form.append("file", file);
  return request<{ imported: number }>("/import/orders", { method: "POST", body: form });
}

export function importInventoryCsv(file: File) {
  const form = new FormData();
  form.append("file", file);
  return request<{ imported: number }>("/import/inventory", { method: "POST", body: form });
}
