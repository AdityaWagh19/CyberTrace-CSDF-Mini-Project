import pandas as pd
from collections import Counter
from datetime import datetime
import os


def _normalize_log_columns(df: pd.DataFrame) -> pd.DataFrame:
    """Normalize common log column names to standard keys."""
    mapping = {
        "datetime": "timestamp",
        "time": "timestamp",
        "user": "username",
        "account": "username",
        "ip": "source_ip",
        "ip_address": "source_ip",
        "src_ip": "source_ip",
        "status": "event",
        "action": "event",
    }
    df = df.rename(columns={c: mapping[c.lower()] for c in df.columns if c.lower() in mapping})
    return df


def analyze_logs(file_path: str) -> dict:
    """Analyze authentication logs for suspicious activity."""
    if not os.path.exists(file_path):
        return {"error": f"Log file not found: {file_path}"}

    try:
        logs = pd.read_csv(file_path)
    except Exception as e:
        return {"error": f"Could not read log file: {str(e)}"}

    logs = _normalize_log_columns(logs)

    required_cols = ["timestamp", "username", "source_ip", "event"]
    for col in required_cols:
        if col not in logs.columns:
            return {"error": f"Missing required column: '{col}' (found: {list(logs.columns)})"}

    # Normalize event names
    logs["event_clean"] = logs["event"].astype(str).str.upper().str.strip()

    failed = logs[logs["event_clean"].str.contains("FAIL|DENIED|INVALID", na=False)].copy()
    successful = logs[logs["event_clean"].str.contains("SUCCESS|ACCEPT|OK|LOGIN_SUCCESS", na=False)].copy()

    attempts = (
        failed.groupby(["username", "source_ip"])
        .size()
        .reset_index(name="failed_attempts")
    )

    suspicious = attempts[attempts["failed_attempts"] >= 5].copy()

    # Detect successful logins after multiple failures for same user/IP
    success_after_failure = []
    for _, row in suspicious.iterrows():
        user = row["username"]
        ip = row["source_ip"]
        user_success = successful[(successful["username"] == user) & (successful["source_ip"] == ip)]
        if not user_success.empty:
            success_after_failure.append({
                "username": user,
                "source_ip": ip,
                "failed_attempts": int(row["failed_attempts"]),
                "subsequent_success_count": len(user_success),
            })

    results = {
        "file_path": file_path,
        "total_records": len(logs),
        "total_failed": len(failed),
        "total_successful": len(successful),
        "suspicious_attempts": suspicious.to_dict(orient="records"),
        "top_suspicious": suspicious.sort_values("failed_attempts", ascending=False).head(10).to_dict(orient="records") if not suspicious.empty else [],
        "success_after_failure": success_after_failure,
        "unique_users": logs["username"].nunique() if "username" in logs.columns else 0,
        "unique_ips": logs["source_ip"].nunique() if "source_ip" in logs.columns else 0,
    }

    return results


def detect_brute_force(file_path: str, threshold: int = 5) -> dict:
    """Detect brute force attacks from log data."""
    if not os.path.exists(file_path):
        return {"error": f"Log file not found: {file_path}"}

    try:
        logs = pd.read_csv(file_path)
    except Exception as e:
        return {"error": f"Could not read log file: {str(e)}"}

    logs = _normalize_log_columns(logs)

    if "username" not in logs.columns or "source_ip" not in logs.columns or "event" not in logs.columns:
        return {"error": "Log file missing required columns: username, source_ip, event"}

    logs["event_clean"] = logs["event"].astype(str).str.upper().str.strip()
    failed = logs[logs["event_clean"].str.contains("FAIL|DENIED|INVALID", na=False)]

    attempts = (
        failed.groupby(["username", "source_ip"])
        .size()
        .reset_index(name="failed_attempts")
    )

    brute_force = attempts[attempts["failed_attempts"] >= threshold].copy()

    entries = brute_force.to_dict(orient="records")
    return {
        "file_path": file_path,
        "brute_force_detected": len(entries) > 0,
        "brute_force_entries": entries,
        "threshold": threshold,
        "total_attack_sources": len(entries),
    }


def detect_off_hours_logins(file_path: str, work_start: int = 7, work_end: int = 20) -> dict:
    """
    Detect successful logins outside normal working hours (e.g., between 20:00 and 07:00).
    """
    if not os.path.exists(file_path):
        return {"error": f"Log file not found: {file_path}"}

    try:
        logs = pd.read_csv(file_path)
    except Exception as e:
        return {"error": f"Could not read log file: {str(e)}"}

    logs = _normalize_log_columns(logs)

    if "timestamp" not in logs.columns or "event" not in logs.columns:
        return {"error": "Log file missing required columns: timestamp, event"}

    logs_copy = logs.copy()
    logs_copy["dt"] = pd.to_datetime(logs_copy["timestamp"], errors="coerce")
    logs_copy["hour"] = logs_copy["dt"].dt.hour
    logs_copy["event_clean"] = logs_copy["event"].astype(str).str.upper().str.strip()

    # Off-hours: before work_start (e.g. 7 AM) OR after work_end (e.g. 8 PM)
    off_hours = logs_copy[(logs_copy["hour"] < work_start) | (logs_copy["hour"] >= work_end)]
    off_hour_success = off_hours[off_hours["event_clean"].str.contains("SUCCESS|ACCEPT|OK|LOGIN_SUCCESS", na=False)]

    records = off_hour_success[["timestamp", "username", "source_ip", "event"]].to_dict(orient="records") if not off_hour_success.empty else []

    return {
        "file_path": file_path,
        "off_hours_logins": records,
        "total_off_hours_logins": len(records),
        "working_window": f"{work_start:02d}:00 to {work_end:02d}:00",
    }


def detect_unknown_ip(file_path: str, known_ips: list = None) -> dict:
    """Detect logins from unknown or untrusted IPs."""
    if not os.path.exists(file_path):
        return {"error": f"Log file not found: {file_path}"}

    if known_ips is None:
        known_ips = ["192.168.1.1", "10.0.0.1", "172.16.0.1", "127.0.0.1", "192.168.1.10"]

    try:
        logs = pd.read_csv(file_path)
    except Exception as e:
        return {"error": f"Could not read log file: {str(e)}"}

    logs = _normalize_log_columns(logs)

    if "source_ip" not in logs.columns:
        return {"error": "Log file missing 'source_ip' column"}

    unknown_entries = logs[~logs["source_ip"].astype(str).isin(known_ips)].copy()

    return {
        "file_path": file_path,
        "unknown_ip_logins": unknown_entries.head(20).to_dict(orient="records"),
        "total_unknown_ip": len(unknown_entries),
        "unique_unknown_ips": unknown_entries["source_ip"].unique().tolist(),
        "known_ips_checked": known_ips,
    }