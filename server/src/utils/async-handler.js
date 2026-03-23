// server/src/utils/asyncHandler.js
// Custom async handler for NotebookLM RAG project
// Covers: Express routes, Prisma, Appwrite, Qdrant, BullMQ, OpenAI

import { performance } from 'perf_hooks'

// ─────────────────────────────────────────
// API ERROR CLASS
// ─────────────────────────────────────────

export class ApiError extends Error {
  constructor(statusCode, message, errors = [], stack = '') {
    super(message)
    this.statusCode = statusCode
    this.errors = errors
    this.success = false
    if (stack) this.stack = stack
    else Error.captureStackTrace(this, this.constructor)
  }
}

// ─────────────────────────────────────────
// ERROR STANDARDIZER
// Converts any error into a clean ApiError
// ─────────────────────────────────────────

const standardizeError = (err) => {
  // Log the raw error for debugging in development
  if (process.env.NODE_ENV === 'development' && err) {
    console.error('[DEBUG] Raw error:', err)
  }

  // Already an ApiError — return as is
  if (err instanceof ApiError) return err

  // ── Clerk Auth Errors ──
  if (err.message?.includes('Unauthorized') || err.status === 401) {
    return new ApiError(401, 'Unauthorized — invalid or expired token')
  }
  if (err.clerkError) {
    return new ApiError(401, err.errors?.[0]?.message || 'Authentication failed')
  }

  // ── Prisma / PostgreSQL Errors ──
  if (err.code === 'P2002') {
    const field = err.meta?.target?.[0] || 'field'
    return new ApiError(409, `${field} already exists`)
  }
  if (err.code === 'P2025') {
    return new ApiError(404, 'Record not found')
  }
  if (err.code === 'P2003') {
    return new ApiError(400, 'Related record does not exist')
  }
  if (err.name === 'PrismaClientKnownRequestError') {
    return new ApiError(400, `Database error: ${err.message}`)
  }
  if (err.name === 'PrismaClientValidationError') {
    return new ApiError(400, 'Invalid data provided to database')
  }

  // ── Appwrite Errors ──
  if (err.type === 'storage_file_not_found') {
    return new ApiError(404, 'File not found in Appwrite storage')
  }
  if (err.type === 'storage_bucket_not_found') {
    return new ApiError(500, 'Appwrite storage bucket not configured correctly')
  }
  if (err.type === 'storage_file_type_unsupported') {
    return new ApiError(400, 'File type not supported — only PDFs are allowed')
  }
  if (err.type === 'storage_device_not_found') {
    return new ApiError(503, 'Appwrite storage unavailable')
  }

  // ── Qdrant Errors ──
  if (err.message?.includes('Collection') && err.message?.includes('not found')) {
    return new ApiError(503, 'Vector database collection not ready — try again shortly')
  }
  if (err.status === 422) {
    return new ApiError(500, 'Vector database error — embedding may be malformed')
  }

  // ── OpenAI Errors ──
  if (err.status === 429 && err.type === 'tokens') {
    return new ApiError(429, 'OpenAI token limit reached — please try a shorter query')
  }
  if (err.status === 429) {
    return new ApiError(429, 'AI service rate limit reached — please wait a moment')
  }
  if (err.code === 'context_length_exceeded') {
    return new ApiError(400, 'Document too large to process in one request')
  }
  if (err.status === 503 && err.message?.includes('openai')) {
    return new ApiError(503, 'AI service temporarily unavailable')
  }

  // ── BullMQ / Redis Errors ──
  if (err.message?.includes('Redis') || err.code === 'ECONNREFUSED') {
    return new ApiError(503, 'Job queue unavailable — please try again')
  }
  if (err.message?.includes('Job') && err.message?.includes('failed')) {
    return new ApiError(500, 'Background processing job failed')
  }

  // ── File / Upload Errors ──
  if (err.code === 'LIMIT_FILE_SIZE') {
    return new ApiError(413, `File too large — maximum size is ${Math.round(err.limit / (1024 * 1024))}MB`)
  }
  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return new ApiError(400, 'Unexpected file field in upload')
  }

  // ── Network / Timeout Errors ──
  if (err.code === 'ETIMEDOUT' || err.message?.includes('timeout')) {
    return new ApiError(504, 'Request timed out — document may be too large')
  }

  // ── PDF Parsing Errors ──
  if (err.message?.includes('PDF') || err.message?.includes('pdf-parse')) {
    return new ApiError(422, 'Could not extract text from PDF — it may be scanned or corrupted')
  }

  // ── Zod Validation Errors ──
  if (err.name === 'ZodError') {
    const errors = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }))
    return new ApiError(400, 'Invalid request data', errors)
  }

  // ── Invalid JSON Body ──
  if (err instanceof SyntaxError && err.status === 400) {
    return new ApiError(400, 'Invalid JSON in request body')
  }

  // ── Fallback ──
  // Handle cases where err might not be a standard Error object
  const statusCode = err?.statusCode || err?.status || 500
  const message = err?.message || String(err) || 'An unexpected error occurred'

  return new ApiError(
    statusCode,
    message,
    [],
    process.env.NODE_ENV === 'development' ? err?.stack : ''
  )
}

// ─────────────────────────────────────────
// 1. EXPRESS ROUTE HANDLER
// Usage: router.get('/route', asyncHandler(async (req, res) => { ... }))
// ─────────────────────────────────────────

const asyncHandler = (fn) => {
  return async (req, res, next) => {
    try {
      await fn(req, res, next)
    } catch (err) {
      const apiError = standardizeError(err)

      if (apiError.statusCode >= 500) {
        console.error(`[ERROR] ${req.method} ${req.path}`, {
          error: apiError.message,
          stack: apiError.stack,
          userId: req.userId || 'unauthenticated',
        })
      }

      if (!res.headersSent) {
        res.status(apiError.statusCode).json({
          success: false,
          message: apiError.message,
          errors: apiError.errors,
          ...(process.env.NODE_ENV === 'development' && { stack: apiError.stack }),
        })
      }
    }
  }
}

// ─────────────────────────────────────────
// 2. SERVICE / UTILITY FUNCTION WRAPPER
// Usage: await asyncHandler.service(() => prisma.notebook.findMany(...))
// Best for: Prisma queries, Appwrite calls, Qdrant operations
// ─────────────────────────────────────────

asyncHandler.service = (fn) => {
  return fn().catch((err) => {
    throw standardizeError(err)
  })
}

// ─────────────────────────────────────────
// 3. BULLMQ WORKER JOB WRAPPER
// Usage: asyncHandler.job(async (job) => { ... })
// Best for: PDF processing worker — logs job ID + duration on failure
// ─────────────────────────────────────────

asyncHandler.job = (fn) => {
  return async (job) => {
    const start = performance.now()
    try {
      await fn(job)
      const duration = Math.round(performance.now() - start)
      console.log(`[JOB ✅] ${job.name} #${job.id} completed in ${duration}ms`)
    } catch (err) {
      const apiError = standardizeError(err)
      const duration = Math.round(performance.now() - start)
      console.error(`[JOB ❌] ${job.name} #${job.id} failed after ${duration}ms`, {
        error: apiError.message,
        jobData: job.data,
      })
      throw apiError // re-throw so BullMQ marks job as failed + retries
    }
  }
}

// ─────────────────────────────────────────
// EXPRESS ERROR MIDDLEWARE
// Mount this at the very bottom of app.js
// Usage: app.use(errorMiddleware)
// ─────────────────────────────────────────

export const errorMiddleware = (err, req, res, _next) => {
  const apiError = standardizeError(err)

  if (apiError.statusCode >= 500) {
    console.error(`[SERVER ERROR] ${req.method} ${req.path}`, {
      error: apiError.message,
      stack: apiError.stack,
      userId: req.userId || 'unauthenticated',
    })
  }

  if (!res.headersSent) {
    res.status(apiError.statusCode).json({
      success: false,
      message: apiError.message,
      errors: apiError.errors,
      ...(process.env.NODE_ENV === 'development' && { stack: apiError.stack }),
    })
  }
}

export { asyncHandler }