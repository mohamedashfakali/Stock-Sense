import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { asyncHandler, AppError } from '../middleware/errorHandler.js'
import { AuthRequest, requireNotViewer } from '../middleware/auth.js'
import { transferSchema, paginationSchema } from '../lib/validators.js'

const router = Router()

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { page, limit, search, sortBy, sortOrder, status } = paginationSchema.parse(req.query)
    const where: any = {}
    if (search) where.OR = [{ fromLocation: { name: { contains: search, mode: 'insensitive' } }, toLocation: { name: { contains: search, mode: 'insensitive' } } }]
    if (status) where.status = status
    const [data, total] = await Promise.all([
      prisma.transfer.findMany({
        where,
        include: { fromLocation: { include: { warehouse: true } }, toLocation: { include: { warehouse: true } }, createdBy: { select: { id: true, name: true } }, lines: { include: { product: { include: { uom: true } } } } },
        orderBy: { [sortBy || 'createdAt']: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.transfer.count({ where }),
    ])
    res.json({ data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } })
  })
)

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const transfer = await prisma.transfer.findUnique({
      where: { id: req.params.id },
      include: { fromLocation: { include: { warehouse: true } }, toLocation: { include: { warehouse: true } }, createdBy: { select: { id: true, name: true } }, validatedBy: { select: { id: true, name: true } }, lines: { include: { product: { include: { category: true, uom: true } } } } },
    })
    if (!transfer) throw new AppError(404, 'Transfer not found')
    res.json(transfer)
  })
)

router.post(
  '/',
  requireNotViewer,
  asyncHandler(async (req: AuthRequest, res) => {
    const data = transferSchema.parse(req.body)
    if (data.fromLocationId === data.toLocationId) throw new AppError(400, 'Source and destination locations must be different')

    const transfer = await prisma.transfer.create({
      data: { ...data, createdById: req.user!.id, lines: { create: data.lines } },
      include: { lines: { include: { product: true } } },
    })
    res.status(201).json(transfer)
  })
)

router.put(
  '/:id',
  requireNotViewer,
  asyncHandler(async (req: AuthRequest, res) => {
    const data = transferSchema.partial().parse(req.body)
    const transfer = await prisma.transfer.findUnique({ where: { id: req.params.id } })
    if (!transfer) throw new AppError(404, 'Transfer not found')
    if (transfer.status !== 'DRAFT') throw new AppError(400, 'Only draft transfers can be updated')

    await prisma.transfer.update({
      where: { id: req.params.id },
      data: {
        fromLocationId: data.fromLocationId,
        toLocationId: data.toLocationId,
      },
    })

    if (data.lines) {
      await prisma.transferLine.deleteMany({ where: { transferId: req.params.id } })
      await prisma.transferLine.createMany({
        data: data.lines.map(l => ({ ...l, transferId: req.params.id }))
      })
    }

    const updated = await prisma.transfer.findUnique({
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
    const transfer = await prisma.transfer.findUnique({
      where: { id: req.params.id },
      include: { lines: true },
    })
    if (!transfer) throw new AppError(404, 'Transfer not found')
    if (transfer.status !== 'DRAFT') throw new AppError(400, 'Only draft transfers can be validated')

    await prisma.$transaction(async (tx) => {
      for (const line of transfer.lines) {
        const stock = await tx.stockMove.groupBy({
          by: ['productId'],
          where: { productId: line.productId, locationId: transfer.fromLocationId },
          _sum: { qtyDelta: true },
        })
        const available = stock[0]?._sum.qtyDelta || 0
        if (available < line.qty) {
          throw new AppError(400, `Insufficient stock at source location for product ${line.productId}. Available: ${available}`)
        }
        await tx.stockMove.create({
          data: { productId: line.productId, locationId: transfer.fromLocationId, qtyDelta: -line.qty, refType: 'TRANSFER_OUT', refId: transfer.id, userId: req.user!.id },
        })
        await tx.stockMove.create({
          data: { productId: line.productId, locationId: transfer.toLocationId, qtyDelta: line.qty, refType: 'TRANSFER_IN', refId: transfer.id, userId: req.user!.id },
        })
      }
      await tx.transfer.update({ where: { id: transfer.id }, data: { status: 'DONE', validatedById: req.user!.id, validatedAt: new Date() } })
    })

    const updated = await prisma.transfer.findUnique({ where: { id: transfer.id }, include: { lines: { include: { product: true } } } })
    res.json(updated)
  })
)

router.post(
  '/:id/cancel',
  requireNotViewer,
  asyncHandler(async (req: AuthRequest, res) => {
    const transfer = await prisma.transfer.findUnique({ where: { id: req.params.id } })
    if (!transfer) throw new AppError(404, 'Transfer not found')
    if (transfer.status === 'DONE') throw new AppError(400, 'Cannot cancel validated transfer')

    await prisma.transfer.update({ where: { id: transfer.id }, data: { status: 'CANCELED' } })
    res.json({ message: 'Transfer canceled' })
  })
)

export default router