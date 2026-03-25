import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "@prisma/client"
import pg from "pg"

// Prisma 7 requires an adapter for direct database connections
// Use lazy initialization with a getter to avoid errors during module load

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL ?? process.env.DB_URL

  if (!connectionString) {
    // Return a dummy client that throws on actual use
    // This allows the module to load without crashing
    console.warn("DATABASE_URL not set - Prisma client will fail on first use")
  }

  const pool = new pg.Pool({
    connectionString: connectionString || "postgresql://placeholder:placeholder@localhost:5432/placeholder"
  })
  const adapter = new PrismaPg(pool)

  return new PrismaClient({ adapter })
}

// Lazy getter - creates client on first access
function getPrismaClient(): PrismaClient {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient()
  }
  return globalForPrisma.prisma
}

// Export a proxy that lazily initializes
export const prisma = new Proxy({} as PrismaClient, {
  get(_, prop: string | symbol) {
    const client = getPrismaClient()
    return (client as any)[prop]
  }
})

// For non-production, preserve across hot reloads
if (process.env.NODE_ENV !== "production") {
  // Access to initialize for dev
  getPrismaClient()
}

