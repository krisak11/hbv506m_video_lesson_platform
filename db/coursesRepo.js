// CRUD operations for "courses" table.

// All queries are parameterized (?). Defense against injection (A05).

const db = require('./index');

function getAllCourses() {
  return db.prepare('SELECT * FROM courses ORDER BY id DESC').all();
}

function getCourseById(id) {
  return db.prepare('SELECT * FROM courses WHERE id = ?').get(id);
}

function createCourse({ title, description }) {
  const stmt = db.prepare(`
    INSERT INTO courses (title, description)
    VALUES (?, ?)
  `);
  const result = stmt.run(title, description);
  return result.lastInsertRowid;
}

function updateCourse(id, { title, description }) {
  const stmt = db.prepare(`
    UPDATE courses
    SET title = ?, description = ?, updated_at = datetime('now')
    WHERE id = ?
  `);
  return stmt.run(title, description, id).changes;
}

function deleteCourse(id) {
  return db.prepare('DELETE FROM courses WHERE id = ?').run(id).changes;
}

module.exports = {
  getAllCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
};
