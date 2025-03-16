import createError from 'http-errors';
import express from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import loggerModule from './logger.js'; // Import the default export

const { logger, morgan } = loggerModule;

import indexRouter from './routes/index.js';

const app = express();

// View engine setup
app.set('views', path.join(path.resolve(), 'views'));
app.set('view engine', 'ejs');

// Use Morgan with Winston integration
app.use(morgan('combined', { stream: logger.stream }));

// Use additional middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(path.resolve(), 'public')));

app.use('/', indexRouter);

// Catch 404 and forward to error handler
app.use((req, res, next) => {
  next(createError(404));
});

// Error handler
app.use((err, req, res, next) => {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // Log the error using Winston
  logger.error(`Error occurred: ${err.message}`);

  res.status(err.status || 500);
  res.render('error');
});

export default app;
