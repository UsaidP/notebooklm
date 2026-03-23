import { config } from "dotenv"
import { defineConfig, env } from "prisma/config"

// Load .env file
config()

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: env("DATABASE_URL"),
  },
})
