// Migration SQL is also exercised by tests/sqlite_test.py against real SQLite.
export const SCHEMA_V1 = `
CREATE TABLE IF NOT EXISTS feed_pages (
  source TEXT NOT NULL CHECK(source IN ('demo', 'hn')),
  page INTEGER NOT NULL CHECK(page >= 0),
  payload TEXT NOT NULL,
  PRIMARY KEY(source, page)
);
CREATE TABLE IF NOT EXISTS bookmarks (
  id TEXT PRIMARY KEY NOT NULL,
  payload TEXT NOT NULL,
  saved_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS metadata (
  key TEXT PRIMARY KEY NOT NULL,
  value TEXT NOT NULL
);
`;
