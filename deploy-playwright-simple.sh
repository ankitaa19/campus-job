#!/bin/bash

# CampusPe Playwright PDF Service - Simple Deployment
# This deploys directly to Azure Container Instances using Docker Hub

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
RESOURCE_GROUP="rg-campuspe-pdf"
CONTAINER_NAME="campuspe-playwright-pdf"
IMAGE_NAME="campuspe/playwright-pdf"
LOCATION="southindia"

# Functions
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

check_prerequisites() {
    log_info "Checking prerequisites..."
    
    if ! command -v az &> /dev/null; then
        log_error "Azure CLI is not installed"
        exit 1
    fi
    
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed"
        exit 1
    fi
    
    if ! docker info &> /dev/null; then
        log_error "Docker is not running. Please start Docker first."
        exit 1
    fi
    
    log_success "Prerequisites check passed"
}

build_and_push_to_dockerhub() {
    log_info "Building Docker image..."
    
    cd playwright-pdf-service
    
    # Build the image using minimal Dockerfile
    docker build -f Dockerfile.minimal -t $IMAGE_NAME:latest .
    
    log_success "Docker image built successfully"
    
    # Note: For Docker Hub, you would need to login and push
    # For this demo, we'll use the local image
    log_warning "For production, push to Docker Hub: docker push $IMAGE_NAME:latest"
}

deploy_to_azure() {
    log_info "Deploying to Azure Container Instances..."
    
    # Create the container instance
    az container create \
        --resource-group $RESOURCE_GROUP \
        --name $CONTAINER_NAME \
        --image $IMAGE_NAME:latest \
        --cpu 1 \
        --memory 2 \
        --port 3000 \
        --ip-address Public \
        --environment-variables NODE_ENV=production \
        --restart-policy Always
    
    # Get the IP address
    IP_ADDRESS=$(az container show \
        --resource-group $RESOURCE_GROUP \
        --name $CONTAINER_NAME \
        --query ipAddress.ip \
        --output tsv)
    
    log_success "Deployment completed!"
    log_success "Service URL: http://$IP_ADDRESS:3000"
    log_success "Health Check: http://$IP_ADDRESS:3000/health"
    log_success "PDF Generation: http://$IP_ADDRESS:3000/generate-pdf"
    
    # Save the URL for later use
    echo "PLAYWRIGHT_PDF_SERVICE_URL=http://$IP_ADDRESS:3000" > playwright-service-url.txt
    log_info "Service URL saved to playwright-service-url.txt"
}

cleanup() {
    log_warning "Cleaning up existing deployment..."
    
    # Delete existing container if it exists
    if az container show --resource-group $RESOURCE_GROUP --name $CONTAINER_NAME &> /dev/null; then
        az container delete \
            --resource-group $RESOURCE_GROUP \
            --name $CONTAINER_NAME \
            --yes
        log_success "Existing container deleted"
    fi
}

# Main deployment function
deploy() {
    echo -e "${BLUE}🚀 CampusPe Playwright PDF Service - Simple Deployment${NC}"
    echo "============================================================"
    
    check_prerequisites
    cleanup
    build_and_push_to_dockerhub
    deploy_to_azure
    
    echo ""
    echo -e "${GREEN}🎉 Deployment Complete!${NC}"
    echo -e "${BLUE}Next steps:${NC}"
    echo "1. Test the service: curl http://$IP_ADDRESS:3000/health"
    echo "2. Update your API environment variables with the new URL"
    echo "3. Test PDF generation with the new service"
}

# Check command line arguments
case "${1:-help}" in
    "deploy")
        deploy
        ;;
    "cleanup")
        cleanup
        ;;
    *)
        echo "Usage: $0 [deploy|cleanup]"
        echo ""
        echo "Commands:"
        echo "  deploy   - Deploy the Playwright PDF service to Azure"
        echo "  cleanup  - Remove the existing deployment"
        exit 1
        ;;
esac
