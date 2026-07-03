#!/bin/bash
set -e

# Azure App Service startup script for CampusPe Web
echo "=== CampusPe Web Service Startup ==="

# Ensure we run from the script's directory
cd "$(dirname "$0")"

# Set environment variables for Azure
export PORT="${PORT:-8080}"
export HOST="${HOST:-0.0.0.0}"
export NODE_ENV=production

echo "Environment: PORT=$PORT, HOST=$HOST, NODE_ENV=$NODE_ENV"
echo "Working directory: $(pwd)"
echo "Process: PID=$$, Node=$(node --version)"

# Check for required files
echo "Checking required files..."

echo "package.json: $([ -f \"package.json\" ] && echo \"✅ EXISTS\" || echo \"❌ MISSING\")"
echo "server-azure.js: $([ -f \"server-azure.js\" ] && echo \"✅ EXISTS\" || echo \"❌ MISSING\")"

# Verify required dependencies and build artifacts
if [ ! -d "node_modules/next" ]; then
    echo "❌ Missing dependency: node_modules/next. Ensure dependencies are installed before deployment."
    exit 1
fi

echo ".next directory: $([ -d ".next" ] && echo "✅ EXISTS" || echo "❌ MISSING")"
echo "package.json: $([ -f "package.json" ] && echo "✅ EXISTS" || echo "❌ MISSING")"
echo "server-azure.js: $([ -f "server-azure.js" ] && echo "✅ EXISTS" || echo "❌ MISSING")"

# Install dependencies if missing
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies (including dev)..."
    npm ci --include=dev
else
    echo "Dependencies already installed"
fi

echo "Starting CampusPe Web server..."
if [ -f "server-azure.js" ]; then
    node server-azure.js
else
    echo "❌ No server entry point found (server-azure.js missing)"
    exit 1
fi

if [ ! -d ".next" ]; then
    echo "❌ Missing build artifacts: .next directory. Run 'npm run build' before deploying."
    exit 1
fi
if [ ! -d ".next" ]; then
    echo "❌ Next.js build not found! Attempting to build..."
    npm run build
    if [ ! -d ".next" ]; then
        echo "❌ Build failed to produce .next directory."
        exit 1
    fi
else
    echo "✅ Next.js build found"
fi

echo "✅ Dependencies and build artifacts present"

# Start the application
echo "Starting CampusPe Web Application..."

# Use exec to replace the shell process
exec node server-azure.js
