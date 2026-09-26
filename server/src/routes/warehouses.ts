import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { asyncHandler, AppError } from '../middleware/errorHandler.js'
import { AuthRequest, requireNotViewer } from '../middleware/auth.js'
import { warehouseSchema, paginationSchema } from '../lib/validators.js'

const router = Router()

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { page, limit, search, sortBy, sortOrder } = paginationSchema.parse(req.query)
    const where = search ? { name: { contains: search, mode: 'insensitive' } } : {}
    const [data, total] = await Promise.all([
      prisma.warehouse.findMany({ where, include: { _count: { select: { locations: true } } }, orderBy: { [sortBy || 'name']: sortOrder }, skip: (page - 1) * limit, take: limit }),
      prisma.warehouse.count({ where }),
    ])
    res.json({ data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } })
  })
)

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const warehouse = await prisma.warehouse.findUnique({ where: { id: req.params.id }, include: { locations: true } })
    if (!warehouse) throw new AppError(404, 'Warehouse not found')
    res.json(warehouse)
  })
)

router.post(
  '/',
  requireNotViewer,
  asyncHandler(async (req, res) => {
    const data = warehouseSchema.parse(req.body)
    const warehouse = await prisma.warehouse.create({ data })
    res.status(201).json(warehouse)
  })
)

router.put(
  '/:id',
  requireNotViewer,
  asyncHandler(async (req, res) => {
    const data = warehouseSchema.partial().parse(req.body)
    const warehouse = await prisma.warehouse.update({ where: { id: req.params.id }, data })
    res.json(warehouse)
  })
)

router.delete(
  '/:id',
  requireNotViewer,
  asyncHandler(async (req, res) => {
    await prisma.warehouse.delete({ where: { id: req.params.id } })
    res.json({ message: 'Warehouse deleted' })
  })
)

export default router