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
COPY --from=client-builder /app/package.json ./

EXPOSE 3000

# Create entrypoint script for better logging
RUN printf '#!/bin/sh\necho "=== Starting container ==="\necho "PORT env: $PORT"\nDEFAULT_PORT=3000\nACTUAL_PORT=${PORT:-$DEFAULT_PORT}\necho "Running migrations..."\nnpx prisma migrate deploy\necho "Migration exit code: $?"\necho "Starting Next.js standalone server on port $ACTUAL_PORT..."\ncd /app && PORT=$ACTUAL_PORT node .next/standalone/server.js' > /entrypoint.sh && chmod +x /entrypoint.sh

CMD ["/entrypoint.sh"]