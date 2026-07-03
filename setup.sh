#!/bin/bash

# Quick setup script for CampusPe development
echo "🚀 Setting up CampusPe development environment..."

# Install root dependencies
echo "📦 Installing root dependencies..."
npm install

# Install API dependencies
echo "🔧 Installing API dependencies..."
cd apps/api && npm install && cd ../..

# Install Web dependencies
echo "🌐 Installing Web dependencies..."
cd apps/web && npm install && cd ../..

# Build API
echo "🔨 Building API..."
cd apps/api && npm run build && cd ../..

echo "✅ Setup complete!"
echo ""
echo "📝 Next steps:"
echo "1. Copy apps/api/.env.azure to apps/api/.env and update with your values"
echo "2. Copy apps/web/.env.azure to apps/web/.env and update with your values"
echo "3. Run 'npm run dev' to start development servers"
echo ""
echo "🚀 For Azure deployment, follow the AZURE_DEPLOYMENT_GUIDE.md"
