import createError from 'http-errors';
import express from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import winston from 'winston';

// Setup Winston logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console() // Log to the console
  ]
});

// Create a Morgan stream for Winston
const stream = {
  write: (message) => logger.info(message.trim())
};

import indexRouter from './routes/index.js';

const app = express();

// View engine setup
app.set('views', path.join(path.resolve(), 'views')); // Dynamically resolve views directory
app.set('view engine', 'ejs'); // Set EJS as the templating engine

// Use Morgan for HTTP request logging, integrated with Winston
app.use(morgan('combined', { stream }));

// Cache-Control Header Middleware
app.use((req, res, next) => {
  const cacheControl = process.env.CACHE_CONTROL || 'no-store, no-cache, must-revalidate, proxy-revalidate';
  res.setHeader('Cache-Control', cacheControl);
  next();
});

// Use additional middlewares
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: false })); // Parse URL-encoded bodies
app.use(cookieParser()); // Parse cookies
app.use(express.static(path.join(path.resolve(), 'public'))); // Serve static files

// Setup routes
app.use('/', indexRouter);

// Catch 404 and forward to error handler
app.use((req, res, next) => {
  next(createError(404));
});

// Error handler
app.use((err, req, res, next) => {
  // Set locals, only providing error details in development.
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // Log the error using Winston.
  logger.error(`Error occurred: ${err.message}`);

  // Render the error page.
  res.status(err.status || 500);
  res.render('error');
});

export default app;
