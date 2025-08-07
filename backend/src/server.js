#!/usr/bin/env node

/**
 * Module dependencies.
 */
const app = require('./app');
const config = require('./config');
const logger = require('./utils/logger');
const databaseService = require('./services/databaseService');

/**
 * Get port from environment and store in Express.
 */
const port = normalizePort(config.server.port);
app.set('port', port);

/**
 * Create HTTP server.
 */
const server = require('http').createServer(app);

/**
 * Listen on provided port, on all network interfaces.
 */
// Initialize database and start the server
async function startServer() {
  try {
    // Connect to database
    await databaseService.connect();
    
    // Start the server
    server.listen(port, config.server.host);
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
server.on('error', onError);
server.on('listening', onListening);

/**
 * Normalize a port into a number, string, or false.
 */
function normalizePort(val) {
  const port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}

/**
 * Event listener for HTTP server "error" event.
 */
function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  const bind = typeof port === 'string'
    ? 'Pipe ' + port
    : 'Port ' + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      logger.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      logger.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */
function onListening() {
  const addr = server.address();
  const bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + addr.port;

  logger.info(`🚀 Email Bot API Server started successfully!`);
  logger.info(`📍 Server running on ${config.server.host}:${addr.port}`);
  logger.info(`🌍 Environment: ${config.server.env}`);
  logger.info(`📊 Health check: http://${config.server.host}:${addr.port}/health`);
  logger.info(`🔗 API documentation: http://${config.server.host}:${addr.port}/api`);
  
  if (config.server.env === 'development') {
    logger.info(`🎯 Frontend URL: ${config.cors.origin}`);
  }
}