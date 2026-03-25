-- FOCUS App - Database Schema
-- Turso (SQLite) Migration

-- Tabela de Usuários
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  avatar TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT
);

-- Tabela de Perfis (estilo Netflix)
CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  avatar_id TEXT NOT NULL DEFAULT 'scholar',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT
);

-- Tabela de Sessões (para refresh tokens)
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);

-- Subjects
CREATE TABLE IF NOT EXISTS subjects (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  order_num INTEGER,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT
);

-- Topics
CREATE TABLE IF NOT EXISTS topics (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject_id TEXT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  order_num INTEGER,
  description TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT
);

-- Subtopics
CREATE TABLE IF NOT EXISTS subtopics (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  topic_id TEXT NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  order_num INTEGER,
  description TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT
);

-- Notes
CREATE TABLE IF NOT EXISTS notes (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  topic_id TEXT NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  subtopic_id TEXT REFERENCES subtopics(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT
);

-- Questions
CREATE TABLE IF NOT EXISTS questions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  topic_id TEXT NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  subtopic_id TEXT REFERENCES subtopics(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK(type IN ('mcq', 'open')),
  prompt TEXT NOT NULL,
  choices TEXT, -- JSON array para MCQ
  answer_index INTEGER,
  explanation TEXT,
  sample_answer TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT
);

-- Study Sessions
CREATE TABLE IF NOT EXISTS study_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  topic_id TEXT NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  subtopic_id TEXT REFERENCES subtopics(id) ON DELETE SET NULL,
  activity_type TEXT NOT NULL,
  started_at TEXT NOT NULL,
  ended_at TEXT NOT NULL,
  duration_sec INTEGER NOT NULL,
  mode TEXT NOT NULL,
  difficulty INTEGER,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT
);

-- Review Schedules
CREATE TABLE IF NOT EXISTS review_schedules (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  topic_id TEXT NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  subtopic_id TEXT REFERENCES subtopics(id) ON DELETE SET NULL,
  origin_session_id TEXT NOT NULL REFERENCES study_sessions(id) ON DELETE CASCADE,
  due_at TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('pending', 'completed', 'overdue')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT
);

-- Review Attempts
CREATE TABLE IF NOT EXISTS review_attempts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  schedule_id TEXT NOT NULL REFERENCES review_schedules(id) ON DELETE CASCADE,
  correct_count INTEGER NOT NULL,
  question_count INTEGER NOT NULL,
  accuracy REAL NOT NULL,
  duration_sec INTEGER NOT NULL,
  completed_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT
);

-- Question History
CREATE TABLE IF NOT EXISTS question_history (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  topic_id TEXT NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  subtopic_id TEXT REFERENCES subtopics(id) ON DELETE SET NULL,
  session_id TEXT REFERENCES study_sessions(id) ON DELETE SET NULL,
  correct_count INTEGER NOT NULL,
  wrong_count INTEGER NOT NULL,
  blank_count INTEGER NOT NULL,
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT
);

-- Activity Plan Items
CREATE TABLE IF NOT EXISTS activity_plan_items (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  topic_id TEXT NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  subtopic_id TEXT REFERENCES subtopics(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  teacher_name TEXT,
  material_type TEXT NOT NULL,
  target_count INTEGER NOT NULL,
  completed_count INTEGER NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('pending', 'completed')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT
);

-- Settings (por usuário)
CREATE TABLE IF NOT EXISTS settings (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  pomodoro_minutes INTEGER NOT NULL DEFAULT 25,
  short_break_minutes INTEGER NOT NULL DEFAULT 5,
  long_break_minutes INTEGER NOT NULL DEFAULT 15,
  daily_goal_minutes INTEGER NOT NULL DEFAULT 120,
  enable_sounds INTEGER NOT NULL DEFAULT 1,
  theme TEXT NOT NULL DEFAULT 'dark',
  updated_at TEXT NOT NULL,
  deleted_at TEXT
);

-- Completed Items (para tracking de progresso)
CREATE TABLE IF NOT EXISTS completed_items (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  item_id TEXT NOT NULL,
  item_type TEXT NOT NULL CHECK(item_type IN ('topic', 'subtopic')),
  completed_at TEXT NOT NULL,
  UNIQUE(user_id, item_id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_subjects_user_id ON subjects(user_id);
CREATE INDEX IF NOT EXISTS idx_topics_user_id ON topics(user_id);
CREATE INDEX IF NOT EXISTS idx_topics_subject_id ON topics(subject_id);
CREATE INDEX IF NOT EXISTS idx_subtopics_user_id ON subtopics(user_id);
CREATE INDEX IF NOT EXISTS idx_subtopics_topic_id ON subtopics(topic_id);
CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_topic_id ON notes(topic_id);
CREATE INDEX IF NOT EXISTS idx_questions_user_id ON questions(user_id);
CREATE INDEX IF NOT EXISTS idx_questions_topic_id ON questions(topic_id);
CREATE INDEX IF NOT EXISTS idx_study_sessions_user_id ON study_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_study_sessions_topic_id ON study_sessions(topic_id);
CREATE INDEX IF NOT EXISTS idx_review_schedules_user_id ON review_schedules(user_id);
CREATE INDEX IF NOT EXISTS idx_review_schedules_topic_id ON review_schedules(topic_id);
CREATE INDEX IF NOT EXISTS idx_review_schedules_status ON review_schedules(status);
CREATE INDEX IF NOT EXISTS idx_review_attempts_user_id ON review_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_review_attempts_schedule_id ON review_attempts(schedule_id);
CREATE INDEX IF NOT EXISTS idx_question_history_user_id ON question_history(user_id);
CREATE INDEX IF NOT EXISTS idx_question_history_topic_id ON question_history(topic_id);
CREATE INDEX IF NOT EXISTS idx_activity_plan_items_user_id ON activity_plan_items(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_plan_items_topic_id ON activity_plan_items(topic_id);
CREATE INDEX IF NOT EXISTS idx_activity_plan_items_status ON activity_plan_items(status);
CREATE INDEX IF NOT EXISTS idx_completed_items_user_id ON completed_items(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
