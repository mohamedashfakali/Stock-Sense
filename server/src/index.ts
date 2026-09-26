import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { errorHandler } from './middleware/errorHandler.js'
import { authMiddleware } from './middleware/auth.js'
import authRoutes from './routes/auth.js'
import productRoutes from './routes/products.js'
import categoryRoutes from './routes/categories.js'
import uomRoutes from './routes/uoms.js'
import warehouseRoutes from './routes/warehouses.js'
import locationRoutes from './routes/locations.js'
import receiptRoutes from './routes/receipts.js'
import deliveryRoutes from './routes/deliveries.js'
import transferRoutes from './routes/transfers.js'
import adjustmentRoutes from './routes/adjustments.js'
import stockRoutes from './routes/stock.js'
import dashboardRoutes from './routes/dashboard.js'
import userRoutes from './routes/users.js'

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }))
app.use(express.json())

app.get('/api/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }))

app.use('/api/auth', authRoutes)
app.use('/api/products', authMiddleware, productRoutes)
app.use('/api/categories', authMiddleware, categoryRoutes)
app.use('/api/uoms', authMiddleware, uomRoutes)
app.use('/api/warehouses', authMiddleware, warehouseRoutes)
app.use('/api/locations', authMiddleware, locationRoutes)
app.use('/api/receipts', authMiddleware, receiptRoutes)
app.use('/api/deliveries', authMiddleware, deliveryRoutes)
app.use('/api/transfers', authMiddleware, transferRoutes)
app.use('/api/adjustments', authMiddleware, adjustmentRoutes)
app.use('/api/stock', authMiddleware, stockRoutes)
app.use('/api/dashboard', authMiddleware, dashboardRoutes)
app.use('/api/users', authMiddleware, userRoutes)

app.use(errorHandler)

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})