"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import {
  DollarSign,
  Users,
  ShoppingCart,
  Package,
  TrendingUp,
  TrendingDown,
  Activity,
  RefreshCw,
  Calendar,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Order {
  id: number
  razorpay_order_id: string
  customer_name: string
  phone_number: string
  total_amount: number
  order_status: string
  created_at: string
  items: Array<{
    name: string
    quantity: number
    variant: string
    price: number
  }>
  address: {
    line1: string
    city: string
    state: string
    pincode: string
  }
}

interface Product {
  id: number
  item_name: string
  category: string
  description: string
  shelf_life_days: number
  lead_time_days: number
  image_url: string
  packing_01: number
  price_01: number
  packing_02: number
  price_02: number
  packing_03: number
  price_03: number
  packing_04: number
  price_04: number
  is_enabled: boolean
}

export default function Dashboard() {
  const [orders, setOrders] = useState<Order[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [timePeriod, setTimePeriod] = useState("monthly")
  const { toast } = useToast()

  // Load orders from API
  const loadOrders = useCallback(
    async (silent = false) => {
      try {
        if (!silent) setIsLoading(true)
        const response = await fetch("http://localhost:8000/api/admin/orders", {
          credentials: "include",
        })
        if (response.ok) {
          const data = await response.json()
          setOrders(data)
        }
      } catch (error) {
        console.error("Error loading orders:", error)
        if (!silent) {
          toast({
            title: "Error",
            description: "Failed to load orders",
            variant: "destructive",
          })
        }
      } finally {
        if (!silent) setIsLoading(false)
      }
    },
    [toast],
  )

  // Load products from API
  const loadProducts = useCallback(
    async (silent = false) => {
      try {
        const response = await fetch("http://localhost:8000/api/products-state")
        if (response.ok) {
          const data = await response.json()
          setProducts(data)
        }
      } catch (error) {
        console.error("Error loading products:", error)
        if (!silent) {
          toast({
            title: "Error",
            description: "Failed to load products",
            variant: "destructive",
          })
        }
      }
    },
    [toast],
  )

  // Load all data
  const loadAllData = useCallback(async () => {
    setIsLoading(true)
    await Promise.all([loadOrders(true), loadProducts(true)])
    setIsLoading(false)
  }, [loadOrders, loadProducts])

  useEffect(() => {
    loadAllData()
  }, [loadAllData])

  // Calculate time-based sales data
  const getTimePeriodData = () => {
    const now = new Date()
    const dataMap: { [key: string]: { revenue: number; orders: number; date: Date } } = {}

    orders.forEach((order) => {
      const orderDate = new Date(order.created_at)
      let periodKey = ""

      switch (timePeriod) {
        case "weekly":
          // Get week number
          const weekStart = new Date(orderDate)
          weekStart.setDate(orderDate.getDate() - orderDate.getDay())
          periodKey = weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" })
          break
        case "monthly":
          periodKey = orderDate.toLocaleDateString("en-US", { month: "short", year: "numeric" })
          break
        case "yearly":
          periodKey = orderDate.getFullYear().toString()
          break
      }

      if (!dataMap[periodKey]) {
        dataMap[periodKey] = { revenue: 0, orders: 0, date: orderDate }
      }

      dataMap[periodKey].revenue += order.total_amount || 0
      dataMap[periodKey].orders += 1
    })

    return Object.entries(dataMap)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .slice(-12) // Last 12 periods
  }

  // Calculate category data from products
  const getCategoryData = () => {
    const categoryCount: { [key: string]: number } = {}

    products.forEach((product) => {
      if (product.category) {
        categoryCount[product.category] = (categoryCount[product.category] || 0) + 1
      }
    })

    const colors = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#06B6D4"]

    return Object.entries(categoryCount).map(([name, value], index) => ({
      name,
      value,
      color: colors[index % colors.length],
    }))
  }

  // Get top products by sales this period
  const getTopProducts = () => {
    const now = new Date()
    const startDate = new Date()

    switch (timePeriod) {
      case "weekly":
        startDate.setDate(now.getDate() - 7)
        break
      case "monthly":
        startDate.setMonth(now.getMonth() - 1)
        break
      case "yearly":
        startDate.setFullYear(now.getFullYear() - 1)
        break
    }

    const periodOrders = orders.filter((order) => new Date(order.created_at) >= startDate)
    const productCount: { [key: string]: { count: number; revenue: number } } = {}

    periodOrders.forEach((order) => {
      order.items?.forEach((item) => {
        if (!productCount[item.name]) {
          productCount[item.name] = { count: 0, revenue: 0 }
        }
        productCount[item.name].count += item.quantity
        productCount[item.name].revenue += item.quantity * (item.price || 0)
      })
    })

    return Object.entries(productCount)
      .map(([name, data]) => ({
        name,
        sales: data.count,
        revenue: data.revenue,
        trend: data.count > 0 ? "up" : "down",
      }))
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 5)
  }

  // Calculate statistics
  const stats = {
    totalRevenue: orders.reduce((sum, order) => sum + (order.total_amount || 0), 0),
    totalCustomers: new Set(orders.map((order) => order.customer_name)).size,
    totalOrders: orders.length,
    activeProducts: products.filter((p) => p.is_enabled).length,
  }

  // Calculate growth percentages based on actual data
  const calculateGrowth = () => {
    const now = new Date()
    const lastPeriodStart = new Date()
    const currentPeriodStart = new Date()

    switch (timePeriod) {
      case "weekly":
        lastPeriodStart.setDate(now.getDate() - 14)
        currentPeriodStart.setDate(now.getDate() - 7)
        break
      case "monthly":
        lastPeriodStart.setMonth(now.getMonth() - 2)
        currentPeriodStart.setMonth(now.getMonth() - 1)
        break
      case "yearly":
        lastPeriodStart.setFullYear(now.getFullYear() - 2)
        currentPeriodStart.setFullYear(now.getFullYear() - 1)
        break
    }

    const lastPeriodOrders = orders.filter(
      (order) => new Date(order.created_at) >= lastPeriodStart && new Date(order.created_at) < currentPeriodStart,
    )
    const currentPeriodOrders = orders.filter((order) => new Date(order.created_at) >= currentPeriodStart)

    const lastRevenue = lastPeriodOrders.reduce((sum, order) => sum + (order.total_amount || 0), 0)
    const currentRevenue = currentPeriodOrders.reduce((sum, order) => sum + (order.total_amount || 0), 0)

    const revenueGrowth = lastRevenue > 0 ? ((currentRevenue - lastRevenue) / lastRevenue) * 100 : 0
    const ordersGrowth =
      lastPeriodOrders.length > 0
        ? ((currentPeriodOrders.length - lastPeriodOrders.length) / lastPeriodOrders.length) * 100
        : 0

    return {
      revenue: Math.round(revenueGrowth),
      orders: Math.round(ordersGrowth),
      customers: Math.round(Math.random() * 20 + 5), // Mock for now
      products: Math.round(Math.random() * 10 - 2), // Mock for now
    }
  }

  const salesData = getTimePeriodData()
  const categoryData = getCategoryData()
  const topProducts = getTopProducts()
  const growth = calculateGrowth()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">Business Dashboard</h1>
              <p className="text-slate-600">Welcome back! Here's an overview of your business performance.</p>
            </div>
            <div className="flex items-center space-x-4">
              <Select value={timePeriod} onValueChange={setTimePeriod}>
                <SelectTrigger className="w-40">
                  <Calendar className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
              <SelectContent className="bg-white shadow-md">
  <SelectItem value="weekly">Weekly</SelectItem>
  <SelectItem value="monthly">Monthly</SelectItem>
  <SelectItem value="yearly">Yearly</SelectItem>
</SelectContent>

              </Select>
              <Button variant="outline" onClick={loadAllData} disabled={isLoading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium opacity-90">Total Revenue</CardTitle>
              <DollarSign className="h-5 w-5 opacity-80" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{stats.totalRevenue.toLocaleString()}</div>
              {/* <p className="text-xs opacity-90 flex items-center mt-1">
                {growth.revenue >= 0 ? (
                  <TrendingUp className="h-3 w-3 mr-1" />
                ) : (
                  <TrendingDown className="h-3 w-3 mr-1" />
                )}
                {growth.revenue >= 0 ? "+" : ""}
                {growth.revenue}% from last {timePeriod.slice(0, -2)}
              </p> */}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium opacity-90">Total Customers</CardTitle>
              <Users className="h-5 w-5 opacity-80" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCustomers.toLocaleString()}</div>
              {/* <p className="text-xs opacity-90 flex items-center mt-1">
                <TrendingUp className="h-3 w-3 mr-1" />+{growth.customers}% from last {timePeriod.slice(0, -2)}
              </p> */}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-500 to-orange-600 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium opacity-90">Total Orders</CardTitle>
              <ShoppingCart className="h-5 w-5 opacity-80" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalOrders.toLocaleString()}</div>
              {/* <p className="text-xs opacity-90 flex items-center mt-1">
                {growth.orders >= 0 ? (
                  <TrendingUp className="h-3 w-3 mr-1" />
                ) : (
                  <TrendingDown className="h-3 w-3 mr-1" />
                )}
                {growth.orders >= 0 ? "+" : ""}
                {growth.orders}% from last {timePeriod.slice(0, -2)}
              </p> */}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium opacity-90">Active Products</CardTitle>
              <Package className="h-5 w-5 opacity-80" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeProducts}</div>
              {/* <p className="text-xs opacity-90 flex items-center mt-1">
                {growth.products >= 0 ? (
                  <TrendingUp className="h-3 w-3 mr-1" />
                ) : (
                  <TrendingDown className="h-3 w-3 mr-1" />
                )}
                {growth.products >= 0 ? "+" : ""}
                {growth.products}% from last {timePeriod.slice(0, -2)}
              </p> */}
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid gap-6 lg:grid-cols-7">
          <Card className="col-span-4 shadow-lg border-0">
            <CardHeader>
              <CardTitle className="text-slate-900">
                Revenue Overview ({timePeriod.charAt(0).toUpperCase() + timePeriod.slice(1)})
              </CardTitle>
            </CardHeader>
            <CardContent className="pl-2">
              <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={salesData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" stroke="#64748b" />
                  <YAxis stroke="#64748b" />
                  <Tooltip
                    formatter={(value, name) => [
                      name === "revenue" ? `₹${value}` : value,
                      name === "revenue" ? "Revenue" : "Orders",
                    ]}
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #e2e8f0",
                      borderRadius: "8px",
                      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#3B82F6"
                    fill="#3B82F6"
                    fillOpacity={0.2}
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="col-span-3 shadow-lg border-0">
            <CardHeader>
              <CardTitle className="text-slate-900">Products by Category</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="value"
label={({ name, percent = 0 }) =>
  `${name} ${Math.round(percent * 100)}%`
}                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Top Products Section */}
        <Card className="shadow-lg border-0">
          <CardHeader>
            <CardTitle className="text-slate-900">
              Top Products This {timePeriod.charAt(0).toUpperCase() + timePeriod.slice(1, -2)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topProducts.length > 0 ? (
                topProducts.map((product, index) => (
                  <div key={product.name} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{product.name}</p>
                        <p className="text-sm text-slate-500">{product.sales} units sold</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-slate-900">₹{product.revenue.toLocaleString()}</p>
                      <Badge variant={product.trend === "up" ? "default" : "secondary"} className="text-xs">
                        {product.trend === "up" ? "↗ High" : "↘ Low"} Demand
                      </Badge>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No sales data available for this period</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Activity Feed */}
        <Card className="shadow-lg border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-900">
              <Activity className="h-5 w-5" />
              Recent Business Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {orders.slice(0, 3).map((order, index) => (
                <div
                  key={order.id}
                  className={`flex items-center gap-4 p-4 rounded-lg border-l-4 ${
                    index === 0
                      ? "border-blue-500 bg-blue-50"
                      : index === 1
                        ? "border-green-500 bg-green-50"
                        : "border-orange-500 bg-orange-50"
                  }`}
                >
                  <div
                    className={`w-3 h-3 rounded-full ${
                      index === 0 ? "bg-blue-500" : index === 1 ? "bg-green-500" : "bg-orange-500"
                    }`}
                  ></div>
                  <div className="flex-1">
                    <p className="font-medium text-slate-900">
                      {index === 0 ? "New order received" : index === 1 ? "Order status updated" : "Payment confirmed"}
                    </p>
                    <p className="text-sm text-slate-600">
                      Order #{order.id} from {order.customer_name || "Unknown"} - ₹{order.total_amount} -{" "}
                      {Math.floor((Date.now() - new Date(order.created_at).getTime()) / (1000 * 60))} minutes ago
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

