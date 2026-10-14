"""Execute the app's actual migration SQL against SQLite, not an in-memory JS mock."""
import re
import sqlite3
import unittest
from pathlib import Path

SOURCE = Path(__file__).resolve().parents[1] / 'src/data/schema.ts'
SQL = re.search(r'export const SCHEMA_V1 = `([\s\S]*?)`;', SOURCE.read_text()).group(1)

class SqliteContract(unittest.TestCase):
    def setUp(self):
        self.db = sqlite3.connect(':memory:')
        self.db.executescript(SQL)
    def tearDown(self):
        self.db.close()
    def test_migration_is_idempotent(self):
        self.db.executescript(SQL)
        tables = {r[0] for r in self.db.execute("SELECT name FROM sqlite_master WHERE type='table'")}
        self.assertEqual(tables, {'feed_pages', 'bookmarks', 'metadata'})
    def test_feed_namespace_and_page_are_unique(self):
        self.db.execute("INSERT INTO feed_pages VALUES ('demo', 0, '{}')")
        self.db.execute("INSERT INTO feed_pages VALUES ('hn', 0, '{}')")
        with self.assertRaises(sqlite3.IntegrityError):
            self.db.execute("INSERT INTO feed_pages VALUES ('demo', 0, '{}')")
    def test_invalid_source_and_page_rejected(self):
        for source, page in [('bad', 0), ('hn', -1)]:
            with self.assertRaises(sqlite3.IntegrityError):
                self.db.execute('INSERT INTO feed_pages VALUES (?, ?, ?)', (source, page, '{}'))
    def test_cache_clear_preserves_bookmarks(self):
        self.db.execute("INSERT INTO bookmarks VALUES ('demo-1', '{}', '2026-10-14')")
        self.db.execute("INSERT INTO feed_pages VALUES ('demo', 0, '{}')")
        self.db.execute('DELETE FROM feed_pages')
        self.assertEqual(self.db.execute('SELECT COUNT(*) FROM bookmarks').fetchone()[0], 1)
    def test_bound_payload_cannot_execute_sql(self):
        value = "'); DROP TABLE bookmarks; --"
        self.db.execute('INSERT INTO metadata VALUES (?, ?)', ('x', value))
        self.assertEqual(self.db.execute('SELECT value FROM metadata').fetchone()[0], value)
        self.db.execute('SELECT * FROM bookmarks')
    def test_bookmark_upsert_is_idempotent_and_preserves_save_order(self):
        sql = 'INSERT INTO bookmarks VALUES (?, ?, ?) ON CONFLICT(id) DO UPDATE SET payload = excluded.payload'
        self.db.execute(sql, ('demo-1', 'old', 'first'))
        self.db.execute(sql, ('demo-1', 'new', 'second'))
        self.assertEqual(self.db.execute('SELECT payload, saved_at FROM bookmarks').fetchall(), [('new', 'first')])

if __name__ == '__main__':
    unittest.main(verbosity=2)
