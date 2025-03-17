import app from '../app.js';
import debugLib from 'debug';
import http from 'http';
import fs from 'fs';

const debug = debugLib('phishsense:server');
const activeServers = []; // Track active servers for graceful shutdown

/**
 * Normalize a port into a number, string, or false.
 */
function normalizePort(val) {
  const port = parseInt(val, 10);
  if (isNaN(port)) return val; // Named pipe.
  if (port >= 0) return port;  // Port number.
  return false;
}

/**
 * Log when the server starts listening.
 */
function onListening(server) {
  const addr = server.address();
  const bind = typeof addr === 'string' ? 'pipe ' + addr : 'port ' + addr.port;
  debug('Listening on ' + bind);
  console.log(`Server successfully started on ${bind}`);
}

/**
 * Production error handler.
 */
function onErrorProd(error, portVal) {
  if (error.syscall !== 'listen') throw error;
  const bind = typeof portVal === 'string' ? 'pipe ' + portVal : 'port ' + portVal;
  switch (error.code) {
    case 'EACCES':
      console.error(`${bind} requires elevated privileges`);
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(`${bind} is already in use`);
      process.exit(1);
      break;
    default:
      throw error;
  }
}

/**
 * DEVELOPMENT MODE: Start an HTTP server with retry logic.
 */
function startDevServer(currentPort) {
  const server = http.createServer(app);
  activeServers.push(server);

  server.listen(currentPort, () => {
    console.log(`HTTP server (development) is running on port ${currentPort}`);
  });

  server.on('error', (error) => {
    if (error.syscall !== 'listen') throw error;
    if (error.code === 'EADDRINUSE') {
      console.warn(`Port ${currentPort} is in use. Retrying on port ${currentPort + 1}...`);
      server.close(() => startDevServer(currentPort + 1));
    } else {
      throw error;
    }
  });

  server.on('listening', () => onListening(server));
}

// Retrieve port configuration for development.
const devPort = normalizePort(process.env.PORT || '8080');

if (process.env.ENV !== 'DEV') {
  // PRODUCTION MODE: Use the port provided by Azure, defaulting to 80.
  // Azure App Service automatically assigns a port via process.env.PORT.
  const prodPort = normalizePort(process.env.PORT || '80');
  app.set('port', prodPort);

  // Create an HTTP server. In production, Azure handles SSL offloading;
  // therefore, the container should listen via HTTP on the assigned port.
  const server = http.createServer(app);
  activeServers.push(server);

  server.listen(prodPort, () => {
    console.log(`HTTP server (production) is running on port ${prodPort}`);
  });
  server.on('error', (error) => onErrorProd(error, prodPort));
  server.on('listening', () => onListening(server));
} else {
  // DEVELOPMENT MODE: Use HTTP with a fallback retry logic.
  startDevServer(devPort);
}

// Global error handlers for any unhandled exceptions or rejections.
process.on('uncaughtException', (err) => {
  console.error('Unhandled Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Graceful shutdown: Close all active servers on SIGINT.
process.on('SIGINT', () => {
  console.log('Shutting down servers...');
  activeServers.forEach((server) => {
    server.close(() => {
      console.log('Server closed');
    });
  });
  process.exit(0);
});
