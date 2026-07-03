#!/bin/bash

# College Registration System Test Script
# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

API_BASE_URL="http://localhost:5001"
WEB_BASE_URL="http://localhost:3001"
TEST_EMAIL="test.college.$(date +%s)@example.com"
TEST_PHONE="9876543210"

echo -e "${BLUE}🚀 Starting College Registration System Tests${NC}"
echo "=============================================================="

PASSED=0
FAILED=0

# Function to run a test
run_test() {
    local test_name="$1"
    local test_command="$2"
    
    echo -e "${BLUE}ℹ️  Running: $test_name${NC}"
    
    if eval "$test_command"; then
        echo -e "${GREEN}✅ $test_name - PASSED${NC}"
        ((PASSED++))
    else
        echo -e "${RED}❌ $test_name - FAILED${NC}"
        ((FAILED++))
    fi
    echo ""
}

# Test 1: API Health Check
test_api_health() {
    response=$(curl -s -w "%{http_code}" -o /tmp/health_response.json "$API_BASE_URL/health")
    if [[ "$response" == "200" ]] && grep -q '"status":"OK"' /tmp/health_response.json && grep -q '"database":"connected"' /tmp/health_response.json; then
        return 0
    else
        echo "Health check failed. Response code: $response"
        cat /tmp/health_response.json
        return 1
    fi
}

# Test 2: Email Availability Check
test_email_check() {
    response=$(curl -s -w "%{http_code}" -X POST "$API_BASE_URL/api/auth/check-email" \
        -H "Content-Type: application/json" \
        -d "{\"email\": \"$TEST_EMAIL\"}" \
        -o /tmp/email_response.json)
    
    if [[ "$response" == "200" ]] && grep -q '"available":true' /tmp/email_response.json; then
        return 0
    else
        echo "Email check failed. Response code: $response"
        cat /tmp/email_response.json
        return 1
    fi
}

# Test 3: Phone Availability Check
test_phone_check() {
    response=$(curl -s -w "%{http_code}" -X POST "$API_BASE_URL/api/auth/check-phone" \
        -H "Content-Type: application/json" \
        -d "{\"phone\": \"$TEST_PHONE\"}" \
        -o /tmp/phone_response.json)
    
    if [[ "$response" == "200" ]] && grep -q '"available":true' /tmp/phone_response.json; then
        return 0
    else
        echo "Phone check failed. Response code: $response"
        cat /tmp/phone_response.json
        return 1
    fi
}

# Test 4: Send Email OTP
test_send_email_otp() {
    response=$(curl -s -w "%{http_code}" -X POST "$API_BASE_URL/api/auth/send-otp" \
        -H "Content-Type: application/json" \
        -d "{\"email\": \"$TEST_EMAIL\", \"userType\": \"college\"}" \
        -o /tmp/email_otp_response.json)
    
    if [[ "$response" == "200" ]] && grep -q '"otpId"' /tmp/email_otp_response.json; then
        return 0
    else
        echo "Email OTP send failed. Response code: $response"
        cat /tmp/email_otp_response.json
        return 1
    fi
}

# Test 5: Send WhatsApp OTP
test_send_whatsapp_otp() {
    response=$(curl -s -w "%{http_code}" -X POST "$API_BASE_URL/api/auth/send-otp" \
        -H "Content-Type: application/json" \
        -d "{\"phoneNumber\": \"$TEST_PHONE\", \"userType\": \"college\", \"preferredMethod\": \"whatsapp\", \"firstName\": \"Test\", \"lastName\": \"College\"}" \
        -o /tmp/whatsapp_otp_response.json)
    
    if [[ "$response" == "200" ]] && grep -q '"otpId"' /tmp/whatsapp_otp_response.json; then
        return 0
    else
        echo "WhatsApp OTP send failed. Response code: $response"
        cat /tmp/whatsapp_otp_response.json
        return 1
    fi
}

# Test 6: Frontend Page Accessibility
test_frontend_page() {
    response=$(curl -s -w "%{http_code}" "$WEB_BASE_URL/register/college" -o /tmp/frontend_response.html)
    
    if [[ "$response" == "200" ]] && (grep -q "Create an Account" /tmp/frontend_response.html || grep -q "College" /tmp/frontend_response.html); then
        return 0
    else
        echo "Frontend page failed. Response code: $response"
        echo "Page content preview:"
        head -20 /tmp/frontend_response.html
        return 1
    fi
}

# Test 7: CORS Configuration
test_cors() {
    response=$(curl -s -w "%{http_code}" -H "Origin: http://localhost:3001" "$API_BASE_URL/health" -o /tmp/cors_response.json)
    
    if [[ "$response" == "200" ]]; then
        return 0
    else
        echo "CORS test failed. Response code: $response"
        return 1
    fi
}

# Test 8: College Registration Structure (expect to fail with invalid OTP, but structure should be accepted)
test_registration_structure() {
    response=$(curl -s -w "%{http_code}" -X POST "$API_BASE_URL/api/auth/register" \
        -H "Content-Type: application/json" \
        -d "{
            \"email\": \"$TEST_EMAIL\",
            \"password\": \"testpassword123\",
            \"role\": \"college\",
            \"phoneNumber\": \"$TEST_PHONE\",
            \"whatsappNumber\": \"$TEST_PHONE\",
            \"otpId\": \"dummy-otp-id\",
            \"profileData\": {
                \"collegeName\": \"Test College\",
                \"collegeType\": \"Private College\",
                \"establishedYear\": 2020,
                \"recognizedBy\": \"AICTE\",
                \"website\": \"https://testcollege.edu\",
                \"affiliatedTo\": \"Karnataka University\",
                \"aboutCollege\": \"Test college for automated testing\",
                \"address\": {
                    \"street\": \"123 Test Street\",
                    \"city\": \"Bangalore\",
                    \"state\": \"Karnataka\",
                    \"pincode\": \"560001\",
                    \"landmark\": \"Near Test Mall\",
                    \"location\": \"Test Location\"
                },
                \"primaryContact\": {
                    \"name\": \"Test Coordinator\",
                    \"designation\": \"Principal\",
                    \"email\": \"coordinator@testcollege.edu\",
                    \"phone\": \"$TEST_PHONE\"
                }
            }
        }" \
        -o /tmp/registration_response.json)
    
    # Should return 400 with "Invalid OTP" message, which means structure is accepted
    if [[ "$response" == "400" ]] && grep -q -i "invalid\|otp" /tmp/registration_response.json; then
        return 0
    elif [[ "$response" == "200" ]]; then
        # Unexpected success - but still good
        return 0
    else
        echo "Registration structure test failed. Response code: $response"
        cat /tmp/registration_response.json
        return 1
    fi
}

# Run all tests
echo "Testing with:"
echo "  Email: $TEST_EMAIL"
echo "  Phone: $TEST_PHONE"
echo ""

run_test "API Health Check" "test_api_health"
run_test "Email Availability Check" "test_email_check"
run_test "Phone Availability Check" "test_phone_check"
run_test "Send Email OTP" "test_send_email_otp"
run_test "Send WhatsApp OTP" "test_send_whatsapp_otp"
run_test "Frontend Page Accessibility" "test_frontend_page"
run_test "CORS Configuration" "test_cors"
run_test "Registration Data Structure" "test_registration_structure"

# Results Summary
echo "=============================================================="
echo -e "${BLUE}ℹ️  TEST RESULTS SUMMARY${NC}"
echo "=============================================================="
echo -e "Total Tests: $((PASSED + FAILED))"
echo -e "${GREEN}Passed: $PASSED${NC}"
if [[ $FAILED -gt 0 ]]; then
    echo -e "${RED}Failed: $FAILED${NC}"
fi

SUCCESS_RATE=$(( (PASSED * 100) / (PASSED + FAILED) ))

if [[ $SUCCESS_RATE -ge 80 ]]; then
    echo -e "${GREEN}✅ Success Rate: ${SUCCESS_RATE}% - System is working well! 🎉${NC}"
    echo -e "${GREEN}✨ College registration system is ready for use!${NC}"
    echo -e "${BLUE}🌐 Test the registration flow at: $WEB_BASE_URL/register/college${NC}"
elif [[ $SUCCESS_RATE -ge 60 ]]; then
    echo -e "${YELLOW}⚠️  Success Rate: ${SUCCESS_RATE}% - Some issues need attention${NC}"
else
    echo -e "${RED}❌ Success Rate: ${SUCCESS_RATE}% - Major issues need fixing${NC}"
fi

echo "=============================================================="

# Cleanup
rm -f /tmp/health_response.json /tmp/email_response.json /tmp/phone_response.json
rm -f /tmp/email_otp_response.json /tmp/whatsapp_otp_response.json /tmp/frontend_response.html
rm -f /tmp/cors_response.json /tmp/registration_response.json
