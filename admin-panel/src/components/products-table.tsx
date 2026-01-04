import { Eye, Edit, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { useState } from "react"
import type { Product } from "@/types/products"
import { EditProductModal } from "./edit-product-modal"

interface ProductsTableProps {
  products: Product[]
  currentPage: number
  onPageChange: (page: number) => void
  onProductSelect: (product: Product) => void
  onProductUpdate: () => void
  isLoading: boolean
}

const PRODUCTS_PER_PAGE = 20

export function ProductsTable({
  products,
  currentPage,
  onPageChange,
  onProductSelect,
  onProductUpdate,
  isLoading,
}: ProductsTableProps) {
  const { toast } = useToast()
  const [editProduct, setEditProduct] = useState<Product | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  const handleDelete = async (id: number) => {
    const confirmed = window.confirm("Are you sure you want to delete this product?")
    if (!confirmed) return

    try {
      const res = await fetch(`http://localhost:8000/api/products/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Delete failed")

      toast({ title: "Success", description: "Product deleted successfully!" })
      onProductUpdate()
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete the product.", variant: "destructive" })
      console.error("Delete error:", error)
    }
  }

  const handleToggleStatus = async (id: number, currentStatus: boolean) => {
    try {
      const res = await fetch(`http://localhost:8000/api/products/${id}/toggle`, { method: "PATCH" })
      if (!res.ok) throw new Error("Toggle failed")
      const data = await res.json()

      toast({
        title: "Success",
        description: `Product ${data.new_status ? "enabled" : "disabled"} successfully!`,
      })
      onProductUpdate()
    } catch (error) {
      toast({ title: "Error", description: "Failed to toggle product status.", variant: "destructive" })
      console.error("Toggle error:", error)
    }
  }

  const totalPages = Math.ceil(products.length / PRODUCTS_PER_PAGE)
  const startIndex = (currentPage - 1) * PRODUCTS_PER_PAGE
  const endIndex = startIndex + PRODUCTS_PER_PAGE
  const paginatedProducts = products.slice(startIndex, endIndex)

  return (
    <div className="space-y-6">
      {/* Table */}
      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto w-full">
          <table className="min-w-[1400px] w-full">
            <thead className="bg-gradient-to-r from-emerald-50 to-green-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-left font-semibold text-slate-700">Image</th>
                <th className="px-6 py-4 text-left font-semibold text-slate-700">Product Name</th>
                <th className="px-6 py-4 text-left font-semibold text-slate-700">Category</th>
                <th className="px-6 py-4 text-left font-semibold text-slate-700">Pricing</th>
                <th className="px-6 py-4 text-left font-semibold text-slate-700">Shelf Life</th>
                <th className="px-6 py-4 text-left font-semibold text-slate-700">Description</th>
                <th className="px-6 py-4 text-left font-semibold text-slate-700">Status</th>
                <th className="px-6 py-4 text-left font-semibold text-slate-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {paginatedProducts.map((product) => (
                <tr
                  key={product.id}
                  className="hover:bg-gradient-to-r hover:from-slate-50 hover:to-emerald-50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <img
                      src={product.image_url || "/placeholder.svg?height=50&width=50"}
                      alt={product.item_name}
                      className="w-12 h-12 object-cover rounded-xl border border-slate-200 shadow-sm"
                    />
                  </td>
                  <td className="px-6 py-4 font-semibold text-slate-900">{product.item_name}</td>
                  <td className="px-6 py-4">
                    <Badge className="bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-800 border-0 shadow-sm">
                      {product.category}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      {product.packing_01 && <div className="text-sm">{product.packing_01}g: <strong>₹{product.price_01}</strong></div>}
                      {product.packing_02 && <div className="text-sm">{product.packing_02}g: <strong>₹{product.price_02}</strong></div>}
                      {product.packing_03 && <div className="text-sm">{product.packing_03}g: <strong>₹{product.price_03}</strong></div>}
                      {product.packing_04 && <div className="text-sm">{product.packing_04}g: <strong>₹{product.price_04}</strong></div>}
                    </div>
                  </td>
                  <td className="px-6 py-4">{product.shelf_life_days} days</td>
                  <td className="px-6 py-4 text-slate-600 max-w-[200px] line-clamp-3">{product.description || "No description available"}</td>
                  <td className="px-6 py-4">
                    <Button
                      size="sm"
                      variant={product.is_enabled ? "default" : "outline"}
                      className={product.is_enabled ? "bg-gradient-to-r from-green-500 to-green-600" : "bg-gray-200 text-slate-700"}
                      onClick={() => handleToggleStatus(product.id, product.is_enabled)}
                    >
                      {product.is_enabled ? "Disable" : "Enable"}
                    </Button>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-1">
                      <Button size="sm" variant="outline" onClick={() => onProductSelect(product)}>
                        <Eye className="h-3 w-3 mr-1" /> View
                      </Button>

                      {/* Edit Button */}
                      <Button
                        size="sm"
                        className="bg-gradient-to-r from-blue-500 to-blue-600"
                        onClick={() => {
                          setEditProduct(product)
                          setIsEditModalOpen(true)
                        }}
                      >
                        <Edit className="h-3 w-3 mr-1" /> Edit
                      </Button>

                      <Button
                        size="sm"
                        className="bg-gradient-to-r from-red-500 to-red-600"
                        onClick={() => handleDelete(product.id)}
                      >
                        <Trash2 className="h-3 w-3 mr-1" /> Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Product Modal */}
      {editProduct && (
        <EditProductModal
          isOpen={isEditModalOpen}
          product={editProduct}
          onClose={() => setIsEditModalOpen(false)}
          onSuccess={() => {
            onProductUpdate()
            setIsEditModalOpen(false)
          }}
        />
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="text-sm text-slate-600">
              Showing {startIndex + 1}-{Math.min(endIndex, products.length)} of {products.length} products
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="border-slate-300 text-slate-700 hover:bg-slate-50"
              >
                Previous
              </Button>
              <div className="flex gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const page = i + 1
                  return (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => onPageChange(page)}
                      className={
                        currentPage === page
                          ? "bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 shadow-sm"
                          : "border-slate-300 text-slate-700 hover:bg-slate-50"
                      }
                    >
                      {page}
                    </Button>
                  )
                })}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="border-slate-300 text-slate-700 hover:bg-slate-50"
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

