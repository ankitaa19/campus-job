#!/bin/bash
set -e

# Azure App Service startup script for CampusPe API
echo "=== CampusPe API Service Startup ==="
echo "Timestamp: $(date)"

# Determine working directory
WORK_DIR=""
if [ -d "/home/site/wwwroot/apps/api" ]; then
    WORK_DIR="/home/site/wwwroot/apps/api"
    echo "Found monorepo structure, using apps/api directory"
elif [ -d "/home/site/wwwroot" ]; then
    WORK_DIR="/home/site/wwwroot"
    echo "Using root directory"
else
    # Fallback for local development
    WORK_DIR="$(dirname "$0")"
    echo "Using script directory for local development"
fi

cd "$WORK_DIR"
echo "Working directory: $(pwd)"

# Set environment variables for Azure
export PORT="${PORT:-8080}"
export HOST="${HOST:-0.0.0.0}"
export NODE_ENV="${NODE_ENV:-production}"

echo "Environment Configuration:"
echo "  PORT: $PORT"
echo "  HOST: $HOST"
echo "  NODE_ENV: $NODE_ENV"
echo "  Node.js: $(node --version)"
echo "  NPM: $(npm --version)"

# List current directory contents for debugging
echo "Directory contents:"
ls -la
echo "Starting CampusPe API server..."
if [ -f "server.js" ]; then
    node server.js
elif [ -f "dist/app.js" ]; then
    node dist/app.js
else
    echo "❌ No server entry point found (server.js or dist/app.js missing)"
    exit 1
fi
# Verify package.json exists and has content
if [ ! -f "package.json" ]; then
    echo "❌ package.json not found!"
    exit 1
fi

# Check if package.json has content
if [ ! -s "package.json" ]; then
    echo "❌ package.json is empty!"
    exit 1
fi

echo "✅ package.json found and has content"

# Install dependencies (production only for Azure)
echo "Installing dependencies..."
if [ "$NODE_ENV" = "production" ]; then
    npm ci --only=production --no-audit --no-fund
else
    npm install
fi

# Check if TypeScript source exists
if [ ! -d "src" ]; then
    echo "❌ Source directory 'src' not found!"
    exit 1
fi

# Build TypeScript to JavaScript
echo "Building TypeScript application..."
# Build TypeScript to JavaScript
echo "Building TypeScript application..."
if [ -f "tsconfig.json" ]; then
    npm run build
    echo "✅ TypeScript build completed"
else
    echo "❌ tsconfig.json not found!"
    exit 1
fi

# Verify build output
if [ ! -f "dist/app.js" ]; then
    echo "❌ Build failed! dist/app.js not found"
    echo "Contents of dist directory:"
    ls -la dist/ 2>/dev/null || echo "dist directory doesn't exist"
    exit 1
fi

echo "✅ Build verification successful"
echo "✅ Application ready to start"

# Start the application
echo "🚀 Starting CampusPe API Application..."
echo "📁 Entry point: dist/app.js"
echo "🌐 Listening on: http://$HOST:$PORT"

# Use exec to replace the shell process with node
# This ensures proper signal handling in Azure
exec node dist/app.js
