import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { asyncHandler, AppError } from '../middleware/errorHandler.js'
import { AuthRequest, requireNotViewer } from '../middleware/auth.js'
import { receiptSchema, paginationSchema, validateSchema } from '../lib/validators.js'

const router = Router()

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { page, limit, search, sortBy, sortOrder, status, warehouseId } = paginationSchema.parse(req.query)
    const where: any = {}
    if (search) where.OR = [{ supplier: { contains: search, mode: 'insensitive' } }]
    if (status) where.status = status
    if (warehouseId) where.warehouseId = warehouseId
    const [data, total] = await Promise.all([
      prisma.receipt.findMany({
        where,
        include: { warehouse: true, location: true, createdBy: { select: { id: true, name: true } }, lines: { include: { product: { include: { uom: true } } } } },
        orderBy: { [sortBy || 'createdAt']: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.receipt.count({ where }),
    ])
    res.json({ data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } })
  })
)

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const receipt = await prisma.receipt.findUnique({
      where: { id: req.params.id },
      include: { warehouse: true, location: true, createdBy: { select: { id: true, name: true } }, validatedBy: { select: { id: true, name: true } }, lines: { include: { product: { include: { category: true, uom: true } } } } },
    })
    if (!receipt) throw new AppError(404, 'Receipt not found')
    res.json(receipt)
  })
)

router.post(
  '/',
  requireNotViewer,
  asyncHandler(async (req: AuthRequest, res) => {
    const data = receiptSchema.parse(req.body)
    const receipt = await prisma.receipt.create({
      data: { ...data, createdById: req.user!.id, lines: { create: data.lines } },
      include: { lines: { include: { product: true } } },
    })
    res.status(201).json(receipt)
  })
)

router.put(
  '/:id',
  requireNotViewer,
  asyncHandler(async (req: AuthRequest, res) => {
    const data = receiptSchema.partial().parse(req.body)
    const receipt = await prisma.receipt.findUnique({ where: { id: req.params.id } })
    if (!receipt) throw new AppError(404, 'Receipt not found')
    if (receipt.status !== 'DRAFT') throw new AppError(400, 'Only draft receipts can be updated')

    await prisma.receipt.update({
      where: { id: req.params.id },
      data: {
        supplier: data.supplier,
        warehouseId: data.warehouseId,
        locationId: data.locationId,
      },
    })

    if (data.lines) {
      await prisma.receiptLine.deleteMany({ where: { receiptId: req.params.id } })
      await prisma.receiptLine.createMany({
        data: data.lines.map(l => ({ ...l, receiptId: req.params.id }))
      })
    }

    const updated = await prisma.receipt.findUnique({
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
    const receipt = await prisma.receipt.findUnique({
      where: { id: req.params.id },
      include: { lines: true },
    })
    if (!receipt) throw new AppError(404, 'Receipt not found')
    if (receipt.status !== 'DRAFT') throw new AppError(400, 'Only draft receipts can be validated')

    await prisma.$transaction(async (tx) => {
      for (const line of receipt.lines) {
        if (line.qtyReceived > 0) {
          await tx.stockMove.create({
            data: {
              productId: line.productId,
              locationId: receipt.locationId,
              qtyDelta: line.qtyReceived,
              refType: 'RECEIPT',
              refId: receipt.id,
              userId: req.user!.id,
            },
          })
        }
      }
      await tx.receipt.update({
        where: { id: receipt.id },
        data: { status: 'DONE', validatedById: req.user!.id, validatedAt: new Date() },
      })
    })

    const updated = await prisma.receipt.findUnique({ where: { id: receipt.id }, include: { lines: { include: { product: true } } } })
    res.json(updated)
  })
)

router.post(
  '/:id/cancel',
  requireNotViewer,
  asyncHandler(async (req: AuthRequest, res) => {
    const receipt = await prisma.receipt.findUnique({ where: { id: req.params.id } })
    if (!receipt) throw new AppError(404, 'Receipt not found')
    if (receipt.status === 'DONE') throw new AppError(400, 'Cannot cancel validated receipt')

    await prisma.receipt.update({ where: { id: receipt.id }, data: { status: 'CANCELED' } })
    res.json({ message: 'Receipt canceled' })
  })
)

export default router