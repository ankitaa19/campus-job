const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const path = require('path');
const fs = require('fs');

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOST || '0.0.0.0';
const port = parseInt(process.env.PORT || '8080', 10);

console.log(`🚀 Starting CampusPe Web Server`);
console.log(`📍 Environment: ${process.env.NODE_ENV}`);
console.log(`🌐 Host: ${hostname}`);
console.log(`🔌 Port: ${port}`);
console.log(`📂 Working Directory: ${process.cwd()}`);
console.log(`🏗️  Development Mode: ${dev}`);

// Verify Next.js build exists in production
if (!dev) {
  const buildPath = path.join(process.cwd(), '.next');
  if (!fs.existsSync(buildPath)) {
    console.error('❌ Next.js build not found at:', buildPath);
    console.error('🔧 Ensure "npm run build" was executed before deployment');
    process.exit(1);
  }
  console.log('✅ Next.js build verified');
}

// Initialize Next.js app
const app = next({ 
  dev, 
  hostname, 
  port,
  conf: {
    // Azure-specific optimizations
    poweredByHeader: false,
    generateEtags: true,
    compress: true
  }
});
const handle = app.getRequestHandler();

// Health check endpoint for Azure
const healthCheck = (req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    port: port
  }));
};

app.prepare().then(() => {
  console.log('✅ Next.js app prepared successfully');
  
  const server = createServer(async (req, res) => {
    try {
      // Handle health check endpoint
      if (req.url === '/health' || req.url === '/api/health') {
        return healthCheck(req, res);
      }

      // Parse the URL
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('❌ Error occurred handling request:', err);
      res.statusCode = 500;
      res.end('Internal Server Error');
    }
  });

  server.listen(port, hostname, (err) => {
    if (err) {
      console.error('❌ Server failed to start:', err);
      process.exit(1);
    }
    console.log(`🎉 CampusPe Web Server running on http://${hostname}:${port}`);
    console.log(`🌍 Ready to serve requests!`);
    console.log(`💚 Health check available at: http://${hostname}:${port}/health`);
  });

  // Handle server errors
  server.on('error', (err) => {
    console.error('❌ Server error:', err);
    if (err.code === 'EADDRINUSE') {
      console.error(`🔴 Port ${port} is already in use`);
      process.exit(1);
    }
  });

  // Graceful shutdown
  const gracefulShutdown = (signal) => {
    console.log(`⏹️  ${signal} received, shutting down gracefully`);
    server.close(() => {
      console.log('✅ Server closed');
      process.exit(0);
    });
    
    // Force close after 10 seconds
    setTimeout(() => {
      console.error('❌ Could not close connections in time, forcefully shutting down');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  
  // Handle uncaught exceptions
  process.on('uncaughtException', (err) => {
    console.error('❌ Uncaught Exception:', err);
    gracefulShutdown('UNCAUGHT_EXCEPTION');
  });

  process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
    gracefulShutdown('UNHANDLED_REJECTION');
  });
  
}).catch((ex) => {
  console.error('❌ Failed to prepare Next.js app:', ex);
  process.exit(1);
});
