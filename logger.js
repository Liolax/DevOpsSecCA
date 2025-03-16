import { createLogger, transports, format } from 'winston';
import morgan from 'morgan';

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

// Create a stream object to use with Morgan
logger.stream = {
  write: (message) => logger.info(message.trim())
};

export default { logger, morgan };
