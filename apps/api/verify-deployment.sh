#!/bin/bash
set -e

echo "=== CampusPe API Deployment Verification ==="

# Check if we're in the correct directory
if [ ! -f "package.json" ]; then
    echo "❌ package.json not found. Are you in the right directory?"
    exit 1
fi

echo "✅ Found package.json"

# Check if dist directory exists
if [ ! -d "dist" ]; then
    echo "❌ dist directory not found. Building..."
    npm run build
else
    echo "✅ dist directory exists"
fi

# Check if main entry file exists
if [ ! -f "dist/app.js" ]; then
    echo "❌ dist/app.js not found. Building..."
    npm run build
fi

if [ -f "dist/app.js" ]; then
    echo "✅ dist/app.js exists"
else
    echo "❌ Failed to create dist/app.js"
    exit 1
fi

# Check Node.js version
echo "Node.js version: $(node --version)"
echo "NPM version: $(npm --version)"

# Check if all dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "❌ node_modules not found. Installing..."
    npm install
else
    echo "✅ node_modules exists"
fi

# Test if the app can start
echo "Testing application startup..."
PORT=5999 timeout 10s node dist/app.js &
PID=$!
sleep 5

if kill -0 $PID 2>/dev/null; then
    echo "✅ Application started successfully"
    kill $PID
    wait $PID 2>/dev/null || true
else
    echo "❌ Application failed to start"
    exit 1
fi

echo "🎉 Deployment verification completed successfully!"
