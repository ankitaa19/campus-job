#!/bin/bash

# Post-build script for Azure deployment
set -e

echo "=== Post-Build Script Starting ==="

# Navigate to API directory
cd apps/api

# Ensure TypeScript is compiled
if [ ! -d "dist" ]; then
    echo "Building TypeScript project..."
    npm run build
else
    echo "✅ Build directory already exists"
fi

# Check required files exist
echo "Checking build artifacts..."
if [ -f "dist/app.js" ]; then
    echo "✅ Main application file found: dist/app.js"
else
    echo "❌ Main application file missing: dist/app.js"
    ls -la dist/ || echo "dist directory not found"
    exit 1
fi

echo "=== Post-Build Script Completed Successfully ==="
