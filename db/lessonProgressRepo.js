// Operations for "lesson_progress" table.
// All queries are parameterized (?). Defense against injection (A05).

const db = require("./index");

function getProgressForUserInCourse(userId, courseId) {
  return db
    .prepare(
      `
      SELECT lp.*, l.course_id
      FROM lesson_progress lp
      JOIN lessons l ON l.id = lp.lesson_id
      WHERE lp.user_id = ? AND l.course_id = ?
      ORDER BY l.position ASC, l.id ASC
    `
    )
    .all(userId, courseId);
}

function upsertProgress({
  user_id,
  lesson_id,
  status = "in_progress",
  progress_seconds = 0,
  completed_at = null,
}) {
  // SQLite UPSERT via ON CONFLICT
  const stmt = db.prepare(`
    INSERT INTO lesson_progress (user_id, lesson_id, status, progress_seconds, completed_at, updated_at)
    VALUES (?, ?, ?, ?, ?, datetime('now'))
    ON CONFLICT(user_id, lesson_id) DO UPDATE SET
      status = excluded.status,
      progress_seconds = excluded.progress_seconds,
      completed_at = excluded.completed_at,
      updated_at = datetime('now')
  `);

  stmt.run(user_id, lesson_id, status, progress_seconds, completed_at);
  return true;
}

function markLessonCompleted(userId, lessonId) {
  const stmt = db.prepare(`
    INSERT INTO lesson_progress (user_id, lesson_id, status, progress_seconds, completed_at, updated_at)
    VALUES (?, ?, 'completed', 0, datetime('now'), datetime('now'))
    ON CONFLICT(user_id, lesson_id) DO UPDATE SET
      status = 'completed',
      completed_at = datetime('now'),
      updated_at = datetime('now')
  `);

  stmt.run(userId, lessonId);
  return true;
}

module.exports = {
  getProgressForUserInCourse,
  upsertProgress,
  markLessonCompleted,
};
