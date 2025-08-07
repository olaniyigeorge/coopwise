import cron from "node-cron";
import https from "https";
import http from "http";
import { config } from "dotenv";

// Load environment variables
config();

// Configuration
const BACKEND_URL = process.env.BACKEND_URL || "https://coopwise.onrender.com";
const KEEP_ALIVE_ENDPOINT = process.env.KEEP_ALIVE_ENDPOINT || "/ping";
const PING_INTERVAL_MINUTES = process.env.PING_INTERVAL_MINUTES || 14;
const LOG_LEVEL = process.env.LOG_LEVEL || "info";
const PORT = process.env.PORT || 3001;

// Construct full ping URL
const PING_URL = `${BACKEND_URL}${KEEP_ALIVE_ENDPOINT}`;

// Logging utility
const logger = {
  info: (message, ...args) => {
    if (LOG_LEVEL === "info") {
      console.log(`ℹ️  [${new Date().toISOString()}] ${message}`, ...args);
    }
  },
  warn: (message, ...args) => {
    if (["info", "warn"].includes(LOG_LEVEL)) {
      console.warn(`⚠️  [${new Date().toISOString()}] ${message}`, ...args);
    }
  },
  error: (message, ...args) => {
    console.error(`❌ [${new Date().toISOString()}] ${message}`, ...args);
  },
  success: (message, ...args) => {
    if (LOG_LEVEL === "info") {
      console.log(`✅ [${new Date().toISOString()}] ${message}`, ...args);
    }
  }
};

// Ping function
const pingBackend = () => {
  const startTime = Date.now();
  const protocol = PING_URL.startsWith("https") ? https : http;
  
  logger.info(`Pinging backend at: ${PING_URL}`);
  
  const req = protocol.get(PING_URL, (res) => {
    const responseTime = Date.now() - startTime;
    
    if (res.statusCode === 200) {
      logger.success(`Backend ping successful (${responseTime}ms) - Status: ${res.statusCode}`);
    } else {
      logger.warn(`Backend ping returned unexpected status: ${res.statusCode} (${responseTime}ms)`);
    }
    
    // Consume response data to prevent memory leaks
    res.on('data', () => {});
    res.on('end', () => {});
  });
  
  req.on("error", (error) => {
    const responseTime = Date.now() - startTime;
    logger.error(`Backend ping failed (${responseTime}ms):`, error.message);
  });
  
  req.setTimeout(30000, () => {
    req.destroy();
    logger.error("Backend ping timed out (30s)");
  });
};

// Validate configuration
const validateConfig = () => {
  if (!BACKEND_URL) {
    logger.error("BACKEND_URL is required but not provided");
    process.exit(1);
  }
  
  if (PING_INTERVAL_MINUTES >= 15) {
    logger.warn("PING_INTERVAL_MINUTES should be less than 15 to prevent Render sleep");
  }
  
  logger.info("Configuration validated successfully");
  logger.info(`Backend URL: ${BACKEND_URL}`);
  logger.info(`Keep-alive endpoint: ${KEEP_ALIVE_ENDPOINT}`);
  logger.info(`Ping interval: ${PING_INTERVAL_MINUTES} minutes`);
  logger.info(`Full ping URL: ${PING_URL}`);
};

// Create cron job - runs every N minutes
const cronPattern = `*/${PING_INTERVAL_MINUTES} * * * *`;

logger.info(`Setting up cron job with pattern: ${cronPattern}`);

const job = new cron.CronJob(cronPattern, () => {
  pingBackend();
}, null, false, 'UTC');

// Health check server (optional)
const createHealthCheckServer = () => {
  const server = http.createServer((req, res) => {
    if (req.url === '/health' && req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        status: 'healthy',
        service: 'coopwise-keep-alive',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        config: {
          backendUrl: BACKEND_URL,
          pingInterval: `${PING_INTERVAL_MINUTES} minutes`,
          nextPing: job.nextDate()?.toISOString() || 'Not scheduled'
        }
      }));
    } else if (req.url === '/ping-now' && req.method === 'POST') {
      pingBackend();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        message: 'Manual ping triggered',
        timestamp: new Date().toISOString()
      }));
    } else {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Not found' }));
    }
  });
  
  server.listen(PORT, () => {
    logger.info(`Health check server running on port ${PORT}`);
    logger.info(`Health endpoint: http://localhost:${PORT}/health`);
    logger.info(`Manual ping endpoint: http://localhost:${PORT}/ping-now (POST)`);
  });
  
  return server;
};

// Graceful shutdown
const gracefulShutdown = (signal) => {
  logger.info(`Received ${signal}, shutting down gracefully...`);
  
  if (job) {
    job.stop();
    logger.info("Cron job stopped");
  }
  
  process.exit(0);
};

// Main execution
const main = () => {
  logger.info("🚀 Starting CoopWise Keep-Alive Service");
  
  // Validate configuration
  validateConfig();
  
  // Start health check server
  createHealthCheckServer();
  
  // Start cron job
  job.start();
  logger.success(`Keep-alive cron job started - will ping every ${PING_INTERVAL_MINUTES} minutes`);
  
  // Do an initial ping
  logger.info("Performing initial ping...");
  pingBackend();
  
  // Setup graceful shutdown
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  
  logger.success("Keep-alive service is running! 🎉");
};

// Start the service
main(); 