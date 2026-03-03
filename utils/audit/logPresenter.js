function parseMetadata(metadataJson) {
  if (!metadataJson) return {};
  try {
    return JSON.parse(metadataJson);
  } catch (_) {
    return {};
  }
}

function summarizeResource(metadata) {
  const domain = metadata?.domain || {};
  const parts = [];

  if (domain.course_id) {
    const courseLabel = domain.course_title ? `course:${domain.course_id} (${domain.course_title})` : `course:${domain.course_id}`;
    parts.push(courseLabel);
  }
  if (domain.lesson_id) {
    const lessonLabel = domain.lesson_title ? `lesson:${domain.lesson_id} (${domain.lesson_title})` : `lesson:${domain.lesson_id}`;
    parts.push(lessonLabel);
  }
  if (domain.user_id) parts.push(`user:${domain.user_id}`);
  if (domain.enrollment_id) parts.push(`enrollment:${domain.enrollment_id}`);

  return parts.length ? parts.join(' | ') : '-';
}

function summarizeMessage(log, resourceSummary) {
  const base = log.message || '';
  if (!resourceSummary || resourceSummary === '-') return base;
  return base ? `${base} [${resourceSummary}]` : `[${resourceSummary}]`;
}

function presentAuditLogs(rawLogs) {
  return rawLogs.map((log) => {
    const metadata = parseMetadata(log.metadata_json);
    return {
      ...log,
      message_summary: summarizeMessage(log, summarizeResource(metadata)),
    };
  });
}

module.exports = {
  presentAuditLogs,
};
