#!/bin/bash

# CampusPe Playwright PDF Service - Azure Deployment Script
# This script helps you deploy the Playwright PDF service to Azure Container Instances

set -e

# Configuration
RESOURCE_GROUP="rg-campuspe-pdf"
CONTAINER_NAME="campuspe-pdf-service"
LOCATION="southindia"
DNS_NAME="campuspe-pdf"
IMAGE_NAME="campuspe/pdf-service"
REGISTRY_NAME="campuspepdf"

echo "🚀 CampusPe Playwright PDF Service Deployment"
echo "============================================="

# Check if Azure CLI is installed
if ! command -v az &> /dev/null; then
    echo "❌ Azure CLI is not installed. Please install it first:"
    echo "   https://docs.microsoft.com/en-us/cli/azure/install-azure-cli"
    exit 1
fi

# Check if logged in to Azure
if ! az account show &> /dev/null; then
    echo "🔑 Please log in to Azure first:"
    az login
fi

echo "✅ Azure CLI is ready"

# Function to create resource group
create_resource_group() {
    echo "📦 Creating resource group: $RESOURCE_GROUP"
    az group create \
        --name $RESOURCE_GROUP \
        --location $LOCATION \
        --output table
    echo "✅ Resource group created"
}

# Function to create Azure Container Registry
create_container_registry() {
    echo "🏗️ Creating Azure Container Registry: $REGISTRY_NAME"
    az acr create \
        --resource-group $RESOURCE_GROUP \
        --name $REGISTRY_NAME \
        --sku Basic \
        --admin-enabled true \
        --output table
    echo "✅ Container Registry created"
}

# Function to build and push Docker image
build_and_push_image() {
    echo "🔨 Building and pushing Docker image..."
    
    # Get ACR login server
    ACR_LOGIN_SERVER=$(az acr show --name $REGISTRY_NAME --resource-group $RESOURCE_GROUP --query "loginServer" --output tsv)
    
    # Log in to ACR
    az acr login --name $REGISTRY_NAME
    
    # Build image locally
    echo "🔨 Building Docker image..."
    docker build -t $IMAGE_NAME:latest ./playwright-pdf-service/
    
    # Tag for ACR
    docker tag $IMAGE_NAME:latest $ACR_LOGIN_SERVER/$IMAGE_NAME:latest
    
    # Push to ACR
    echo "📤 Pushing to Azure Container Registry..."
    docker push $ACR_LOGIN_SERVER/$IMAGE_NAME:latest
    
    echo "✅ Image pushed to ACR: $ACR_LOGIN_SERVER/$IMAGE_NAME:latest"
}

# Function to deploy container instance
deploy_container_instance() {
    echo "🚀 Deploying Container Instance..."
    
    # Get ACR credentials
    ACR_LOGIN_SERVER=$(az acr show --name $REGISTRY_NAME --resource-group $RESOURCE_GROUP --query "loginServer" --output tsv)
    ACR_USERNAME=$(az acr credential show --name $REGISTRY_NAME --resource-group $RESOURCE_GROUP --query "username" --output tsv)
    ACR_PASSWORD=$(az acr credential show --name $REGISTRY_NAME --resource-group $RESOURCE_GROUP --query "passwords[0].value" --output tsv)
    
    # Deploy container instance
    az container create \
        --resource-group $RESOURCE_GROUP \
        --name $CONTAINER_NAME \
        --image $ACR_LOGIN_SERVER/$IMAGE_NAME:latest \
        --registry-login-server $ACR_LOGIN_SERVER \
        --registry-username $ACR_USERNAME \
        --registry-password $ACR_PASSWORD \
        --dns-name-label $DNS_NAME \
        --ports 3000 \
        --memory 3 \
        --cpu 2 \
        --environment-variables \
            NODE_ENV=production \
            PORT=3000 \
        --restart-policy Always \
        --output table
    
    echo "✅ Container instance deployed"
}

# Function to get deployment info
get_deployment_info() {
    echo "📊 Getting deployment information..."
    
    # Get container instance details
    FQDN=$(az container show --resource-group $RESOURCE_GROUP --name $CONTAINER_NAME --query "ipAddress.fqdn" --output tsv)
    IP=$(az container show --resource-group $RESOURCE_GROUP --name $CONTAINER_NAME --query "ipAddress.ip" --output tsv)
    STATE=$(az container show --resource-group $RESOURCE_GROUP --name $CONTAINER_NAME --query "instanceView.state" --output tsv)
    
    echo ""
    echo "🎉 Deployment Complete!"
    echo "======================="
    echo "📍 Resource Group: $RESOURCE_GROUP"
    echo "🐳 Container Name: $CONTAINER_NAME"
    echo "🌐 FQDN: $FQDN"
    echo "🔗 IP Address: $IP"
    echo "📊 State: $STATE"
    echo ""
    echo "🔗 Service URLs:"
    echo "   Health Check: https://$FQDN:3000/health"
    echo "   Test Endpoint: https://$FQDN:3000/test"
    echo ""
    echo "🔧 Update your environment variable:"
    echo "   PLAYWRIGHT_PDF_SERVICE_URL=https://$FQDN:3000"
    echo ""
}

# Function to test deployment
test_deployment() {
    echo "🧪 Testing deployment..."
    
    FQDN=$(az container show --resource-group $RESOURCE_GROUP --name $CONTAINER_NAME --query "ipAddress.fqdn" --output tsv)
    
    echo "🏥 Testing health endpoint..."
    if curl -f "https://$FQDN:3000/health" > /dev/null 2>&1; then
        echo "✅ Health check passed"
    else
        echo "❌ Health check failed"
        echo "📋 Container logs:"
        az container logs --resource-group $RESOURCE_GROUP --name $CONTAINER_NAME
    fi
}

# Function to show logs
show_logs() {
    echo "📋 Container logs:"
    az container logs --resource-group $RESOURCE_GROUP --name $CONTAINER_NAME
}

# Function to cleanup deployment
cleanup() {
    echo "🧹 Cleaning up deployment..."
    read -p "Are you sure you want to delete all resources? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "🗑️ Deleting resource group: $RESOURCE_GROUP"
        az group delete --name $RESOURCE_GROUP --yes --no-wait
        echo "✅ Cleanup initiated"
    else
        echo "❌ Cleanup cancelled"
    fi
}

# Main deployment function
deploy() {
    echo "🚀 Starting full deployment..."
    
    # Check if Docker is running
    if ! docker info > /dev/null 2>&1; then
        echo "❌ Docker is not running. Please start Docker first."
        exit 1
    fi
    
    create_resource_group
    create_container_registry
    build_and_push_image
    deploy_container_instance
    
    # Wait for container to start
    echo "⏳ Waiting for container to start..."
    sleep 30
    
    get_deployment_info
    test_deployment
    
    echo ""
    echo "🎉 Deployment completed successfully!"
    echo "📝 Next steps:"
    echo "   1. Update your API environment variables"
    echo "   2. Test the service with your resume builder"
    echo "   3. Monitor the container performance"
}

# Command line interface
case "${1:-deploy}" in
    "deploy")
        deploy
        ;;
    "info")
        get_deployment_info
        ;;
    "logs")
        show_logs
        ;;
    "test")
        test_deployment
        ;;
    "cleanup")
        cleanup
        ;;
    "help")
        echo "Usage: $0 [command]"
        echo ""
        echo "Commands:"
        echo "  deploy   - Full deployment (default)"
        echo "  info     - Show deployment information"
        echo "  logs     - Show container logs"
        echo "  test     - Test the deployment"
        echo "  cleanup  - Delete all resources"
        echo "  help     - Show this help"
        ;;
    *)
        echo "❌ Unknown command: $1"
        echo "Use '$0 help' for usage information"
        exit 1
        ;;
esac
