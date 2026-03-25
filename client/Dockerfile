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
COPY --from=client-builder /app/package.json ./
COPY --from=client-builder /app/next.config.ts ./

EXPOSE 3000

# Create entrypoint script
RUN printf '#!/bin/sh\necho "=== Starting container ==="\necho "PORT env: $PORT"\necho "RAILWAY_PORT env: $RAILWAY_PORT"\nSERVER_PORT=${RAILWAY_PORT:-${PORT:-3000}}\necho "Starting server on port: $SERVER_PORT"\necho "Running migrations..."\nnpx prisma migrate deploy\necho "Migration exit code: $?"\necho "Starting Next.js on port $SERVER_PORT..."\nexec npx next start -H 0.0.0.0 -p $SERVER_PORT' > /entrypoint.sh && chmod +x /entrypoint.sh

CMD ["/entrypoint.sh"]