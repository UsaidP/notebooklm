FROM node:20-alpine AS base

# Install dependencies
RUN apk add --no-cache libc6-compat openssl

# Set working directory
WORKDIR /app

# ==================================================================
# Stage 1: Build the Client (Next.js)
# ==================================================================
FROM base AS client-builder

WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies
RUN npm ci

# Set placeholder DATABASE_URL for Prisma (needed for prisma generate)


# Copy Prisma config and generate client
COPY prisma.config.ts ./
COPY prisma ./prisma/
RUN npx prisma generate

# Copy client source code
COPY . .

# Build the Next.js application
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ==================================================================
# Stage 2: Production Image
# ==================================================================
FROM base AS production

# Install production runtime dependencies
RUN apk add --no-cache openssl

WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Set placeholder DATABASE_URL for Prisma (needed for prisma generate)
ENV DATABASE_URL="postgresql://user:pass@localhost:5432/db"

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# Copy Prisma schema and generate client
COPY prisma.config.ts ./
COPY prisma ./prisma/
RUN npx prisma generate

# Copy built client from builder
COPY --from=client-builder /app/.next ./.next
COPY --from=client-builder /app/public ./public
COPY --from=client-builder /app/next.config.ts ./

EXPOSE 3000

# Health check - use 0.0.0.0 for Railway compatibility
HEALTHCHECK --interval=30s --timeout=3s --start-period=90s --retries=3 \
  CMD node -e "require('http').get('http://0.0.0.0:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Run migrations and start Next.js server
CMD ["sh", "-c", "echo '=== Starting container ===' && echo 'Running migrations...' && npx prisma migrate deploy; echo 'Migration exit code: '$? && echo 'Starting Next.js...' && exec npx next start -H 0.0.0.0 -p 3000"]