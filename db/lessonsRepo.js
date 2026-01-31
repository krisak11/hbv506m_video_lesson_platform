// CRUD operations for "lessons" table.
// All queries are parameterized (?). Defense against injection (A05).

const db = require("./index");

function getLessonsByCourseId(courseId, { includeUnpublished = true } = {}) {
  if (includeUnpublished) {
    return db
      .prepare(
        `SELECT * FROM lessons
         WHERE course_id = ?
         ORDER BY position ASC, id ASC`
      )
      .all(courseId);
  }

  return db
    .prepare(
      `SELECT * FROM lessons
       WHERE course_id = ? AND is_published = 1
       ORDER BY position ASC, id ASC`
    )
    .all(courseId);
}

function getLessonById(id) {
  return db.prepare(`SELECT * FROM lessons WHERE id = ?`).get(id);
}

function createLesson({
  course_id,
  title,
  description = null,
  video_url = null,
  position = 0,
  is_published = 0,
}) {
  const stmt = db.prepare(`
    INSERT INTO lessons (course_id, title, description, video_url, position, is_published)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const result = stmt.run(
    course_id,
    title,
    description,
    video_url,
    position,
    is_published
  );

  return result.lastInsertRowid;
}

function updateLesson(
  id,
  { title, description = null, video_url = null, position = 0, is_published = 0 }
) {
  const stmt = db.prepare(`
    UPDATE lessons
    SET title = ?,
        description = ?,
        video_url = ?,
        position = ?,
        is_published = ?,
        updated_at = datetime('now')
    WHERE id = ?
  `);

  return stmt
    .run(title, description, video_url, position, is_published, id)
    .changes;
}

function deleteLesson(id) {
  return db.prepare(`DELETE FROM lessons WHERE id = ?`).run(id).changes;
}

module.exports = {
  getLessonsByCourseId,
  getLessonById,
  createLesson,
  updateLesson,
  deleteLesson,
};
