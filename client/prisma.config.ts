import { config } from "dotenv"
import { defineConfig } from "prisma/config"

// Load .env file (optional for client build)
config({ path: ".env", override: false, debug: false })

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env.DATABASE_URL || "postgresql://user:pass@localhost:5432/db",
  },
})
