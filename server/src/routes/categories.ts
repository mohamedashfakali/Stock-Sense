import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { asyncHandler, AppError } from '../middleware/errorHandler.js'
import { AuthRequest, requireNotViewer } from '../middleware/auth.js'
import { categorySchema, paginationSchema } from '../lib/validators.js'

const router = Router()

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { page, limit, search, sortBy, sortOrder } = paginationSchema.parse(req.query)
    const where = search ? { name: { contains: search, mode: 'insensitive' } } : {}
    const [data, total] = await Promise.all([
      prisma.category.findMany({ where, orderBy: { [sortBy || 'name']: sortOrder }, skip: (page - 1) * limit, take: limit }),
      prisma.category.count({ where }),
    ])
    res.json({ data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } })
  })
)

router.post(
  '/',
  requireNotViewer,
  asyncHandler(async (req, res) => {
    const data = categorySchema.parse(req.body)
    const category = await prisma.category.create({ data })
    res.status(201).json(category)
  })
)

router.put(
  '/:id',
  requireNotViewer,
  asyncHandler(async (req, res) => {
    const data = categorySchema.partial().parse(req.body)
    const category = await prisma.category.update({ where: { id: req.params.id }, data })
    res.json(category)
  })
)

router.delete(
  '/:id',
  requireNotViewer,
  asyncHandler(async (req, res) => {
    await prisma.category.delete({ where: { id: req.params.id } })
    res.json({ message: 'Category deleted' })
  })
)

export default router