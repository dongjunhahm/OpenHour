#!/bin/bash

# Run database initialization first
echo "Initializing database..."
node render-init-db.js

# Start the Next.js application
echo "Starting Next.js application..."
npm start
