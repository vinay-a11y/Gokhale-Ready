"use client"

import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type  { Order } from "@/types/orders"

interface OrderModalProps {
  order: Order
  onClose: () => void
}

export function OrderModal({ order, onClose }: OrderModalProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      placed: "bg-gradient-to-r from-yellow-500 to-yellow-600 text-white shadow-sm",
      confirmed: "bg-gradient-to-r from-green-500 to-green-600 text-white shadow-sm",
      inprocess: "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-sm",
      dispatched: "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-sm",
      delivered: "bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-sm",
      completed: "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-sm",
      rejected: "bg-gradient-to-r from-red-500 to-red-600 text-white shadow-sm",
    }

    return (
      <Badge
        className={`${variants[status as keyof typeof variants]} border-0 font-semibold uppercase text-xs px-3 py-1`}
      >
        {status}
      </Badge>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-gradient-to-r from-blue-50 to-purple-50">
          <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Order Details
          </h2>
          <Button variant="ghost" size="sm" onClick={onClose} className="hover:bg-white/50">
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          <div className="space-y-8">
            {/* Order Information */}
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-4 pb-2 border-b border-slate-200">
                Order Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-xl border border-blue-100">
                  <strong className="text-slate-700">Order ID:</strong>
                  <div className="text-blue-600 font-semibold">#{order.id}</div>
                </div>
                <div className="bg-gradient-to-r from-slate-50 to-slate-100 p-4 rounded-xl border border-slate-200">
                  <strong className="text-slate-700">Razorpay ID:</strong>
                  <div className="text-slate-900 font-mono text-sm">{order.razorpay_order_id}</div>
                </div>
                <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 p-4 rounded-xl border border-emerald-200">
                  <strong className="text-slate-700">Customer:</strong>
<div className="text-slate-900">{order.first_name ?? "N/A"}</div>
                </div>
                <div className="bg-gradient-to-r from-orange-50 to-orange-100 p-4 rounded-xl border border-orange-200">
                  <strong className="text-slate-700">Phone:</strong>
<div className="text-slate-900">{order.mobile_number ?? "N/A"}</div>
                </div>
                <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-xl border border-purple-200">
                  <strong className="text-slate-700">Status:</strong>
                  <div className="mt-1">{getStatusBadge(order.order_status)}</div>
                </div>
                <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 p-4 rounded-xl border border-yellow-200">
                  <strong className="text-slate-700">Date:</strong>
                  <div className="text-slate-900">{formatDate(order.created_at)}</div>
                </div>
                <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-xl border border-green-200">
                  <strong className="text-slate-700">Total Amount:</strong>
                  <div className="text-green-600 font-semibold text-lg">₹{order.total_amount.toLocaleString()}</div>
                </div>
              </div>
            </div>

            {/* Delivery Address */}
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-4 pb-2 border-b border-slate-200">
                Delivery Address
              </h3>
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-xl border-l-4 border-blue-600">
                <p className="font-semibold text-slate-900">{order.address.line1}</p>
                <p className="text-slate-700">
                  {order.address.city}, {order.address.state} - {order.address.pincode}
                </p>
              </div>
            </div>

            {/* Order Items */}
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-4 pb-2 border-b border-slate-200">Order Items</h3>
              <div className="overflow-x-auto">
                <table className="w-full border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                  <thead className="bg-gradient-to-r from-slate-50 to-slate-100">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700">Item Name</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700">Variant</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700">Quantity</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700">Price</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700">Original Price</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {order.items.map((item, index) => (
                      <tr
                        key={index}
                        className="hover:bg-gradient-to-r hover:from-slate-50 hover:to-blue-50 transition-colors"
                      >
                        <td className="px-4 py-3 text-slate-900 font-medium">{item.name}</td>
                        <td className="px-4 py-3 text-slate-600">{item.variant}</td>
                        <td className="px-4 py-3 text-slate-900 font-medium">{item.quantity}</td>
                        <td className="px-4 py-3 text-green-600 font-semibold">₹{item.price}</td>
                        <td className="px-4 py-3 text-slate-500 line-through">₹{item.originalPrice}</td>
                        <td className="px-4 py-3 text-slate-900 font-semibold">
                          ₹{(item.price * item.quantity).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

