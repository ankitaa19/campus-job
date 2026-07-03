#!/bin/bash
set -e

echo "🔧 Azure Pre-build Script for CampusPe API"
echo "==========================================="

# Show current working directory
echo "📍 Current directory: $(pwd)"

# Show directory contents
echo "📁 Directory contents:"
ls -la

# Check if we're in the right place (should have package.json and tsconfig.json)
if [ ! -f "package.json" ]; then
    echo "❌ package.json not found in $(pwd)"
    echo "📂 Looking for package.json in subdirectories..."
    find . -name "package.json" -type f | head -5
    exit 1
fi

if [ ! -f "tsconfig.json" ]; then
    echo "❌ tsconfig.json not found in $(pwd)"
    echo "📂 Looking for tsconfig.json in subdirectories..."
    find . -name "tsconfig.json" -type f | head -5
    exit 1
fi

echo "✅ Found required files in $(pwd)"
echo "✅ Pre-build script completed successfully"
