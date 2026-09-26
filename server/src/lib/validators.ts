import { z } from 'zod'

// CUID2 validation for user IDs (Prisma uses CUID2 by default)
const cuid2Schema = z.string().regex(/^c[a-z0-9]{24}$/, 'Invalid CUID2 format')

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(2),
})

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
})

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
})

export const resetPasswordSchema = z.object({
  email: z.string().email(),
  token: z.string(),
  password: z.string().min(6),
})

export const productSchema = z.object({
  sku: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  categoryId: z.string().cuid(),
  uomId: z.string().cuid(),
  reorderPoint: z.number().int().nonnegative().default(10),
  isActive: z.boolean().optional(),
})

export const categorySchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
})

export const uomSchema = z.object({
  name: z.string().min(1),
  symbol: z.string().min(1),
  description: z.string().optional(),
})

export const warehouseSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1),
  address: z.string().optional(),
})

export const locationSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1),
  type: z.enum(['STORAGE', 'PRODUCTION', 'RECEIVING', 'SHIPPING', 'QUARANTINE']).default('STORAGE'),
  warehouseId: z.string().cuid(),
  parentId: z.string().cuid().optional(),
})

export const receiptLineSchema = z.object({
  productId: z.string().cuid(),
  qtyOrdered: z.number().int().positive(),
  qtyReceived: z.number().int().nonnegative().default(0),
})

export const receiptSchema = z.object({
  supplier: z.string().min(1),
  warehouseId: z.string().cuid(),
  locationId: z.string().cuid(),
  lines: z.array(receiptLineSchema).min(1),
})

export const deliveryLineSchema = z.object({
  productId: z.string().cuid(),
  qtyOrdered: z.number().int().positive(),
  qtyDelivered: z.number().int().nonnegative().default(0),
})

export const deliverySchema = z.object({
  customer: z.string().min(1),
  warehouseId: z.string().cuid(),
  locationId: z.string().cuid(),
  lines: z.array(deliveryLineSchema).min(1),
})

export const transferLineSchema = z.object({
  productId: z.string().cuid(),
  qty: z.number().int().positive(),
})

export const transferSchema = z.object({
  fromLocationId: z.string().cuid(),
  toLocationId: z.string().cuid(),
  lines: z.array(transferLineSchema).min(1),
})

export const adjustmentLineSchema = z.object({
  productId: z.string().cuid(),
  systemQty: z.number().int().nonnegative(),
  countedQty: z.number().int().nonnegative(),
})

export const adjustmentSchema = z.object({
  locationId: z.string().cuid(),
  reason: z.string().min(1),
  lines: z.array(adjustmentLineSchema).min(1),
})

export const validateSchema = z.object({
  id: z.string().cuid(),
})

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  status: z.string().optional(),
  warehouseId: z.string().optional(),
  locationId: z.string().optional(),
  isActive: z.coerce.boolean().optional(),
})

export const stockFilterSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  warehouseId: z.string().cuid().optional(),
  locationId: z.string().cuid().optional(),
  categoryId: z.string().cuid().optional(),
  productId: z.string().cuid().optional(),
  lowStockOnly: z.coerce.boolean().default(false),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

export const userIdSchema = z.object({
  id: cuid2Schema,
})