const express = require('express');
const router = express.Router();
const authService = require('../services/authService');

/* GET register page. */
router.get('/register', function(req, res, next) {
  res.render('auth/register', {
    title: 'Register',
    pageCss: '/stylesheets/pages/register.css'
  });
});

/* POST register page. */
router.post('/register', async (req, res) => {
  try {
    const user = await authService.register(req.body)

    req.session.user = user

    res.redirect('/')
  } catch (err) {
    res.status(400).send(err.message)
  }
});

router.post('/login', async (req, res) => {
  try {
    const user = await authService.login(req.body)

    req.session.user = user

    res.redirect('/')
  } catch (err) {
    res.status(400).send(err.message)
  }
});

module.exports = router;