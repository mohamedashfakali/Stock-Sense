import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { asyncHandler, AppError } from '../middleware/errorHandler.js'
import { AuthRequest, requireNotViewer } from '../middleware/auth.js'
import { uomSchema, paginationSchema } from '../lib/validators.js'

const router = Router()

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { page, limit, search, sortBy, sortOrder } = paginationSchema.parse(req.query)
    const where = search ? { name: { contains: search, mode: 'insensitive' } } : {}
    const [data, total] = await Promise.all([
      prisma.unitOfMeasure.findMany({ where, orderBy: { [sortBy || 'name']: sortOrder }, skip: (page - 1) * limit, take: limit }),
      prisma.unitOfMeasure.count({ where }),
    ])
    res.json({ data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } })
  })
)

router.post(
  '/',
  requireNotViewer,
  asyncHandler(async (req, res) => {
    const data = uomSchema.parse(req.body)
    const uom = await prisma.unitOfMeasure.create({ data })
    res.status(201).json(uom)
  })
)

router.put(
  '/:id',
  requireNotViewer,
  asyncHandler(async (req, res) => {
    const data = uomSchema.partial().parse(req.body)
    const uom = await prisma.unitOfMeasure.update({ where: { id: req.params.id }, data })
    res.json(uom)
  })
)

router.delete(
  '/:id',
  requireNotViewer,
  asyncHandler(async (req, res) => {
    await prisma.unitOfMeasure.delete({ where: { id: req.params.id } })
    res.json({ message: 'UOM deleted' })
  })
)

export default router