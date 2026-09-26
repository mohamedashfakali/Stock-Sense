import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { prisma } from '../lib/prisma.js'
import { asyncHandler, AppError } from '../middleware/errorHandler.js'
import { authMiddleware, generateToken, AuthRequest } from '../middleware/auth.js'
import { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema } from '../lib/validators.js'
import { z } from 'zod'

const router = Router()

const otpStore = new Map<string, { code: string; expires: number }>()

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

function sendOTPEmail(email: string, code: string) {
  console.log(`[MOCK EMAIL] To: ${email}, OTP: ${code}`)
}

router.post(
  '/register',
  asyncHandler(async (req, res) => {
    const data = registerSchema.parse(req.body)
    const existing = await prisma.user.findUnique({ where: { email: data.email } })
    if (existing) throw new AppError(409, 'Email already registered')

    const passwordHash = await bcrypt.hash(data.password, 10)
    const { password, ...userData } = data
    const user = await prisma.user.create({
      data: { ...userData, passwordHash },
      select: { id: true, email: true, name: true, role: true },
    })

    const token = generateToken(user.id)
    res.status(201).json({ user, token })
  })
)

router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const data = loginSchema.parse(req.body)
    const user = await prisma.user.findUnique({ where: { email: data.email } })
    if (!user) throw new AppError(401, 'Invalid credentials')

    const valid = await bcrypt.compare(data.password, user.passwordHash)
    if (!valid) throw new AppError(401, 'Invalid credentials')

    const token = generateToken(user.id)
    res.json({
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
      token,
    })
  })
)

router.post(
  '/forgot-password',
  asyncHandler(async (req, res) => {
    const data = forgotPasswordSchema.parse(req.body)
    const user = await prisma.user.findUnique({ where: { email: data.email } })
    if (!user) return res.json({ message: 'If email exists, OTP sent' })

    const code = generateOTP()
    otpStore.set(data.email, { code, expires: Date.now() + 10 * 60 * 1000 })
    sendOTPEmail(data.email, code)
    res.json({ message: 'If email exists, OTP sent' })
  })
)

router.post(
  '/reset-password',
  asyncHandler(async (req, res) => {
    const data = resetPasswordSchema.parse(req.body)
    const record = otpStore.get(req.body.email)
    if (!record || record.code !== data.token || record.expires < Date.now()) {
      throw new AppError(400, 'Invalid or expired OTP')
    }

    const passwordHash = await bcrypt.hash(data.password, 10)
    await prisma.user.update({ where: { email: req.body.email }, data: { passwordHash } })
    otpStore.delete(req.body.email)
    res.json({ message: 'Password reset successful' })
  })
)

router.get(
  '/me',
  authMiddleware,
  asyncHandler(async (req: AuthRequest, res) => {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { id: true, email: true, name: true, role: true, avatarUrl: true, createdAt: true },
    })
    res.json(user)
  })
)

router.put(
  '/profile',
  authMiddleware,
  asyncHandler(async (req: AuthRequest, res) => {
    const schema = z.object({ name: z.string().min(2).optional(), avatarUrl: z.string().url().optional().nullable() })
    const data = schema.parse(req.body)
    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data,
      select: { id: true, email: true, name: true, role: true, avatarUrl: true },
    })
    res.json(user)
  })
)

export default router