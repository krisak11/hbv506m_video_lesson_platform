require('dotenv').config();

const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const fs = require('fs');
const session = require('express-session');

let indexRouter = require('./routes/index');
let usersRouter = require('./routes/users');
let authRouter = require('./routes/auth');
let coursesRouter = require('./routes/courses');
let lessonsRouter = require('./routes/lessons');
let adminRouter = require('./routes/admin');

const requireAuth = require('./utils//middleware/requireAuth');
let expressLayouts = require('express-ejs-layouts');

function createApp({ sessionStore } = {}) {
  const app = express();

  // defaults for views
  app.use((req, res, next) => {
    res.locals.title = 'Video Lesson Platform';
    res.locals.pageCss = null;
    next();
  });

  app.use(expressLayouts);
  app.set('layout', 'layout');

  app.set('views', path.join(__dirname, 'views'));
  app.set('view engine', 'ejs');
  
  app.set('trust proxy', 'loopback'); // trusts 127.0.0.1 / ::1 only
  // --------------------------
  // Logging
  // --------------------------
  const defaultLogFile = path.join(__dirname, 'logs', 'app.log');
  const logFilePath = process.env.LOG_PATH || defaultLogFile;
  fs.mkdirSync(path.dirname(logFilePath), { recursive: true });

  const accessLogStream = fs.createWriteStream(logFilePath, { flags: 'a' });
  app.use(logger('combined', { stream: accessLogStream }));
  app.use(logger('dev'));

  // --------------------------
  // Parsers / static
  // --------------------------
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  app.use(cookieParser());
  app.use(express.static(path.join(__dirname, 'public')));

  // --------------------------
  // Session middleware (store injected)
  // --------------------------
  const sessionOptions = {
    secret: process.env.SESSION_SECRET || 'dev-only-secret-change-me',
    resave: false,
    saveUninitialized: false,
    proxy: true,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 1000 * 60 * 60 * 24,
    },
  };

  if (sessionStore) {
    sessionOptions.store = sessionStore;
  }

  app.use(session(sessionOptions));

  app.use((req, res, next) => {
    res.locals.user = req.session.user;
    next();
  });

  // --------------------------
  // Routes
  // --------------------------
  app.use('/', indexRouter);
  app.use('/users', usersRouter);
  app.use('/auth', authRouter);

  app.use('/courses', requireAuth, coursesRouter);
  app.use('/lessons', requireAuth, lessonsRouter);
  app.use('/admin', requireAuth, adminRouter);

  app.use(function (req, res, next) {
    next(createError(404));
  });

  app.use(function (err, req, res, next) {
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};
    res.status(err.status || 500);
    res.render('error');
  });

  return app;
}

module.exports = { createApp };