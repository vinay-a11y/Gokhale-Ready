export type ActiveSection =
  | "dashboard"
  | "orders"
  | "products"
  | "kitchen"
  | "landing"

export interface DashboardSummary {
  total_revenue: number
  total_orders: number
  total_customers: number
}

export interface RevenuePoint {
  month?: string
  date?: string
  year?: number
  revenue: number
}

export interface TopProduct {
  name: string
  sales: number
  revenue: number
}

export interface CategoryData {
  name: string
  value: number
}
