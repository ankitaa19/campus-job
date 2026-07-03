#!/bin/bash

# CampusPe Playwright PDF Service - Azure Web App Deployment
# This deploys directly to Azure Web App without Docker

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
RESOURCE_GROUP="rg-campuspe-pdf"
APP_NAME="campuspe-playwright-pdf"
APP_SERVICE_PLAN="asp-campuspe-pdf"
LOCATION="southindia"
RUNTIME="NODE:20-lts"

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
    
    log_success "Prerequisites check passed"
}

create_app_service() {
    log_info "Creating App Service Plan..."
    
    # Create App Service Plan
    az appservice plan create \
        --name $APP_SERVICE_PLAN \
        --resource-group $RESOURCE_GROUP \
        --sku F1 \
        --is-linux
    
    log_success "App Service Plan created"
    
    # Create Web App
    log_info "Creating Web App..."
    az webapp create \
        --name $APP_NAME \
        --resource-group $RESOURCE_GROUP \
        --plan $APP_SERVICE_PLAN \
        --runtime "$RUNTIME"
    
    log_success "Web App created"
}

configure_app_settings() {
    log_info "Configuring app settings..."
    
    # Set app settings
    az webapp config appsettings set \
        --name $APP_NAME \
        --resource-group $RESOURCE_GROUP \
        --settings \
            NODE_ENV=production \
            WEBSITES_NODE_DEFAULT_VERSION=20-lts \
            SCM_DO_BUILD_DURING_DEPLOYMENT=true \
            PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=false
    
    log_success "App settings configured"
}

deploy_code() {
    log_info "Deploying application code..."
    
    cd playwright-pdf-service
    
    # Create a deployment package
    zip -r ../playwright-service.zip . -x "node_modules/*" "*.log"
    
    cd ..
    
    # Deploy using zip
    az webapp deployment source config-zip \
        --name $APP_NAME \
        --resource-group $RESOURCE_GROUP \
        --src playwright-service.zip
    
    log_success "Code deployed"
    
    # Clean up
    rm -f playwright-service.zip
}

get_app_url() {
    # Get the app URL
    APP_URL=$(az webapp show \
        --name $APP_NAME \
        --resource-group $RESOURCE_GROUP \
        --query defaultHostName \
        --output tsv)
    
    log_success "Deployment completed!"
    log_success "Service URL: https://$APP_URL"
    log_success "Health Check: https://$APP_URL/health"
    log_success "PDF Generation: https://$APP_URL/generate-pdf"
    
    # Save the URL for later use
    echo "PLAYWRIGHT_PDF_SERVICE_URL=https://$APP_URL" > playwright-service-url.txt
    log_info "Service URL saved to playwright-service-url.txt"
}

cleanup() {
    log_warning "Cleaning up existing deployment..."
    
    # Delete existing web app if it exists
    if az webapp show --name $APP_NAME --resource-group $RESOURCE_GROUP &> /dev/null; then
        az webapp delete \
            --name $APP_NAME \
            --resource-group $RESOURCE_GROUP
        log_success "Existing web app deleted"
    fi
    
    # Delete existing app service plan if it exists
    if az appservice plan show --name $APP_SERVICE_PLAN --resource-group $RESOURCE_GROUP &> /dev/null; then
        az appservice plan delete \
            --name $APP_SERVICE_PLAN \
            --resource-group $RESOURCE_GROUP
        log_success "Existing app service plan deleted"
    fi
}

# Main deployment function
deploy() {
    echo -e "${BLUE}🚀 CampusPe Playwright PDF Service - Azure Web App Deployment${NC}"
    echo "=================================================================="
    
    check_prerequisites
    cleanup
    create_app_service
    configure_app_settings
    deploy_code
    get_app_url
    
    echo ""
    echo -e "${GREEN}🎉 Deployment Complete!${NC}"
    echo -e "${BLUE}Next steps:${NC}"
    echo "1. Wait for the app to start (may take a few minutes)"
    echo "2. Test the service: curl https://$APP_URL/health"
    echo "3. Update your API environment variables with the new URL"
    echo "4. Test PDF generation with the new service"
    echo ""
    echo -e "${YELLOW}Note: The first request may take longer as Playwright installs browsers.${NC}"
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
        echo "  deploy   - Deploy the Playwright PDF service to Azure Web App"
        echo "  cleanup  - Remove the existing deployment"
        exit 1
        ;;
esac
