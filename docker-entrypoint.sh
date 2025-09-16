#!/bin/sh

# Function to handle shutdown gracefully
cleanup() {
    echo "Shutting down services..."
    kill $API_PID $WORKER_PID $AUDIT_PID 2>/dev/null
    wait
    exit 0
}

# Set up signal handlers
trap cleanup SIGTERM SIGINT

echo "Starting LLM Proxy services..."

export NODE_OPTIONS="--loader ts-node/esm --experimental-specifier-resolution=node"

# Start the API server in the background
echo "Starting API server..."
node src/app.ts &
API_PID=$!

# Start the worker server in the background
echo "Starting worker server..."
node src/servers/worker.server.ts &
WORKER_PID=$!

# Start the audit server in the background
echo "Starting audit server..."
node src/servers/audit.server.ts &
AUDIT_PID=$!

echo "All services started:"
echo "  API PID: $API_PID"
echo "  Worker PID: $WORKER_PID"
echo "  Audit PID: $AUDIT_PID"

# Wait for any process to exit
wait -n

# If we get here, one of the processes has died
echo "One of the services has stopped. Shutting down all services..."
cleanup
