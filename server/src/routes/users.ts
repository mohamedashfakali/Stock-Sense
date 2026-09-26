import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { asyncHandler, AppError } from '../middleware/errorHandler.js'
import { AuthRequest, requireNotViewer } from '../middleware/auth.js'
import { paginationSchema, userIdSchema } from '../lib/validators.js'
import { z } from 'zod'

const userPaginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

const router = Router()

const userSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
  role: z.enum(['ADMIN', 'MANAGER', 'STAFF', 'VIEWER']),
  avatarUrl: z.string().url().optional(),
})

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { page, limit, search, sortBy, sortOrder } = userPaginationSchema.parse(req.query)
    const where = search && search.trim() !== ''
      ? { OR: [{ name: { contains: search.toLowerCase() } }, { email: { contains: search.toLowerCase() } }] }
      : {}

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: { id: true, email: true, name: true, role: true, avatarUrl: true, createdAt: true },
        orderBy: { [sortBy || 'createdAt']: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.user.count({ where }),
    ])

    res.json({ data: users, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } })
  })
)

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = userIdSchema.parse({ id: req.params.id })
    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, name: true, role: true, avatarUrl: true, createdAt: true },
    })
    if (!user) throw new AppError(404, 'User not found')
    res.json(user)
  })
)

router.post(
  '/',
  requireNotViewer,
  asyncHandler(async (req: AuthRequest, res) => {
    const data = userSchema.parse(req.body)
    const existing = await prisma.user.findUnique({ where: { email: data.email } })
    if (existing) throw new AppError(409, 'Email already registered')

    const bcrypt = await import('bcryptjs')
    const passwordHash = await bcrypt.hash('password123', 10)

    const user = await prisma.user.create({
      data: { ...data, passwordHash },
      select: { id: true, email: true, name: true, role: true, avatarUrl: true, createdAt: true },
    })
    res.status(201).json(user)
  })
)

router.put(
  '/:id',
  requireNotViewer,
  asyncHandler(async (req: AuthRequest, res) => {
    const { id } = userIdSchema.parse({ id: req.params.id })
    const data = userSchema.partial().parse(req.body)
    const user = await prisma.user.update({
      where: { id },
      data,
      select: { id: true, email: true, name: true, role: true, avatarUrl: true, createdAt: true },
    })
    res.json(user)
  })
)

router.delete(
  '/:id',
  requireNotViewer,
  asyncHandler(async (req: AuthRequest, res) => {
    const { id } = userIdSchema.parse({ id: req.params.id })
    if (id === req.user!.id) throw new AppError(400, 'Cannot delete yourself')
    await prisma.user.delete({ where: { id } })
    res.json({ message: 'User deleted' })
  })
)

export default router