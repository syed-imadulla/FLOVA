"""SQLite storage. Two tables: riders and their weekly payouts.

The self-salary plan is never stored: it is replayed from the payouts each
time, so editing or undoing a payout can never leave a stale buffer behind.
"""

from __future__ import annotations

import os
import sqlite3
from contextlib import contextmanager
from typing import Iterator

SCHEMA = """
CREATE TABLE IF NOT EXISTS riders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT UNIQUE,
    essentials_per_week REAL NOT NULL CHECK (essentials_per_week > 0),
    start_buffer REAL NOT NULL DEFAULT 0 CHECK (start_buffer >= 0),
    start_week INTEGER NOT NULL DEFAULT 0 CHECK (start_week >= 0),
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS payouts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    rider_id INTEGER NOT NULL REFERENCES riders(id) ON DELETE CASCADE,
    amount REAL NOT NULL,
    note TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_payouts_rider ON payouts(rider_id, id);
"""


def db_path() -> str:
    return os.environ.get("FLOVA_DB", os.path.join(os.path.dirname(__file__), "..", "flova.db"))


def connect() -> sqlite3.Connection:
    conn = sqlite3.connect(db_path())
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


@contextmanager
def get_conn() -> Iterator[sqlite3.Connection]:
    conn = connect()
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def init_db() -> None:
    with get_conn() as conn:
        conn.executescript(SCHEMA)
