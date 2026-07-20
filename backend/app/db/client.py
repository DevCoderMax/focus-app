from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
import json
import sqlite3
import threading
from typing import Any


LOCAL_USER_ID = "local-user"
DEFAULT_PROFILE_ID = "default"


@dataclass
class DBResult:
    rows: list[dict[str, Any]]
    rows_affected: int


def _now() -> str:
    from datetime import datetime, timezone

    return datetime.now(timezone.utc).isoformat()


def _encode(value: Any) -> Any:
    if isinstance(value, bool):
        return 1 if value else 0
    if isinstance(value, (dict, list)):
        return json.dumps(value, ensure_ascii=False)
    return value


class SQLiteClient:
    def __init__(self, db_path: Path):
        self.db_path = db_path
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self._lock = threading.RLock()
        self._conn = sqlite3.connect(str(db_path), check_same_thread=False)
        self._conn.row_factory = sqlite3.Row
        self._conn.execute("PRAGMA foreign_keys = ON")
        self._conn.execute("PRAGMA journal_mode = WAL")
        self.ensure_schema()
        try:
            self._conn.execute("ALTER TABLE settings ADD COLUMN disable_progress_animations INTEGER NOT NULL DEFAULT 0")
            self._conn.commit()
        except sqlite3.OperationalError:
            pass # Column already exists


    async def close(self) -> None:
        with self._lock:
            self._conn.close()

    async def execute(self, sql: str, args: list[Any] | None = None) -> DBResult:
        with self._lock:
            cursor = self._conn.execute(sql, [_encode(arg) for arg in (args or [])])
            rows = [dict(row) for row in cursor.fetchall()] if cursor.description else []
            self._conn.commit()
            return DBResult(rows=rows, rows_affected=max(cursor.rowcount, 0))

    def execute_script(self, sql: str) -> None:
        with self._lock:
            self._conn.executescript(sql)
            self._conn.commit()

    async def ensure_local_user(self) -> None:
        """Ensure the local user record exists (required for all local operations)."""
        now = _now()
        await self.execute(
            """
            INSERT OR IGNORE INTO users (id, email, password_hash, name, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            [LOCAL_USER_ID, "local@focus.local", "local", "Usuário Local", now, now],
        )

    async def ensure_default_profile(self) -> None:
        """Ensure the local user and default profile exist (used for fallback when no profile header is sent)."""
        await self.ensure_local_user()
        now = _now()
        await self.execute(
            """
            INSERT OR IGNORE INTO profiles (id, user_id, name, avatar_id, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            [DEFAULT_PROFILE_ID, LOCAL_USER_ID, "Perfil Principal", "scholar", now, now],
        )
        await self.execute(
            """
            INSERT OR IGNORE INTO settings (
              id, user_id, profile_id, pomodoro_minutes, short_break_minutes,
              long_break_minutes, daily_goal_minutes, enable_sounds, theme, disable_progress_animations, updated_at
            ) VALUES (?, ?, ?, 25, 5, 15, 120, 1, 'dark', 0, ?)
            """,
            [DEFAULT_PROFILE_ID, LOCAL_USER_ID, DEFAULT_PROFILE_ID, now],
        )

    def ensure_schema(self) -> None:
        self.execute_script(
            """
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

            CREATE TABLE IF NOT EXISTS profiles (
              id TEXT PRIMARY KEY,
              user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
              name TEXT NOT NULL,
              avatar_id TEXT NOT NULL DEFAULT 'scholar',
              created_at TEXT NOT NULL,
              updated_at TEXT NOT NULL,
              deleted_at TEXT
            );

            CREATE TABLE IF NOT EXISTS subjects (
              id TEXT PRIMARY KEY,
              user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
              profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
              name TEXT NOT NULL,
              order_num INTEGER,
              created_at TEXT NOT NULL,
              updated_at TEXT NOT NULL,
              deleted_at TEXT
            );

            CREATE TABLE IF NOT EXISTS topics (
              id TEXT PRIMARY KEY,
              user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
              profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
              subject_id TEXT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
              name TEXT NOT NULL,
              order_num INTEGER,
              description TEXT,
              created_at TEXT NOT NULL,
              updated_at TEXT NOT NULL,
              deleted_at TEXT
            );

            CREATE TABLE IF NOT EXISTS subtopics (
              id TEXT PRIMARY KEY,
              user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
              profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
              topic_id TEXT NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
              name TEXT NOT NULL,
              order_num INTEGER,
              description TEXT,
              created_at TEXT NOT NULL,
              updated_at TEXT NOT NULL,
              deleted_at TEXT
            );

            CREATE TABLE IF NOT EXISTS notes (
              id TEXT PRIMARY KEY,
              user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
              profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
              topic_id TEXT NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
              subtopic_id TEXT REFERENCES subtopics(id) ON DELETE SET NULL,
              title TEXT NOT NULL,
              content TEXT NOT NULL,
              created_at TEXT NOT NULL,
              updated_at TEXT NOT NULL,
              deleted_at TEXT
            );

            CREATE TABLE IF NOT EXISTS questions (
              id TEXT PRIMARY KEY,
              user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
              profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
              topic_id TEXT NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
              subtopic_id TEXT REFERENCES subtopics(id) ON DELETE SET NULL,
              type TEXT NOT NULL CHECK(type IN ('mcq', 'open')),
              prompt TEXT NOT NULL,
              choices TEXT,
              answer_index INTEGER,
              explanation TEXT,
              sample_answer TEXT,
              created_at TEXT NOT NULL,
              updated_at TEXT NOT NULL,
              deleted_at TEXT
            );

            CREATE TABLE IF NOT EXISTS study_sessions (
              id TEXT PRIMARY KEY,
              user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
              profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
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

            CREATE TABLE IF NOT EXISTS review_schedules (
              id TEXT PRIMARY KEY,
              user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
              profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
              topic_id TEXT NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
              subtopic_id TEXT REFERENCES subtopics(id) ON DELETE SET NULL,
              origin_session_id TEXT NOT NULL REFERENCES study_sessions(id) ON DELETE CASCADE,
              due_at TEXT NOT NULL,
              status TEXT NOT NULL CHECK(status IN ('pending', 'completed', 'overdue')),
              created_at TEXT NOT NULL,
              updated_at TEXT NOT NULL,
              deleted_at TEXT
            );

            CREATE TABLE IF NOT EXISTS review_attempts (
              id TEXT PRIMARY KEY,
              user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
              profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
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

            CREATE TABLE IF NOT EXISTS question_history (
              id TEXT PRIMARY KEY,
              user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
              profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
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

            CREATE TABLE IF NOT EXISTS activity_plan_items (
              id TEXT PRIMARY KEY,
              user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
              profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
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

            CREATE TABLE IF NOT EXISTS settings (
              id TEXT PRIMARY KEY,
              user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
              profile_id TEXT NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
              pomodoro_minutes INTEGER NOT NULL DEFAULT 25,
              short_break_minutes INTEGER NOT NULL DEFAULT 5,
              long_break_minutes INTEGER NOT NULL DEFAULT 15,
              daily_goal_minutes INTEGER NOT NULL DEFAULT 120,
              enable_sounds INTEGER NOT NULL DEFAULT 1,
              theme TEXT NOT NULL DEFAULT 'dark',
              disable_progress_animations INTEGER NOT NULL DEFAULT 0,
              updated_at TEXT NOT NULL,
              deleted_at TEXT
            );

            CREATE TABLE IF NOT EXISTS completed_items (
              id TEXT PRIMARY KEY,
              user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
              profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
              item_id TEXT NOT NULL,
              item_type TEXT NOT NULL CHECK(item_type IN ('topic', 'subtopic')),
              completed_at TEXT NOT NULL,
              UNIQUE(user_id, profile_id, item_id, item_type)
            );

            CREATE INDEX IF NOT EXISTS idx_subjects_scope ON subjects(user_id, profile_id);
            CREATE INDEX IF NOT EXISTS idx_topics_scope ON topics(user_id, profile_id, subject_id);
            CREATE INDEX IF NOT EXISTS idx_subtopics_scope ON subtopics(user_id, profile_id, topic_id);
            CREATE INDEX IF NOT EXISTS idx_notes_scope ON notes(user_id, profile_id, topic_id);
            CREATE INDEX IF NOT EXISTS idx_questions_scope ON questions(user_id, profile_id, topic_id);
            CREATE INDEX IF NOT EXISTS idx_study_sessions_scope ON study_sessions(user_id, profile_id, topic_id);
            CREATE INDEX IF NOT EXISTS idx_review_schedules_scope ON review_schedules(user_id, profile_id, topic_id);
            CREATE INDEX IF NOT EXISTS idx_review_attempts_scope ON review_attempts(user_id, profile_id, schedule_id);
            CREATE INDEX IF NOT EXISTS idx_question_history_scope ON question_history(user_id, profile_id, topic_id);
            CREATE INDEX IF NOT EXISTS idx_activity_plan_items_scope ON activity_plan_items(user_id, profile_id, topic_id);
            CREATE INDEX IF NOT EXISTS idx_completed_items_scope ON completed_items(user_id, profile_id, item_type);
            CREATE TABLE IF NOT EXISTS goals (
              id TEXT PRIMARY KEY,
              user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
              profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
              title TEXT NOT NULL,
              description TEXT,
              goal_type TEXT NOT NULL,
              target_value REAL NOT NULL,
              current_value REAL NOT NULL DEFAULT 0,
              unit TEXT,
              subject_id TEXT REFERENCES subjects(id) ON DELETE SET NULL,
              topic_id TEXT REFERENCES topics(id) ON DELETE SET NULL,
              period TEXT NOT NULL DEFAULT 'weekly',
              start_date TEXT NOT NULL,
              end_date TEXT,
              status TEXT NOT NULL DEFAULT 'active',
              created_at TEXT NOT NULL,
              updated_at TEXT NOT NULL,
              deleted_at TEXT
            );

            CREATE INDEX IF NOT EXISTS idx_goals_scope ON goals(user_id, profile_id, status);
            CREATE INDEX IF NOT EXISTS idx_goals_type ON goals(user_id, profile_id, goal_type);
            """
        )
        now = _now()
        with self._lock:
            self._conn.execute(
                """
                INSERT OR IGNORE INTO users (id, email, password_hash, name, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                [LOCAL_USER_ID, "local@focus.local", "local", "Usuário Local", now, now],
            )
            self._conn.execute(
                """
                INSERT OR IGNORE INTO profiles (id, user_id, name, avatar_id, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                [DEFAULT_PROFILE_ID, LOCAL_USER_ID, "Perfil Principal", "scholar", now, now],
            )
            self._conn.execute(
                """
                INSERT OR IGNORE INTO settings (
                  id, user_id, profile_id, pomodoro_minutes, short_break_minutes,
                  long_break_minutes, daily_goal_minutes, enable_sounds, theme, updated_at
                ) VALUES (?, ?, ?, 25, 5, 15, 120, 1, 'dark', ?)
                """,
                [DEFAULT_PROFILE_ID, LOCAL_USER_ID, DEFAULT_PROFILE_ID, now],
            )
            self._conn.commit()
