import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const passwordHash = await bcrypt.hash('password123', 10)

  const admin = await prisma.user.upsert({
    where: { email: 'admin@stocksense.com' },
    update: {},
    create: {
      email: 'admin@stocksense.com',
      passwordHash,
      name: 'Admin User',
      role: 'ADMIN',
    },
  })

  const manager = await prisma.user.upsert({
    where: { email: 'manager@stocksense.com' },
    update: {},
    create: {
      email: 'manager@stocksense.com',
      passwordHash,
      name: 'Inventory Manager',
      role: 'MANAGER',
    },
  })

  const staff = await prisma.user.upsert({
    where: { email: 'staff@stocksense.com' },
    update: {},
    create: {
      email: 'staff@stocksense.com',
      passwordHash,
      name: 'Warehouse Staff',
      role: 'STAFF',
    },
  })

  const viewer = await prisma.user.upsert({
    where: { email: 'viewer@stocksense.com' },
    update: {},
    create: {
      email: 'viewer@stocksense.com',
      passwordHash,
      name: 'Viewer User',
      role: 'VIEWER',
    },
  })

  const categories = await Promise.all([
    prisma.category.upsert({ where: { name: 'Raw Materials' }, update: {}, create: { name: 'Raw Materials', description: 'Raw materials for production' } }),
    prisma.category.upsert({ where: { name: 'Finished Goods' }, update: {}, create: { name: 'Finished Goods', description: 'Finished products ready for sale' } }),
    prisma.category.upsert({ where: { name: 'Components' }, update: {}, create: { name: 'Components', description: 'Components and parts' } }),
    prisma.category.upsert({ where: { name: 'Consumables' }, update: {}, create: { name: 'Consumables', description: 'Consumable supplies' } }),
  ])

  const uoms = await Promise.all([
    prisma.unitOfMeasure.upsert({ where: { name: 'Kilogram' }, update: {}, create: { name: 'Kilogram', symbol: 'kg' } }),
    prisma.unitOfMeasure.upsert({ where: { name: 'Piece' }, update: {}, create: { name: 'Piece', symbol: 'pcs' } }),
    prisma.unitOfMeasure.upsert({ where: { name: 'Meter' }, update: {}, create: { name: 'Meter', symbol: 'm' } }),
    prisma.unitOfMeasure.upsert({ where: { name: 'Liter' }, update: {}, create: { name: 'Liter', symbol: 'L' } }),
    prisma.unitOfMeasure.upsert({ where: { name: 'Box' }, update: {}, create: { name: 'Box', symbol: 'box' } }),
  ])

  const warehouse = await prisma.warehouse.upsert({
    where: { code: 'WH001' },
    update: {},
    create: {
      name: 'Main Warehouse',
      code: 'WH001',
      address: '123 Industrial Ave, City',
    },
  })

  const locations = await Promise.all([
    prisma.location.upsert({ where: { warehouseId_code: { warehouseId: warehouse.id, code: 'RECV' } }, update: {}, create: { name: 'Receiving Dock', code: 'RECV', type: 'RECEIVING', warehouseId: warehouse.id } }),
    prisma.location.upsert({ where: { warehouseId_code: { warehouseId: warehouse.id, code: 'STOR-A' } }, update: {}, create: { name: 'Storage Rack A', code: 'STOR-A', type: 'STORAGE', warehouseId: warehouse.id } }),
    prisma.location.upsert({ where: { warehouseId_code: { warehouseId: warehouse.id, code: 'STOR-B' } }, update: {}, create: { name: 'Storage Rack B', code: 'STOR-B', type: 'STORAGE', warehouseId: warehouse.id } }),
    prisma.location.upsert({ where: { warehouseId_code: { warehouseId: warehouse.id, code: 'PROD' } }, update: {}, create: { name: 'Production Floor', code: 'PROD', type: 'PRODUCTION', warehouseId: warehouse.id } }),
    prisma.location.upsert({ where: { warehouseId_code: { warehouseId: warehouse.id, code: 'SHIP' } }, update: {}, create: { name: 'Shipping Area', code: 'SHIP', type: 'SHIPPING', warehouseId: warehouse.id } }),
    prisma.location.upsert({ where: { warehouseId_code: { warehouseId: warehouse.id, code: 'QUAR' } }, update: {}, create: { name: 'Quarantine', code: 'QUAR', type: 'QUARANTINE', warehouseId: warehouse.id } }),
  ])

  const [recvLoc, storA, storB, prodLoc, shipLoc, quarLoc] = locations

  const products = await Promise.all([
    prisma.product.upsert({
      where: { sku: 'STEEL-ROD-001' },
      update: {},
      create: { sku: 'STEEL-ROD-001', name: 'Steel Rods 10mm', description: '10mm diameter steel rods', categoryId: categories[0].id, uomId: uoms[0].id, reorderPoint: 50, createdById: admin.id },
    }),
    prisma.product.upsert({
      where: { sku: 'CHAIR-001' },
      update: {},
      create: { sku: 'CHAIR-001', name: 'Office Chair', description: 'Ergonomic office chair', categoryId: categories[1].id, uomId: uoms[1].id, reorderPoint: 10, createdById: admin.id },
    }),
    prisma.product.upsert({
      where: { sku: 'SCREW-001' },
      update: {},
      create: { sku: 'SCREW-001', name: 'Steel Screws 5mm', description: '5mm steel screws box of 100', categoryId: categories[2].id, uomId: uoms[4].id, reorderPoint: 20, createdById: admin.id },
    }),
    prisma.product.upsert({
      where: { sku: 'PAINT-001' },
      update: {},
      create: { sku: 'PAINT-001', name: 'Industrial Paint Blue', description: 'Blue industrial paint 20L', categoryId: categories[3].id, uomId: uoms[3].id, reorderPoint: 5, createdById: admin.id },
    }),
    prisma.product.upsert({
      where: { sku: 'WIRE-001' },
      update: {},
      create: { sku: 'WIRE-001', name: 'Copper Wire 2.5mm', description: '2.5mm copper electrical wire', categoryId: categories[0].id, uomId: uoms[2].id, reorderPoint: 100, createdById: admin.id },
    }),
  ])

  const receipt = await prisma.receipt.create({
    data: {
      supplier: 'SteelCorp Industries',
      status: 'DONE',
      warehouseId: warehouse.id,
      locationId: recvLoc.id,
      createdById: admin.id,
      validatedById: admin.id,
      validatedAt: new Date(),
      lines: {
        create: [
          { productId: products[0].id, qtyOrdered: 100, qtyReceived: 100 },
          { productId: products[2].id, qtyOrdered: 50, qtyReceived: 50 },
        ],
      },
    },
    include: { lines: true },
  })

  for (const line of receipt.lines) {
    await prisma.stockMove.create({
      data: {
        productId: line.productId,
        locationId: recvLoc.id,
        qtyDelta: line.qtyReceived,
        refType: 'RECEIPT',
        refId: receipt.id,
        userId: admin.id,
      },
    })
  }

  const delivery = await prisma.delivery.create({
    data: {
      customer: 'ABC Furniture Co.',
      status: 'DONE',
      warehouseId: warehouse.id,
      locationId: shipLoc.id,
      createdById: admin.id,
      validatedById: admin.id,
      validatedAt: new Date(),
      lines: {
        create: [
          { productId: products[1].id, qtyOrdered: 5, qtyDelivered: 5 },
        ],
      },
    },
    include: { lines: true },
  })

  for (const line of delivery.lines) {
    await prisma.stockMove.create({
      data: {
        productId: line.productId,
        locationId: shipLoc.id,
        qtyDelta: -line.qtyDelivered,
        refType: 'DELIVERY',
        refId: delivery.id,
        userId: admin.id,
      },
    })
  }

  const transfer = await prisma.transfer.create({
    data: {
      fromLocationId: storA.id,
      toLocationId: prodLoc.id,
      status: 'DONE',
      createdById: admin.id,
      validatedById: admin.id,
      validatedAt: new Date(),
      lines: {
        create: [
          { productId: products[0].id, qty: 20 },
        ],
      },
    },
    include: { lines: true },
  })

  for (const line of transfer.lines) {
    await prisma.stockMove.create({
      data: {
        productId: line.productId,
        locationId: storA.id,
        qtyDelta: -line.qty,
        refType: 'TRANSFER_OUT',
        refId: transfer.id,
        userId: admin.id,
      },
    })
    await prisma.stockMove.create({
      data: {
        productId: line.productId,
        locationId: prodLoc.id,
        qtyDelta: line.qty,
        refType: 'TRANSFER_IN',
        refId: transfer.id,
        userId: admin.id,
      },
    })
  }

  const adjustment = await prisma.adjustment.create({
    data: {
      locationId: storA.id,
      reason: 'Damaged during handling',
      status: 'DONE',
      createdById: admin.id,
      validatedById: admin.id,
      validatedAt: new Date(),
      lines: {
        create: [
          { productId: products[0].id, systemQty: 80, countedQty: 77 },
        ],
      },
    },
    include: { lines: true },
  })

  for (const line of adjustment.lines) {
    const delta = line.countedQty - line.systemQty
    await prisma.stockMove.create({
      data: {
        productId: line.productId,
        locationId: storA.id,
        qtyDelta: delta,
        refType: 'ADJUSTMENT',
        refId: adjustment.id,
        userId: admin.id,
      },
    })
  }

  console.log('Database seeded successfully!')
  console.log('Test users:')
  console.log('  admin@stocksense.com / password123 (Admin)')
  console.log('  manager@stocksense.com / password123 (Manager)')
  console.log('  staff@stocksense.com / password123 (Staff)')
  console.log('  viewer@stocksense.com / password123 (Viewer)')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })