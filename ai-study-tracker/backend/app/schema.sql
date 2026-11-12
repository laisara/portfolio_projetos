PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT);
CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);

-- Catálogo (vem de data/catalog.json) --------------------------------------
CREATE TABLE IF NOT EXISTS tracks (
  id TEXT PRIMARY KEY, ord INTEGER NOT NULL, title TEXT NOT NULL,
  group_name TEXT NOT NULL DEFAULT '', header_min REAL
);
CREATE TABLE IF NOT EXISTS contents (
  id TEXT PRIMARY KEY, title TEXT NOT NULL, type TEXT NOT NULL DEFAULT 'curso',
  study_ord INTEGER NOT NULL, competencies TEXT NOT NULL DEFAULT '[]',
  card_min REAL, duration_min REAL NOT NULL, lesson_count INTEGER NOT NULL, note TEXT,
  optional INTEGER NOT NULL DEFAULT 0, elective_of TEXT
);
-- Um curso pode aparecer em várias trilhas; o cadastro e o progresso são únicos.
CREATE TABLE IF NOT EXISTS appearances (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  content_id TEXT NOT NULL REFERENCES contents(id) ON DELETE CASCADE,
  track_id TEXT NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
  position INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS modules (
  id TEXT PRIMARY KEY, content_id TEXT NOT NULL REFERENCES contents(id) ON DELETE CASCADE,
  ord INTEGER NOT NULL, title TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS lessons (
  id TEXT PRIMARY KEY, module_id TEXT NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  content_id TEXT NOT NULL, ord INTEGER NOT NULL, num INTEGER NOT NULL, seq INTEGER NOT NULL,
  title TEXT NOT NULL, duration_min REAL NOT NULL DEFAULT 0, has_duration INTEGER NOT NULL DEFAULT 1,
  kind TEXT NOT NULL DEFAULT 'video'
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
