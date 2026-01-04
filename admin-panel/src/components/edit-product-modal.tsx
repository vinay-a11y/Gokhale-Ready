"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Package, DollarSign, Tag, Edit } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { Product } from "@/types/products"

interface EditProductModalProps {
  isOpen: boolean
  product: Product | null
  onClose: () => void
  onSuccess: () => void
}

export function EditProductModal({ isOpen, product, onClose, onSuccess }: EditProductModalProps) {
  const [formData, setFormData] = useState({
    item_name: "",
    description: "",
    category: "",
    shelf_life_days: 30,
    lead_time_days: 1,
    imagesrc: "",
    packing_01: "",
    price_01: "",
    packing_02: "",
    price_02: "",
    packing_03: "",
    price_03: "",
    packing_04: "",
    price_04: "",
  })
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  // Populate form when product changes
  useEffect(() => {
    if (product) {
      // Convert variants back to individual fields for editing
      const variants = product.variants || []
      setFormData({
        item_name: product.item_name || "",
        description: product.description || "",
        category: product.category || "",
        shelf_life_days: product.shelf_life_days || 30,
        lead_time_days: product.lead_time_days || 1,
        imagesrc: product.image_url || "",
        packing_01: variants[0]?.packing || "",
        price_01: variants[0]?.price?.toString() || "",
        packing_02: variants[1]?.packing || "",
        price_02: variants[1]?.price?.toString() || "",
        packing_03: variants[2]?.packing || "",
        price_03: variants[2]?.price?.toString() || "",
        packing_04: variants[3]?.packing || "",
        price_04: variants[3]?.price?.toString() || "",
      })
    }
  }, [product])

  const resetForm = () => {
    setFormData({
      item_name: "",
      description: "",
      category: "",
      shelf_life_days: 30,
      lead_time_days: 1,
      imagesrc: "",
      packing_01: "",
      price_01: "",
      packing_02: "",
      price_02: "",
      packing_03: "",
      price_03: "",
      packing_04: "",
      price_04: "",
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!product) return

    setLoading(true)

    try {
      const productData = {
        item_name: formData.item_name,
        category: formData.category,
        description: formData.description,
        shelf_life_days: formData.shelf_life_days,
        lead_time_days: formData.lead_time_days,
        imagesrc: formData.imagesrc,
        packing_01: formData.packing_01 || null,
        price_01: formData.price_01 ? Number.parseFloat(formData.price_01) : null,
        packing_02: formData.packing_02 || null,
        price_02: formData.price_02 ? Number.parseFloat(formData.price_02) : null,
        packing_03: formData.packing_03 || null,
        price_03: formData.price_03 ? Number.parseFloat(formData.price_03) : null,
        packing_04: formData.packing_04 || null,
        price_04: formData.price_04 ? Number.parseFloat(formData.price_04) : null,
      }

      console.log("Updating product:", product.id, productData)

      const res = await fetch(`http://localhost:8000/api/products/${product.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(productData),
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.detail || "Failed to update product")
      }

      const data = await res.json()
      console.log("Product updated:", data)

      toast({
        title: "Success",
        description: "Product updated successfully!",
      })

      onSuccess()
      onClose()
    } catch (error) {
      console.error("Error updating product:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update product",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  if (!product) return null

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white/95 backdrop-blur-md border border-slate-200 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5 text-blue-600" />
            Edit Product: {product.item_name}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card className="bg-white/90 backdrop-blur-sm border border-slate-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Tag className="h-4 w-4" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="item_name">Product Name *</Label>
                  <Input
                    id="item_name"
                    value={formData.item_name}
                    onChange={(e) => setFormData({ ...formData, item_name: e.target.value })}
                    placeholder="Enter product name"
                    required
                    className="bg-white/90 backdrop-blur-sm border-slate-300"
                  />
                </div>
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Input
                    id="category"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="e.g., Snacks, Beverages"
                    className="bg-white/90 backdrop-blur-sm border-slate-300"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter product description"
                  rows={3}
                  className="bg-white/90 backdrop-blur-sm border-slate-300"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="shelf_life_days">Shelf Life (days)</Label>
                  <Input
                    id="shelf_life_days"
                    type="number"
                    value={formData.shelf_life_days}
                    onChange={(e) =>
                      setFormData({ ...formData, shelf_life_days: Number.parseInt(e.target.value) || 30 })
                    }
                    min="1"
                    className="bg-white/90 backdrop-blur-sm border-slate-300"
                  />
                </div>
                <div>
                  <Label htmlFor="lead_time_days">Lead Time (days)</Label>
                  <Input
                    id="lead_time_days"
                    type="number"
                    value={formData.lead_time_days}
                    onChange={(e) => setFormData({ ...formData, lead_time_days: Number.parseInt(e.target.value) || 1 })}
                    min="1"
                    className="bg-white/90 backdrop-blur-sm border-slate-300"
                  />
                </div>
                <div>
                  <Label htmlFor="imagesrc">Image URL</Label>
                  <Input
                    id="imagesrc"
                    value={formData.imagesrc}
                    onChange={(e) => setFormData({ ...formData, imagesrc: e.target.value })}
                    placeholder="https://example.com/image.jpg"
                    className="bg-white/90 backdrop-blur-sm border-slate-300"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Packaging & Pricing */}
          <Card className="bg-white/90 backdrop-blur-sm border border-slate-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <DollarSign className="h-4 w-4" />
                Packaging & Pricing
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Package 1 */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Package 1</Label>
                  <div className="space-y-2">
                    <Input
                      placeholder="Weight (g)"
                      value={formData.packing_01}
                      onChange={(e) => setFormData({ ...formData, packing_01: e.target.value })}
                      className="bg-white/90 backdrop-blur-sm border-slate-300"
                    />
                    <Input
                      placeholder="Price (₹)"
                      type="number"
                      step="0.01"
                      value={formData.price_01}
                      onChange={(e) => setFormData({ ...formData, price_01: e.target.value })}
                      className="bg-white/90 backdrop-blur-sm border-slate-300"
                    />
                  </div>
                </div>

                {/* Package 2 */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Package 2</Label>
                  <div className="space-y-2">
                    <Input
                      placeholder="Weight (g)"
                      value={formData.packing_02}
                      onChange={(e) => setFormData({ ...formData, packing_02: e.target.value })}
                      className="bg-white/90 backdrop-blur-sm border-slate-300"
                    />
                    <Input
                      placeholder="Price (₹)"
                      type="number"
                      step="0.01"
                      value={formData.price_02}
                      onChange={(e) => setFormData({ ...formData, price_02: e.target.value })}
                      className="bg-white/90 backdrop-blur-sm border-slate-300"
                    />
                  </div>
                </div>

                {/* Package 3 */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Package 3</Label>
                  <div className="space-y-2">
                    <Input
                      placeholder="Weight (g)"
                      value={formData.packing_03}
                      onChange={(e) => setFormData({ ...formData, packing_03: e.target.value })}
                      className="bg-white/90 backdrop-blur-sm border-slate-300"
                    />
                    <Input
                      placeholder="Price (₹)"
                      type="number"
                      step="0.01"
                      value={formData.price_03}
                      onChange={(e) => setFormData({ ...formData, price_03: e.target.value })}
                      className="bg-white/90 backdrop-blur-sm border-slate-300"
                    />
                  </div>
                </div>

                {/* Package 4 */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Package 4</Label>
                  <div className="space-y-2">
                    <Input
                      placeholder="Weight (g)"
                      value={formData.packing_04}
                      onChange={(e) => setFormData({ ...formData, packing_04: e.target.value })}
                      className="bg-white/90 backdrop-blur-sm border-slate-300"
                    />
                    <Input
                      placeholder="Price (₹)"
                      type="number"
                      step="0.01"
                      value={formData.price_04}
                      onChange={(e) => setFormData({ ...formData, price_04: e.target.value })}
                      className="bg-white/90 backdrop-blur-sm border-slate-300"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Product Preview */}
          {formData.item_name && (
            <Card className="bg-slate-50/90 backdrop-blur-sm border border-slate-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Product Preview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-slate-600">Name:</span>
                    <span className="ml-2 font-medium">{formData.item_name}</span>
                  </div>
                  <div>
                    <span className="text-slate-600">Category:</span>
                    <span className="ml-2 font-medium">{formData.category || "Uncategorized"}</span>
                  </div>
                  <div>
                    <span className="text-slate-600">Shelf Life:</span>
                    <span className="ml-2 font-medium">{formData.shelf_life_days} days</span>
                  </div>
                  <div>
                    <span className="text-slate-600">Lead Time:</span>
                    <span className="ml-2 font-medium">{formData.lead_time_days} days</span>
                  </div>
                </div>

                {/* Packaging Preview */}
                <div className="mt-4">
                  <span className="text-slate-600 text-sm">Available Packages:</span>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.packing_01 && formData.price_01 && (
                      <Badge className="bg-green-100 text-green-700">
                        {formData.packing_01}g - ₹{formData.price_01}
                      </Badge>
                    )}
                    {formData.packing_02 && formData.price_02 && (
                      <Badge className="bg-blue-100 text-blue-700">
                        {formData.packing_02}g - ₹{formData.price_02}
                      </Badge>
                    )}
                    {formData.packing_03 && formData.price_03 && (
                      <Badge className="bg-purple-100 text-purple-700">
                        {formData.packing_03}g - ₹{formData.price_03}
                      </Badge>
                    )}
                    {formData.packing_04 && formData.price_04 && (
                      <Badge className="bg-orange-100 text-orange-700">
                        {formData.packing_04}g - ₹{formData.price_04}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={handleClose} className="bg-white/90 backdrop-blur-sm">
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !formData.item_name}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
            >
              {loading ? "Updating..." : "Update Product"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

