"use client"

import { useState, useEffect, useCallback } from "react"
import { Flame, Weight, RefreshCw, Download, ChefHat, Clock, Package2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import type { Order } from "@/types/orders"

interface KitchenItem {
  name: string
  totalQuantity: number
  totalWeight: number
  orderCount: number
  variants: { variant: string; quantity: number; weight: number }[]
  priority: "high" | "medium" | "low"
  estimatedPrepTime: number
}

export function KitchenSection() {
  const [kitchenData, setKitchenData] = useState<KitchenItem[]>([])
  const [statusFilter, setStatusFilter] = useState("confirmed,inprocess")
  const [isLoading, setIsLoading] = useState(false)
  const [orders, setOrders] = useState<Order[]>([])

  const { toast } = useToast()

  const loadOrders = useCallback(
    async (silent = false) => {
      try {
        if (!silent) setIsLoading(true)

        const response = await fetch(" http://127.0.0.1:8000/api/admin/orders")
        const fetchedOrders: Order[] = await response.json()

        if (!response.ok || !Array.isArray(fetchedOrders)) {
          throw new Error("Failed to fetch orders")
        }

        setOrders(fetchedOrders)

        if (!silent) {
          toast({
            title: "Orders Loaded",
            description: "Successfully fetched orders from backend",
          })
        }
      } catch (error) {
        console.error("Error fetching orders:", error)
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

  // Helper function to convert package size to grams
  const convertToGrams = (variant: string): number => {
    const lowerVariant = variant.toLowerCase()

    // Extract number from variant string
    const numberMatch = lowerVariant.match(/(\d+(?:\.\d+)?)/)
    if (!numberMatch) return 0

    const number = Number.parseFloat(numberMatch[1])

    // Check for units
    if (lowerVariant.includes("kg")) {
      return number * 1000 // Convert kg to grams
    } else if (lowerVariant.includes("g")) {
      return number // Already in grams
    } else {
      // If no unit specified, assume it's grams
      return number
    }
  }

  // Calculate kitchen preparation data
  const calculateKitchenPrep = useCallback(
    (orders: Order[]) => {
      const statusFilters = statusFilter.split(",")
      const activeOrders = orders.filter((order) => statusFilters.includes(order.order_status))

      const itemMap = new Map<
        string,
        {
          name: string
          totalQuantity: number
          totalWeight: number
          orderCount: number
          variants: Map<string, { quantity: number; weight: number }>
          orders: Set<number>
        }
      >()

      // Aggregate items from all active orders
      activeOrders.forEach((order) => {
        order.items.forEach((item) => {
          const key = item.name
          if (!itemMap.has(key)) {
            itemMap.set(key, {
              name: item.name,
              totalQuantity: 0,
              totalWeight: 0,
              orderCount: 0,
              variants: new Map(),
              orders: new Set(),
            })
          }

          const itemData = itemMap.get(key)!
          itemData.totalQuantity += item.quantity
          itemData.orders.add(order.id)
          itemData.orderCount = itemData.orders.size

          // Calculate weight based on variant
          const variantWeight = convertToGrams(item.variant)
          const totalItemWeight = variantWeight * item.quantity
          itemData.totalWeight += totalItemWeight

          // Track variants with their weights
          const variantKey = item.variant
          if (!itemData.variants.has(variantKey)) {
            itemData.variants.set(variantKey, { quantity: 0, weight: 0 })
          }
          const variantData = itemData.variants.get(variantKey)!
          variantData.quantity += item.quantity
          variantData.weight += totalItemWeight
        })
      })

      // Convert to array and add priority and prep time
      return Array.from(itemMap.values()).map((item) => ({
        name: item.name,
        totalQuantity: item.totalQuantity,
        totalWeight: item.totalWeight,
        orderCount: item.orderCount,
        variants: Array.from(item.variants.entries()).map(([variant, data]) => ({
          variant,
          quantity: data.quantity,
          weight: data.weight,
        })),
        priority: calculatePriority(item.orderCount, item.totalWeight),
        estimatedPrepTime: calculatePrepTime(item.totalWeight),
      }))
    },
    [statusFilter],
  )

  const calculatePriority = (orderCount: number, totalWeight: number): "high" | "medium" | "low" => {
    if (orderCount >= 3 || totalWeight >= 2000) return "high"
    if (orderCount >= 2 || totalWeight >= 1000) return "medium"
    return "low"
  }

  const calculatePrepTime = (totalWeight: number): number => {
    const baseTime = Math.ceil(totalWeight / 100)
    return Math.max(baseTime, 5) // Minimum 5 minutes
  }

  // Load kitchen data
  const loadKitchenData = useCallback(
    async (silent = false) => {
      try {
        if (!silent) setIsLoading(true)

        const response = await fetch("http://127.0.0.1:8000/api/admin/orders")
        const fetchedOrders: Order[] = await response.json()

        if (!response.ok || !Array.isArray(fetchedOrders)) {
          throw new Error("Failed to fetch orders")
        }

        setOrders(fetchedOrders)

        // Now calculate kitchen prep data from the real orders
        const prepData = calculateKitchenPrep(fetchedOrders)
        setKitchenData(prepData)

        if (!silent) {
          toast({
            title: "Success",
            description: "Kitchen data calculated successfully",
          })
        }
      } catch (error) {
        console.error("Error calculating kitchen data:", error)
        if (!silent) {
          toast({
            title: "Error",
            description: "Failed to calculate kitchen data",
            variant: "destructive",
          })
        }
      } finally {
        if (!silent) setIsLoading(false)
      }
    },
    [calculateKitchenPrep, toast],
  )

  // Export kitchen data
  const exportKitchenData = () => {
    if (kitchenData.length === 0) {
      toast({
        title: "Error",
        description: "No kitchen data to export",
        variant: "destructive",
      })
      return
    }

    const headers = ["Product Name", "Total Weight (g)", "Order Count", "Variants", "Priority", "Prep Time (min)"]

    const rows = kitchenData.map((item) => [
      item.name,
      item.totalWeight,
      item.orderCount,
      item.variants.map((v) => `${v.variant}: ${v.quantity}x (${v.weight}g)`).join("; "),
      item.priority,
      item.estimatedPrepTime,
    ])

    const csvContent = [headers, ...rows].map((row) => row.map((field) => `"${field}"`).join(",")).join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `kitchen_prep_${new Date().toISOString().split("T")[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast({
      title: "Success",
      description: `Exported ${kitchenData.length} preparation items`,
    })
  }

  // Calculate statistics
  const stats = {
    activeOrders: orders.filter((order) => statusFilter.split(",").includes(order.order_status)).length,
    totalWeight: kitchenData.reduce((sum, item) => sum + item.totalWeight, 0),
    uniqueItems: kitchenData.length,
    highPriorityItems: kitchenData.filter((item) => item.priority === "high").length,
  }

  // Effects
  useEffect(() => {
    loadKitchenData()
  }, [loadKitchenData])

  useEffect(() => {
    if (orders.length > 0) {
      const prepData = calculateKitchenPrep(orders)
      setKitchenData(prepData)
    }
  }, [statusFilter, orders, calculateKitchenPrep])

  const getPriorityBadge = (priority: "high" | "medium" | "low") => {
    const variants = {
      high: "bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg",
      medium: "bg-gradient-to-r from-yellow-500 to-yellow-600 text-white shadow-lg",
      low: "bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg",
    }

    return (
      <Badge className={`${variants[priority]} border-0 font-semibold uppercase text-xs px-3 py-1`}>{priority}</Badge>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="flex items-center gap-3 text-3xl font-bold mb-2 text-slate-900">
                <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
                  <ChefHat className="h-5 w-5 text-white" />
                </div>
                Kitchen Preparation Center
              </h1>
              <p className="text-slate-600 text-sm">
                Calculate total quantities needed for efficient order preparation
              </p>
            </div>

            {/* Stats Cards */}
            <div className="flex gap-4">
              <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-4 rounded-xl shadow-lg min-w-[120px]">
                <div className="flex items-center gap-2">
                  <Flame className="h-5 w-5 opacity-80" />
                  <div>
                    <div className="text-xl font-bold">{stats.activeOrders}</div>
                    <div className="text-xs opacity-90">Active Orders</div>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-4 rounded-xl shadow-lg min-w-[120px]">
                <div className="flex items-center gap-2">
                  <Weight className="h-5 w-5 opacity-80" />
                  <div>
                    <div className="text-xl font-bold">{(stats.totalWeight / 1000).toFixed(1)}kg</div>
                    <div className="text-xs opacity-90">Total Weight</div>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 rounded-xl shadow-lg min-w-[120px]">
                <div className="flex items-center gap-2">
                  <Package2 className="h-5 w-5 opacity-80" />
                  <div>
                    <div className="text-xl font-bold">{stats.uniqueItems}</div>
                    <div className="text-xs opacity-90">Unique Items</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6">
        {/* Controls */}
        <div className="flex justify-between items-center mb-6 gap-4">
          <div className="flex items-center gap-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-64 border-slate-300 focus:border-orange-500 focus:ring-orange-500">
                <SelectValue />
              </SelectTrigger>
<SelectContent className="bg-white shadow-md">
                <SelectItem value="confirmed,inprocess">Confirmed & In Process</SelectItem>
                <SelectItem value="confirmed">Confirmed Only</SelectItem>
                <SelectItem value="inprocess">In Process Only</SelectItem>
                <SelectItem value="placed,confirmed,inprocess">All Active Orders</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => loadKitchenData()}
              className="border-slate-300 text-slate-700 hover:bg-slate-50"
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>

            <Button
              variant="outline"
              onClick={exportKitchenData}
              className="border-orange-300 text-orange-700 hover:bg-orange-50 bg-transparent"
            >
              <Download className="h-4 w-4 mr-2" />
              Export Prep List
            </Button>
          </div>
        </div>

        {/* Kitchen Table */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
          {isLoading ? (
            <div className="p-8">
              <div className="flex flex-col items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mb-4"></div>
                <p className="text-slate-600">Calculating preparation requirements...</p>
              </div>
            </div>
          ) : kitchenData.length === 0 ? (
            <div className="p-8">
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gradient-to-r from-orange-100 to-orange-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ChefHat className="h-8 w-8 text-orange-600" />
                </div>
                <h3 className="text-xl font-semibold text-slate-700 mb-2">No preparation needed</h3>
                <p className="text-slate-500">No confirmed or in-process orders found.</p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-orange-50 to-orange-100 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-left font-semibold text-slate-700">Product Name</th>
                    <th className="px-6 py-4 text-left font-semibold text-slate-700">Total Weight</th>
                    <th className="px-6 py-4 text-left font-semibold text-slate-700">Orders</th>
                    <th className="px-6 py-4 text-left font-semibold text-slate-700">Variants Breakdown</th>
                    <th className="px-6 py-4 text-left font-semibold text-slate-700">Priority</th>
                    <th className="px-6 py-4 text-left font-semibold text-slate-700">Prep Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {kitchenData
                    .sort((a, b) => {
                      const priorityOrder = { high: 3, medium: 2, low: 1 }
                      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
                        return priorityOrder[b.priority] - priorityOrder[a.priority]
                      }
                      return b.totalWeight - a.totalWeight
                    })
                    .map((item, index) => (
                      <tr
                        key={index}
                        className="hover:bg-gradient-to-r hover:from-slate-50 hover:to-orange-50 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="font-semibold text-slate-900">{item.name}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-slate-900">
                            {item.totalWeight >= 1000
                              ? `${(item.totalWeight / 1000).toFixed(1)} kg`
                              : `${item.totalWeight} g`}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-medium text-slate-900">{item.orderCount}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            {item.variants.map((variant, vIndex) => (
                              <span
                                key={vIndex}
                                className="inline-block bg-gradient-to-r from-slate-100 to-slate-200 text-slate-700 px-3 py-1 rounded-full text-sm mr-1 mb-1 shadow-sm"
                              >
                                {variant.variant}: {variant.quantity}x (
                                {variant.weight >= 1000
                                  ? `${(variant.weight / 1000).toFixed(1)}kg`
                                  : `${variant.weight}g`}
                                )
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4">{getPriorityBadge(item.priority)}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-slate-500" />
                            <span className="font-medium text-slate-900">{item.estimatedPrepTime} min</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

