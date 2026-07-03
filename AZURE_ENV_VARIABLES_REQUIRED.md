# Azure App Service Environment Variables Configuration

# Copy these to Azure App Service -> Settings -> Environment variables

# ============= CRITICAL MISSING VARIABLES FOR OTP SYSTEM =============

# 2Factor SMS Service (MISSING - This is why SMS fallback fails)

TWOFACTOR_API_KEY=880f24b5-5eed-11f0-a562-0200cd936042

# MongoDB Connection (MISSING - Critical for OTP storage)

MONGODB_URI=mongodb+srv://CampusPeAdmin:CampusPe@campuspestaging.adsljpw.mongodb.net/campuspe?retryWrites=true&w=majority&appName=CampuspeStaging

# JWT Authentication (MISSING - Critical for auth system)

JWT_SECRET=campuspe_super_secret_jwt_key_2025
JWT_EXPIRES_IN=7d

# API Configuration

NODE_ENV=production
PORT=8080
HOST=0.0.0.0

# CORS - Allow dev.campuspe.com frontend

CORS_ORIGIN=https://dev.campuspe.com

# ============= EXISTING WABB WEBHOOK VARIABLES (KEEP THESE) =============

WABB_WEBHOOK_URL=https://api.wabb.in/api/v1/webhooks-automation/catch/220/FQavVMJ9VP7G/
WABB_WEBHOOK_URL_GENERAL=https://api.wabb.in/api/v1/webhooks-automation/catch/220/FQavVMJ9VP7G/
WABB_WEBHOOK_URL_JOBS=https://api.wabb.in/api/v1/webhooks-automation/catch/220/FQavVMJ9VP7G/
WABB_WEBHOOK_URL_OTP=https://api.wabb.in/api/v1/webhooks-automation/catch/220/FQavVMJ9VP7G/
WABB_WEBHOOK_URL_RESUME=https://api.wabb.in/api/v1/webhooks-automation/catch/220/ORIQYvoj8qk9/
WABB_WEBHOOK_TOKEN=campuspe_wabb_verify_token_2025

# ============= ADDITIONAL MISSING VARIABLES =============

# Claude AI Configuration

CLAUDE_API_KEY=<YOUR_CLAUDE_API_KEY_FROM_LOCAL_ENV>
ANTHROPIC_API_KEY=<YOUR_CLAUDE_API_KEY_FROM_LOCAL_ENV>

# Bunny.net Cloud Storage

BUNNY_STORAGE_ZONE_NAME=campuspe-resumes-v2
BUNNY_STORAGE_ACCESS_KEY=07617915-b491-4726-bb581e8e9362-d4be-419e
BUNNY_STORAGE_HOSTNAME=sg.storage.bunnycdn.com
BUNNY_CDN_URL=https://campuspe-resumes-cdn-v2.b-cdn.net/

# API Base URL for Azure

API_BASE_URL=https://campuspe-api-staging-hmfjgud5c6a7exe9.southindia-01.azurewebsites.net

# Azure Communication Services

AZURE_COMMUNICATION_CONNECTION_STRING=<YOUR_AZURE_COMMUNICATION_CONNECTION_STRING>
AZURE_COMMUNICATION_EMAIL_FROM=DoNotReply@campuspe.com

# ============= INSTRUCTIONS =============

# 1. Add ALL missing variables above to Azure App Service

# 2. Deploy the updated API code to Azure

# 3. Restart the Azure App Service

# 4. Test the OTP system from dev.campuspe.com
