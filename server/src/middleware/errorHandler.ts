import { Request, Response, NextFunction } from 'express'
import { ZodError } from 'zod'
import { Prisma } from '@prisma/client'

export class AppError extends Error {
  constructor(public statusCode: number, message: string, public details?: unknown) {
    super(message)
    this.name = 'AppError'
  }
}

export const errorHandler = (err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Error:', err)

  if (err instanceof ZodError) {
    return res.status(400).json({
      error: 'Validation error',
      details: err.errors.map(e => ({ field: e.path.join('.'), message: e.message })),
    })
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      return res.status(409).json({ error: 'A record with this value already exists' })
    }
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Record not found' })
    }
  }

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ error: err.message, details: err.details })
  }

  return res.status(500).json({ error: 'Internal server error' })
}

export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}