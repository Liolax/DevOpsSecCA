import { createApp } from '../app.js';
import debugLib from 'debug';
import http from 'http';
import https from 'https';
import fs from 'fs';
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [new winston.transports.Console()]
});

const debug = debugLib('phishsense:server');
const activeServers = [];

function normalizePort(val) {
  const port = parseInt(val, 10);
  if (isNaN(port)) return val;
  if (port >= 0) return port;
  return false;
}

function onListening(server) {
  const addr = server.address();
  const bind = typeof addr === 'string' ? `pipe ${addr}` : `port ${addr.port}`;
  logger.info(`Listening on ${bind}`);
}

function onErrorProd(error, portVal) {
  if (error.syscall !== 'listen') throw error;
  const bind = typeof portVal === 'string' ? `pipe ${portVal}` : `port ${portVal}`;
  switch (error.code) {
    case 'EACCES':
      logger.error(`${bind} requires elevated privileges`);
      process.exit(1);
      break;
    case 'EADDRINUSE':
      logger.error(`${bind} is already in use`);
      process.exit(1);
      break;
    default:
      throw error;
  }
}

const devPort = normalizePort(process.env.PORT || '8080');
const app = createApp();

if (process.env.ENV !== 'DEV') {
  const prodPort = normalizePort(process.env.PORT || '80');
  app.set('port', prodPort);
  // Using PFX certificate for HTTPS
  const server = process.env.HTTPS === 'true'
    ? https.createServer(
        { 
          pfx: fs.readFileSync('./deployment/ssl.pfx'),
          passphrase: process.env.PFX_PASSPHRASE || ''
        },
        app
      )
    : http.createServer(app);
  activeServers.push(server);

  server.listen(prodPort, () => logger.info(`HTTP server (production) is running on port ${prodPort}`));
  server.on('error', (error) => onErrorProd(error, prodPort));
  server.on('listening', () => onListening(server));
} else {
  const server = http.createServer(app);
  activeServers.push(server);
  server.listen(devPort, () => logger.info(`HTTP server (development) is running on port ${devPort}`));
  server.on('listening', () => onListening(server));
}

process.on('uncaughtException', (err) => {
  logger.error('Unhandled Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

process.on('SIGINT', () => {
  logger.info('Shutting down servers...');
  activeServers.forEach((server) => {
    server.close(() => logger.info('Server closed'));
  });
  process.exit(0);
});
