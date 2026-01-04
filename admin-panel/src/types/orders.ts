export interface Order {
  id: number
  razorpay_order_id: string
  first_name: string | null
  mobile_number: string | null
  created_at: string
  delivery_date: string | null
  total_amount: number
  order_status: OrderStatus
  items: OrderItem[]
  address: OrderAddress
}

export interface OrderItem {
  name: string
  variant: string
  quantity: number
  price: number
  originalPrice: number
  weight: number
}

export interface OrderAddress {
  line1: string
  city: string
  state: string
  pincode: string
}

export type OrderStatus = "placed" | "confirmed" | "inprocess" | "dispatched" | "delivered" | "completed" | "rejected"

export type TabType =
  | "recent"
  | "placed"
  | "confirmed"
  | "inprocess"
  | "dispatched"
  | "delivered"
  | "completed"
  | "rejected"
  | "all"

