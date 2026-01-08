"use client"

import { useEffect, useState } from "react"
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
  RefreshCw,
  Calendar,
} from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"

import type {
  DashboardSummary,
  RevenuePoint,
  TopProduct,
  CategoryData,
} from "@/types/admin"

const COLORS = ["#2563EB", "#16A34A", "#F59E0B", "#DC2626", "#7C3AED"]

export default function Dashboard() {
  const [period, setPeriod] = useState<"weekly" | "monthly" | "yearly">("monthly")
  const [loading, setLoading] = useState(false)

  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [revenue, setRevenue] = useState<RevenuePoint[]>([])
  const [topProducts, setTopProducts] = useState<TopProduct[]>([])
  const [categories, setCategories] = useState<CategoryData[]>([])

  const { toast } = useToast()
const loadDashboard = async () => {
  try {
    setLoading(true)

    const [
      summaryRes,
      revenueRes,
      topRes,
      categoryRes,
    ] = await Promise.all([
      fetch(
        `http://localhost:8000/api/admin/dashboard/summary?period=${period}`,
        { cache: "no-store" }
      ),
      fetch(
        `http://localhost:8000/api/admin/dashboard/revenue?period=${period}`,
        { cache: "no-store" }
      ),
      fetch(
        "http://localhost:8000/api/admin/dashboard/top-products",
        { cache: "no-store" }
      ),
      fetch(
        "http://localhost:8000/api/admin/dashboard/categories",
        { cache: "no-store" }
      ),
    ])

    if (
      !summaryRes.ok ||
      !revenueRes.ok ||
      !topRes.ok ||
      !categoryRes.ok
    ) {
      throw new Error("Failed to load dashboard data")
    }

    const summaryData = await summaryRes.json()
    const revenueData = await revenueRes.json()
    const topProductsData = await topRes.json()
    const categoriesData = await categoryRes.json()

    setSummary(summaryData)
    setRevenue(revenueData)
    setTopProducts(topProductsData)
    setCategories(categoriesData)

  } catch (error) {
    console.error("Dashboard load error:", error)
    toast({
      title: "Error",
      description: "Failed to load dashboard data",
      variant: "destructive",
    })
  } finally {
    setLoading(false)
  }
}


  useEffect(() => {
    loadDashboard()
  }, [period])

  if (!summary) {
    return (
      <div className="flex items-center justify-center h-[70vh] text-slate-500">
        Loading dashboard…
      </div>
    )
  }

  const activeProducts = categories.reduce((sum, c) => sum + c.value, 0)

  return (
    <div className="min-h-screen bg-slate-50 p-6 space-y-8">

      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            Business Dashboard
          </h1>
          <p className="text-slate-600">
            Track revenue, orders, and product performance
          </p>
        </div>

        <div className="flex gap-3">
          <Select value={period} onValueChange={(v) => setPeriod(v as any)}>
            <SelectTrigger className="w-40">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="yearly">Yearly</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            onClick={loadDashboard}
            disabled={loading}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Stat
          title="Total Revenue"
          value={`₹${summary.total_revenue.toLocaleString()}`}
          icon={DollarSign}
          gradient="from-blue-600 to-blue-500"
        />
        <Stat
          title="Total Orders"
          value={summary.total_orders}
          icon={ShoppingCart}
          gradient="from-green-600 to-green-500"
        />
        <Stat
          title="Total Customers"
          value={summary.total_customers}
          icon={Users}
          gradient="from-purple-600 to-purple-500"
        />
        <Stat
          title="Active Products"
          value={activeProducts}
          icon={Package}
          gradient="from-orange-500 to-orange-400"
        />
      </div>

      {/* CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-7 gap-6">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={revenue}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563EB" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#2563EB" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(v) => `₹${v}`} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#2563EB"
                  fill="url(#revenueGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Category Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={320}>
              <PieChart>
                <Pie
                  data={categories}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={110}
                  label={({ name, percent = 0 }) =>
                    `${name} ${Math.round(percent * 100)}%`
                  }
                >
                  {categories.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* TOP PRODUCTS */}
      <Card>
        <CardHeader>
          <CardTitle>Top Selling Products</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {topProducts.length ? (
            topProducts.map((p, i) => (
              <div
                key={p.name}
                className="flex justify-between items-center p-4 rounded-lg bg-slate-50 border"
              >
                <div className="flex items-center gap-4">
                  <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold">
                    {i + 1}
                  </div>
                  <div>
                    <p className="font-medium">{p.name}</p>
                    <p className="text-sm text-slate-500">
                      {p.sales} units sold
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold">
                    ₹{p.revenue.toLocaleString()}
                  </p>
                  <Badge variant="secondary">High Demand</Badge>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-slate-500 py-6">
              No sales data available
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function Stat({
  title,
  value,
  icon: Icon,
  gradient,
}: {
  title: string
  value: any
  icon: any
  gradient: string
}) {
  return (
    <Card className={`bg-gradient-to-br ${gradient} text-white`}>
      <CardHeader className="flex flex-row justify-between items-center">
        <CardTitle className="text-sm opacity-90">{title}</CardTitle>
        <Icon className="h-5 w-5 opacity-80" />
      </CardHeader>
      <CardContent className="text-2xl font-bold">{value}</CardContent>
    </Card>
  )
}
