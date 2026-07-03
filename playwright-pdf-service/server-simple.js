const express = require('express');
const { chromium } = require('playwright');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const winston = require('winston');

const app = express();
const port = process.env.PORT || 3000;

// Configure logging
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Global browser instance
let browser = null;

// Initialize browser
async function initBrowser() {
  if (browser) {
    return browser;
  }
  
  try {
    logger.info('🎭 Initializing Playwright Chromium browser...');
    browser = await chromium.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor'
      ]
    });
    logger.info('✅ Playwright browser initialized successfully');
  } catch (error) {
    logger.error('❌ Failed to initialize browser:', error);
    throw error;
  }
  return browser;
}

// Root endpoint - Service information
app.get('/', (req, res) => {
  res.json({
    service: 'CampusPe Playwright PDF Service',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: 'GET /health',
      generatePdf: 'POST /generate-pdf',
      generatePdfFromUrl: 'POST /generate-pdf-from-url',
      test: 'GET /test'
    },
    description: 'High-quality PDF generation service using Playwright',
    timestamp: new Date().toISOString()
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'CampusPe Playwright PDF Service',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: '1.0.0'
  });
});

// PDF generation endpoint
app.post('/generate-pdf', async (req, res) => {
  const startTime = Date.now();
  let page = null;
  
  try {
    const { html, options = {} } = req.body;
    
    if (!html) {
      return res.status(400).json({
        success: false,
        message: 'HTML content is required'
      });
    }
    
    logger.info('📄 Starting PDF generation with Playwright...');
    
    // Initialize browser
    const browserInstance = await initBrowser();
    
    // Create new page
    page = await browserInstance.newPage({
      bypassCSP: true
    });
    
    // Set viewport for consistent rendering
    await page.setViewportSize({ width: 1200, height: 1600 });
    
    // Set content with enhanced error handling
    logger.info('📝 Setting HTML content...');
    await page.setContent(html, { 
      waitUntil: 'networkidle',
      timeout: 30000
    });
    
    // Wait for fonts and any dynamic content to load
    await page.waitForLoadState('networkidle');
    
    // Add a small delay to ensure everything is rendered
    await page.waitForTimeout(1000);
    
    // Configure PDF options
    const pdfOptions = {
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20px',
        right: '20px',
        bottom: '20px',
        left: '20px'
      },
      ...options
    };
    
    // Generate PDF
    logger.info('🎯 Generating PDF...');
    const pdfBuffer = await page.pdf(pdfOptions);
    
    const generationTime = Date.now() - startTime;
    logger.info(`✅ PDF generated successfully in ${generationTime}ms (${pdfBuffer.length} bytes)`);
    
    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Length', pdfBuffer.length);
    res.setHeader('Content-Disposition', 'attachment; filename="document.pdf"');
    
    // Send PDF buffer
    res.send(pdfBuffer);
    
  } catch (error) {
    const generationTime = Date.now() - startTime;
    logger.error('❌ PDF generation failed:', {
      error: error.message,
      stack: error.stack,
      generationTime,
      timestamp: new Date().toISOString()
    });
    
    res.status(500).json({
      success: false,
      message: 'PDF generation failed',
      error: error.message,
      metadata: {
        generationTime,
        timestamp: new Date().toISOString()
      }
    });
  } finally {
    // Always close the page
    if (page) {
      try {
        await page.close();
        logger.info('✅ Page closed successfully');
      } catch (closeError) {
        logger.warn('⚠️ Warning: Failed to close page:', closeError.message);
      }
    }
  }
});

// PDF generation from URL endpoint
app.post('/generate-pdf-from-url', async (req, res) => {
  const startTime = Date.now();
  let page = null;
  
  try {
    const { url, options = {} } = req.body;
    
    if (!url) {
      return res.status(400).json({
        success: false,
        message: 'URL is required'
      });
    }
    
    logger.info(`📄 Starting PDF generation from URL: ${url}`);
    
    // Initialize browser
    const browserInstance = await initBrowser();
    
    // Create new page
    page = await browserInstance.newPage({
      bypassCSP: true
    });
    
    // Set viewport for consistent rendering
    await page.setViewportSize({ width: 1200, height: 1600 });
    
    // Navigate to URL
    logger.info('🔗 Navigating to URL...');
    await page.goto(url, { 
      waitUntil: 'networkidle',
      timeout: 30000
    });
    
    // Wait for content to load
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Configure PDF options
    const pdfOptions = {
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20px',
        right: '20px',
        bottom: '20px',
        left: '20px'
      },
      ...options
    };
    
    // Generate PDF
    logger.info('🎯 Generating PDF from URL...');
    const pdfBuffer = await page.pdf(pdfOptions);
    
    const generationTime = Date.now() - startTime;
    logger.info(`✅ PDF generated from URL successfully in ${generationTime}ms (${pdfBuffer.length} bytes)`);
    
    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Length', pdfBuffer.length);
    res.setHeader('Content-Disposition', 'attachment; filename="webpage.pdf"');
    
    // Send PDF buffer
    res.send(pdfBuffer);
    
  } catch (error) {
    const generationTime = Date.now() - startTime;
    logger.error('❌ PDF generation from URL failed:', {
      error: error.message,
      stack: error.stack,
      generationTime,
      timestamp: new Date().toISOString()
    });
    
    res.status(500).json({
      success: false,
      message: 'PDF generation from URL failed',
      error: error.message,
      metadata: {
        generationTime,
        timestamp: new Date().toISOString()
      }
    });
  } finally {
    // Always close the page
    if (page) {
      try {
        await page.close();
        logger.info('✅ Page closed successfully');
      } catch (closeError) {
        logger.warn('⚠️ Warning: Failed to close page:', closeError.message);
      }
    }
  }
});

// Test endpoint
app.get('/test', async (req, res) => {
  try {
    const testHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Test Document</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            h1 { color: #2563eb; }
          </style>
        </head>
        <body>
          <h1>Test Document</h1>
          <p>This is a test document generated by the Playwright PDF service.</p>
          <p>Generated at: ${new Date().toISOString()}</p>
        </body>
      </html>
    `;
    
    // Generate test PDF using our own endpoint
    const response = await fetch(`http://localhost:${port}/generate-pdf`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ html: testHtml })
    });
    
    if (!response.ok) {
      throw new Error('Test PDF generation failed');
    }
    
    const buffer = await response.arrayBuffer();
    
    res.json({
      success: true,
      message: 'Test PDF generated successfully',
      pdfSize: buffer.byteLength,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    logger.error('❌ Test endpoint failed:', error);
    res.status(500).json({
      success: false,
      message: 'Test failed',
      error: error.message
    });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  logger.error('Unhandled error:', error);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: error.message
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    availableEndpoints: {
      root: 'GET /',
      health: 'GET /health',
      generatePdf: 'POST /generate-pdf',
      generatePdfFromUrl: 'POST /generate-pdf-from-url',
      test: 'GET /test'
    }
  });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('🛑 Received SIGTERM, shutting down gracefully...');
  
  if (browser) {
    try {
      await browser.close();
      logger.info('✅ Browser closed successfully');
    } catch (error) {
      logger.error('❌ Error closing browser:', error);
    }
  }
  
  process.exit(0);
});

// Start server
app.listen(port, () => {
  logger.info(`🚀 CampusPe Playwright PDF Service running on port ${port}`);
  logger.info(`🏥 Health check: http://localhost:${port}/health`);
  logger.info(`🧪 Test endpoint: http://localhost:${port}/test`);
  
  // Initialize browser on startup
  initBrowser().catch(error => {
    logger.error('❌ Failed to initialize browser on startup:', error);
  });
});
