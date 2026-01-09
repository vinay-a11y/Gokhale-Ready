  "use client"

  import { useState, useEffect, useCallback } from "react"
  import { Package, Plus, Search, X, RefreshCw, TrendingUp, BarChart3 } from "lucide-react"
  import { Button } from "@/components/ui/button"
  import { Input } from "@/components/ui/input"
  import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
  import { ProductsTable } from "./products-table"
  import { ProductModal } from "./product-modal"
  import { AddProductModal } from "./add-product-modal"
  import { useToast } from "@/hooks/use-toast"
  import type { Product } from "@/types/products"

  const CONFIG = {
    PRODUCTS_PER_PAGE: 20,
    SEARCH_DEBOUNCE_DELAY: 300,

    // ✅ FIXED URLs
    PRODUCTS_API_URL: "http://localhost:8000/api/admin/products-state",
    TOGGLE_ALL_URL: "http://localhost:8000/api/admin/products/toggle-all",
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

  export function ProductsSection() {
    const [products, setProducts] = useState<Product[]>([])
    const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
    const [currentPage, setCurrentPage] = useState(1)
    const [searchQuery, setSearchQuery] = useState("")
    const [categoryFilter, setCategoryFilter] = useState("all")
    const [sortBy, setSortBy] = useState("item_name")
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")
    const [isLoading, setIsLoading] = useState(false)
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
    const [showAddModal, setShowAddModal] = useState(false)

    const { toast } = useToast()

    // Load products from backend
    const loadProducts = useCallback(
      async (silent = false) => {
        try {
          if (!silent) setIsLoading(true)
  const response = await adminFetch(CONFIG.PRODUCTS_API_URL)
          if (!response.ok) throw new Error(`HTTP ${response.status}`)
          const data: Product[] = await response.json()
          const sortedData = data.sort((a, b) => a.item_name.localeCompare(b.item_name))
          setProducts(sortedData)
          setFilteredProducts(sortedData)

          if (!silent) {
            toast({ title: "Success", description: `Loaded ${sortedData.length} products successfully` })
          }
        } catch (error) {
          console.error("Error loading products:", error)
          if (!silent) {
            toast({ title: "Error", description: "Failed to load products from backend", variant: "destructive" })
          }
          setProducts([])
          setFilteredProducts([])
        } finally {
          if (!silent) setIsLoading(false)
        }
      },
      [toast],
    )

    // Apply search, filter, sort
    const applyFiltersAndRender = useCallback(() => {
      let filtered = [...products]

      if (categoryFilter !== "all") {
        filtered = filtered.filter((product) => product.category === categoryFilter)
      }

      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        filtered = filtered.filter(
          (product) =>
            product.item_name.toLowerCase().includes(query) ||
            product.category?.toLowerCase().includes(query) ||
            (product.description && product.description.toLowerCase().includes(query)),
        )
      }

      filtered.sort((a, b) => {
        let aValue: any = a[sortBy as keyof Product]
        let bValue: any = b[sortBy as keyof Product]

        if (aValue == null && bValue == null) return 0
        if (aValue == null) return sortOrder === "asc" ? -1 : 1
        if (bValue == null) return sortOrder === "asc" ? 1 : -1

        if (typeof aValue === "string" && typeof bValue === "string") {
          aValue = aValue.toLowerCase()
          bValue = bValue.toLowerCase()
        }

        if (aValue < bValue) return sortOrder === "asc" ? -1 : 1
        if (aValue > bValue) return sortOrder === "asc" ? 1 : -1
        return 0
      })

      setFilteredProducts(filtered)
    }, [products, categoryFilter, searchQuery, sortBy, sortOrder])

    // Reload products silently
    const handleProductUpdate = useCallback(() => {
      loadProducts(true)
    }, [loadProducts])

    // Toggle all products
    const toggleAllProducts = async (action: "1" | "0") => {
      const actionText = action === "1" ? "enable" : "disable"
      if (!confirm(`Are you sure you want to ${actionText} all products?`)) return

      try {
        setIsLoading(true)
  const response = await adminFetch(
    `${CONFIG.TOGGLE_ALL_URL}?action=${action}`,
    { method: "PATCH" }
  )
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        const data = await response.json()
        toast({ title: "Success", description: data.message })
        loadProducts(true)
      } catch (error) {
        console.error("Error toggling all products:", error)
        toast({ title: "Error", description: "Failed to toggle all products", variant: "destructive" })
      } finally {
        setIsLoading(false)
      }
    }

    const categories = [
      ...new Set(products.map((p) => p.category).filter((c): c is string => typeof c === "string")),
    ].sort()

    const stats = {
      totalProducts: products.length,
      totalCategories: categories.length,
      lowStockProducts: products.filter((p) => (p.shelf_life_days ?? Number.POSITIVE_INFINITY) < 30).length,
      activeProducts: products.filter((p) => p.is_enabled && p.price_01 && p.price_01 > 0).length,
    }

    useEffect(() => {
      loadProducts()
    }, [loadProducts])

    useEffect(() => {
      applyFiltersAndRender()
    }, [applyFiltersAndRender])

    useEffect(() => {
      const timer = setTimeout(() => setCurrentPage(1), CONFIG.SEARCH_DEBOUNCE_DELAY)
      return () => clearTimeout(timer)
    }, [searchQuery])

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-6 py-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="flex items-center gap-3 text-3xl font-bold mb-2 text-slate-900">
                  <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                    <Package className="h-5 w-5 text-white" />
                  </div>
                  Product Catalog
                </h1>
                <p className="text-slate-600 text-sm">
                  Manage your product catalog, pricing, and inventory efficiently
                </p>
              </div>

              <div className="flex gap-4">
                <StatCard
                  label="Total Products"
                  value={stats.totalProducts}
                  icon={Package}
                  color="from-emerald-500 to-emerald-600"
                />
                <StatCard
                  label="Categories"
                  value={stats.totalCategories}
                  icon={BarChart3}
                  color="from-blue-500 to-blue-600"
                />
                <StatCard
                  label="Active Products"
                  value={stats.activeProducts}
                  icon={TrendingUp}
                  color="from-green-500 to-green-600"
                />
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="max-w-[1500px] mx-auto p-6">
          {/* Controls */}
          <div className="flex justify-between items-center mb-6 gap-4 flex-wrap">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search products by name, category, or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-10 border-slate-300 focus:border-emerald-500 focus:ring-emerald-500"
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

            {/* Filters & Actions */}
            <div className="flex items-center gap-4">
              {/* Toggle All Dropdown */}
              <Select onValueChange={(value) => toggleAllProducts(value as "1" | "0")}>
                <SelectTrigger className="w-48 border-slate-300 focus:border-emerald-500 focus:ring-emerald-500">
                  <SelectValue placeholder="Toggle All Products" />
                </SelectTrigger>
                <SelectContent className="bg-white shadow-md">
                  <SelectItem value="1">Enable All Products</SelectItem>
                  <SelectItem value="0">Disable All Products</SelectItem>
                </SelectContent>
              </Select>

              {/* Category Filter */}
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-48 border-slate-300 focus:border-emerald-500 focus:ring-emerald-500">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent className="bg-white shadow-md">
                  <SelectItem value="all">All Categories ({products.length})</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category} ({products.filter((p) => p.category === category).length})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Sort */}
              <Select
                value={`${sortBy}-${sortOrder}`}
                onValueChange={(value) => {
                  const [newSortBy, newSortOrder] = value.split("-")
                  setSortBy(newSortBy)
                  setSortOrder(newSortOrder as "asc" | "desc")
                }}
              >
                <SelectTrigger className="w-48 border-slate-300 focus:border-emerald-500 focus:ring-emerald-500">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent className="bg-white shadow-md">
                  <SelectItem value="item_name-asc">Name (A-Z)</SelectItem>
                  <SelectItem value="item_name-desc">Name (Z-A)</SelectItem>
                  <SelectItem value="category-asc">Category (A-Z)</SelectItem>
                  <SelectItem value="price_01-asc">Price (Low-High)</SelectItem>
                  <SelectItem value="price_01-desc">Price (High-Low)</SelectItem>
                </SelectContent>
              </Select>

              {/* Refresh */}
              <Button
                variant="outline"
                onClick={() => loadProducts()}
                className="border-slate-300 text-slate-700 hover:bg-slate-50"
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
                Refresh
              </Button>

              {/* Add Product */}
              <Button
                className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 shadow-lg"
                onClick={() => setShowAddModal(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Product
              </Button>
            </div>
          </div>

          {/* Products Table */}
          <ProductsTable
            products={filteredProducts}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
            onProductSelect={setSelectedProduct}
            onProductUpdate={handleProductUpdate}
            isLoading={isLoading}
          />

          {/* Product Modal */}
          {selectedProduct && <ProductModal product={selectedProduct} onClose={() => setSelectedProduct(null)} />}

          {/* Add Product Modal */}
          {showAddModal && (
            <AddProductModal
              isOpen={showAddModal}
              onClose={() => setShowAddModal(false)}
              onSuccess={handleProductUpdate}
            />
          )}
        </div>
      </div>
    )
  }

  function StatCard({ label, value, icon: Icon, color }: { label: string; value: number; icon: any; color: string }) {
    return (
      <div className={`bg-gradient-to-r ${color} text-white p-4 rounded-xl shadow-lg min-w-[130px]`}>
        <div className="flex items-center gap-3">
          <Icon className="h-5 w-5 opacity-80" />
          <div>
            <div className="text-xl font-bold">{value.toLocaleString()}</div>
            <div className="text-xs opacity-90">{label}</div>
          </div>
        </div>
      </div>
    )
  }
