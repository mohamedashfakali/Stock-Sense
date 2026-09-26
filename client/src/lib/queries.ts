import api from './api'
import type {
  PaginatedResponse,
  Product,
  Category,
  UnitOfMeasure,
  Warehouse,
  Location,
  Receipt,
  Delivery,
  Transfer,
  Adjustment,
  StockMove,
  DashboardKPIs,
  StockItem,
  User,
} from './types'

const paramsSerializer = (params: Record<string, any>) => {
  const search = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') search.append(key, String(value))
  })
  return search.toString()
}

export const authApi = {
  login: (email: string, password: string) => api.post('/auth/login', { email, password }),
  register: (data: { email: string; password: string; name: string }) => api.post('/auth/register', data),
  me: () => api.get('/auth/me'),
  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),
  resetPassword: (email: string, token: string, password: string) => api.post('/auth/reset-password', { email, token, password }),
  updateProfile: (data: { name?: string; avatarUrl?: string }) => api.put('/auth/profile', data),
}

export const productApi = {
  list: (params?: { page?: number; limit?: number; search?: string; sortBy?: string; sortOrder?: string; isActive?: boolean }) =>
    api.get<PaginatedResponse<Product>>('/products', { params, paramsSerializer }),
  get: (id: string) => api.get<Product>(`/products/${id}`),
  create: (data: Partial<Product>) => api.post<Product>('/products', data),
  update: (id: string, data: Partial<Product>) => api.put<Product>(`/products/${id}`, data),
  delete: (id: string) => api.delete(`/products/${id}`),
  getStock: (id: string) => api.get<StockItem[]>(`/products/${id}/stock`),
  getMoves: (id: string, params?: { page?: number; limit?: number }) => api.get<PaginatedResponse<StockMove>>(`/products/${id}/moves`, { params, paramsSerializer }),
  getLowStock: () => api.get<Product[]>(`/products/low-stock`),
}

export const categoryApi = {
  list: (params?: { page?: number; limit?: number; search?: string }) =>
    api.get<PaginatedResponse<Category>>('/categories', { params, paramsSerializer }),
  create: (data: Partial<Category>) => api.post<Category>('/categories', data),
  update: (id: string, data: Partial<Category>) => api.put<Category>(`/categories/${id}`, data),
  delete: (id: string) => api.delete(`/categories/${id}`),
}

export const uomApi = {
  list: (params?: { page?: number; limit?: number; search?: string }) =>
    api.get<PaginatedResponse<UnitOfMeasure>>('/uoms', { params, paramsSerializer }),
  create: (data: Partial<UnitOfMeasure>) => api.post<UnitOfMeasure>('/uoms', data),
  update: (id: string, data: Partial<UnitOfMeasure>) => api.put<UnitOfMeasure>(`/uoms/${id}`, data),
  delete: (id: string) => api.delete(`/uoms/${id}`),
}

export const warehouseApi = {
  list: (params?: { page?: number; limit?: number; search?: string }) =>
    api.get<PaginatedResponse<Warehouse>>('/warehouses', { params, paramsSerializer }),
  get: (id: string) => api.get<Warehouse>(`/warehouses/${id}`),
  create: (data: Partial<Warehouse>) => api.post<Warehouse>('/warehouses', data),
  update: (id: string, data: Partial<Warehouse>) => api.put<Warehouse>(`/warehouses/${id}`, data),
  delete: (id: string) => api.delete(`/warehouses/${id}`),
}

export const locationApi = {
  list: (params?: { page?: number; limit?: number; search?: string; warehouseId?: string }) =>
    api.get<PaginatedResponse<Location>>('/locations', { params, paramsSerializer }),
  get: (id: string) => api.get<Location>(`/locations/${id}`),
  create: (data: Partial<Location>) => api.post<Location>('/locations', data),
  update: (id: string, data: Partial<Location>) => api.put<Location>(`/locations/${id}`, data),
  delete: (id: string) => api.delete(`/locations/${id}`),
}

export const receiptApi = {
  list: (params?: { page?: number; limit?: number; search?: string; status?: string; warehouseId?: string }) =>
    api.get<PaginatedResponse<Receipt>>('/receipts', { params, paramsSerializer }),
  get: (id: string) => api.get<Receipt>(`/receipts/${id}`),
  create: (data: Partial<Receipt>) => api.post<Receipt>('/receipts', data),
  update: (id: string, data: Partial<Receipt>) => api.put<Receipt>(`/receipts/${id}`, data),
  validate: (id: string) => api.post<Receipt>(`/receipts/${id}/validate`),
  cancel: (id: string) => api.post(`/receipts/${id}/cancel`),
}

export const deliveryApi = {
  list: (params?: { page?: number; limit?: number; search?: string; status?: string; warehouseId?: string }) =>
    api.get<PaginatedResponse<Delivery>>('/deliveries', { params, paramsSerializer }),
  get: (id: string) => api.get<Delivery>(`/deliveries/${id}`),
  create: (data: Partial<Delivery>) => api.post<Delivery>('/deliveries', data),
  update: (id: string, data: Partial<Delivery>) => api.put<Delivery>(`/deliveries/${id}`, data),
  validate: (id: string) => api.post<Delivery>(`/deliveries/${id}/validate`),
  cancel: (id: string) => api.post(`/deliveries/${id}/cancel`),
}

export const transferApi = {
  list: (params?: { page?: number; limit?: number; search?: string; status?: string }) =>
    api.get<PaginatedResponse<Transfer>>('/transfers', { params, paramsSerializer }),
  get: (id: string) => api.get<Transfer>(`/transfers/${id}`),
  create: (data: Partial<Transfer>) => api.post<Transfer>('/transfers', data),
  update: (id: string, data: Partial<Transfer>) => api.put<Transfer>(`/transfers/${id}`, data),
  validate: (id: string) => api.post<Transfer>(`/transfers/${id}/validate`),
  cancel: (id: string) => api.post(`/transfers/${id}/cancel`),
}

export const adjustmentApi = {
  list: (params?: { page?: number; limit?: number; search?: string; status?: string; locationId?: string }) =>
    api.get<PaginatedResponse<Adjustment>>('/adjustments', { params, paramsSerializer }),
  get: (id: string) => api.get<Adjustment>(`/adjustments/${id}`),
  create: (data: Partial<Adjustment>) => api.post<Adjustment>('/adjustments', data),
  update: (id: string, data: Partial<Adjustment>) => api.put<Adjustment>(`/adjustments/${id}`, data),
  validate: (id: string) => api.post<Adjustment>(`/adjustments/${id}/validate`),
  cancel: (id: string) => api.post(`/adjustments/${id}/cancel`),
}

export const stockApi = {
  list: (params?: { page?: number; limit?: number; warehouseId?: string; locationId?: string; categoryId?: string; productId?: string; lowStockOnly?: boolean; search?: string }) =>
    api.get<PaginatedResponse<StockItem>>('/stock', { params, paramsSerializer }),
  getProductLocation: (productId: string, locationId: string) => api.get<{ quantity: number }>(`/stock/product/${productId}/location/${locationId}`),
  getLedger: (params?: { page?: number; limit?: number; productId?: string; locationId?: string; refType?: string; startDate?: string; endDate?: string }) =>
    api.get<PaginatedResponse<StockMove>>('/stock/ledger', { params, paramsSerializer }),
}

export const dashboardApi = {
  getKPIs: () => api.get<DashboardKPIs>('/dashboard/kpis'),
  getStockByCategory: () => api.get('/dashboard/stock-by-category'),
  getStockByWarehouse: () => api.get('/dashboard/stock-by-warehouse'),
  getActivity: (days?: number) => api.get('/dashboard/activity', { params: { days }, paramsSerializer }),
}

export const userApi = {
  list: (params?: { page?: number; limit?: number; search?: string }) =>
    api.get<PaginatedResponse<User>>('/users', { params, paramsSerializer }),
  get: (id: string) => api.get<User>(`/users/${id}`),
  create: (data: Partial<User>) => api.post<User>('/users', data),
  update: (id: string, data: Partial<User>) => api.put<User>(`/users/${id}`, data),
  delete: (id: string) => api.delete(`/users/${id}`),
}