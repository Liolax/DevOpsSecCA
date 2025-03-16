import app from '../app.js';
import debugLib from 'debug';
import http from 'http';
import https from 'https';
import fs from 'fs';

const debug = debugLib('phishsense:server');

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
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
    default:
      throw error;
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */
function onListening(server) {
  const addr = server.address();
  const bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + addr.port;
  debug('Listening on ' + bind);
}

// Ports configuration
const port = normalizePort(process.env.PORT || '8080');
const httpsPort = process.env.PORT_HTTPS || 8443;

if (process.env.ENV !== "DEV") {
  // Load the private key and certificate
  try {
    const privateKey = fs.readFileSync('privatekey.pem', 'utf8');
    const certificate = fs.readFileSync('server.crt', 'utf8');
    
    // Define HTTPS options
    const httpsOptions = {
      key: privateKey,
      cert: certificate
    };

    app.set("port", httpsPort);

    // Create and start the HTTPS server
    const httpsServer = https.createServer(httpsOptions, app);

    httpsServer.listen(httpsPort, () => {
      console.log('HTTPS server is running on port ' + httpsPort);
    });

    httpsServer.on('error', onError);
    httpsServer.on('listening', () => onListening(httpsServer));

    // HTTP to HTTPS redirection
    http.createServer((req, res) => {
      const httpsUrl = `https://${req.headers.host.split(':')[0]}:${httpsPort}${req.url}`;
      res.writeHead(301, { "Location": httpsUrl });
      console.log("Redirecting HTTP request to: ", httpsUrl);
      res.end();
    }).listen(port);

  } catch (error) {
    console.error("Failed to configure HTTPS: ", error.message);
    process.exit(1);
  }
} else {
  // Development environment: Use HTTP only
  const server = http.createServer(app);

  server.listen(port, () => {
    console.log('HTTP server is running on port ' + port);
  });

  server.on('error', onError);
  server.on('listening', () => onListening(server));
}
