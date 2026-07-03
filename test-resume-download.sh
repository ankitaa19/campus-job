#!/bin/bash

echo "🧪 Testing Resume Builder Functionality"
echo "========================================"
echo ""

# Test 1: Check API Health
echo "1️⃣ Checking API Health..."
API_HEALTH=$(curl -s http://localhost:5001/health)
if echo "$API_HEALTH" | grep -q "healthy"; then
    echo "   ✅ API is healthy"
else
    echo "   ❌ API health check failed"
    echo "   Response: $API_HEALTH"
fi
echo ""

# Test 2: Check Web Server
echo "2️⃣ Checking Web Server..."
WEB_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000)
if [ "$WEB_HEALTH" = "200" ] || [ "$WEB_HEALTH" = "307" ]; then
    echo "   ✅ Web server is running (HTTP $WEB_HEALTH)"
else
    echo "   ❌ Web server check failed (HTTP $WEB_HEALTH)"
fi
echo ""

# Test 3: Check Resume Builder Routes
echo "3️⃣ Checking Resume Builder Routes..."

# Check templates page
TEMPLATES=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/resume-builder/templates)
if [ "$TEMPLATES" = "200" ] || [ "$TEMPLATES" = "307" ]; then
    echo "   ✅ Templates page accessible (HTTP $TEMPLATES)"
else
    echo "   ⚠️  Templates page status: HTTP $TEMPLATES"
fi

# Check main resume builder page
MAIN=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/resume-builder)
if [ "$MAIN" = "200" ] || [ "$MAIN" = "307" ]; then
    echo "   ✅ Main resume builder page accessible (HTTP $MAIN)"
else
    echo "   ⚠️  Main page status: HTTP $MAIN"
fi

echo ""
echo "✨ Summary:"
echo "   - API Server: http://localhost:5001"
echo "   - Web Server: http://localhost:3000"
echo "   - Resume Builder: http://localhost:3000/resume-builder"
echo "   - Templates: http://localhost:3000/resume-builder/templates"
echo ""
echo "📝 To test manually:"
echo "   1. Open http://localhost:3000/resume-builder"
echo "   2. Click 'Resume Builder (Manually)'"
echo "   3. Select a template"
echo "   4. Fill in your information"
echo "   5. Click 'Preview Resume' to see PDF modal"
echo "   6. Click 'Download Resume' to download PDF"
echo ""
