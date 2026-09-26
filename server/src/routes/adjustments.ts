import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { asyncHandler, AppError } from '../middleware/errorHandler.js'
import { AuthRequest, requireNotViewer } from '../middleware/auth.js'
import { adjustmentSchema, paginationSchema } from '../lib/validators.js'

const router = Router()

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { page, limit, search, sortBy, sortOrder, status, locationId } = paginationSchema.parse(req.query)
    const where: any = {}
    if (search) where.OR = [{ reason: { contains: search, mode: 'insensitive' } }]
    if (status) where.status = status
    if (locationId) where.locationId = locationId
    const [data, total] = await Promise.all([
      prisma.adjustment.findMany({
        where,
        include: { location: { include: { warehouse: true } }, createdBy: { select: { id: true, name: true } }, lines: { include: { product: { include: { uom: true } } } } },
        orderBy: { [sortBy || 'createdAt']: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.adjustment.count({ where }),
    ])
    res.json({ data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } })
  })
)

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const adjustment = await prisma.adjustment.findUnique({
      where: { id: req.params.id },
      include: { location: { include: { warehouse: true } }, createdBy: { select: { id: true, name: true } }, validatedBy: { select: { id: true, name: true } }, lines: { include: { product: { include: { category: true, uom: true } } } } },
    })
    if (!adjustment) throw new AppError(404, 'Adjustment not found')
    res.json(adjustment)
  })
)

router.post(
  '/',
  requireNotViewer,
  asyncHandler(async (req: AuthRequest, res) => {
    const data = adjustmentSchema.parse(req.body)
    const adjustment = await prisma.adjustment.create({
      data: { ...data, createdById: req.user!.id, lines: { create: data.lines } },
      include: { lines: { include: { product: true } } },
    })
    res.status(201).json(adjustment)
  })
)

router.put(
  '/:id',
  requireNotViewer,
  asyncHandler(async (req: AuthRequest, res) => {
    const data = adjustmentSchema.partial().parse(req.body)
    const adjustment = await prisma.adjustment.findUnique({ where: { id: req.params.id } })
    if (!adjustment) throw new AppError(404, 'Adjustment not found')
    if (adjustment.status !== 'DRAFT') throw new AppError(400, 'Only draft adjustments can be updated')

    await prisma.adjustment.update({
      where: { id: req.params.id },
      data: {
        locationId: data.locationId,
        reason: data.reason,
      },
    })

    if (data.lines) {
      await prisma.adjustmentLine.deleteMany({ where: { adjustmentId: req.params.id } })
      await prisma.adjustmentLine.createMany({
        data: data.lines.map(l => ({ ...l, adjustmentId: req.params.id }))
      })
    }

    const updated = await prisma.adjustment.findUnique({
      where: { id: req.params.id },
      include: { lines: { include: { product: true } } },
    })
    res.json(updated)
  })
)

router.post(
  '/:id/validate',
  requireNotViewer,
  asyncHandler(async (req: AuthRequest, res) => {
    const adjustment = await prisma.adjustment.findUnique({
      where: { id: req.params.id },
      include: { lines: true },
    })
    if (!adjustment) throw new AppError(404, 'Adjustment not found')
    if (adjustment.status !== 'DRAFT') throw new AppError(400, 'Only draft adjustments can be validated')

    await prisma.$transaction(async (tx) => {
      for (const line of adjustment.lines) {
        const delta = line.countedQty - line.systemQty
        if (delta !== 0) {
          await tx.stockMove.create({
            data: { productId: line.productId, locationId: adjustment.locationId, qtyDelta: delta, refType: 'ADJUSTMENT', refId: adjustment.id, userId: req.user!.id },
          })
        }
      }
      await tx.adjustment.update({ where: { id: adjustment.id }, data: { status: 'DONE', validatedById: req.user!.id, validatedAt: new Date() } })
    })

    const updated = await prisma.adjustment.findUnique({ where: { id: adjustment.id }, include: { lines: { include: { product: true } } } })
    res.json(updated)
  })
)

router.post(
  '/:id/cancel',
  requireNotViewer,
  asyncHandler(async (req: AuthRequest, res) => {
    const adjustment = await prisma.adjustment.findUnique({ where: { id: req.params.id } })
    if (!adjustment) throw new AppError(404, 'Adjustment not found')
    if (adjustment.status === 'DONE') throw new AppError(400, 'Cannot cancel validated adjustment')

    await prisma.adjustment.update({ where: { id: adjustment.id }, data: { status: 'CANCELED' } })
    res.json({ message: 'Adjustment canceled' })
  })
)

export default router