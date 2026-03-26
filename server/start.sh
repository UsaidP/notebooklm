#!/bin/sh

# 1. Apply database migrations to the production database
echo "Applying database migrations..."
npx prisma migrate deploy

# 2. Start the worker process in the background
echo "Starting Worker..."
npm run start:worker & 

# 3. Start the server process in the background
echo "Starting Server..."
npm run start:server &

# Wait for any process to exit.
wait -n
exit $?