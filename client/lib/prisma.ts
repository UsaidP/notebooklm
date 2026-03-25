import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "@prisma/client"
import pg from "pg"

// Prisma 7 requires an adapter for direct database connections
// Use lazy initialization to avoid errors during module load

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL ?? process.env.DB_URL

  if (!connectionString) {
    throw new Error(
      "DATABASE_URL or DB_URL environment variable is required. Please set one of these environment variables."
    )
  }

  const pool = new pg.Pool({ connectionString })
  const adapter = new PrismaPg(pool)

  return new PrismaClient({ adapter })
}

// Lazy getter - only creates client when first accessed
export const prisma = new Proxy({} as PrismaClient, {
  get(_, prop) {
    if (!globalForPrisma.prisma) {
      globalForPrisma.prisma = createPrismaClient()
    }
    return (globalForPrisma.prisma as any)[prop]
  }
})

// For non-production, store in global
if (process.env.NODE_ENV !== "production") {
  // Access prisma to initialize it for hot reload preservation
  // This is intentional - we want it created once in dev
}