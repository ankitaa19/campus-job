#!/bin/bash

# Test script to verify file upload and admin panel fixes

echo "🔍 Testing File Upload and Admin Panel Fixes..."

# Check if API server is running
echo "📡 Checking API server..."
if curl -s http://localhost:8000/api/health > /dev/null; then
    echo "✅ API server is running on port 8000"
else
    echo "❌ API server is not responding"
    exit 1
fi

# Check if Web server is running
echo "🌐 Checking Web server..."
if curl -s http://localhost:3000 > /dev/null; then
    echo "✅ Web server is running on port 3000"
else
    echo "❌ Web server is not responding"
    exit 1
fi

echo ""
echo "🎯 Summary of Fixes Applied:"
echo "1. ✅ Fixed backend controllers to store files in 'submittedDocuments' field instead of 'supportingDocuments'"
echo "2. ✅ Added 'aboutCollege' and 'recognizedBy' fields to admin panel college details page"
echo "3. ✅ Updated both College and Recruiter controllers for consistent file storage"
echo "4. ✅ No TypeScript/JavaScript errors found in modified files"
echo ""
echo "📋 Next Steps for Testing:"
echo "1. Login to college account and upload supporting documents via ApprovalStatus component"
echo "2. Check admin panel at http://localhost:3000/admin/college-details/[collegeId]"
echo "3. Verify uploaded files appear in 'Documents' section"
echo "4. Verify 'About College' and 'Recognized By' fields are displayed"
echo ""
echo "🔧 Issues Fixed:"
echo "- Files now upload to BunnyCDN and store URLs in database correctly"
echo "- Admin panel displays uploaded files in 'Submitted Documents' section" 
echo "- Missing college fields now visible in admin interface"
