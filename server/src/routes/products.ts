import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { asyncHandler, AppError } from '../middleware/errorHandler.js'
import { AuthRequest, requireNotViewer } from '../middleware/auth.js'
import { productSchema, paginationSchema } from '../lib/validators.js'
import { z } from 'zod'

const router = Router()

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { page, limit, search, sortBy, sortOrder, isActive } = paginationSchema.parse(req.query)
    const where: any = {}
    if (search && search.trim() !== '' && search !== '0') {
      const searchLower = search.toLowerCase()
      where.OR = [
        { name: { contains: searchLower } },
        { sku: { contains: searchLower } },
      ]
    }
    if (isActive !== undefined) where.isActive = isActive

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: { category: true, uom: true },
        orderBy: { [sortBy || 'createdAt']: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.product.count({ where }),
    ])

    res.json({ data: products, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } })
  })
)

router.get(
  '/low-stock',
  asyncHandler(async (req, res) => {
    const products = await prisma.product.findMany({
      where: { isActive: true },
      include: { category: true, uom: true },
    })

    const lowStock: Array<any> = []
    for (const p of products) {
      const stock = await prisma.stockMove.groupBy({
        by: ['productId'],
        where: { productId: p.id },
        _sum: { qtyDelta: true },
      })
      const total = stock[0]?._sum.qtyDelta || 0
      if (total <= p.reorderPoint) {
        lowStock.push({ ...p, currentStock: total })
      }
    }
    res.json(lowStock)
  })
)

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const product = await prisma.product.findUnique({
      where: { id: req.params.id },
      include: { category: true, uom: true, createdBy: { select: { id: true, name: true } }, updatedBy: { select: { id: true, name: true } } },
    })
    if (!product) throw new AppError(404, 'Product not found')
    res.json(product)
  })
)

router.post(
  '/',
  requireNotViewer,
  asyncHandler(async (req: AuthRequest, res) => {
    const data = productSchema.parse(req.body)
    const existing = await prisma.product.findUnique({ where: { sku: data.sku } })
    if (existing) throw new AppError(409, 'SKU already exists')

    const product = await prisma.product.create({
      data: { ...data, createdById: req.user!.id },
      include: { category: true, uom: true },
    })
    res.status(201).json(product)
  })
)

router.put(
  '/:id',
  requireNotViewer,
  asyncHandler(async (req: AuthRequest, res) => {
    const data = productSchema.partial().parse(req.body)
    const product = await prisma.product.update({
      where: { id: req.params.id },
      data: { ...data, updatedById: req.user!.id },
      include: { category: true, uom: true },
    })
    res.json(product)
  })
)

router.delete(
  '/:id',
  requireNotViewer,
  asyncHandler(async (req, res) => {
    await prisma.product.update({ where: { id: req.params.id }, data: { isActive: false } })
    res.json({ message: 'Product archived' })
  })
)

router.get(
  '/:id/stock',
  asyncHandler(async (req, res) => {
    const moves = await prisma.stockMove.groupBy({
      by: ['locationId'],
      where: { productId: req.params.id },
      _sum: { qtyDelta: true },
    })

    const locations = await prisma.location.findMany({
      where: { id: { in: moves.map(m => m.locationId) } },
      include: { warehouse: true },
    })

    const stock = moves.map(m => ({
      location: locations.find(l => l.id === m.locationId),
      quantity: m._sum.qtyDelta || 0,
    }))

    res.json(stock)
  })
)

router.get(
  '/:id/moves',
  asyncHandler(async (req, res) => {
    const { page, limit } = paginationSchema.parse(req.query)
    const [moves, total] = await Promise.all([
      prisma.stockMove.findMany({
        where: { productId: req.params.id },
        include: { location: { include: { warehouse: true } }, user: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.stockMove.count({ where: { productId: req.params.id } }),
    ])
    res.json({ data: moves, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } })
  })
)

export default router