#!/bin/bash

echo "=== CampusPe Deployment Diagnostic Tool ==="
echo "Timestamp: $(date)"
echo "=========================================="

# Function to check URL status
check_url() {
    local url=$1
    local name=$2
    echo -n "Checking $name ($url)... "
    
    if curl -s --max-time 30 --head "$url" > /dev/null 2>&1; then
        echo "✅ RESPONDING"
        # Get status code
        status_code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$url")
        echo "  Status Code: $status_code"
    else
        echo "❌ NOT RESPONDING"
    fi
    echo
}

# Check deployment URLs
echo "🌐 Checking Deployed Applications:"
echo "=================================="

# API Endpoint
API_URL="https://campuspe-api-staging-hmfjgud5c6a7exe9.southindia-01.azurewebsites.net"
check_url "$API_URL" "API Server"
check_url "$API_URL/health" "API Health Check"
check_url "$API_URL/api/health" "API Health Endpoint"

# Web Endpoint  
WEB_URL="https://campuspe-web-staging-erd8dvb3ewcjc5g2.southindia-01.azurewebsites.net"
check_url "$WEB_URL" "Web Application"
check_url "$WEB_URL/health" "Web Health Check"

echo "🔍 Local Project Structure:"
echo "==========================="

# Check API structure
echo "📁 API Directory (/apps/api):"
if [ -d "apps/api" ]; then
    cd apps/api
    echo "  package.json: $([ -f 'package.json' ] && echo '✅ EXISTS' || echo '❌ MISSING')"
    echo "  package.json size: $([ -f 'package.json' ] && du -h 'package.json' | cut -f1 || echo 'N/A')"
    echo "  tsconfig.json: $([ -f 'tsconfig.json' ] && echo '✅ EXISTS' || echo '❌ MISSING')"
    echo "  src/ directory: $([ -d 'src' ] && echo '✅ EXISTS' || echo '❌ MISSING')"
    echo "  dist/ directory: $([ -d 'dist' ] && echo '✅ EXISTS' || echo '❌ MISSING')"
    echo "  startup.sh: $([ -f 'startup.sh' ] && echo '✅ EXISTS' || echo '❌ MISSING')"
    echo "  web.config: $([ -f 'web.config' ] && echo '✅ EXISTS' || echo '❌ MISSING')"
    cd ../..
else
    echo "  ❌ API directory not found"
fi

echo
echo "📁 Web Directory (/apps/web):"
if [ -d "apps/web" ]; then
    cd apps/web
    echo "  package.json: $([ -f 'package.json' ] && echo '✅ EXISTS' || echo '❌ MISSING')"
    echo "  next.config.js: $([ -f 'next.config.js' ] && echo '✅ EXISTS' || echo '❌ MISSING')"
    echo "  .next/ directory: $([ -d '.next' ] && echo '✅ EXISTS' || echo '❌ MISSING')"
    echo "  startup.js: $([ -f 'startup.js' ] && echo '✅ EXISTS' || echo '❌ MISSING')"
    echo "  startup.sh: $([ -f 'startup.sh' ] && echo '✅ EXISTS' || echo '❌ MISSING')"
    echo "  server-azure.js: $([ -f 'server-azure.js' ] && echo '✅ EXISTS' || echo '❌ MISSING')"
    echo "  web.config: $([ -f 'web.config' ] && echo '✅ EXISTS' || echo '❌ MISSING')"
    cd ../..
else
    echo "  ❌ Web directory not found"
fi

echo
echo "🔧 Recommended Actions:"
echo "======================="
echo "1. If API is not responding:"
echo "   - Check Azure App Service logs for the API"
echo "   - Verify startup command is set to: startup.sh"
echo "   - Ensure package.json exists and has content"
echo "   - Check if TypeScript build is successful"
echo
echo "2. If Web is not responding:"
echo "   - Check Azure App Service logs for the Web app"
echo "   - Verify startup command is set to: startup.js"
echo "   - Ensure Next.js build (.next directory) exists"
echo "   - Check if all dependencies are installed"
echo
echo "3. Build the applications locally:"
echo "   cd apps/api && npm install && npm run build"
echo "   cd apps/web && npm install && npm run build"
echo
echo "4. Test locally before redeploying:"
echo "   cd apps/api && npm start"
echo "   cd apps/web && npm start"
