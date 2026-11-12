PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT);
CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);

-- Catálogo -----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tracks (
  id TEXT PRIMARY KEY, ord INTEGER NOT NULL, title TEXT NOT NULL, name TEXT,
  confirmed INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS contents (
  id TEXT PRIMARY KEY, title TEXT NOT NULL, instructor TEXT, nature TEXT,
  practice_ratio REAL NOT NULL, duration_min REAL NOT NULL, lesson_count INTEGER,
  lessons_known INTEGER NOT NULL DEFAULT 0, intro INTEGER NOT NULL DEFAULT 0,
  verify INTEGER NOT NULL DEFAULT 0, confidence TEXT NOT NULL DEFAULT '{}',
  study_ord INTEGER NOT NULL, competencies TEXT NOT NULL DEFAULT '[]', overlap_note TEXT, nature_default_ratio REAL
);
-- Aparições de um curso nos prints. track_id NULL = trilha A VERIFICAR.
CREATE TABLE IF NOT EXISTS appearances (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  content_id TEXT NOT NULL REFERENCES contents(id) ON DELETE CASCADE,
  track_id TEXT, position INTEGER NOT NULL, inferred_group TEXT
);
CREATE TABLE IF NOT EXISTS modules (
  id TEXT PRIMARY KEY, content_id TEXT NOT NULL REFERENCES contents(id) ON DELETE CASCADE,
  ord INTEGER NOT NULL, title TEXT NOT NULL, verify INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS lessons (
  id TEXT PRIMARY KEY, module_id TEXT NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  content_id TEXT NOT NULL, ord INTEGER NOT NULL, seq INTEGER NOT NULL,
  title TEXT NOT NULL, duration_min REAL NOT NULL,
  verify INTEGER NOT NULL DEFAULT 0, segment INTEGER NOT NULL DEFAULT 0
);

-- Progresso real (sem FK: sobrevive à reimportação do catálogo) -------------
CREATE TABLE IF NOT EXISTS lesson_progress (
  lesson_id TEXT PRIMARY KEY, completed_on TEXT, watched_min REAL NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL, type TEXT NOT NULL CHECK (type IN ('VIDEO','PRACTICE','PROJECT','REVIEW','OTHER')),
  target_kind TEXT NOT NULL DEFAULT 'free', target_id TEXT,
  title TEXT NOT NULL, planned_min REAL NOT NULL DEFAULT 0, actual_min REAL NOT NULL,
  notes TEXT NOT NULL DEFAULT '', status TEXT NOT NULL DEFAULT 'done' CHECK (status IN ('done','partial','missed')),
  focus INTEGER NOT NULL DEFAULT 0, started_at TEXT, ended_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);
CREATE INDEX IF NOT EXISTS ix_sessions_date ON sessions(date);
CREATE TABLE IF NOT EXISTS review_log (
  review_key TEXT PRIMARY KEY, learned_on TEXT NOT NULL, interval_days INTEGER NOT NULL,
  due_on TEXT NOT NULL, done_on TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS achievements_unlocked (id TEXT PRIMARY KEY, unlocked_on TEXT NOT NULL);

-- AI Agent Lab -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS lab_stages (
  id TEXT PRIMARY KEY, ord INTEGER NOT NULL, title TEXT NOT NULL, subtitle TEXT,
  objective TEXT, implementation TEXT, competencies TEXT NOT NULL DEFAULT '[]',
  unlock_after TEXT, planned_hours REAL NOT NULL, status TEXT NOT NULL DEFAULT 'locked',
  notes TEXT NOT NULL DEFAULT '', repo_url TEXT NOT NULL DEFAULT ''
);
CREATE TABLE IF NOT EXISTS lab_tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT, stage_id TEXT NOT NULL REFERENCES lab_stages(id) ON DELETE CASCADE,
  ord INTEGER NOT NULL, title TEXT NOT NULL, done_on TEXT
);
CREATE TABLE IF NOT EXISTS lab_milestones (
  id INTEGER PRIMARY KEY AUTOINCREMENT, stage_id TEXT NOT NULL REFERENCES lab_stages(id) ON DELETE CASCADE,
  ord INTEGER NOT NULL, title TEXT NOT NULL, done_on TEXT
);

-- Planejamento -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS plan_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT, date TEXT NOT NULL, seq INTEGER NOT NULL,
  kind TEXT NOT NULL, ref TEXT, title TEXT NOT NULL, minutes REAL NOT NULL,
  content_id TEXT, phase TEXT, detail TEXT NOT NULL DEFAULT '{}', rev INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS ix_plan_date ON plan_items(date);
CREATE TABLE IF NOT EXISTS day_baseline (
  date TEXT PRIMARY KEY, planned_min REAL NOT NULL, items TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS plan_revisions (
  rev INTEGER PRIMARY KEY AUTOINCREMENT, generated_at TEXT NOT NULL, from_date TEXT NOT NULL,
  end_date TEXT, total_min REAL NOT NULL, reason TEXT NOT NULL
);
