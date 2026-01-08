"use client"

import { useState, useEffect, useCallback } from "react"
import { ClipboardList, ShoppingCart, Clock, HourglassIcon, Search, X, Download, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { OrdersTable } from "./orders-table"
import { OrderModal } from "./order-modal"
import { useToast } from "@/hooks/use-toast"
import type { Order, OrderStatus, TabType } from "@/types/orders"

// Configuration
const CONFIG = {
  ORDERS_PER_PAGE: 20,
  RECENT_DAYS_FILTER: 10,
  SEARCH_DEBOUNCE_DELAY: 300,
  API_BASE_URL: "http://gokhalebandhu.com/api/admin/orders",
  AUTO_REFRESH_INTERVAL: 30000,
}

export function OrdersSection() {
  // State management
  const [orders, setOrders] = useState<Order[]>([])
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([])
  const [currentTab, setCurrentTab] = useState<TabType>("recent")
  const [currentPage, setCurrentPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState("")
  const [dateFilter, setDateFilter] = useState("all")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [sortBy, setSortBy] = useState("created_at")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [isLoading, setIsLoading] = useState(false)
  const [selectedOrders, setSelectedOrders] = useState<Set<number>>(new Set())
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)

  const { toast } = useToast()

  // Load orders from API - using real backend data
  const loadOrders = useCallback(
    async (silent = false) => {
      try {
        if (!silent) setIsLoading(true)

const response = await fetch("http://localhost:8000/api/admin/orders", {
          credentials: "include",
        })

        if (response.ok) {
          const data = await response.json()
          const sortedData = data.sort(
            (a: Order, b: Order) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
          )
          setOrders(sortedData)

          if (!silent) {
            toast({
              title: "Success",
              description: `Loaded ${sortedData.length} orders from backend`,
            })
          }
        } else {
          throw new Error(`HTTP ${response.status}`)
        }
      } catch (error) {
        console.error("Error loading orders:", error)
        if (!silent) {
          toast({
            title: "Error",
            description: "Failed to load orders from backend",
            variant: "destructive",
          })
        }
        // Set empty array if backend fails
        setOrders([])
      } finally {
        if (!silent) setIsLoading(false)
      }
    },
    [toast],
  )

  // Update order status
  const updateOrderStatus = async (orderId: number, newStatus: OrderStatus) => {
    try {
      const response = await fetch(`${CONFIG.API_BASE_URL}/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ order_status: newStatus }),
      })

      if (response.ok) {
        const updatedOrder = await response.json()
        setOrders((prev) =>
          prev.map((order) =>
            order.id === orderId ? { ...order, order_status: updatedOrder.order_status || newStatus } : order,
          ),
        )
        toast({
          title: "Success",
          description: `Order #${orderId} status updated to ${newStatus}`,
        })
      } else {
        throw new Error(`HTTP ${response.status}`)
      }
    } catch (error) {
      console.error("Error updating order status:", error)
      toast({
        title: "Error",
        description: "Failed to update order status",
        variant: "destructive",
      })
    }
  }

  // Bulk update status
  const bulkUpdateStatus = async (newStatus: OrderStatus) => {
    if (selectedOrders.size === 0) {
      toast({
        title: "Error",
        description: "No orders selected",
        variant: "destructive",
      })
      return
    }

    try {
      const orderIds = Array.from(selectedOrders)
      const updatePromises = orderIds.map((orderId) =>
        fetch(`${CONFIG.API_BASE_URL}/${orderId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ order_status: newStatus }),
        }),
      )

      await Promise.all(updatePromises)

      // Update local state
      setOrders((prev) =>
        prev.map((order) => (orderIds.includes(order.id) ? { ...order, order_status: newStatus } : order)),
      )

      setSelectedOrders(new Set())

      toast({
        title: "Success",
        description: `${orderIds.length} orders updated to ${newStatus}`,
      })
    } catch (error) {
      console.error("Error bulk updating orders:", error)
      toast({
        title: "Error",
        description: "Failed to update orders",
        variant: "destructive",
      })
    }
  }

  // Export to CSV
  const exportOrders = () => {
    if (filteredOrders.length === 0) {
      toast({
        title: "Error",
        description: "No orders to export",
        variant: "destructive",
      })
      return
    }

    const headers = [
      "Order ID",
      "Razorpay ID",
      "Customer Name",
      "Phone",
      "Date",
      "Amount",
      "Status",
      "Items",
      "Address",
    ]

    const rows = filteredOrders.map((order) => [
      order.id,
      order.razorpay_order_id,
      order.first_name|| "",
      order.mobile_number || "",
      formatDate(order.created_at),
      order.total_amount,
      order.order_status,
      order.items?.map((item) => `${item.name} (${item.quantity}x${item.variant})`).join("; ") || "",
      `${order.address?.line1 || ""}, ${order.address?.city || ""}, ${order.address?.state || ""} - ${order.address?.pincode || ""}`,
    ])

    const csvContent = [headers, ...rows].map((row) => row.map((field) => `"${field}"`).join(",")).join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `gokhale_bhandu_orders_${currentTab}_${new Date().toISOString().split("T")[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast({
      title: "Success",
      description: `Exported ${filteredOrders.length} orders`,
    })
  }

  // Apply filters and render
  const applyFiltersAndRender = useCallback(() => {
    let filtered = [...orders]

    // Apply tab filter
    const now = new Date()
    const recentCutoff = new Date(now)
    recentCutoff.setDate(recentCutoff.getDate() - CONFIG.RECENT_DAYS_FILTER)

    switch (currentTab) {
      case "recent":
        filtered = filtered.filter((order) => {
          const orderDate = new Date(order.created_at)
          return orderDate >= recentCutoff
        })
        break
      case "placed":
        filtered = filtered.filter((order) => order.order_status === "placed")
        break
      case "confirmed":
        filtered = filtered.filter((order) => order.order_status === "confirmed")
        break
      case "inprocess":
        filtered = filtered.filter((order) => order.order_status === "inprocess")
        break
      case "dispatched":
        filtered = filtered.filter((order) => order.order_status === "dispatched")
        break
      case "delivered":
        filtered = filtered.filter((order) => order.order_status === "delivered")
        break
      case "completed":
        filtered = filtered.filter((order) => order.order_status === "completed")
        break
      case "rejected":
        filtered = filtered.filter((order) => order.order_status === "rejected")
        break
      case "all":
      default:
        // No filter
        break
    }

    // Apply date filter
    if (dateFilter !== "all") {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      switch (dateFilter) {
        case "today":
          filtered = filtered.filter((order) => {
            const orderDate = new Date(order.created_at)
            orderDate.setHours(0, 0, 0, 0)
            return orderDate.getTime() === today.getTime()
          })
          break
        case "yesterday":
          const yesterday = new Date(today)
          yesterday.setDate(yesterday.getDate() - 1)
          filtered = filtered.filter((order) => {
            const orderDate = new Date(order.created_at)
            orderDate.setHours(0, 0, 0, 0)
            return orderDate.getTime() === yesterday.getTime()
          })
          break
        case "week":
          const weekAgo = new Date(today)
          weekAgo.setDate(weekAgo.getDate() - 7)
          filtered = filtered.filter((order) => {
            const orderDate = new Date(order.created_at)
            return orderDate >= weekAgo
          })
          break
        case "month":
          const monthAgo = new Date(today)
          monthAgo.setMonth(monthAgo.getMonth() - 1)
          filtered = filtered.filter((order) => {
            const orderDate = new Date(order.created_at)
            return orderDate >= monthAgo
          })
          break
        case "custom":
          if (startDate || endDate) {
            filtered = filtered.filter((order) => {
              const orderDate = new Date(order.created_at)
              if (startDate && orderDate < new Date(startDate)) return false
              if (endDate && orderDate > new Date(endDate + "T23:59:59")) return false
              return true
            })
          }
          break
      }
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (order) =>
          order.id.toString().includes(query) ||
          order.razorpay_order_id?.toLowerCase().includes(query) ||
          (order.first_name && order.first_name.toLowerCase().includes(query)) ||
          (order.mobile_number && order.mobile_number.toLowerCase().includes(query)),
      ) 
    }

    // Apply sorting with proper null/undefined handling
    filtered.sort((a, b) => {
      let aValue: any = a[sortBy as keyof Order]
      let bValue: any = b[sortBy as keyof Order]

      // Handle null/undefined values
      if (aValue == null && bValue == null) return 0
      if (aValue == null) return sortOrder === "asc" ? -1 : 1
      if (bValue == null) return sortOrder === "asc" ? 1 : -1

      if (sortBy === "created_at") {
        aValue = new Date(aValue as string).getTime()
        bValue = new Date(bValue as string).getTime()
      } else if (sortBy === "total_amount") {
        aValue = Number(aValue) || 0
        bValue = Number(bValue) || 0
      } else if (typeof aValue === "string" && typeof bValue === "string") {
        aValue = aValue.toLowerCase()
        bValue = bValue.toLowerCase()
      }

      if (aValue < bValue) return sortOrder === "asc" ? -1 : 1
      if (aValue > bValue) return sortOrder === "asc" ? 1 : -1
      return 0
    })

    setFilteredOrders(filtered)
  }, [orders, currentTab, searchQuery, sortBy, sortOrder, dateFilter, startDate, endDate])

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  // Calculate real statistics from actual data
  const stats = {
    totalOrders: orders.length,
    recentOrders: orders.filter((order) => {
      const recentCutoff = new Date()
      recentCutoff.setDate(recentCutoff.getDate() - CONFIG.RECENT_DAYS_FILTER)
      return new Date(order.created_at) >= recentCutoff
    }).length,
    pendingOrders: orders.filter((order) => !["completed", "rejected", "delivered"].includes(order.order_status))
      .length,
    totalRevenue: orders.reduce((sum, order) => sum + (order.total_amount || 0), 0),
  }

  // Calculate tab counts from real data
  const tabCounts = {
    recent: orders.filter((order) => {
      const recentCutoff = new Date()
      recentCutoff.setDate(recentCutoff.getDate() - CONFIG.RECENT_DAYS_FILTER)
      return new Date(order.created_at) >= recentCutoff
    }).length,
    placed: orders.filter((order) => order.order_status === "placed").length,
    confirmed: orders.filter((order) => order.order_status === "confirmed").length,
    inprocess: orders.filter((order) => order.order_status === "inprocess").length,
    dispatched: orders.filter((order) => order.order_status === "dispatched").length,
    delivered: orders.filter((order) => order.order_status === "delivered").length,
    completed: orders.filter((order) => order.order_status === "completed").length,
    rejected: orders.filter((order) => order.order_status === "rejected").length,
    all: orders.length,
  }

  // Effects
  useEffect(() => {
    loadOrders()

    // Set up auto-refresh
    const interval = setInterval(() => {
      loadOrders(true) // Silent refresh
    }, CONFIG.AUTO_REFRESH_INTERVAL)

    return () => clearInterval(interval)
  }, [loadOrders])

  useEffect(() => {
    applyFiltersAndRender()
  }, [applyFiltersAndRender])

  // Search debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1)
    }, CONFIG.SEARCH_DEBOUNCE_DELAY)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Tab definitions
  const tabs = [
    { id: "recent" as TabType, label: "Recent Orders (10 days)", icon: Clock, count: tabCounts.recent },
    { id: "placed" as TabType, label: "Placed", icon: ShoppingCart, count: tabCounts.placed },
    { id: "confirmed" as TabType, label: "Confirmed", icon: ShoppingCart, count: tabCounts.confirmed },
    { id: "inprocess" as TabType, label: "In Process", icon: ShoppingCart, count: tabCounts.inprocess },
    { id: "dispatched" as TabType, label: "Dispatched", icon: ShoppingCart, count: tabCounts.dispatched },
    { id: "delivered" as TabType, label: "Delivered", icon: ShoppingCart, count: tabCounts.delivered },
    { id: "completed" as TabType, label: "Completed", icon: ShoppingCart, count: tabCounts.completed },
    { id: "rejected" as TabType, label: "Rejected", icon: ShoppingCart, count: tabCounts.rejected },
    { id: "all" as TabType, label: "All Orders", icon: ShoppingCart, count: tabCounts.all },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="flex items-center gap-3 text-3xl font-bold mb-2">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <ClipboardList className="h-5 w-5 text-white" />
                </div>
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Gokhale Bhandu Orders
                </span>
              </h1>
              <p className="text-slate-600 text-sm">
                Manage and track all customer orders with progression: Placed → Confirmed → In Process → Dispatched →
                Delivered
              </p>
            </div>

            {/* Stats Cards */}
            <div className="flex gap-4">
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 rounded-xl shadow-lg min-w-[130px]">
                <div className="flex items-center gap-3">
                  <ShoppingCart className="h-6 w-6 opacity-80" />
                  <div>
                    <div className="text-2xl font-bold">{stats.totalOrders.toLocaleString()}</div>
                    <div className="text-xs opacity-90">Total Orders</div>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white p-4 rounded-xl shadow-lg min-w-[130px]">
                <div className="flex items-center gap-3">
                  <Clock className="h-6 w-6 opacity-80" />
                  <div>
                    <div className="text-2xl font-bold">{stats.recentOrders.toLocaleString()}</div>
                    <div className="text-xs opacity-90">Recent Orders</div>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-4 rounded-xl shadow-lg min-w-[130px]">
                <div className="flex items-center gap-3">
                  <HourglassIcon className="h-6 w-6 opacity-80" />
                  <div>
                    <div className="text-2xl font-bold">{stats.pendingOrders.toLocaleString()}</div>
                    <div className="text-xs opacity-90">Pending Orders</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-10xl mx-auto p-8">
        {/* Navigation Tabs */}
        <nav className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setCurrentTab(tab.id)
                  setCurrentPage(1)
                }}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium whitespace-nowrap transition-all duration-200 ${
                  currentTab === tab.id
                    ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg transform scale-105"
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 hover:text-blue-600 hover:border-blue-200 shadow-sm"
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
                <span
                  className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    currentTab === tab.id ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            )
          })}
        </nav>

        {/* Controls */}
        <div className="flex justify-between items-center mb-8 gap-4 flex-wrap">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search by Order ID, Razorpay ID, Customer Name, or Phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10 border-slate-300 focus:border-blue-500 focus:ring-blue-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Filters */}
          <div className="flex items-center gap-4">
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-40 border-slate-300 focus:border-blue-500 focus:ring-blue-500">
                <SelectValue />
              </SelectTrigger>
<SelectContent className="bg-white shadow-md">
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="yesterday">Yesterday</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="custom">Custom Range</SelectItem>
              </SelectContent>
            </Select>

            {dateFilter === "custom" && (
              <>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-40 border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                />
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-40 border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </>
            )}

            {/* Action Buttons */}
            <Button
              variant="outline"
              onClick={() => loadOrders()}
              className="border-slate-300 text-slate-700 hover:bg-slate-50"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>

            <Button
              variant="outline"
              onClick={exportOrders}
              className="border-blue-300 text-blue-700 hover:bg-blue-50 bg-transparent"
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedOrders.size > 0 && (
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-4 mb-6 shadow-sm">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-blue-700">
                {selectedOrders.size} order{selectedOrders.size !== 1 ? "s" : ""} selected
              </span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => bulkUpdateStatus("confirmed")}
                  className="bg-blue-600 hover:bg-blue-700 shadow-sm"
                >
                  Confirm All
                </Button>
                <Button
                  size="sm"
                  onClick={() => bulkUpdateStatus("rejected")}
                  variant="destructive"
                  className="shadow-sm"
                >
                  Reject All
                </Button>
                <Button
                  size="sm"
                  onClick={() => setSelectedOrders(new Set())}
                  variant="outline"
                  className="border-slate-300 text-slate-700 hover:bg-slate-50"
                >
                  Clear Selection
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Orders Table */}
        <OrdersTable
          orders={filteredOrders}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          onOrderSelect={setSelectedOrder}
          onStatusUpdate={updateOrderStatus}
          selectedOrders={selectedOrders}
          onOrderSelectionChange={setSelectedOrders}
          isLoading={isLoading}
        />

        {/* Order Details Modal */}
        {selectedOrder && <OrderModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />}
      </div>
    </div>
  )
}

