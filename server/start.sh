#!/bin/sh

# 1. Apply database migrations to the production database
echo "Applying database migrations..."
npx prisma db push --accept-data-loss

# 2. Start the worker process in the background
echo "Starting Worker..."
npm run start:worker & 

# 3. Start the server process in the foreground (NO '&' at the end)
echo "Starting Server..."
npm run start:server