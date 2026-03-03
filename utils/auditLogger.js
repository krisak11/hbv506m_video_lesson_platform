const auditLogsRepo = require('../db/auditLogsRepo');
const INTERNAL_FIELDS = new Set(['_csrf', '_method', 'csrfToken']);
const RESERVED_METADATA_KEYS = new Set(['identity','outcome','request',
  'domain','changes','details','updatedFields','course_id','course_title',
  'lesson_id','lesson_title','user_id','userId','enrollment_id',
]);
const SENSITIVE_KEY_SNIPPETS = ['password', 'token', 'secret', 'authorization', 'cookie', 'session', 'csrf'];

function getChangedFields(body = {}) {
  return Object.keys(body).filter((key) => !INTERNAL_FIELDS.has(key));
}

function userTarget(user) {
  return {
    identity: {
      target: {
        id: user?.id ?? null,
        email: user?.email ?? null,
      },
    },
    userId: user?.id ?? null,
  };
}

function normalizeEmail(email) {
  return (email || '').trim().toLowerCase();
}

function authTarget(email, id = null) {
  return {
    identity: {
      target: {
        id,
        email: normalizeEmail(email) || null,
      },
    },
  };
}

function isPlainObject(value) {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function shouldRedactKey(key) {
  const lower = String(key || '').toLowerCase();
  return SENSITIVE_KEY_SNIPPETS.some((snippet) => lower.includes(snippet));
}

function sanitizeValue(value) {
  if (Array.isArray(value)) return value.map(sanitizeValue);
  if (!isPlainObject(value)) return value;

  const out = {};
  for (const [k, v] of Object.entries(value)) {
    out[k] = shouldRedactKey(k) ? '[REDACTED]' : sanitizeValue(v);
  }
  return out;
}

function buildDomain(baseMetadata) {
  const mdDomain = isPlainObject(baseMetadata.domain) ? baseMetadata.domain : {};
  return {
    course_id: mdDomain.course_id ?? baseMetadata.course_id ?? null,
    course_title: mdDomain.course_title ?? baseMetadata.course_title ?? null,
    lesson_id: mdDomain.lesson_id ?? baseMetadata.lesson_id ?? null,
    lesson_title: mdDomain.lesson_title ?? baseMetadata.lesson_title ?? null,
    user_id: mdDomain.user_id ?? baseMetadata.user_id ?? baseMetadata.userId ?? baseMetadata.identity?.target?.id ?? null,
    enrollment_id: mdDomain.enrollment_id ?? baseMetadata.enrollment_id ?? null,
  };
}

function buildDetails(baseMetadata) {
  const providedDetails = isPlainObject(baseMetadata.details) ? sanitizeValue(baseMetadata.details) : {};
  const extra = {};

  for (const [k, v] of Object.entries(baseMetadata)) {
    if (RESERVED_METADATA_KEYS.has(k)) continue;
    extra[k] = sanitizeValue(v);
  }

  return { ...extra, ...providedDetails };
}

function buildChanges(baseMetadata) {
  const fromChanges = isPlainObject(baseMetadata.changes) ? baseMetadata.changes : {};
  const rawFields = fromChanges.fields ?? baseMetadata.updatedFields ?? [];
  return {
    fields: Array.isArray(rawFields) ? rawFields.filter(Boolean) : [],
    before: isPlainObject(fromChanges.before) ? sanitizeValue(fromChanges.before) : {},
    after: isPlainObject(fromChanges.after) ? sanitizeValue(fromChanges.after) : {},
  };
}

function buildMetadata(req, payload) {
  const baseMetadata = isPlainObject(payload.metadata) ? sanitizeValue(payload.metadata) : {};
  const identity = isPlainObject(baseMetadata.identity) ? baseMetadata.identity : {};
  const outcome = isPlainObject(baseMetadata.outcome) ? baseMetadata.outcome : {};
  const request = isPlainObject(baseMetadata.request) ? baseMetadata.request : {};

  return {
    identity: {
      actor: {
        id: identity.actor?.id ?? req?.user?.id ?? payload.actor_user_id ?? null,
        email: identity.actor?.email ?? req?.user?.email ?? null,
        role: identity.actor?.role ?? req?.user?.role ?? null,
      },
      target: identity.target
        ? {
            id: identity.target.id ?? null,
            email: identity.target.email ?? null,
          }
        : null,
    },
    outcome: {
      success: outcome.success ?? true,
      failure_reason: outcome.failure_reason ?? null,
    },
    request: {
      request_id: request.request_id ?? req?.audit?.request_id ?? req?.id ?? null,
      method: request.method ?? req?.method ?? null,
      path: request.path ?? req?.originalUrl ?? req?.path ?? null,
      query: isPlainObject(request.query) ? request.query : sanitizeValue(req?.query || {}),
      ip: request.ip ?? req?.ip ?? null,
      user_agent: request.user_agent ?? req?.get?.('User-Agent') ?? null,
      duration_ms:
        request.duration_ms ??
        req?.audit?.duration_ms ??
        (Number.isFinite(req?.audit?.started_at_ms) ? (Date.now() - req.audit.started_at_ms) : null),
    },
    domain: buildDomain(baseMetadata),
    changes: buildChanges(baseMetadata),
    details: buildDetails(baseMetadata),
  };
}

// Safely log an audit event, catching and logging any errors internally
function safeAuditLog(req, payload) {
  try {
    const safePayload = isPlainObject(payload) ? payload : {};
    const metadata = buildMetadata(req, safePayload);

    auditLogsRepo.logEvent({
      ...safePayload,
      ip_address: req?.ip ?? null,
      user_agent: req?.get?.('User-Agent') ?? null,
      metadata,
    });
  } catch (e) {
    console.warn('Audit log failed:', e.message);
  }
}

module.exports = {
  safeAuditLog,
  getChangedFields,
  userTarget,
  normalizeEmail,
  authTarget,
};
