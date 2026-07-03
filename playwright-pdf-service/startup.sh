#!/bin/bash

echo "🚀 Installing Playwright browsers..."
npx playwright install --with-deps chromium

echo "🎯 Starting the PDF service..."
node server.js
