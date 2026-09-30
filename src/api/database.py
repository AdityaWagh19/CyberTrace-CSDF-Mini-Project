import hashlib
import json
import os
import sqlite3
from datetime import datetime
from pathlib import Path

# Paths
API_DIR = Path(__file__).resolve().parent
SRC_DIR = API_DIR.parent
PROJECT_ROOT = SRC_DIR.parent

# Primary evidence directory in project root, with fallback
EVIDENCE_DIR = PROJECT_ROOT / "evidence"
EVIDENCE_DIR.mkdir(parents=True, exist_ok=True)

DB_PATH = PROJECT_ROOT / "evidence.db"

DEFAULT_CIA_SCORES = [
    ("Log Forensics", 8, 8, 7, "Detects unauthorized access and event timelines"),
    ("Network Forensics", 9, 7, 9, "Identifies data transfer, scans, and disruption"),
    ("File Integrity Analysis", 5, 10, 7, "Proves whether files were modified"),
    ("Malware Signature Analysis", 8, 8, 8, "Detects malicious files and persistence indicators"),
    ("Metadata Forensics", 6, 7, 5, "Provides file context and timeline clues"),
    ("Deleted-File Analysis", 7, 9, 6, "Identifies evidence destruction and data loss"),
]


def get_db_connection():
    """Return a database connection with row factory enabled."""
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    return conn


def calculate_sha256(file_path: str) -> str:
    """Calculate SHA-256 hash of a file."""
    sha256 = hashlib.sha256()
    with open(file_path, "rb") as f:
        for block in iter(lambda: f.read(4096), b""):
            sha256.update(block)
    return sha256.hexdigest()


def calculate_md5(file_path: str) -> str:
    """Calculate MD5 hash of a file."""
    md5 = hashlib.md5()
    with open(file_path, "rb") as f:
        for block in iter(lambda: f.read(4096), b""):
            md5.update(block)
    return md5.hexdigest()


def init_db():
    """Initialize database tables and constraints."""
    conn = sqlite3.connect(str(DB_PATH))
    c = conn.cursor()
    c.execute("""
        CREATE TABLE IF NOT EXISTS cases (
            case_id INTEGER PRIMARY KEY AUTOINCREMENT,
            case_name TEXT NOT NULL,
            investigator TEXT,
            created_at TEXT NOT NULL,
            status TEXT DEFAULT 'OPEN',
            description TEXT
        )
    """)
    c.execute("""
        CREATE TABLE IF NOT EXISTS evidence (
            evidence_id INTEGER PRIMARY KEY AUTOINCREMENT,
            case_id INTEGER NOT NULL,
            file_name TEXT NOT NULL,
            evidence_type TEXT NOT NULL,
            source TEXT,
            collected_at TEXT,
            sha256_hash TEXT NOT NULL,
            status TEXT,
            notes TEXT,
            FOREIGN KEY (case_id) REFERENCES cases(case_id)
        )
    """)
    c.execute("""
        CREATE TABLE IF NOT EXISTS findings (
            finding_id INTEGER PRIMARY KEY AUTOINCREMENT,
            case_id INTEGER NOT NULL,
            evidence_id INTEGER,
            technique TEXT NOT NULL,
            finding TEXT NOT NULL,
            severity TEXT,
            confidence REAL,
            created_at TEXT NOT NULL,
            FOREIGN KEY (case_id) REFERENCES cases(case_id),
            FOREIGN KEY (evidence_id) REFERENCES evidence(evidence_id)
        )
    """)
    c.execute("""
        CREATE TABLE IF NOT EXISTS cia_scores (
            score_id INTEGER PRIMARY KEY AUTOINCREMENT,
            case_id INTEGER NOT NULL,
            technique TEXT NOT NULL,
            confidentiality INTEGER,
            integrity INTEGER,
            availability INTEGER,
            justification TEXT,
            FOREIGN KEY (case_id) REFERENCES cases(case_id)
        )
    """)
    conn.commit()
    conn.close()


def initialize_case_cia_scores(case_id: int):
    """Seed default CIA evaluation scores for a case if not already present."""
    conn = sqlite3.connect(str(DB_PATH))
    c = conn.cursor()
    c.execute("SELECT COUNT(*) FROM cia_scores WHERE case_id=?", (case_id,))
    count = c.fetchone()[0]
    if count == 0:
        for technique, conf, integ, avail, just in DEFAULT_CIA_SCORES:
            c.execute(
                "INSERT INTO cia_scores (case_id, technique, confidentiality, integrity, availability, justification) VALUES (?, ?, ?, ?, ?, ?)",
                (case_id, technique, conf, integ, avail, just),
            )
        conn.commit()
    conn.close()


def add_finding(case_id: int, technique: str, finding: str, severity: str = "MEDIUM", confidence: float = 8.0, evidence_id: int = None):
    """Insert a forensic finding for a given case."""
    conn = sqlite3.connect(str(DB_PATH))
    c = conn.cursor()
    created_at = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    c.execute(
        "INSERT INTO findings (case_id, evidence_id, technique, finding, severity, confidence, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
        (case_id, evidence_id, technique, finding, severity.upper(), confidence, created_at),
    )
    finding_id = c.lastrowid
    conn.commit()
    conn.close()
    return finding_id


# Initialize DB upon import
init_db()