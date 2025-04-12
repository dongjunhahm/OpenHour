#!/bin/bash
# Render startup script

# Set error handling
set -e

# Log startup time
echo "Starting OpenHour application at $(date)"

# Verify Node.js version
echo "Node version: $(node -v)"
echo "NPM version: $(npm -v)"

# Run database initialization and wait for it to complete
echo "Initializing database..."
node render-init-db.js

# Wait a moment to ensure database connections are established
echo "Waiting for database connections to stabilize..."
sleep 5

# Start the Next.js application
echo "Starting Next.js application..."
exec npm start
