const express = require('express');
const puppeteer = require('puppeteer');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Global browser instance for reuse
let browser = null;

// Initialize browser
async function initBrowser() {
  if (!browser) {
    console.log('🚀 Initializing Puppeteer browser...');
    browser = await puppeteer.launch({
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium-browser',
      headless: 'new',
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
        '--disable-backgrounding-occluded-windows'
      ]
    });
    console.log('✅ Browser initialized successfully');
  }
  return browser;
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  if (browser) {
    await browser.close();
    console.log('🔄 Browser closed gracefully');
  }
  process.exit(0);
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Azure PDF Service is running',
    timestamp: new Date().toISOString(),
    browser: !!browser
  });
});

// PDF generation endpoint
app.post('/generate-pdf', async (req, res) => {
  let page = null;
  
  try {
    const { html, options = {} } = req.body;
    
    if (!html) {
      return res.status(400).json({
        success: false,
        message: 'HTML content is required'
      });
    }
    
    console.log('📄 Starting PDF generation...');
    
    // Initialize browser if needed
    const browserInstance = await initBrowser();
    
    // Create new page
    page = await browserInstance.newPage();
    
    // Set viewport
    await page.setViewport({ width: 1200, height: 1600 });
    
    // Set HTML content
    await page.setContent(html, { 
      waitUntil: 'networkidle0',
      timeout: 30000
    });
    
    // Wait for fonts and styles to load
    await page.evaluate(() => {
      return new Promise((resolve) => {
        if (document.readyState === 'complete') {
          resolve();
        } else {
          window.addEventListener('load', () => resolve());
        }
      });
    });
    
    // Add small delay for rendering
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Generate PDF with custom options
    const pdfOptions = {
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20px',
        right: '20px',
        bottom: '20px',
        left: '20px'
      },
      timeout: 30000,
      preferCSSPageSize: false,
      displayHeaderFooter: false,
      ...options
    };
    
    const pdf = await page.pdf(pdfOptions);
    
    console.log('✅ PDF generated successfully, size:', pdf.length, 'bytes');
    
    // Return PDF as base64
    res.json({
      success: true,
      message: 'PDF generated successfully',
      pdf: pdf.toString('base64'),
      size: pdf.length,
      contentType: 'application/pdf'
    });
    
  } catch (error) {
    console.error('❌ PDF generation failed:', error);
    res.status(500).json({
      success: false,
      message: 'PDF generation failed',
      error: error.message
    });
  } finally {
    if (page) {
      try {
        await page.close();
        console.log('✅ Page closed successfully');
      } catch (closeError) {
        console.warn('⚠️ Warning: Failed to close page:', closeError);
      }
    }
  }
});

// Start server
app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 Azure PDF Service listening on port ${port}`);
  console.log(`📊 Health: http://localhost:${port}/health`);
  console.log(`📄 Generate PDF: POST http://localhost:${port}/generate-pdf`);
});

module.exports = app;
