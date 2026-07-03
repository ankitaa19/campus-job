# Azure Container Instance Deployment
# Deploy PDF generation service to Azure Container Instances

# Resource group (use existing or create new)
RESOURCE_GROUP="campuspe-staging-rg"
LOCATION="southindia"

# Container instance configuration
ACI_NAME="campuspe-pdf-service"
IMAGE_NAME="campuspe-pdf-service"
REGISTRY_NAME="campuspestaging"  # Update with your Azure Container Registry

# Build and push image to Azure Container Registry
echo "🏗️  Building and pushing Docker image..."

# Login to Azure Container Registry
az acr login --name $REGISTRY_NAME

# Build and push image
docker build -t $REGISTRY_NAME.azurecr.io/$IMAGE_NAME:latest .
docker push $REGISTRY_NAME.azurecr.io/$IMAGE_NAME:latest

# Create container instance
echo "🚀 Creating Azure Container Instance..."

az container create \
  --resource-group $RESOURCE_GROUP \
  --name $ACI_NAME \
  --image $REGISTRY_NAME.azurecr.io/$IMAGE_NAME:latest \
  --registry-login-server $REGISTRY_NAME.azurecr.io \
  --registry-username $REGISTRY_NAME \
  --registry-password $(az acr credential show --name $REGISTRY_NAME --query "passwords[0].value" -o tsv) \
  --dns-name-label $ACI_NAME \
  --ports 3000 \
  --cpu 1 \
  --memory 2 \
  --restart-policy OnFailure \
  --environment-variables \
    NODE_ENV=production \
    PORT=3000 \
  --ip-address public

# Get the public IP/URL
echo "✅ Container instance created!"
echo "🌐 Service URL: http://$ACI_NAME.$LOCATION.azurecontainer.io:3000"
echo "📊 Health check: http://$ACI_NAME.$LOCATION.azurecontainer.io:3000/health"
