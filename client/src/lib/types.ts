export interface User {
  id: string
  email: string
  name: string
  role: 'ADMIN' | 'MANAGER' | 'STAFF' | 'VIEWER'
  avatarUrl?: string
  createdAt: string
}

export interface Category {
  id: string
  name: string
  description?: string
  createdAt: string
  updatedAt: string
}

export interface UnitOfMeasure {
  id: string
  name: string
  symbol: string
  description?: string
}

export interface Warehouse {
  id: string
  name: string
  code: string
  address?: string
  isActive: boolean
  _count?: { locations: number }
  locations?: Location[]
}

export interface Location {
  id: string
  name: string
  code: string
  type: 'STORAGE' | 'PRODUCTION' | 'RECEIVING' | 'SHIPPING' | 'QUARANTINE'
  warehouseId: string
  warehouse?: Warehouse
  parentId?: string
  parent?: Location
  children?: Location[]
}

export interface Product {
  id: string
  sku: string
  name: string
  description?: string
  categoryId: string
  category?: Category
  uomId: string
  uom?: UnitOfMeasure
  reorderPoint: number
  isActive: boolean
  createdAt: string
  updatedAt: string
  createdById: string
  createdBy?: User
  updatedById?: string
  updatedBy?: User
}

export interface StockMove {
  id: string
  productId: string
  product?: Product
  locationId: string
  location?: Location
  qtyDelta: number
  refType: 'RECEIPT' | 'DELIVERY' | 'TRANSFER_OUT' | 'TRANSFER_IN' | 'ADJUSTMENT'
  refId: string
  userId: string
  user?: User
  createdAt: string
}

export type DocStatus = 'DRAFT' | 'WAITING' | 'READY' | 'DONE' | 'CANCELED'

export interface ReceiptLine {
  id: string
  productId: string
  product?: Product
  qtyOrdered: number
  qtyReceived: number
}

export interface Receipt {
  id: string
  supplier: string
  status: DocStatus
  warehouseId: string
  warehouse?: Warehouse
  locationId: string
  location?: Location
  createdById: string
  createdBy?: User
  validatedById?: string
  validatedBy?: User
  validatedAt?: string
  createdAt: string
  updatedAt: string
  lines: ReceiptLine[]
}

export interface DeliveryLine {
  id: string
  productId: string
  product?: Product
  qtyOrdered: number
  qtyDelivered: number
}

export interface Delivery {
  id: string
  customer: string
  status: DocStatus
  warehouseId: string
  warehouse?: Warehouse
  locationId: string
  location?: Location
  createdById: string
  createdBy?: User
  validatedById?: string
  validatedBy?: User
  validatedAt?: string
  createdAt: string
  updatedAt: string
  lines: DeliveryLine[]
}

export interface TransferLine {
  id: string
  productId: string
  product?: Product
  qty: number
}

export interface Transfer {
  id: string
  fromLocationId: string
  fromLocation?: Location
  toLocationId: string
  toLocation?: Location
  status: DocStatus
  createdById: string
  createdBy?: User
  validatedById?: string
  validatedBy?: User
  validatedAt?: string
  createdAt: string
  updatedAt: string
  lines: TransferLine[]
}

export interface AdjustmentLine {
  id: string
  productId: string
  product?: Product
  systemQty: number
  countedQty: number
}

export interface Adjustment {
  id: string
  locationId: string
  location?: Location
  reason: string
  status: DocStatus
  createdById: string
  createdBy?: User
  validatedById?: string
  validatedBy?: User
  validatedAt?: string
  createdAt: string
  updatedAt: string
  lines: AdjustmentLine[]
}

export interface PaginatedResponse<T> {
  data: T[]
  meta: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface DashboardKPIs {
  totalProducts: number
  lowStockItems: number
  outOfStockItems: number
  pendingReceipts: number
  pendingDeliveries: number
  pendingTransfers: number
  recentMoves: StockMove[]
  [key: string]: number | StockMove[]
}

export interface StockItem {
  product: Product
  location: Location
  quantity: number
  reorderPoint: number
  isLowStock: boolean
}