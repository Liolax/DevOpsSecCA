import app from '../app.js';
import debugLib from 'debug';
import http from 'http';
import https from 'https';
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
  const bind =
    typeof addr === 'string' ? 'pipe ' + addr : 'port ' + addr.port;
  debug('Listening on ' + bind);
  console.log(`Server successfully started on ${bind}`);
}

/**
 * Production error handler.
 * In production mode, we do not retry on a port conflict.
 */
function onErrorProd(error, portVal) {
  if (error.syscall !== 'listen') throw error;
  const bind =
    typeof portVal === 'string' ? 'Pipe ' + portVal : 'Port ' + portVal;
  switch (error.code) {
    case 'EACCES':
      console.error(`${bind} requires elevated privileges`);
      process.exit(1);
    case 'EADDRINUSE':
      console.error(`${bind} is already in use`);
      process.exit(1);
    default:
      throw error;
  }
}

/**
 * DEVELOPMENT: Start an HTTP server with retry logic.
 */
function startDevServer(currentPort) {
  const server = http.createServer(app);
  activeServers.push(server);

  server.listen(currentPort, () => {
    console.log(`HTTP server is running on port ${currentPort}`);
  });

  server.on('error', (error) => {
    if (error.syscall !== 'listen') throw error;
    if (error.code === 'EADDRINUSE') {
      console.warn(`Port ${currentPort} is in use. Retrying on port ${currentPort + 1}...`);
      // Close current server and retry with the next port
      server.close(() => startDevServer(currentPort + 1));
    } else {
      throw error;
    }
  });

  server.on('listening', () => onListening(server));
}

// Retrieve port configurations
const devPort = normalizePort(process.env.PORT || '8080');
const prodHttpsPort = normalizePort(process.env.PORT_HTTPS || '8443');

if (process.env.ENV !== 'DEV') {
  // PRODUCTION MODE: Use HTTPS only.
  try {
    // Load SSL certificate and private key
    const privateKey = fs.readFileSync('privatekey.pem', 'utf8');
    const certificate = fs.readFileSync('server.crt', 'utf8');
    const httpsOptions = { key: privateKey, cert: certificate };

    // Set the port for the app
    app.set('port', prodHttpsPort);

    // Create and start the HTTPS server on the production HTTPS port
    const httpsServer = https.createServer(httpsOptions, app);
    activeServers.push(httpsServer);
    httpsServer.listen(prodHttpsPort, () => {
      console.log(`HTTPS server is running on port ${prodHttpsPort}`);
    });
    httpsServer.on('error', (error) => onErrorProd(error, prodHttpsPort));
    httpsServer.on('listening', () => onListening(httpsServer));

    // Create an HTTP server for redirecting to HTTPS (optional)
    const httpRedirectServer = http.createServer((req, res) => {
      const host = req.headers.host.split(':')[0];
      const httpsUrl = `https://${host}:${prodHttpsPort}${req.url}`;
      res.writeHead(301, { Location: httpsUrl });
      console.log(`Redirecting HTTP request to: ${httpsUrl}`);
      res.end();
    });
    activeServers.push(httpRedirectServer);
    httpRedirectServer.listen(normalizePort(process.env.PORT || '8080'), () => {
      console.log(`HTTP redirect server is running on port ${process.env.PORT || '8080'}`);
    });
    httpRedirectServer.on('error', (error) => onErrorProd(error, process.env.PORT || '8080'));
    httpRedirectServer.on('listening', () => onListening(httpRedirectServer));

  } catch (error) {
    console.error('Failed to configure HTTPS:', error.message);
    process.exit(1);
  }
} else {
  // DEVELOPMENT MODE: Use HTTP with fallback retry logic.
  startDevServer(devPort);
}

// Global error handlers to catch unhandled exceptions and rejections
process.on('uncaughtException', (err) => {
  console.error('Unhandled Exception:', err);
  process.exit(1); // Exit gracefully
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1); // Exit gracefully
});

// Graceful shutdown: close all active servers on SIGINT
process.on('SIGINT', () => {
  console.log('Shutting down servers...');
  activeServers.forEach((server) => {
    server.close(() => console.log('Server closed'));
  });
  process.exit(0);
});
