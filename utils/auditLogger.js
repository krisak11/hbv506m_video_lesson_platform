const auditLogsRepo = require('../db/auditLogsRepo');

// Helper to log audit events without blocking main flow
function safeAuditLog(payload) {
  try {
    auditLogsRepo.logEvent(payload);
  } catch (e) {
    // Do not block core CRUD functionality if audit logging fails
    console.warn('Audit log failed:', e.message);
  }
}

module.exports = {
  safeAuditLog,
};
