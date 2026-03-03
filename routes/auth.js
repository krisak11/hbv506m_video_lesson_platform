const express = require('express');
const router = express.Router();
const authService = require('../services/authService');
const passwordPolicy = require('../utils/passwordPolicy');
const loginRateLimit = require('../utils/loginRateLimit');
const registerRateLimit = require('../utils/registerRateLimit');
const { safeAuditLog, normalizeEmail, authTarget } = require('../utils/auditLogger');

/* GET register page. */
router.get('/register', function(req, res, next) {
  res.render('auth/register', {
    title: 'Register',
    pageCss: '/stylesheets/pages/register.css',
    errors:[],
    form: {email: '', display_name: ''}
  });
});

/* GET login page. */
router.get('/login', function(req, res, next) {
  res.render('auth/login', {
    title: 'Login',
    pageCss: '/stylesheets/pages/register.css',
    errors: [],
    form: {email: ''}
  });
});

/* POST register page. */
// Ensure passwordPolicy and registerRateLimit middleware are applied to the registration route to enforce security measures.
router.post('/register', registerRateLimit, passwordPolicy, async (req, res) => {
  const registerAttemptEmail = normalizeEmail(req.body.email);

  try {
    if (req.passwordPolicyErrors?.length) {
      safeAuditLog(req, {
        event_type: 'register_failure',
        severity: 'warn',
        actor_user_id: null,
        message: 'Registration failed: password policy validation',
        metadata: {
          ...authTarget(registerAttemptEmail),
          outcome: { success: false, failure_reason: 'validation_error' },
        },
      });

      return res.status(400).render('auth/register', {
        title: 'Register',
        pageCss: '/stylesheets/pages/register.css',
        errors: req.passwordPolicyErrors,
        form: { email: req.body.email || '', display_name: req.body.display_name || ''}
      });
    }
    const user = await authService.register(req.body)
    
    safeAuditLog(req, {
      event_type: 'register_success',
      severity: 'info',
      actor_user_id: user.id,
      message: 'New user registered',
      metadata: authTarget(registerAttemptEmail, user.id),
    });
    
    // Prevent session fixation by regenerating the session on successful registration.
    req.session.regenerate((err) => {
      if (err) return res.status(500).send('Session error');
      req.session.userId = user.id;
      res.redirect('/');
    });
  } catch (err) {
    safeAuditLog(req, {
      event_type: 'register_failure',
      severity: 'warn',
      actor_user_id: null,
      message: 'Registration failed',
      metadata: {
        ...authTarget(registerAttemptEmail),
        outcome: { success: false, failure_reason: 'register_failed' },
      },
    });

    return res.status(400).render('auth/register', {
      title: 'Register',
      pageCss: '/stylesheets/pages/register.css',
      errors: [err.message],
      form: { email: req.body.email || '', display_name: req.body.display_name || ''}
    });
  }
});

/* POST login page. */
router.post('/login', loginRateLimit, async (req, res) => {
  const loginAttemptEmail = normalizeEmail(req.body.email);

  try {
    const user = await authService.login(req.body);
    
    safeAuditLog(req, {
      event_type: 'login_success',
      severity: 'info',
      actor_user_id: user.id,
      message: 'Successful login',
      metadata: authTarget(loginAttemptEmail, user.id),
    });
    
    // Prevent session fixation by regenerating the session on successful login.
    req.session.regenerate((err) => {
      if (err) {
        return res.status(500).send('Session error');
      }
      req.session.userId = user.id;
      res.redirect('/');
    });
    
  } catch (err) {
    const isLocked = err.message.includes('locked');
    safeAuditLog(req, {
      event_type: isLocked ? 'account_locked' : 'login_failure',
      severity: 'warn',
      actor_user_id: null,
      message: 'Login attempt failed',
      metadata: {
        ...authTarget(loginAttemptEmail),
        outcome: { success: false, failure_reason: isLocked ? 'account_locked' : 'invalid_credentials' },
      },
    });

    return res.status(400).render('auth/login', {
      title: 'Login',
      pageCss: '/stylesheets/pages/register.css',
      errors: [err.message],
      form: { email: req.body.email || '' }
    });
  }
});

router.post('/logout', async (req, res) => {
  const userId = req.user?.id ?? null

  req.session.destroy(err => {
    if (err) {
      return res.status(500).send('Logout unsuccessful')
    }

    safeAuditLog(req, {
      event_type: 'logout',
      severity: 'info',
      actor_user_id: userId,
      message: 'User logged out',
    });

    res.clearCookie('connect.sid', { path: '/' });
    res.redirect('/auth/login')
  })
});

module.exports = router;