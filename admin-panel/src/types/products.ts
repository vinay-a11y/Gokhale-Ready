export interface Product {
  id: number
  item_name: string
  category: string
  description?: string
  image_url?: string
  shelf_life_days?: number
  lead_time_days?: number
  variants: Array<{
    packing: string
    price: number
  }>
  max_price: number
  is_enabled: boolean
  // Legacy fields for backward compatibility
  packing_01?: string
  price_01?: number
  packing_02?: string
  price_02?: number
  packing_03?: string
  price_03?: number
  packing_04?: string
  price_04?: number
}

