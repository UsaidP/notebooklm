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
ENV HOSTNAME="0.0.0.0"
# PORT will be set by Railway at runtime

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

EXPOSE ${PORT:-3000}

# Run migrations and start Next.js server
CMD ["sh", "-c", "echo '=== Starting container ===' && echo 'Running migrations...' && npx prisma migrate deploy; echo 'Migration exit code: '$? && echo 'Starting Next.js on port '$PORT'...' && exec npx next start -H 0.0.0.0 -p ${PORT:-3000}"]