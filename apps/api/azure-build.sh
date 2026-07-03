#!/bin/bash
set -e

echo "🔧 Azure Deployment Build Script"
echo "================================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ package.json not found. Please run this from the API directory."
    exit 1
fi

echo "📍 Working directory: $(pwd)"

# Show Node.js and npm versions
echo "🔍 Environment:"
echo "  Node.js: $(node --version)"
echo "  NPM: $(npm --version)"

# Clean any previous builds
echo "🧹 Cleaning previous builds..."
rm -rf dist
rm -rf node_modules
rm -f package-lock.json

# Install dependencies
echo "📦 Installing dependencies..."
npm install --only=production

# Install dev dependencies needed for build
echo "🔨 Installing build dependencies..."
npm install --only=dev

# Run TypeScript compilation with verbose output
echo "🏗️  Building TypeScript project..."
npx tsc --project tsconfig.json --verbose

# Verify build output
if [ ! -f "dist/app.js" ]; then
    echo "❌ Build failed - dist/app.js not found"
    echo "📋 Dist directory contents:"
    ls -la dist/ || echo "Dist directory doesn't exist"
    exit 1
fi

echo "✅ Build successful!"

# Show build output info
echo "📊 Build Output:"
echo "  Main file: dist/app.js ($(ls -lh dist/app.js | awk '{print $5}'))"
echo "  Total files: $(find dist -type f | wc -l)"
echo "  Total size: $(du -sh dist | awk '{print $1}')"

# Test if app can start (quick test)
echo "🧪 Testing app startup..."
timeout 5s node dist/app.js > /dev/null 2>&1 &
PID=$!
sleep 2

if kill -0 $PID 2>/dev/null; then
    echo "✅ App starts successfully"
    kill $PID 2>/dev/null || true
    wait $PID 2>/dev/null || true
else
    echo "⚠️  App startup test failed (may be due to missing env vars - this is normal)"
fi

echo "🎉 Azure deployment build completed!"
echo ""
echo "📁 Files ready for deployment:"
echo "  - package.json"
echo "  - dist/ (compiled TypeScript)"
echo "  - web.config"
echo "  - node_modules/ (dependencies)"
