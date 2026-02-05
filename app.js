const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const fs = require('fs');

let indexRouter = require('./routes/index');
let usersRouter = require('./routes/users');
let authRouter = require('./routes/auth');
let coursesRouter = require('./routes/courses');
let lessonsRouter = require('./routes/lessons');
let adminRouter = require('./routes/admin');

let expressLayouts = require('express-ejs-layouts');

let app = express();

// default title and pagecss definitions
app.use((req, res, next) => {
  res.locals.title = 'Video Lesson Platform';
  res.locals.pageCss = null;
  next();
});

// layout setup
app.use(expressLayouts);
app.set('layout', 'layout');

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Express will respect X-Forwarded-For header
// when determining req.ip for logging and audit purposes
app.set('trust proxy', true); 


// middleware setup

// ensure logs directory exists and create write stream for application logs

const defaultLogFile = path.join(__dirname, 'logs', 'app.log');
const logFilePath = process.env.LOG_PATH || defaultLogFile;

// Ensure the parent directory exists
fs.mkdirSync(path.dirname(logFilePath), { recursive: true });

// Create write stream for application logs
const accessLogStream = fs.createWriteStream(logFilePath, { flags: 'a' });

// Log HTTP requests to file
app.use(logger('combined', { stream: accessLogStream }));

// also log to console
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// route setup
// public routes
app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/auth', authRouter);
// protected routes
app.use('/courses', coursesRouter);
app.use('/lessons', lessonsRouter);
app.use('/admin', adminRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
