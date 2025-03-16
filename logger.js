const { createLogger, transports, format } = require('winston');
const morgan = require('morgan');

const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp(),
    format.printf(({ timestamp, level, message }) => `${timestamp} [${level.toUpperCase()}]: ${message}`)
  ),
  transports: [
    new transports.Console(),
    new transports.File({ filename: 'logs/app.log' })
  ]
});

// Integrate Winston with Morgan for HTTP request logging
logger.morgan = morgan('combined', {
  stream: {
    write: (message) => logger.info(message.trim())
  }
});

module.exports = logger;
