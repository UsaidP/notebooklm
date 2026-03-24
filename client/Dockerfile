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
ENV DATABASE_URL="postgresql://user:pass@localhost:5432/db"

# Copy Prisma config and generate client
COPY prisma.config.ts ./
COPY prisma ./prisma/
RUN npx prisma generate

# Copy client source code
COPY . .

# Build the Next.js application
# Set placeholder env vars needed for build (not used at runtime)
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
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

# Set placeholder DATABASE_URL for Prisma (needed for prisma generate)
ENV DATABASE_URL="postgresql://user:pass@localhost:5432/db"

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# Copy Prisma schema and generate client (needed at runtime)
COPY prisma.config.ts ./
COPY prisma ./prisma/
RUN npx prisma generate

# Copy built client from builder
COPY --from=client-builder /app/.next ./.next
COPY --from=client-builder /app/public ./public
COPY --from=client-builder /app/next.config.ts ./

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Change ownership of app directory
RUN chown -R nodejs:nodejs /app

USER nodejs

# Expose port 3000 (Railway default)
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=60s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Run migrations and start server on port 3000
CMD ["sh", "-c", "npx prisma migrate deploy && npx next start -H 0.0.0.0 -p 3000"]