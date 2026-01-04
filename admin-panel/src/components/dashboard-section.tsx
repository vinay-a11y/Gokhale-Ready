"use client"
import Dashboard from "./Dashboard"

interface Order {
  id: number
  order_date: string
  total_amount: number
  order_status: string
  items: Array<{
    name: string
    quantity: number
    price: number
  }>
}

interface Product {
  id: number
  item_name: string
  category: string
  total_sold: number
  revenue: number
}

interface DashboardData {
  totalRevenue: number
  totalOrders: number
  totalProducts: number
  totalCustomers: number
  recentOrders: Order[]
  monthlyData: Array<{
    month: string
    revenue: number
    orders: number
  }>
  statusData: Array<{
    name: string
    value: number
    color: string
  }>
  topProducts: Array<{
    name: string
    sold: number
    revenue: number
  }>
}

// Mock data for demonstration
const mockOrders: Order[] = [
  {
    id: 1,
    order_date: "2024-01-15",
    total_amount: 2500,
    order_status: "completed",
    items: [
      { name: "Premium Mixture", quantity: 5, price: 120 },
      { name: "Spicy Namkeen", quantity: 10, price: 60 },
      { name: "Classic Bhujia", quantity: 8, price: 100 },
    ],
  },
  {
    id: 2,
    order_date: "2024-01-14",
    total_amount: 1800,
    order_status: "processing",
    items: [
      { name: "Premium Mixture", quantity: 3, price: 120 },
      { name: "Spicy Namkeen", quantity: 15, price: 60 },
    ],
  },
  {
    id: 3,
    order_date: "2024-01-13",
    total_amount: 3200,
    order_status: "completed",
    items: [
      { name: "Classic Bhujia", quantity: 12, price: 100 },
      { name: "Premium Mixture", quantity: 8, price: 120 },
    ],
  },
  {
    id: 4,
    order_date: "2024-01-12",
    total_amount: 1500,
    order_status: "pending",
    items: [{ name: "Spicy Namkeen", quantity: 25, price: 60 }],
  },
  {
    id: 5,
    order_date: "2024-01-11",
    total_amount: 2800,
    order_status: "completed",
    items: [
      { name: "Premium Mixture", quantity: 6, price: 120 },
      { name: "Classic Bhujia", quantity: 16, price: 100 },
    ],
  },
]

export function DashboardSection() {
  return (
    <div className="container mx-auto px-6 py-8">
      <Dashboard />
    </div>
  )
}

