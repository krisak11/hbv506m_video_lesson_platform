// Operations for "audit_logs" table.
// All queries are parameterized (?). Defense against injection (A05).

const db = require("./index");

function logEvent({
  event_type,
  severity = "info",
  actor_user_id = null,
  ip_address = null,
  user_agent = null,
  message = null,
  metadata = null, // JS object
}) {
  const metadata_json = metadata ? JSON.stringify(metadata) : null;

  const stmt = db.prepare(`
    INSERT INTO audit_logs
      (event_type, severity, actor_user_id, ip_address, user_agent, message, metadata_json)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const result = stmt.run(
    event_type,
    severity,
    actor_user_id,
    ip_address,
    user_agent,
    message,
    metadata_json
  );

  return result.lastInsertRowid;
}

function getLatestLogs({ limit = 50, severity = null } = {}) {
  // Limit is interpolated safely by validation (can't be parameterized in SQLite LIMIT reliably with all wrappers)
  // Note: for LIMIT, we validate it and then interpolate the number. 
  // That avoids injection risk while keeping things compatible.
  const safeLimit = Number.isInteger(limit) && limit > 0 && limit <= 500 ? limit : 50;

  if (severity) {
    return db
      .prepare(
        `
        SELECT *
        FROM audit_logs
        WHERE severity = ?
        ORDER BY created_at DESC, id DESC
        LIMIT ${safeLimit}
      `
      )
      .all(severity);
  }

  return db
    .prepare(
      `
      SELECT *
      FROM audit_logs
      ORDER BY created_at DESC, id DESC
      LIMIT ${safeLimit}
    `
    )
    .all();
}

module.exports = {
  logEvent,
  getLatestLogs,
};
