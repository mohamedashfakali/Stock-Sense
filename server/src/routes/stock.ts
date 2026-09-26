import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { asyncHandler } from '../middleware/errorHandler.js'
import { stockFilterSchema, paginationSchema } from '../lib/validators.js'

const router = Router()

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { page, limit, warehouseId, locationId, categoryId, productId, lowStockOnly } = stockFilterSchema.parse(req.query)
    const { sortBy, sortOrder } = paginationSchema.parse(req.query)

    const where: any = {}
    if (warehouseId) {
      const locations = await prisma.location.findMany({ where: { warehouseId }, select: { id: true } })
      where.locationId = { in: locations.map(l => l.id) }
    }
    if (locationId) where.locationId = locationId

    const products = await prisma.product.findMany({
      where: { isActive: true, ...(categoryId ? { categoryId } : {}), ...(productId ? { id: productId } : {}) },
      include: { category: true, uom: true },
    })

    const stockData: Array<any> = []
    for (const p of products) {
      const moves = await prisma.stockMove.groupBy({
        by: ['locationId'],
        where: { productId: p.id, ...(where.locationId ? { locationId: where.locationId } : {}) },
        _sum: { qtyDelta: true },
      })

      for (const m of moves) {
        const qty = m._sum.qtyDelta || 0
        if (lowStockOnly && qty > p.reorderPoint) continue

        const location = await prisma.location.findUnique({ where: { id: m.locationId }, include: { warehouse: true } })
        if (location) {
          stockData.push({ product: p, location, quantity: qty, reorderPoint: p.reorderPoint, isLowStock: qty <= p.reorderPoint })
        }
      }
    }

    stockData.sort((a, b) => {
      const aVal = a[sortBy as keyof typeof a] || ''
      const bVal = b[sortBy as keyof typeof b] || ''
      return sortOrder === 'asc' ? String(aVal).localeCompare(String(bVal)) : String(bVal).localeCompare(String(aVal))
    })

    const start = (page - 1) * limit
    const paginated = stockData.slice(start, start + limit)

    res.json({ data: paginated, meta: { page, limit, total: stockData.length, totalPages: Math.ceil(stockData.length / limit) } })
  })
)

router.get(
  '/product/:productId/location/:locationId',
  asyncHandler(async (req, res) => {
    const moves = await prisma.stockMove.groupBy({
      by: ['productId'],
      where: { productId: req.params.productId, locationId: req.params.locationId },
      _sum: { qtyDelta: true },
    })
    const qty = moves[0]?._sum.qtyDelta || 0
    res.json({ productId: req.params.productId, locationId: req.params.locationId, quantity: qty })
  })
)

router.get(
  '/ledger',
  asyncHandler(async (req, res) => {
    const { page, limit } = paginationSchema.parse(req.query)
    const { productId, locationId, refType, startDate, endDate } = req.query

    const where: any = {}
    if (productId) where.productId = productId
    if (locationId) where.locationId = locationId
    if (refType) where.refType = refType
    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) where.createdAt.gte = new Date(startDate as string)
      if (endDate) where.createdAt.lte = new Date(endDate as string)
    }

    const [moves, total] = await Promise.all([
      prisma.stockMove.findMany({
        where,
        include: { product: { include: { uom: true } }, location: { include: { warehouse: true } }, user: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.stockMove.count({ where }),
    ])
    res.json({ data: moves, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } })
  })
)

export default router