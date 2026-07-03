# CampusPe Playwright PDF Service

High-quality PDF generation service using Playwright for CampusPe resume builder.

## Features

- 🎭 **Playwright-powered**: Uses Playwright Chromium for high-quality PDF generation
- 🚀 **High Performance**: Optimized for Azure deployment with browser reuse
- 🔒 **Secure**: Runs with non-root user and security best practices
- 📊 **Monitoring**: Built-in health checks and logging
- 🐳 **Containerized**: Docker-ready for easy deployment
- ☁️ **Azure-optimized**: Configured for Azure Container Instances

## API Endpoints

### Health Check

```bash
GET /health
```

### Generate PDF from HTML

```bash
POST /generate-pdf
Content-Type: application/json

{
  "html": "<html>...</html>",
  "options": {
    "format": "A4",
    "printBackground": true,
    "margin": {
      "top": "20px",
      "right": "20px",
      "bottom": "20px",
      "left": "20px"
    }
  }
}
```

### Generate PDF from URL

```bash
POST /generate-pdf-from-url
Content-Type: application/json

{
  "url": "https://example.com",
  "options": {
    "format": "A4",
    "printBackground": true
  }
}
```

### Test Endpoint

```bash
GET /test
```

## Local Development

1. **Install Dependencies**

```bash
npm install
npm run install-playwright
```

2. **Start Development Server**

```bash
npm run dev
```

3. **Test the Service**

```bash
curl http://localhost:3000/health
curl http://localhost:3000/test
```

## Docker Deployment

1. **Build Docker Image**

```bash
docker build -t campuspe-pdf-service .
```

2. **Run Container**

```bash
docker run -p 3000:3000 campuspe-pdf-service
```

3. **Test Container**

```bash
curl http://localhost:3000/health
```

## Azure Container Instance Deployment

### Method 1: Azure CLI

```bash
# Create resource group (if not exists)
az group create --name rg-campuspe-pdf --location southindia

# Create container instance
az container create \
  --resource-group rg-campuspe-pdf \
  --name campuspe-pdf-service \
  --image campuspe/pdf-service:latest \
  --dns-name-label campuspe-pdf \
  --ports 3000 \
  --memory 2 \
  --cpu 1 \
  --environment-variables \
    NODE_ENV=production \
    PORT=3000
```

### Method 2: Azure Portal

1. Go to Azure Portal → Container Instances
2. Click "Create"
3. Fill in:
   - **Resource Group**: rg-campuspe-pdf
   - **Container Name**: campuspe-pdf-service
   - **Image Source**: Docker Hub or Azure Container Registry
   - **Image**: campuspe/pdf-service:latest
   - **DNS Name**: campuspe-pdf
   - **Port**: 3000
   - **Memory**: 2 GB
   - **CPU**: 1 core

## Environment Variables

| Variable   | Description | Default       |
| ---------- | ----------- | ------------- |
| `PORT`     | Server port | `3000`        |
| `NODE_ENV` | Environment | `development` |

## Performance Optimization

- **Browser Reuse**: Single browser instance shared across requests
- **Memory Management**: Automatic cleanup of pages after use
- **Timeouts**: Configured timeouts to prevent hanging requests
- **Resource Limits**: Optimized memory and CPU usage

## Security Features

- **Non-root User**: Container runs with restricted user
- **Input Validation**: HTML content and URL validation
- **Resource Limits**: Memory and timeout limits
- **Error Handling**: Comprehensive error handling

## Monitoring

- **Health Checks**: Built-in health endpoint
- **Logging**: Structured logging with Winston
- **Metrics**: Generation time and PDF size tracking

## Integration with CampusPe API

Update your Azure PDF Service configuration:

```typescript
// In azure-pdf-service.ts
const AZURE_PDF_SERVICE_URL =
  "https://campuspe-pdf.southindia.azurecontainer.io:3000";
```

## Troubleshooting

### Common Issues

1. **Browser Launch Failed**

   - Ensure all system dependencies are installed
   - Check memory limits (minimum 2GB recommended)

2. **PDF Generation Timeout**

   - Increase timeout in options
   - Check HTML complexity

3. **Memory Issues**
   - Monitor memory usage
   - Increase container memory limit

### Debug Commands

```bash
# Check container logs
az container logs --resource-group rg-campuspe-pdf --name campuspe-pdf-service

# Check container status
az container show --resource-group rg-campuspe-pdf --name campuspe-pdf-service

# Test health endpoint
curl https://campuspe-pdf.southindia.azurecontainer.io:3000/health
```

## Cost Optimization

- **Auto-scaling**: Configure based on usage
- **Resource Limits**: Set appropriate CPU/memory limits
- **Monitoring**: Track usage and optimize accordingly

## Support

For issues or questions, contact the CampusPe development team.
