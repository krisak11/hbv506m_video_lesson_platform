var express = require('express');
var router = express.Router();

// Placeholder route so app boots
router.get('/', function (req, res) {
  res.send('Admin route is set up (placeholder).');
});

module.exports = router;
