
import 'dotenv/config'
import { defineConfig, env } from 'prisma/config'

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    // Use placeholder for prisma generate (not needed at build time)
    url: env('DB_URL') || 'postgresql://user:pass@localhost:5432/placeholder',
  },
})