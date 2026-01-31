var express = require('express');
var router = express.Router();

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const auditLogsRepo = require('../db/auditLogsRepo');

function tailFile(filePath, maxLines = 100) {
  if (!fs.existsSync(filePath)) return null;
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  return lines.slice(Math.max(0, lines.length - maxLines)).join('\n');
}

// GET /admin/monitor - monitoring page (no auth required yet)
router.get('/monitor', function (req, res, next) {
  res.locals.pageCss = '/stylesheets/pages/admin.css';

  // Latest audit logs from DB
  let latestLogs = [];
  try {
    latestLogs = auditLogsRepo.getLatestLogs({ limit: 50 });
  } catch (e) {
    // If DB logging isn't used yet, don't crash the page
    latestLogs = [];
  }

  // Tail file log (optional)
  const logPath = path.join(__dirname, '..', 'logs', 'app.log');
  const fileLogTail = tailFile(logPath, 120);

  // Uptime command
  exec('uptime', { timeout: 1500 }, (err, stdout, stderr) => {
    const uptimeOutput = err
      ? `Error running uptime: ${err.message}`
      : (stdout || stderr || '').trim();

    res.render('admin/monitor', {
      uptimeOutput,
      latestLogs,
      fileLogTail,
      logPath,
    });
  });
});

module.exports = router;
