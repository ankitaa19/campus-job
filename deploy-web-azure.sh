#!/bin/bash

# CampusPe Web App Azure Deployment Script
echo "🚀 Starting CampusPe Web App deployment to Azure..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Azure App Service details
WEB_APP_NAME="campuspe-web-staging-erd8dvb3ewcjc5g2"
RESOURCE_GROUP="campuspe-staging-rg"

# Check if Azure CLI is installed
if ! command -v az &> /dev/null; then
    echo -e "${RED}❌ Azure CLI is not installed. Please install it first.${NC}"
    echo "Install instructions: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli"
    exit 1
fi

# Check if logged in to Azure
if ! az account show &> /dev/null; then
    echo -e "${YELLOW}⚠️  Not logged in to Azure. Please login first.${NC}"
    echo "Run: az login"
    exit 1
fi

# Navigate to web app directory
cd apps/web || {
    echo -e "${RED}❌ Failed to navigate to apps/web directory${NC}"
    exit 1
}

echo -e "${GREEN}📁 Current directory: $(pwd)${NC}"

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 Installing dependencies...${NC}"
    npm install
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Failed to install dependencies${NC}"
        exit 1
    fi
fi

# Build the application
echo -e "${YELLOW}🔨 Building Next.js application...${NC}"
npm run build
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Build failed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Build completed successfully${NC}"

# Verify build artifacts
if [ ! -f ".next/BUILD_ID" ]; then
    echo -e "${RED}❌ Build artifacts not found${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Build artifacts verified${NC}"

# Create deployment package
echo -e "${YELLOW}📦 Creating deployment package...${NC}"

# Create a temporary directory for the deployment package
TEMP_DIR=$(mktemp -d)
echo "Temporary directory: $TEMP_DIR"

# Copy necessary files for deployment
cp -r .next "$TEMP_DIR/"
cp -r public "$TEMP_DIR/"
cp -r node_modules "$TEMP_DIR/"
cp package.json "$TEMP_DIR/"
cp package-lock.json "$TEMP_DIR/"
cp server-azure.js "$TEMP_DIR/"
cp startup.js "$TEMP_DIR/"
cp web.config "$TEMP_DIR/"

# Remove dev dependencies from copied node_modules to reduce size
cd "$TEMP_DIR"
npm prune --production
cd - > /dev/null

# Create zip file
echo -e "${YELLOW}🗜️  Creating ZIP file...${NC}"
cd "$TEMP_DIR"
zip -r ../deployment.zip . -x "*.DS_Store*" "*.git*"
cd - > /dev/null

# Deploy to Azure
echo -e "${YELLOW}🚀 Deploying to Azure App Service...${NC}"
az webapp deployment source config-zip \
    --resource-group "$RESOURCE_GROUP" \
    --name "$WEB_APP_NAME" \
    --src "$TEMP_DIR/../deployment.zip"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Deployment successful!${NC}"
    echo -e "${GREEN}🌐 Your app should be available at: https://$WEB_APP_NAME.azurewebsites.net${NC}"
    
    # Wait a moment and test the endpoint
    echo -e "${YELLOW}⏳ Waiting for app to start...${NC}"
    sleep 10
    
    echo -e "${YELLOW}🔍 Testing deployment...${NC}"
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "https://$WEB_APP_NAME.azurewebsites.net")
    
    if [ "$HTTP_STATUS" = "200" ]; then
        echo -e "${GREEN}✅ App is responding correctly!${NC}"
    else
        echo -e "${YELLOW}⚠️  App returned status code: $HTTP_STATUS${NC}"
        echo -e "${YELLOW}💡 Check Azure App Service logs for more details${NC}"
    fi
else
    echo -e "${RED}❌ Deployment failed${NC}"
    exit 1
fi

# Clean up
echo -e "${YELLOW}🧹 Cleaning up temporary files...${NC}"
rm -rf "$TEMP_DIR"
rm -f "$TEMP_DIR/../deployment.zip"

echo -e "${GREEN}🎉 Deployment process completed!${NC}"
