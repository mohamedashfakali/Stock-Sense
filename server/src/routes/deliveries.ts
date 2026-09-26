import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { asyncHandler, AppError } from '../middleware/errorHandler.js'
import { AuthRequest, requireNotViewer } from '../middleware/auth.js'
import { deliverySchema, paginationSchema } from '../lib/validators.js'

const router = Router()

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { page, limit, search, sortBy, sortOrder, status, warehouseId } = paginationSchema.parse(req.query)
    const where: any = {}
    if (search) where.OR = [{ customer: { contains: search, mode: 'insensitive' } }]
    if (status) where.status = status
    if (warehouseId) where.warehouseId = warehouseId
    const [data, total] = await Promise.all([
      prisma.delivery.findMany({
        where,
        include: { warehouse: true, location: true, createdBy: { select: { id: true, name: true } }, lines: { include: { product: { include: { uom: true } } } } },
        orderBy: { [sortBy || 'createdAt']: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.delivery.count({ where }),
    ])
    res.json({ data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } })
  })
)

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const delivery = await prisma.delivery.findUnique({
      where: { id: req.params.id },
      include: { warehouse: true, location: true, createdBy: { select: { id: true, name: true } }, validatedBy: { select: { id: true, name: true } }, lines: { include: { product: { include: { category: true, uom: true } } } } },
    })
    if (!delivery) throw new AppError(404, 'Delivery not found')
    res.json(delivery)
  })
)

router.post(
  '/',
  requireNotViewer,
  asyncHandler(async (req: AuthRequest, res) => {
    const data = deliverySchema.parse(req.body)
    const delivery = await prisma.delivery.create({
      data: { ...data, createdById: req.user!.id, lines: { create: data.lines } },
      include: { lines: { include: { product: true } } },
    })
    res.status(201).json(delivery)
  })
)

router.put(
  '/:id',
  requireNotViewer,
  asyncHandler(async (req: AuthRequest, res) => {
    const data = deliverySchema.partial().parse(req.body)
    const delivery = await prisma.delivery.findUnique({ where: { id: req.params.id } })
    if (!delivery) throw new AppError(404, 'Delivery not found')
    if (delivery.status !== 'DRAFT') throw new AppError(400, 'Only draft deliveries can be updated')

    await prisma.delivery.update({
      where: { id: req.params.id },
      data: {
        customer: data.customer,
        warehouseId: data.warehouseId,
        locationId: data.locationId,
      },
    })

    if (data.lines) {
      await prisma.deliveryLine.deleteMany({ where: { deliveryId: req.params.id } })
      await prisma.deliveryLine.createMany({
        data: data.lines.map(l => ({ ...l, deliveryId: req.params.id }))
      })
    }

    const updated = await prisma.delivery.findUnique({
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
    const delivery = await prisma.delivery.findUnique({
      where: { id: req.params.id },
      include: { lines: true },
    })
    if (!delivery) throw new AppError(404, 'Delivery not found')
    if (delivery.status !== 'DRAFT') throw new AppError(400, 'Only draft deliveries can be validated')

    await prisma.$transaction(async (tx) => {
      for (const line of delivery.lines) {
        if (line.qtyDelivered > 0) {
          const stock = await tx.stockMove.groupBy({
            by: ['productId'],
            where: { productId: line.productId, locationId: delivery.locationId },
            _sum: { qtyDelta: true },
          })
          const available = stock[0]?._sum.qtyDelta || 0
          if (available < line.qtyDelivered) {
            throw new AppError(400, `Insufficient stock for product ${line.productId}. Available: ${available}`)
          }
          await tx.stockMove.create({
            data: {
              productId: line.productId,
              locationId: delivery.locationId,
              qtyDelta: -line.qtyDelivered,
              refType: 'DELIVERY',
              refId: delivery.id,
              userId: req.user!.id,
            },
          })
        }
      }
      await tx.delivery.update({
        where: { id: delivery.id },
        data: { status: 'DONE', validatedById: req.user!.id, validatedAt: new Date() },
      })
    })

    const updated = await prisma.delivery.findUnique({ where: { id: delivery.id }, include: { lines: { include: { product: true } } } })
    res.json(updated)
  })
)

router.post(
  '/:id/cancel',
  requireNotViewer,
  asyncHandler(async (req: AuthRequest, res) => {
    const delivery = await prisma.delivery.findUnique({ where: { id: req.params.id } })
    if (!delivery) throw new AppError(404, 'Delivery not found')
    if (delivery.status === 'DONE') throw new AppError(400, 'Cannot cancel validated delivery')

    await prisma.delivery.update({ where: { id: delivery.id }, data: { status: 'CANCELED' } })
    res.json({ message: 'Delivery canceled' })
  })
)

export default router