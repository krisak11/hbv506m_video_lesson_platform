var express = require('express');
var router = express.Router();

/* GET register page. */
router.get('/register', function(req, res, next) {
  res.render('auth/register', {
    title: 'Register',
    pageCss: '/stylesheets/pages/register.css'
  });
});

/* POST register page. */
router.post('/register', (req, res) => {
  const { email, password } = req.body;

  // TODO: validation + DB logic

  res.redirect('/');
});

module.exports = router;