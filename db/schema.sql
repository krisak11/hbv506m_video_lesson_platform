PRAGMA foreign_keys = ON;

-- =========================
-- USERS
-- =========================
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,

  email TEXT NOT NULL UNIQUE,
  password_hash TEXT,            -- nullable for "no auth yet" stage
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),

  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),

  display_name TEXT,
  profile_image_path TEXT,

  email_verified_at TEXT,        -- nullable
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active);


-- =========================
-- COURSES
-- =========================
CREATE TABLE IF NOT EXISTS courses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,

  title TEXT NOT NULL,
  description TEXT NOT NULL,

  is_published INTEGER NOT NULL DEFAULT 0 CHECK (is_published IN (0, 1)),
  price_cents INTEGER NOT NULL DEFAULT 0 CHECK (price_cents >= 0), -- price in cents

  created_by_user_id INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),

  FOREIGN KEY (created_by_user_id) REFERENCES users(id)
    ON UPDATE CASCADE
    ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_courses_published ON courses(is_published);


-- =========================
-- LESSONS (belongs to course)
-- =========================
CREATE TABLE IF NOT EXISTS lessons (
  id INTEGER PRIMARY KEY AUTOINCREMENT,

  course_id INTEGER NOT NULL,

  title TEXT NOT NULL,
  description TEXT,

  video_url TEXT,                -- or video_path, depending on how you store videos
  position INTEGER NOT NULL DEFAULT 0 CHECK (position >= 0),
  is_published INTEGER NOT NULL DEFAULT 0 CHECK (is_published IN (0, 1)),

  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),

  FOREIGN KEY (course_id) REFERENCES courses(id)
    ON UPDATE CASCADE
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_lessons_course ON lessons(course_id);
CREATE INDEX IF NOT EXISTS idx_lessons_course_position ON lessons(course_id, position);


-- =========================
-- ENROLLMENTS (user <-> course)
-- =========================
CREATE TABLE IF NOT EXISTS enrollments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,

  user_id INTEGER NOT NULL,
  course_id INTEGER NOT NULL,

  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'cancelled')),

  enrolled_at TEXT NOT NULL DEFAULT (datetime('now')),
  cancelled_at TEXT,

  UNIQUE(user_id, course_id),

  FOREIGN KEY (user_id) REFERENCES users(id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,

  FOREIGN KEY (course_id) REFERENCES courses(id)
    ON UPDATE CASCADE
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_enrollments_user ON enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course ON enrollments(course_id);


-- =========================
-- LESSON PROGRESS (user <-> lesson)
-- =========================
CREATE TABLE IF NOT EXISTS lesson_progress (
  id INTEGER PRIMARY KEY AUTOINCREMENT,

  user_id INTEGER NOT NULL,
  lesson_id INTEGER NOT NULL,

  status TEXT NOT NULL DEFAULT 'not_started'
    CHECK (status IN ('not_started', 'in_progress', 'completed')),

  progress_seconds INTEGER NOT NULL DEFAULT 0 CHECK (progress_seconds >= 0),
  completed_at TEXT,

  updated_at TEXT NOT NULL DEFAULT (datetime('now')),

  UNIQUE(user_id, lesson_id),

  FOREIGN KEY (user_id) REFERENCES users(id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,

  FOREIGN KEY (lesson_id) REFERENCES lessons(id)
    ON UPDATE CASCADE
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_progress_user ON lesson_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_progress_lesson ON lesson_progress(lesson_id);


-- =========================
-- AUTH TOKENS (email verify / password reset)
-- (We don't need to implement now, but schema supports it)
-- =========================
CREATE TABLE IF NOT EXISTS user_tokens (
  id INTEGER PRIMARY KEY AUTOINCREMENT,

  user_id INTEGER NOT NULL,
  token_hash TEXT NOT NULL,        -- store hash, not raw token
  purpose TEXT NOT NULL CHECK (purpose IN ('email_verify', 'password_reset')),

  expires_at TEXT NOT NULL,
  used_at TEXT,

  created_at TEXT NOT NULL DEFAULT (datetime('now')),

  FOREIGN KEY (user_id) REFERENCES users(id)
    ON UPDATE CASCADE
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_tokens_user ON user_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_tokens_purpose ON user_tokens(purpose);


-- =========================
-- SECURITY / AUDIT LOGS
-- (helps with our admin monitoring/logging requirement)
-- =========================
CREATE TABLE IF NOT EXISTS audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,

  event_type TEXT NOT NULL,         -- e.g. 'login_success', 'course_created', 'admin_action'
  severity TEXT NOT NULL DEFAULT 'info'
    CHECK (severity IN ('debug', 'info', 'warn', 'error')),

  actor_user_id INTEGER,            -- nullable (e.g. anonymous)
  ip_address TEXT,
  user_agent TEXT,

  message TEXT,
  metadata_json TEXT,               -- store JSON as TEXT

  created_at TEXT NOT NULL DEFAULT (datetime('now')),

  FOREIGN KEY (actor_user_id) REFERENCES users(id)
    ON UPDATE CASCADE
    ON DELETE SET NULL
);

-- Create Indexes for audit_logs
-- 
CREATE INDEX IF NOT EXISTS idx_audit_event_type ON audit_logs(event_type);
-- 
CREATE INDEX IF NOT EXISTS idx_audit_actor ON audit_logs(actor_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_created_at ON audit_logs(created_at);
-- Composite index for common queries filtering by severity and ordering by created_at
CREATE INDEX IF NOT EXISTS idx_audit_severity_created_at ON audit_logs(severity, created_at DESC);


-- Auto-maintain updated_at on updates
CREATE TRIGGER IF NOT EXISTS trg_users_updated_at
AFTER UPDATE ON users
FOR EACH ROW
BEGIN
  UPDATE users SET updated_at = datetime('now') WHERE id = OLD.id;
END;

CREATE TRIGGER IF NOT EXISTS trg_courses_updated_at
AFTER UPDATE ON courses
FOR EACH ROW
BEGIN
  UPDATE courses SET updated_at = datetime('now') WHERE id = OLD.id;
END;

CREATE TRIGGER IF NOT EXISTS trg_lessons_updated_at
AFTER UPDATE ON lessons
FOR EACH ROW
BEGIN
  UPDATE lessons SET updated_at = datetime('now') WHERE id = OLD.id;
END;

-- =========================
-- END OF SCHEMA
-- =========================