#!/bin/sh

cleanup() {
    echo "Shutting down services..."
    kill $API_PID $WORKER_PID $AUDIT_PID $BATCH_PID 2>/dev/null
    wait
    exit 0
}

trap cleanup SIGTERM SIGINT

# Set working directory and plugin path based on build mode
if [ "${BUILD_MODE}" = "dev" ]; then
    cd /monorepo/app
    export TS_NODE_PROJECT=/monorepo/app/tsconfig.json
    # Workspaces hoist plugins to monorepo root node_modules
    export API_PLUGINS_DIR=${API_PLUGINS_DIR:-../node_modules}
else
    cd /app
    export TS_NODE_PROJECT=/app/tsconfig.json
    # Prod installs plugins into /app/node_modules
    export API_PLUGINS_DIR=${API_PLUGINS_DIR:-node_modules}
fi

export NODE_OPTIONS="--import ./scripts/register-ts-node.mjs"

# ENABLE_ALL overrides individual toggles when set
if [ "${ENABLE_ALL}" = "true" ]; then
    ENABLE_API="true"
    ENABLE_WORKER="true"
    ENABLE_AUDIT="true"
    ENABLE_BATCH="true"
fi

ENABLE_API="${ENABLE_API:-true}"
ENABLE_WORKER="${ENABLE_WORKER:-true}"
ENABLE_AUDIT="${ENABLE_AUDIT:-true}"
ENABLE_BATCH="${ENABLE_BATCH:-false}"

echo "Starting Holo services (api=$ENABLE_API worker=$ENABLE_WORKER audit=$ENABLE_AUDIT batch=$ENABLE_BATCH mode=${BUILD_MODE:-prod})..."

if [ "$ENABLE_API" = "true" ]; then
    echo "Starting API server..."
    node src/app.ts &
    API_PID=$!
fi

if [ "$ENABLE_WORKER" = "true" ]; then
    echo "Starting Worker server..."
    node src/servers/worker.server.ts &
    WORKER_PID=$!
fi

if [ "$ENABLE_AUDIT" = "true" ]; then
    echo "Starting Audit server..."
    node src/servers/audit.server.ts &
    AUDIT_PID=$!
fi

if [ "$ENABLE_BATCH" = "true" ]; then
    echo "Starting Batch server..."
    node src/servers/batch.server.ts &
    BATCH_PID=$!
fi

echo "Services started: API=${API_PID:-off} Worker=${WORKER_PID:-off} Audit=${AUDIT_PID:-off} Batch=${BATCH_PID:-off}"

wait -n
echo "A service stopped. Shutting down..."
cleanup
