import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { asyncHandler } from '../middleware/errorHandler.js'

const router = Router()

router.get(
  '/kpis',
  asyncHandler(async (req, res) => {
    const [
      totalProducts,
      lowStockItems,
      outOfStockItems,
      pendingReceipts,
      pendingDeliveries,
      pendingTransfers,
      recentMoves,
    ] = await Promise.all([
      prisma.product.count({ where: { isActive: true } }),
      prisma.product.findMany({ where: { isActive: true } }),
      prisma.product.findMany({ where: { isActive: true } }),
      prisma.receipt.count({ where: { status: { in: ['DRAFT', 'WAITING', 'READY'] } } }),
      prisma.delivery.count({ where: { status: { in: ['DRAFT', 'WAITING', 'READY'] } } }),
      prisma.transfer.count({ where: { status: { in: ['DRAFT', 'WAITING', 'READY'] } } }),
      prisma.stockMove.findMany({ take: 10, orderBy: { createdAt: 'desc' }, include: { product: { select: { name: true, sku: true } }, location: { select: { name: true } }, user: { select: { name: true } } } }),
    ])

    let lowCount = 0
    let outCount = 0
    for (const p of lowStockItems) {
      const stock = await prisma.stockMove.groupBy({ by: ['productId'], where: { productId: p.id }, _sum: { qtyDelta: true } })
      const total = stock[0]?._sum.qtyDelta || 0
      if (total <= 0) outCount++
      else if (total <= p.reorderPoint) lowCount++
    }

    res.json({
      totalProducts,
      lowStockItems: lowCount,
      outOfStockItems: outCount,
      pendingReceipts,
      pendingDeliveries,
      pendingTransfers,
      recentMoves,
    })
  })
)

router.get(
  '/stock-by-category',
  asyncHandler(async (req, res) => {
    const categories = await prisma.category.findMany({ include: { products: { where: { isActive: true } } } })
    const data: Array<{ category: string; totalProducts: number; totalQuantity: number }> = []
    for (const cat of categories) {
      let totalQty = 0
      for (const p of cat.products) {
        const stock = await prisma.stockMove.groupBy({ by: ['productId'], where: { productId: p.id }, _sum: { qtyDelta: true } })
        totalQty += stock[0]?._sum.qtyDelta || 0
      }
      data.push({ category: cat.name, totalProducts: cat.products.length, totalQuantity: totalQty })
    }
    res.json(data)
  })
)

router.get(
  '/stock-by-warehouse',
  asyncHandler(async (req, res) => {
    const warehouses = await prisma.warehouse.findMany({ include: { locations: true } })
    const data: Array<{ warehouse: string; totalProducts: number; totalQuantity: number }> = []
    for (const wh of warehouses) {
      let totalQty = 0
      let totalProducts = new Set<string>()
      for (const loc of wh.locations) {
        const moves = await prisma.stockMove.groupBy({ by: ['productId'], where: { locationId: loc.id }, _sum: { qtyDelta: true } })
        for (const m of moves) {
          const qty = m._sum.qtyDelta || 0
          if (qty > 0) {
            totalQty += qty
            totalProducts.add(m.productId)
          }
        }
      }
      data.push({ warehouse: wh.name, totalProducts: totalProducts.size, totalQuantity: totalQty })
    }
    res.json(data)
  })
)

router.get(
  '/activity',
  asyncHandler(async (req, res) => {
    const days = parseInt(req.query.days as string) || 7
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const moves = await prisma.stockMove.groupBy({
      by: ['refType', 'createdAt'],
      where: { createdAt: { gte: startDate } },
      _count: { id: true },
      _sum: { qtyDelta: true },
    })

    const byDate: Record<string, Record<string, number>> = {}
    for (const m of moves) {
      const date = m.createdAt.toISOString().split('T')[0]
      if (!byDate[date]) byDate[date] = {}
      byDate[date][m.refType] = (byDate[date][m.refType] || 0) + (m._sum.qtyDelta || 0)
    }

    const result = Object.entries(byDate).map(([date, types]) => ({ date, ...types }))
    res.json(result)
  })
)

export default router