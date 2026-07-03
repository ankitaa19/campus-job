#!/bin/bash
set -e

echo "=== Azure App Service CampusPe API Startup ==="

# Check if we're in Azure environment
if [ -n "$WEBSITE_SITE_NAME" ]; then
    echo "Running in Azure App Service: $WEBSITE_SITE_NAME"
    
    # Install dependencies if node_modules doesn't exist
    if [ ! -d "node_modules" ]; then
        echo "Installing dependencies..."
        npm ci --only=production
    fi
    
    # Build TypeScript if dist doesn't exist or is empty
    if [ ! -d "dist" ] || [ -z "$(ls -A dist)" ]; then
        echo "Building TypeScript..."
        npm run build
    fi
    
    # Start the application
    echo "Starting CampusPe API..."
    exec npm start
else
    echo "Running in development environment"
    # For local development
    npm install
    npm run build
    npm start
fi
