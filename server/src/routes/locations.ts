import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { asyncHandler, AppError } from '../middleware/errorHandler.js'
import { AuthRequest, requireNotViewer } from '../middleware/auth.js'
import { locationSchema, paginationSchema } from '../lib/validators.js'

const router = Router()

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { page, limit, search, sortBy, sortOrder, warehouseId } = paginationSchema.parse(req.query)
    const where: any = {}
    if (search) where.OR = [{ name: { contains: search, mode: 'insensitive' } }, { code: { contains: search, mode: 'insensitive' } }]
    if (warehouseId) where.warehouseId = warehouseId
    const [data, total] = await Promise.all([
      prisma.location.findMany({ where, include: { warehouse: true, parent: true }, orderBy: { [sortBy || 'name']: sortOrder }, skip: (page - 1) * limit, take: limit }),
      prisma.location.count({ where }),
    ])
    res.json({ data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } })
  })
)

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const location = await prisma.location.findUnique({ where: { id: req.params.id }, include: { warehouse: true, parent: true, children: true } })
    if (!location) throw new AppError(404, 'Location not found')
    res.json(location)
  })
)

router.post(
  '/',
  requireNotViewer,
  asyncHandler(async (req, res) => {
    const data = locationSchema.parse(req.body)
    const location = await prisma.location.create({ data })
    res.status(201).json(location)
  })
)

router.put(
  '/:id',
  requireNotViewer,
  asyncHandler(async (req, res) => {
    const data = locationSchema.partial().parse(req.body)
    const location = await prisma.location.update({ where: { id: req.params.id }, data })
    res.json(location)
  })
)

router.delete(
  '/:id',
  requireNotViewer,
  asyncHandler(async (req, res) => {
    await prisma.location.delete({ where: { id: req.params.id } })
    res.json({ message: 'Location deleted' })
  })
)

export default router