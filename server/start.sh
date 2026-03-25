#!/bin/sh

# Start the worker process in the background
echo "Starting Worker..."
npm run start:worker & 

# Start the server process in the background
echo "Starting Server..."
npm run start:server &

# Wait for any process to exit. If either crashes, the container restarts.
wait -n
exit $?