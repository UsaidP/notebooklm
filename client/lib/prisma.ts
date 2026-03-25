// Prisma 7 requires an adapter for direct database connections
// Use lazy initialization with dynamic imports to avoid errors during module load

const globalForPrisma = globalThis as unknown as {
  prisma: any | undefined
}

async function createPrismaClient() {
  const [{ PrismaPg }, { PrismaClient }, { default: pg }] = await Promise.all([
    import("@prisma/adapter-pg"),
    import("@prisma/client"),
    import("pg")
  ])

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

// Create a proxy that lazily initializes the client
const handler: ProxyHandler<any> = {
  get(_, prop) {
    if (!globalForPrisma.prisma) {
      // Return a promise-like object for async operations
      if (prop === 'then') return undefined

      // For sync access, create the client synchronously if possible
      // This is a workaround for Next.js which may access properties synchronously
      throw new Error('Prisma client not initialized. Use prismaAsync() instead.')
    }
    return globalForPrisma.prisma[prop]
  }
}

export const prisma = new Proxy({} as any, handler)

// Async function to properly initialize and use the client
export async function getPrisma() {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = await createPrismaClient()
  }
  return globalForPrisma.prisma
}

// For non-production, store in global
if (process.env.NODE_ENV !== "production") {
  // Don't auto-initialize in production
}