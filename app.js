import createError from 'http-errors';
import express from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import winston from 'winston';
import rateLimit from 'express-rate-limit';
import indexRouter from './routes/index.js';

// Setup Winston logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'app.log' })
  ]
});

// Create a Morgan stream for Winston
const stream = {
  write: (message) => logger.info(message.trim())
};

export function createApp() {
  const app = express();

  // View engine setup
  app.set('views', path.join(path.resolve(), 'views'));
  app.set('view engine', 'ejs');

  // Apply security and optimization middlewares
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // Limit each IP to 100 requests per window
  });
  app.use(limiter);

  app.use(morgan('combined', { stream }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  app.use(cookieParser());
  app.use(express.static(path.join(path.resolve(), 'public')));

  // Health-check route
  app.get('/status', (_, res) => {
    res.status(200).send('OK');
  });

  // Setup routes
  app.use('/', indexRouter);

  // Catch 404 and forward to error handler
  app.use((req, res, next) => {
    next(createError(404));
  });

  // Error handler
  app.use((err, req, res, next) => {
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};
    logger.error(`Error occurred: ${err.message}`);
    res.status(err.status || 500);
    res.render('error');
  });

  return app;
}
