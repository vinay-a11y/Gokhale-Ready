"use client"

import { useState, useEffect, useCallback } from "react"
import { Flame, Weight, RefreshCw, Download, ChefHat, Clock, Package2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"

interface KitchenItem {
  name: string
  totalQuantity: number
  totalWeight: number
  orderCount: number
  variants: { variant: string; quantity: number; weight: number }[]
  priority: "high" | "medium" | "low"
  estimatedPrepTime: number
}
export const adminFetch = async (
  url: string,
  options: RequestInit = {}
) => {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("adminToken")
      : null

  if (!token) {
    window.location.href = "/admin/login"
    throw new Error("Admin not authenticated")
  }

  return fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
    cache: "no-store",
  })
}

export function KitchenSection() {
  const [kitchenData, setKitchenData] = useState<KitchenItem[]>([])
  const [statusFilter, setStatusFilter] = useState("confirmed,inprocess")
  const [isLoading, setIsLoading] = useState(false)

  const { toast } = useToast()

 
 

  // Load kitchen data
  const loadKitchenData = useCallback(
  async (silent = false) => {
    try {
      if (!silent) setIsLoading(true)
const response = await adminFetch(
  `http://localhost:8000/api/admin/kitchen-prep?status=${statusFilter}`
)

      const data: KitchenItem[] = await response.json()

      if (!response.ok || !Array.isArray(data)) {
        throw new Error("Failed to fetch kitchen prep")
      }

      setKitchenData(data)

      if (!silent) {
        toast({
          title: "Success",
          description: "Kitchen prep loaded",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load kitchen prep",
        variant: "destructive",
      })
    } finally {
      if (!silent) setIsLoading(false)
    }
  },
  [statusFilter, toast],
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
activeOrders: kitchenData.reduce(
  (sum, item) => sum + item.orderCount,
  0
),

    totalWeight: kitchenData.reduce((sum, item) => sum + item.totalWeight, 0),
    uniqueItems: kitchenData.length,
    highPriorityItems: kitchenData.filter((item) => item.priority === "high").length,
  }

  // Effects
  useEffect(() => {
    loadKitchenData()
  }, [loadKitchenData])



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
              {/* <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-4 rounded-xl shadow-lg min-w-[120px]">
                <div className="flex items-center gap-2">
                  <Flame className="h-5 w-5 opacity-80" />
                  <div>
                    <div className="text-xl font-bold">{stats.activeOrders}</div>
                    <div className="text-xs opacity-90">Active Orders</div>
                  </div>
                </div>
              </div> */}

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

