import os
import pandas as pd
from pathlib import Path


def _normalize_deletion_columns(df: pd.DataFrame) -> pd.DataFrame:
    """Normalize file event columns to standard names."""
    mapping = {
        "datetime": "timestamp",
        "time": "timestamp",
        "username": "user",
        "actor": "user",
        "file": "path",
        "file_path": "path",
        "filename": "path",
        "action": "event",
        "operation": "event",
        "file_hash": "hash",
        "sha256": "hash",
    }
    df = df.rename(columns={c: mapping[c.lower()] for c in df.columns if c.lower() in mapping})
    return df


def analyze_deletion_events(file_path: str) -> dict:
    """Analyze file deletion logs for anti-forensic patterns and sensitive file tampering."""
    if not os.path.exists(file_path):
        return {"error": f"Event file not found: {file_path}"}

    try:
        events = pd.read_csv(file_path)
    except Exception as e:
        return {"error": f"Could not read deletion event file: {str(e)}"}

    events = _normalize_deletion_columns(events)

    required_cols = ["timestamp", "user", "path", "event"]
    for col in required_cols:
        if col not in events.columns:
            return {"error": f"Missing required column: '{col}' (found: {list(events.columns)})"}

    events["event_clean"] = events["event"].astype(str).str.upper().str.strip()

    # Filter deletion events
    deleted = events[events["event_clean"].str.contains("DELETE|REMOV|DROP|UNLINK", na=False)].copy()

    # Suspicious sensitive keywords
    sensitive_keywords = [
        "password", "credential", "log", "evidence", "audit", "secret",
        "history", "shadow", "bash_history", "security", "dump", "key"
    ]

    suspicious = deleted[
        deleted["path"].str.contains(
            "|".join(sensitive_keywords),
            case=False,
            na=False,
        )
    ].copy()

    suspicious_records = suspicious.head(30).to_dict(orient="records")

    return {
        "file_path": file_path,
        "total_events": len(events),
        "total_deletions": len(deleted),
        "suspicious_deletions": len(suspicious),
        "suspicious_events": suspicious_records,
        "sensitive_files_targeted": suspicious["path"].unique().tolist() if not suspicious.empty else [],
        "deleting_users": deleted["user"].unique().tolist() if not deleted.empty else [],
        "all_events": events.head(50).to_dict(orient="records"),
    }


def detect_repeated_deletions(file_path: str) -> dict:
    """Detect repeated deletions of the same file path (evidence destruction attempts)."""
    if not os.path.exists(file_path):
        return {"error": f"Event file not found: {file_path}"}

    try:
        events = pd.read_csv(file_path)
    except Exception as e:
        return {"error": f"Could not read event file: {str(e)}"}

    events = _normalize_deletion_columns(events)

    if "event" not in events.columns or "path" not in events.columns:
        return {"error": "Missing required columns: path, event"}

    events["event_clean"] = events["event"].astype(str).str.upper().str.strip()
    deleted_events = events[events["event_clean"].str.contains("DELETE|REMOV|DROP|UNLINK", na=False)].copy()

    if deleted_events.empty:
        return {
            "file_path": file_path,
            "no_deletions": True,
            "message": "No deletion events found in log",
            "files_deleted_multiple_times": [],
            "total_files_with_repeated_deletions": 0,
        }

    # Count deletions per file path
    deletion_counts = deleted_events.groupby("path").size().reset_index(name="deletion_count")
    repeated = deletion_counts[deletion_counts["deletion_count"] > 1].sort_values("deletion_count", ascending=False)

    return {
        "file_path": file_path,
        "files_deleted_multiple_times": repeated.to_dict(orient="records"),
        "total_files_with_repeated_deletions": len(repeated),
        "total_repeated_deletion_events": int(repeated["deletion_count"].sum()) if not repeated.empty else 0,
    }


def analyze_deletion_timeline(file_path: str, case_id: str = None) -> dict:
    """Analyze deletion timeline relative to file creation and modification events."""
    if not os.path.exists(file_path):
        return {"error": f"Event file not found: {file_path}"}

    try:
        events = pd.read_csv(file_path)
    except Exception as e:
        return {"error": f"Could not read event file: {str(e)}"}

    events = _normalize_deletion_columns(events)

    if "event" not in events.columns:
        return {"error": "Missing 'event' column"}

    events["event_clean"] = events["event"].astype(str).str.upper().str.strip()

    deleted = events[events["event_clean"].str.contains("DELETE|REMOV|DROP|UNLINK", na=False)].copy()
    created = events[events["event_clean"].str.contains("CREATE|NEW|TOUCH", na=False)].copy()
    modified = events[events["event_clean"].str.contains("MODIFY|UPDATE|WRITE|EDIT", na=False)].copy()

    timeline = {
        "file_path": file_path,
        "total_events": len(events),
        "total_created": len(created),
        "total_modified": len(modified),
        "total_deleted": len(deleted),
        "earliest_deletion": None,
        "latest_deletion": None,
    }

    if "timestamp" in events.columns and not deleted.empty:
        try:
            deleted["ts"] = pd.to_datetime(deleted["timestamp"], errors="coerce")
            valid_ts = deleted["ts"].dropna()
            if not valid_ts.empty:
                timeline["earliest_deletion"] = valid_ts.min().isoformat()
                timeline["latest_deletion"] = valid_ts.max().isoformat()
        except Exception:
            pass

    return timeline