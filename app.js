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
    new winston.transports.Console(), // Log to the console
  ],
});

// Create a Morgan stream for Winston
const stream = {
  write: (message) => logger.info(message.trim()),
};

import indexRouter from './routes/index.js';

const app = express();

// Set the port dynamically for Azure compatibility
const PORT = process.env.PORT || 8080;

// View engine setup
app.set('views', path.join(path.resolve(), 'views')); // Resolve views directory dynamically
app.set('view engine', 'ejs'); // Set EJS as the templating engine

// Use Morgan for logging, integrated with Winston
app.use(morgan('combined', { stream })); // Log HTTP requests

// Use additional middlewares
app.use(express.json()); // Parse JSON request bodies
app.use(express.urlencoded({ extended: false })); // Parse URL-encoded request bodies
app.use(cookieParser()); // Handle cookies
app.use(express.static(path.join(path.resolve(), 'public'))); // Serve static files

// Set up routes
app.use('/', indexRouter);

// Catch 404 and forward to error handler
app.use((req, res, next) => {
  next(createError(404));
});

// Error handler
app.use((err, req, res, next) => {
  // Provide error details in the response
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // Log the error using Winston
  logger.error(`Error occurred: ${err.message}`);

  // Render the error page
  res.status(err.status || 500);
  res.render('error');
});

// Start the server and listen on the designated port
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});

export default app;
