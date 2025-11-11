export interface Category {
  id: string
  name: string
  description?: string
  order: number
  active: boolean
  createdAt: Date
  updatedAt: Date
}

export interface ProductVariation {
  id: string
  name: string
  options: {
    id: string
    name: string
    price: number
  }[]
  required: boolean
  multiSelect: boolean
}

export interface Product {
  id: string
  categoryId: string
  name: string
  description: string
  price: number
  imageUrl?: string
  active: boolean
  order: number
  variations?: ProductVariation[]
  createdAt: Date
  updatedAt: Date
}

export interface CartItem {
  product: Product
  quantity: number
  notes?: string
  selectedVariations?: {
    variationId: string
    variationName: string
    optionId: string
    optionName: string
    price: number
  }[]
}

export interface DeliveryZone {
  id: string
  name: string
  price: number
  active: boolean
  order: number
}

export interface Order {
  id: string
  orderNumber: string
  customerName: string
  customerPhone: string
  customerEmail?: string // Added optional email field
  customerBirthday?: string // Added optional birthday field (format: YYYY-MM-DD)
  deliveryType: "pickup" | "delivery" | "table"
  deliveryAddress?: string
  deliveryZoneId?: string // Added zone ID to orders
  deliveryZoneName?: string // Added zone name to orders
  numberOfPeople?: number
  paymentMethod?: "cash" | "transfer" | "card"
  cashAmount?: number
  paymentProofUrl?: string
  items: {
    productId: string
    productName: string
    quantity: number
    price: number
    notes?: string
    variations?: {
      variationName: string
      optionName: string
      price: number
    }[]
  }[]
  subtotal: number
  deliveryFee: number
  total: number
  status: "pending" | "confirmed" | "preparing" | "ready" | "delivered" | "cancelled"
  notes?: string
  createdAt: Date
  updatedAt: Date
  completedAt?: Date
}

export interface BrandConfig {
  id: string
  logoUrl?: string
  primaryColor: string
  secondaryColor: string
  accentColor: string
  businessName: string
  whatsappNumber: string
  deliveryFee: number // Deprecated - kept for backwards compatibility
  deliveryZones?: DeliveryZone[] // Added delivery zones array
  paymentMethods?: {
    cash: boolean
    transfer: boolean
    card: boolean
  }
  bankInfo?: {
    bankName: string
    accountNumber: string
    accountHolder: string
  }
  deliveryTypes?: {
    pickup: boolean
    delivery: boolean
    table: boolean
  }
  customerFields?: {
    emailEnabled: boolean
    emailRequired: boolean
    birthdayEnabled: boolean
    birthdayRequired: boolean
  }
  updatedAt: Date
}

export interface OrderStats {
  totalOrders: number
  totalRevenue: number
  averageOrderValue: number
  ordersByStatus: Record<string, number>
  ordersByDate: Record<string, number>
}

export interface Banner {
  id: string
  title: string
  imageUrl: string
  link?: string
  order: number
  active: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Customer {
  phone: string
  name: string
  email?: string // Added optional email field
  birthday?: string // Added optional birthday field
  totalOrders: number
  totalSpent: number
  lastOrderDate: Date
  orders: Order[]
}
