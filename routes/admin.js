var express = require('express');
var router = express.Router();

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const auditLogsRepo = require('../db/auditLogsRepo');
const { safeAuditLog, userTarget } = require('../utils/auditLogger');
const { presentAuditLogs } = require('../utils/audit/logPresenter');
const { authorize } = require('../utils/authz/authorize');
const ABILITIES = require('../utils/authz/abilities');
const usersRepo = require('../db/usersRepo');

function tailFile(filePath, maxLines = 100) {
  if (!fs.existsSync(filePath)) return null;
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  return lines.slice(Math.max(0, lines.length - maxLines)).join('\n');
}

// GET /admin/monitor - monitoring page
router.get(
  '/monitor', 
  authorize(ABILITIES.ADMIN_PANEL),
  function (req, res, next) {
    res.locals.pageCss = '/stylesheets/pages/admin.css';

    safeAuditLog(req, {
      event_type: 'admin_monitor_view',
      severity: 'info',
      actor_user_id: req.user.id,
      message: 'Admin monitoring page accessed'
    })

    // Latest audit logs from DB
    let latestLogs = [];
    try {
      const rawLogs = auditLogsRepo.getLatestLogs({ limit: 50 });
      latestLogs = presentAuditLogs(rawLogs);
    } catch (e) {
      // If DB logging isn't used yet, don't crash the page
      latestLogs = [];
    }

    // Tail file log (optional)
    const logPath = process.env.LOG_PATH || path.join(__dirname, '..', 'logs', 'app.log');
    const fileLogTail = tailFile(logPath, 120);

    // OS Uptime command 
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
  }
);

router.get('/user-search', authorize(ABILITIES.USER_LIST), function (req, res, next) {
  try {
    const userId = parseInt(req.query.id, 10);
    if (!Number.isFinite(userId)) {
      safeAuditLog(req, {
        event_type: 'admin_user_search',
        severity: 'warn',
        actor_user_id: req.user.id,
        message: 'Admin user search failed: invalid user id',
        metadata: {
          outcome: { success: false, failure_reason: 'validation_error' },
        },
      });
      return res.status(400).send('Invalid user ID');
    }

    const userFound = usersRepo.getUserById(userId);
    if (!userFound) {
      safeAuditLog(req, {
        event_type: 'admin_user_search',
        severity: 'warn',
        actor_user_id: req.user.id,
        message: `Admin user search failed: user ${userId} not found`,
        metadata: {
          userId,
          outcome: { success: false, failure_reason: 'not_found' },
        },
      });
      return res.status(404).send('User not found');
    }

    safeAuditLog(req, {
      event_type: 'admin_user_search',
      severity: 'info',
      actor_user_id: req.user.id,
      message: `Admin user search redirected to user ${userId}`,
      metadata: userTarget(userFound),
    });

    res.redirect(`/users/${userId}`);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
