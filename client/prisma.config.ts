import { config } from "dotenv"
import { defineConfig, env } from "prisma/config"

// Load .env file (optional for client build)
config({ path: ".env", override: false, debug: false })

export default defineConfig({
  schema: "prisma/schema.prisma",
  // DATABASE_URL is only needed for migrations, not for prisma generate
  // Use a placeholder URL for client build
  datasource: {
    url: process.env.DATABASE_URL || "postgresql://user:pass@localhost:5432/db",
  },
})
