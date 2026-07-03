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

// Global browser instance for reuse
let browser = null;

// Initialize Playwright browser
async function initBrowser() {
  if (!browser) {
    logger.info('🚀 Initializing Playwright Chromium browser...');
    
    browser = await chromium.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-gpu',
        '--disable-background-timer-throttling',
        '--disable-renderer-backgrounding',
        '--disable-backgrounding-occluded-windows',
        '--disable-ipc-flooding-protection',
        '--disable-extensions',
        '--disable-default-apps',
        '--memory-pressure-off',
        '--max_old_space_size=4096',
        '--ignore-certificate-errors',
        '--ignore-ssl-errors',
        '--ignore-certificate-errors-spki-list',
        '--disable-features=TranslateUI'
      ]
    });
    
    logger.info('✅ Playwright browser initialized successfully');
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
      test: 'GET /test',
      docs: 'GET /docs'
    },
    description: 'High-quality PDF generation service using Playwright',
    timestamp: new Date().toISOString()
  });
});

// API Documentation endpoint
app.get('/docs', (req, res) => {
  res.json({
    service: 'CampusPe Playwright PDF Service',
    version: '1.0.0',
    endpoints: [
      {
        method: 'GET',
        path: '/',
        description: 'Service information'
      },
      {
        method: 'GET',
        path: '/health',
        description: 'Service health status'
      },
      {
        method: 'POST',
        path: '/generate-pdf',
        description: 'Generate PDF from HTML content',
        body: {
          html: 'string (required) - HTML content to convert',
          options: 'object (optional) - PDF generation options'
        },
        example: {
          html: '<html><body><h1>Hello World</h1></body></html>',
          options: {
            format: 'A4',
            margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' },
            printBackground: true
          }
        }
      },
      {
        method: 'POST',
        path: '/generate-pdf-from-url',
        description: 'Generate PDF from URL',
        body: {
          url: 'string (required) - URL to convert to PDF',
          options: 'object (optional) - PDF generation options'
        }
      },
      {
        method: 'GET',
        path: '/test',
        description: 'Test PDF generation with sample content'
      }
    ]
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
    
    // Create new page with bypass for CSP
    page = await browserInstance.newPage({
      bypassCSP: true
    });
    
    // Set viewport for consistent rendering
    await page.setViewportSize({ width: 1200, height: 1600 });
    
    // Add extra font loading support
    await page.addInitScript(() => {
      // Disable CSP for font loading
      document.addEventListener('DOMContentLoaded', () => {
        const meta = document.createElement('meta');
        meta.httpEquiv = 'Content-Security-Policy';
        meta.content = "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob: https: http:; font-src 'self' 'unsafe-inline' data: blob: https: http:;";
        document.head.appendChild(meta);
      });
    });
    
    // Set content with enhanced error handling
    logger.info('📝 Setting HTML content...');
    await page.setContent(html, { 
      waitUntil: 'networkidle',
      timeout: 30000
    });
    
    // Wait for fonts and any dynamic content to load
    await page.waitForLoadState('networkidle');
    
    // Add a small delay to ensure everything is rendered
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
      preferCSSPageSize: false,
      displayHeaderFooter: false,
      ...options
    };
    
    // Generate PDF
    logger.info('🔄 Converting to PDF with Playwright...');
    const pdfBuffer = await page.pdf(pdfOptions);
    
    const generationTime = Date.now() - startTime;
    
    logger.info(`✅ PDF generated successfully in ${generationTime}ms, size: ${pdfBuffer.length} bytes`);
    
    // Convert buffer to base64 for JSON response
    const base64Pdf = pdfBuffer.toString('base64');
    
    res.json({
      success: true,
      message: 'PDF generated successfully',
      pdf: base64Pdf,
      metadata: {
        size: pdfBuffer.length,
        generationTime: generationTime,
        timestamp: new Date().toISOString(),
        engine: 'playwright-chromium'
      }
    });
    
  } catch (error) {
    const generationTime = Date.now() - startTime;
    
    logger.error('❌ PDF generation failed:', {
      error: error.message,
      stack: error.stack,
      generationTime: generationTime
    });
    
    res.status(500).json({
      success: false,
      message: 'PDF generation failed',
      error: error.message,
      metadata: {
        generationTime: generationTime,
        timestamp: new Date().toISOString()
      }
    });
    
  } finally {
    // Always clean up the page
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
    
    // Create new page with bypass for CSP
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
    
    // Wait for any dynamic content to load
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
      preferCSSPageSize: false,
      displayHeaderFooter: false,
      ...options
    };
    
    // Generate PDF
    logger.info('🔄 Converting to PDF with Playwright...');
    const pdfBuffer = await page.pdf(pdfOptions);
    
    const generationTime = Date.now() - startTime;
    
    logger.info(`✅ PDF generated successfully in ${generationTime}ms, size: ${pdfBuffer.length} bytes`);
    
    // Convert buffer to base64 for JSON response
    const base64Pdf = pdfBuffer.toString('base64');
    
    res.json({
      success: true,
      message: 'PDF generated successfully from URL',
      pdf: base64Pdf,
      metadata: {
        size: pdfBuffer.length,
        generationTime: generationTime,
        timestamp: new Date().toISOString(),
        engine: 'playwright-chromium',
        sourceUrl: url
      }
    });
    
  } catch (error) {
    const generationTime = Date.now() - startTime;
    
    logger.error('❌ PDF generation from URL failed:', {
      error: error.message,
      stack: error.stack,
      generationTime: generationTime
    });
    
    res.status(500).json({
      success: false,
      message: 'PDF generation from URL failed',
      error: error.message,
      metadata: {
        generationTime: generationTime,
        timestamp: new Date().toISOString()
      }
    });
    
  } finally {
    // Always clean up the page
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
          <meta charset="utf-8">
          <title>Test PDF</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              margin: 40px;
              line-height: 1.6;
            }
            .header { 
              color: #2563eb; 
              font-size: 24px; 
              font-weight: bold; 
              text-align: center; 
              margin-bottom: 20px;
            }
            .content { 
              color: #333; 
              font-size: 14px;
            }
            .footer {
              margin-top: 40px;
              padding-top: 20px;
              border-top: 1px solid #ccc;
              text-align: center;
              color: #666;
              font-size: 12px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            🎯 CampusPe Playwright PDF Service Test
          </div>
          <div class="content">
            <p>This is a test PDF generated using Playwright.</p>
            <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
            <p><strong>Service:</strong> Playwright PDF Generator</p>
            <p><strong>Quality:</strong> High-resolution, print-ready</p>
          </div>
          <div class="footer">
            Generated by CampusPe Playwright PDF Service
          </div>
        </body>
      </html>
    `;
    
    // Generate test PDF
    const testResponse = await fetch('http://localhost:3000/generate-pdf', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ html: testHtml })
    });
    
    if (!testResponse.ok) {
      throw new Error('Test PDF generation failed');
    }
    
    const result = await testResponse.json();
    
    res.json({
      success: true,
      message: 'Test PDF generated successfully',
      pdfSize: result.metadata?.size || 0,
      generationTime: result.metadata?.generationTime || 0
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

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('🔄 Received SIGTERM, shutting down gracefully...');
  
  if (browser) {
    await browser.close();
    logger.info('🔄 Browser closed gracefully');
  }
  
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('🔄 Received SIGINT, shutting down gracefully...');
  
  if (browser) {
    await browser.close();
    logger.info('🔄 Browser closed gracefully');
  }
  
  process.exit(0);
});

// Error handling
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// Start server
app.listen(port, () => {
  logger.info(`🚀 CampusPe Playwright PDF Service running on port ${port}`);
  logger.info(`📖 Health check: http://localhost:${port}/health`);
  logger.info(`🧪 Test endpoint: http://localhost:${port}/test`);
});

module.exports = app;
