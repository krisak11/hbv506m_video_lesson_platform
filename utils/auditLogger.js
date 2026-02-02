const auditLogsRepo = require('../db/auditLogsRepo');

// Safely log an audit event, catching and logging any errors internally
function safeAuditLog(req, payload) {
  try {
    auditLogsRepo.logEvent({
      ...payload,
      ip_address: req?.ip ?? null,
      user_agent: req?.get?.('User-Agent') ?? null,
    });
  } catch (e) {
    console.warn('Audit log failed:', e.message);
  }
}

module.exports = { safeAuditLog };
