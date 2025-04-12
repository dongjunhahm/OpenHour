#!/bin/bash
# Render startup script

# Set error handling
set -e

# Log startup time
echo "Starting OpenHour application at $(date)"

# Verify Node.js version
echo "Node version: $(node -v)"
echo "NPM version: $(npm -v)"

# Ensure database initialization script exists
if [ -f "./render-init-db.js" ]; then
  # Run the database initialization (non-blocking)
  echo "Initializing database in the background..."
  node render-init-db.js &
else
  echo "Warning: Database initialization script not found"
fi

# Start the Next.js application
echo "Starting Next.js application..."
exec npm start
