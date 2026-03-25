-- Migration: Add Soft Deletes and Missing Timestamps

-- Subjects
ALTER TABLE subjects ADD COLUMN deleted_at TEXT;

-- Topics
ALTER TABLE topics ADD COLUMN deleted_at TEXT;

-- Subtopics
ALTER TABLE subtopics ADD COLUMN deleted_at TEXT;

-- Notes
ALTER TABLE notes ADD COLUMN deleted_at TEXT;

-- Questions
ALTER TABLE questions ADD COLUMN deleted_at TEXT;

-- Study Sessions
ALTER TABLE study_sessions ADD COLUMN updated_at TEXT;
ALTER TABLE study_sessions ADD COLUMN deleted_at TEXT;
UPDATE study_sessions SET updated_at = created_at WHERE updated_at IS NULL;

-- Review Schedules
ALTER TABLE review_schedules ADD COLUMN updated_at TEXT;
ALTER TABLE review_schedules ADD COLUMN deleted_at TEXT;
UPDATE review_schedules SET updated_at = created_at WHERE updated_at IS NULL;

-- Review Attempts
ALTER TABLE review_attempts ADD COLUMN created_at TEXT;
ALTER TABLE review_attempts ADD COLUMN updated_at TEXT;
ALTER TABLE review_attempts ADD COLUMN deleted_at TEXT;
UPDATE review_attempts SET created_at = completed_at, updated_at = completed_at WHERE created_at IS NULL;

-- Question History
ALTER TABLE question_history ADD COLUMN updated_at TEXT;
ALTER TABLE question_history ADD COLUMN deleted_at TEXT;
UPDATE question_history SET updated_at = created_at WHERE updated_at IS NULL;

-- Activity Plan Items
ALTER TABLE activity_plan_items ADD COLUMN deleted_at TEXT;

-- Settings
ALTER TABLE settings ADD COLUMN updated_at TEXT;
ALTER TABLE settings ADD COLUMN deleted_at TEXT;
UPDATE settings SET updated_at = datetime('now') WHERE updated_at IS NULL;

-- Profiles
ALTER TABLE profiles ADD COLUMN deleted_at TEXT;

-- Users
ALTER TABLE users ADD COLUMN deleted_at TEXT;
