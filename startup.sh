#!/bin/bash
set -e

echo "=== CampusPe Platform Startup ==="
echo "Current directory: $(pwd)"
echo "Directory contents:"
ls -la

# Check if we're in a monorepo structure
if [ -d "apps/api" ]; then
    echo "Found monorepo structure, navigating to API directory"
    cd apps/api
    
    # Install production dependencies
    if [ ! -d "node_modules" ]; then
        echo "Installing production dependencies..."
        npm install --only=production
    fi
    
    # Check if startup script exists
    if [ -f "startup.sh" ]; then
        echo "Found API startup script, executing..."
        chmod +x startup.sh
        exec ./startup.sh
    else
        echo "No startup script found, starting directly..."
        exec node dist/app.js
    fi
else
    echo "Not in monorepo structure, trying direct start..."
    exec node dist/app.js
fi
