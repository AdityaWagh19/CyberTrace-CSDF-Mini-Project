import os
import sys
import shutil
import sqlite3
from datetime import datetime
from pathlib import Path
from contextlib import asynccontextmanager
from typing import Optional, List, Union

from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Ensure API directory is in python path
API_DIR = Path(__file__).resolve().parent
if str(API_DIR) not in sys.path:
    sys.path.insert(0, str(API_DIR))

from database import (
    DB_PATH,
    EVIDENCE_DIR,
    init_db,
    initialize_case_cia_scores,
    add_finding,
    calculate_sha256,
    calculate_md5,
)
from correlation_engine import (
    get_case_db,
    correlate_findings,
    calculate_risk_score,
    evaluate_ci_scores,
    get_cia_interpretation,
)
from log_forensics import (
    analyze_logs,
    detect_brute_force,
    detect_off_hours_logins,
    detect_unknown_ip,
)
from network_forensics import (
    capture_pcap_analysis,
    detect_large_transfers,
    detect_dns_queries,
)
from file_integrity import (
    verify_file_integrity,
    batch_hash_directory,
)
from malware_analysis import (
    load_malware_database,
    check_hash_against_database,
    yara_rule_match,
    suspicious_file_extension,
    entropy_analysis,
)
from metadata_forensics import (
    get_file_metadata,
    get_pdf_metadata,
    get_image_metadata,
    compare_metadata,
)
from deleted_file_analysis import (
    analyze_deletion_events,
    detect_repeated_deletions,
    analyze_deletion_timeline,
)

init_db()

@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        conn = sqlite3.connect(str(DB_PATH))
        c = conn.cursor()
        c.execute("SELECT COUNT(*) FROM cases")
        count = c.fetchone()[0]
        conn.close()
        if count == 0:
            try:
                from seed_data import create_synthetic_dataset
                create_synthetic_dataset()
            except Exception as e:
                print("Auto-seed error on startup:", e)
    except Exception as err:
        print("Database check error on startup:", err)
    yield

app = FastAPI(
    title="CyberTrace - Cyber Crime Investigation Forensic Analysis System",
    description="Multi-technique forensic analysis API with CIA Triad correlation and reporting.",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def resolve_evidence_path(file_path: str) -> str:
    """Resolve a relative or absolute file path to the evidence directory if needed."""
    if not file_path:
        return ""
    p = Path(file_path)
    if p.is_absolute() and p.exists():
        return str(p)
    if p.exists():
        return str(p)
    in_evidence = EVIDENCE_DIR / p.name
    if in_evidence.exists():
        return str(in_evidence)
    in_evidence_rel = EVIDENCE_DIR / file_path
    if in_evidence_rel.exists():
        return str(in_evidence_rel)
    return str(EVIDENCE_DIR / p.name)


async def get_request_data(request: Request) -> dict:
    """Extract parameters seamlessly from JSON body, FormData, or Query parameters."""
    ct = request.headers.get("content-type", "").lower()
    data = {}
    if "application/json" in ct:
        try:
            data = await request.json()
        except Exception:
            data = {}
    elif "multipart/form-data" in ct or "application/x-www-form-urlencoded" in ct:
        form = await request.form()
        data = dict(form)
    # Merge query parameters as fallback
    for k, v in request.query_params.items():
        if k not in data or data[k] is None:
            data[k] = v
    return data


# --- Case Management Endpoints ---

@app.post("/api/cases/")
async def create_case(request: Request):
    """Create a new investigation case and initialize default CIA scores."""
    data = await get_request_data(request)
    name = data.get("case_name") or f"Case-{int(datetime.now().timestamp())}"
    inv = data.get("investigator") or "Forensic Analyst"
    desc = data.get("description") or "Investigation Case"

    conn = sqlite3.connect(str(DB_PATH))
    c = conn.cursor()
    created_at = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    c.execute(
        "INSERT INTO cases (case_name, investigator, created_at, status, description) VALUES (?, ?, ?, 'OPEN', ?)",
        (name, inv, created_at, desc),
    )
    case_id = c.lastrowid
    conn.commit()
    conn.close()

    initialize_case_cia_scores(case_id)
    return {"case_id": case_id, "case_name": name, "investigator": inv, "created_at": created_at, "status": "OPEN"}


@app.get("/api/cases/")
def list_cases():
    """List all registered forensic cases."""
    conn = sqlite3.connect(str(DB_PATH))
    c = conn.cursor()
    c.execute("SELECT case_id, case_name, investigator, created_at, status, description FROM cases ORDER BY case_id ASC")
    cases = c.fetchall()
    conn.close()

    return [
        {
            "case_id": row[0],
            "case_name": row[1],
            "investigator": row[2] or "Unknown",
            "created_at": row[3],
            "status": row[4] or "OPEN",
            "description": row[5] or "",
        }
        for row in cases
    ]


# --- Evidence Upload & Registration ---

@app.post("/api/evidence/upload/")
def upload_evidence(
    case_id: int = Form(1),
    file: UploadFile = File(...),
    evidence_type: str = Form("general"),
    source: Optional[str] = Form("Investigator Workspace"),
    notes: Optional[str] = Form(""),
):
    """Upload digital evidence, compute cryptographic hashes, and register in database."""
    file_path = EVIDENCE_DIR / file.filename
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    sha256_hash = calculate_sha256(str(file_path))
    md5_hash_value = calculate_md5(str(file_path))

    conn = sqlite3.connect(str(DB_PATH))
    c = conn.cursor()
    collected_at = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    c.execute(
        "INSERT INTO evidence (case_id, file_name, evidence_type, source, collected_at, sha256_hash, status, notes) VALUES (?, ?, ?, ?, ?, ?, 'VERIFIED', ?)",
        (case_id, file.filename, evidence_type, source, collected_at, sha256_hash, notes),
    )
    evidence_id = c.lastrowid
    conn.commit()
    conn.close()

    return {
        "evidence_id": evidence_id,
        "case_id": case_id,
        "file_name": file.filename,
        "file_path": str(file_path),
        "sha256_hash": sha256_hash,
        "md5_hash": md5_hash_value,
        "evidence_type": evidence_type,
        "collected_at": collected_at,
        "status": "VERIFIED",
    }


# --- Forensic Analysis Endpoints ---

@app.post("/api/forensics/analyze-logs/")
async def analyze_logs_endpoint(request: Request):
    data = await get_request_data(request)
    raw_path = data.get("file_path", "")
    target_case = data.get("case_id")
    if target_case:
        try:
            target_case = int(target_case)
        except ValueError:
            target_case = None

    path = resolve_evidence_path(raw_path)
    result = analyze_logs(path)

    if target_case and "error" not in result:
        if result.get("total_failed", 0) >= 5:
            add_finding(
                case_id=target_case,
                technique="Log Forensics",
                finding=f"Multiple failed logins detected ({result['total_failed']} failures across {len(result.get('suspicious_attempts', []))} sources)",
                severity="HIGH",
                confidence=9.0,
            )
        if result.get("success_after_failure"):
            for s in result["success_after_failure"]:
                add_finding(
                    case_id=target_case,
                    technique="Log Forensics",
                    finding=f"Suspicious successful login after {s['failed_attempts']} failed attempts for account '{s['username']}' from {s['source_ip']}",
                    severity="HIGH",
                    confidence=9.5,
                )
    return result


@app.post("/api/forensics/detect-brute-force/")
async def detect_brute_force_endpoint(request: Request):
    data = await get_request_data(request)
    raw_path = data.get("file_path", "")
    th = int(data.get("threshold", 5))
    target_case = data.get("case_id")
    if target_case:
        try:
            target_case = int(target_case)
        except ValueError:
            target_case = None

    path = resolve_evidence_path(raw_path)
    result = detect_brute_force(path, th)
    if target_case and result.get("brute_force_detected"):
        for entry in result.get("brute_force_entries", []):
            add_finding(
                case_id=target_case,
                technique="Log Forensics",
                finding=f"Brute-force attack detected on account '{entry.get('username')}' from {entry.get('source_ip')} ({entry.get('failed_attempts')} attempts >= threshold {th})",
                severity="HIGH",
                confidence=9.5,
            )
    return result


@app.post("/api/forensics/off-hours-logins/")
async def off_hours_logins_endpoint(request: Request):
    data = await get_request_data(request)
    raw_path = data.get("file_path", "")
    target_case = data.get("case_id")
    if target_case:
        try:
            target_case = int(target_case)
        except ValueError:
            target_case = None

    path = resolve_evidence_path(raw_path)
    result = detect_off_hours_logins(path)
    if target_case and result.get("total_off_hours_logins", 0) > 0:
        add_finding(
            case_id=target_case,
            technique="Log Forensics",
            finding=f"Identified {result['total_off_hours_logins']} successful logins outside standard business hours",
            severity="MEDIUM",
            confidence=8.0,
        )
    return result


@app.post("/api/forensics/unknown-ip/")
async def unknown_ip_endpoint(request: Request):
    data = await get_request_data(request)
    raw_path = data.get("file_path", "")
    raw_ips = data.get("known_ips") or "192.168.1.1,10.0.0.1,172.16.0.1"
    if isinstance(raw_ips, list):
        ip_list = raw_ips
    else:
        ip_list = [ip.strip() for ip in str(raw_ips).split(",") if ip.strip()]

    path = resolve_evidence_path(raw_path)
    result = detect_unknown_ip(path, ip_list)
    return result


# --- Network Forensics ---

@app.post("/api/forensics/analyze-pcap/")
async def analyze_pcap_endpoint(request: Request):
    data = await get_request_data(request)
    raw_path = data.get("file_path", "")
    limit = int(data.get("packet_limit", 5000))
    target_case = data.get("case_id")
    if target_case:
        try:
            target_case = int(target_case)
        except ValueError:
            target_case = None

    path = resolve_evidence_path(raw_path)
    result = capture_pcap_analysis(path, limit)

    if target_case and "error" not in result:
        scans = result.get("port_scan_detections", {})
        if scans:
            for ip, count in scans.items():
                add_finding(
                    case_id=target_case,
                    technique="Network Forensics",
                    finding=f"Port reconnaissance scan detected: IP {ip} contacted {count} distinct ports",
                    severity="HIGH",
                    confidence=9.0,
                )
    return result


@app.post("/api/forensics/large-transfers/")
async def large_transfers_endpoint(request: Request):
    data = await get_request_data(request)
    raw_path = data.get("file_path", "")
    th = int(data.get("threshold_bytes", 1000000))
    target_case = data.get("case_id")
    if target_case:
        try:
            target_case = int(target_case)
        except ValueError:
            target_case = None

    path = resolve_evidence_path(raw_path)
    result = detect_large_transfers(path, th)
    if target_case and result.get("large_transfers", 0) > 0:
        add_finding(
            case_id=target_case,
            technique="Network Forensics",
            finding=f"Potential data exfiltration: Detected {result['large_transfers']} large outbound data transfer packets (> {th} bytes)",
            severity="HIGH",
            confidence=8.5,
        )
    return result


@app.post("/api/forensics/dns-queries/")
async def dns_queries_endpoint(request: Request):
    data = await get_request_data(request)
    raw_path = data.get("file_path", "")
    kw = data.get("domain_keywords")
    if isinstance(kw, list):
        kw_list = kw
    elif isinstance(kw, str) and kw.strip():
        kw_list = [k.strip() for k in kw.split(",") if k.strip()]
    else:
        kw_list = None

    path = resolve_evidence_path(raw_path)
    result = detect_dns_queries(path, kw_list)
    return result


# --- File Integrity Analysis ---

@app.post("/api/forensics/hash-file/")
async def hash_file_endpoint(request: Request):
    data = await get_request_data(request)
    raw_path = data.get("file_path", "")
    path = resolve_evidence_path(raw_path)
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail=f"File not found: {raw_path}")

    sha256 = calculate_sha256(path)
    md5 = calculate_md5(path)
    return {"sha256": sha256, "md5": md5, "file_path": raw_path, "resolved_path": path}


@app.post("/api/forensics/verify-integrity/")
async def verify_integrity_endpoint(request: Request):
    data = await get_request_data(request)
    raw_path = data.get("file_path", "")
    b_hash = data.get("baseline_hash", "")
    target_case = data.get("case_id")
    if target_case:
        try:
            target_case = int(target_case)
        except ValueError:
            target_case = None

    path = resolve_evidence_path(raw_path)
    result = verify_file_integrity(path, b_hash)

    if target_case and result.get("status") == "MODIFIED":
        add_finding(
            case_id=target_case,
            technique="File Integrity Analysis",
            finding=f"File tampering detected: Cryptographic hash mismatch on file '{Path(path).name}' (Baseline: {b_hash[:16]}... vs Current: {result.get('current_sha256', '')[:16]}...)",
            severity="CRITICAL",
            confidence=10.0,
        )
    return result


@app.post("/api/forensics/batch-hash/")
async def batch_hash_endpoint(request: Request):
    data = await get_request_data(request)
    dir_path = data.get("directory") or str(EVIDENCE_DIR)
    result = batch_hash_directory(dir_path)
    return result


# --- Malware Signature Analysis ---

@app.post("/api/forensics/check-malware/")
async def check_malware_endpoint(request: Request):
    data = await get_request_data(request)
    raw_path = data.get("file_path", "")
    db_path = data.get("database_path")
    target_case = data.get("case_id")
    if target_case:
        try:
            target_case = int(target_case)
        except ValueError:
            target_case = None

    path = resolve_evidence_path(raw_path)
    database = load_malware_database(db_path)
    result = check_hash_against_database(path, database)

    if target_case and result.get("is_known_malware"):
        add_finding(
            case_id=target_case,
            technique="Malware Signature Analysis",
            finding=f"Known malware signature detected for file '{Path(path).name}' (Hash Match: {', '.join(result.get('matches', []))})",
            severity="CRITICAL",
            confidence=10.0,
        )
    return result


@app.post("/api/forensics/yara-scan/")
async def yara_scan_endpoint(request: Request):
    data = await get_request_data(request)
    raw_path = data.get("file_path", "")
    rules = data.get("rules_text", "")
    target_case = data.get("case_id")
    if target_case:
        try:
            target_case = int(target_case)
        except ValueError:
            target_case = None

    path = resolve_evidence_path(raw_path)
    result = yara_rule_match(path, rules)

    if target_case and result.get("matches_found"):
        patterns = ", ".join(result.get("matched_patterns", []))
        add_finding(
            case_id=target_case,
            technique="Malware Signature Analysis",
            finding=f"Suspicious script pattern matched YARA indicators on '{Path(path).name}': {patterns}",
            severity=result.get("severity", "HIGH"),
            confidence=9.0,
        )
    return result


@app.post("/api/forensics/suspicious-extension/")
async def suspicious_extension_endpoint(request: Request):
    data = await get_request_data(request)
    raw_path = data.get("file_path", "")
    path = resolve_evidence_path(raw_path)
    result = suspicious_file_extension(path)
    return result


@app.post("/api/forensics/entropy-analysis/")
async def entropy_analysis_endpoint(request: Request):
    data = await get_request_data(request)
    raw_path = data.get("file_path", "")
    path = resolve_evidence_path(raw_path)
    result = entropy_analysis(path)
    return result


# --- Metadata Forensics ---

@app.post("/api/metadata/basic/")
async def basic_metadata_endpoint(request: Request):
    data = await get_request_data(request)
    raw_path = data.get("file_path", "")
    target_case = data.get("case_id")
    if target_case:
        try:
            target_case = int(target_case)
        except ValueError:
            target_case = None

    path = resolve_evidence_path(raw_path)
    result = get_file_metadata(path)

    if target_case and result.get("timestamp_anomaly"):
        add_finding(
            case_id=target_case,
            technique="Metadata Forensics",
            finding=f"Timestamp anomaly detected on '{Path(path).name}': modified timestamp precedes creation timestamp (possible timestomping)",
            severity="MEDIUM",
            confidence=8.0,
        )
    return result


@app.post("/api/metadata/pdf/")
async def pdf_metadata_endpoint(request: Request):
    data = await get_request_data(request)
    raw_path = data.get("file_path", "")
    path = resolve_evidence_path(raw_path)
    result = get_pdf_metadata(path)
    return result


@app.post("/api/metadata/image/")
async def image_metadata_endpoint(request: Request):
    data = await get_request_data(request)
    raw_path = data.get("file_path", "")
    path = resolve_evidence_path(raw_path)
    result = get_image_metadata(path)
    return result


@app.post("/api/metadata/compare/")
async def compare_metadata_endpoint(request: Request):
    data = await get_request_data(request)
    orig = resolve_evidence_path(data.get("original_path", ""))
    working = resolve_evidence_path(data.get("working_copy_path", ""))
    target_case = data.get("case_id")
    if target_case:
        try:
            target_case = int(target_case)
        except ValueError:
            target_case = None

    result = compare_metadata(orig, working)

    if target_case and result.get("tampering_suspected"):
        add_finding(
            case_id=target_case,
            technique="Metadata Forensics",
            finding=f"Metadata discrepancy detected between original '{Path(orig).name}' and working copy '{Path(working).name}'",
            severity="HIGH",
            confidence=8.5,
        )
    return result


# --- Deleted File Analysis ---

@app.post("/api/deleted/analyze/")
async def deleted_analysis_endpoint(request: Request):
    data = await get_request_data(request)
    raw_path = data.get("file_path", "")
    target_case = data.get("case_id")
    if target_case:
        try:
            target_case = int(target_case)
        except ValueError:
            target_case = None

    path = resolve_evidence_path(raw_path)
    result = analyze_deletion_events(path)

    if target_case and result.get("suspicious_deletions", 0) > 0:
        targets = ", ".join(result.get("sensitive_files_targeted", [])[:3])
        add_finding(
            case_id=target_case,
            technique="Deleted-File Analysis",
            finding=f"Anti-forensic evidence destruction: Sensitive log/audit files deleted ({result['suspicious_deletions']} deletions targeting: {targets})",
            severity="HIGH",
            confidence=9.0,
        )
    return result


@app.post("/api/deleted/repeated/")
async def repeated_deletions_endpoint(request: Request):
    data = await get_request_data(request)
    raw_path = data.get("file_path", "")
    path = resolve_evidence_path(raw_path)
    result = detect_repeated_deletions(path)
    return result


@app.post("/api/deleted/timeline/")
async def deletion_timeline_endpoint(request: Request):
    data = await get_request_data(request)
    raw_path = data.get("file_path", "")
    path = resolve_evidence_path(raw_path)
    result = analyze_deletion_timeline(path)
    return result


# --- Correlation & CIA Endpoints ---

@app.post("/api/findings/")
async def create_finding_endpoint(request: Request):
    """Manually add a finding to a case."""
    data = await get_request_data(request)
    case_id = int(data["case_id"])
    finding_id = add_finding(
        case_id=case_id,
        technique=data.get("technique", "General Forensic"),
        finding=data.get("finding", "Observed event"),
        severity=data.get("severity", "MEDIUM"),
        confidence=float(data.get("confidence", 8.0)),
        evidence_id=data.get("evidence_id"),
    )
    return {"finding_id": finding_id, "status": "CREATED"}


@app.post("/api/correlation/")
async def correlation_endpoint(request: Request):
    """Correlate findings from all six forensic techniques."""
    data = await get_request_data(request)
    case_id = int(data.get("case_id", 1))
    result = correlate_findings(case_id)
    return result


@app.post("/api/cia/evaluate/")
async def cia_evaluate_endpoint(request: Request):
    """Evaluate CIA triad scores for a technique."""
    data = await get_request_data(request)
    tech = data.get("technique", "Log Forensics")
    result = evaluate_ci_scores(tech)
    return result


@app.post("/api/cia/interpretation/")
async def cia_interpretation_endpoint(request: Request):
    """Get interpretation for CIA total score."""
    data = await get_request_data(request)
    score = int(data.get("total_score", 20))
    result = {"total_score": score, "interpretation": get_cia_interpretation(score)}
    return result


@app.post("/api/risk/score/")
async def risk_score_endpoint(request: Request):
    """Calculate risk score using project formula: 0.35A + 0.30I + 0.20C + 0.15E."""
    data = await get_request_data(request)
    sev = float(data.get("severity", 5.0))
    imp = float(data.get("impact", 5.0))
    conf = float(data.get("confidence", 8.0))
    corr = float(data.get("corroborating", 2.0))

    result = calculate_risk_score(sev, imp, conf, corr)
    return result


# --- Dashboard Data Endpoint ---

@app.get("/api/dashboard/{case_id}")
def dashboard_data(case_id: int):
    """Get complete dashboard overview data for a case."""
    case, evidence, findings, cia_scores = get_case_db(case_id)
    correlation = correlate_findings(case_id)

    # Format evidence items
    evidence_list = []
    for ev in evidence:
        evidence_list.append({
            "evidence_id": ev[0],
            "case_id": ev[1],
            "file_name": ev[2],
            "evidence_type": ev[3],
            "source": ev[4] or "Workspace",
            "collected_at": ev[5] or "N/A",
            "sha256_hash": ev[6],
            "status": ev[7] or "VERIFIED",
            "notes": ev[8] or "",
        })

    # Format findings
    findings_list = []
    for f in findings:
        findings_list.append({
            "finding_id": f[0],
            "case_id": f[1],
            "evidence_id": f[2],
            "technique": f[3],
            "finding": f[4],
            "severity": f[5],
            "confidence": f[6],
            "created_at": f[7],
        })

    # Format CIA scores
    cia_list = [
        {
            "score_id": cs[0],
            "technique": cs[1],
            "confidentiality": cs[2],
            "integrity": cs[3],
            "availability": cs[4],
            "total": cs[2] + cs[3] + cs[4],
            "justification": cs[5] or "",
            "interpretation": get_cia_interpretation(cs[2] + cs[3] + cs[4]),
        }
        for cs in cia_scores
    ]

    return {
        "case_id": case_id,
        "case_name": case[1] if case else f"Case #{case_id}",
        "investigator": case[2] if case else "Forensic Analyst",
        "created_at": case[3] if case else datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "status": case[4] if case else "OPEN",
        "description": case[5] if case else "",
        "evidence_count": len(evidence_list),
        "evidence_list": evidence_list,
        "findings_count": len(findings_list),
        "findings_list": findings_list,
        "correlation": correlation,
        "cia_scores": cia_list,
        "risk_level": correlation.get("risk_level", "LOW"),
        "risk_score": correlation.get("risk_score", 1.0),
    }


# --- Seed Sample Dataset Endpoint ---

@app.post("/api/seed-sample-data/")
def seed_sample_data():
    """Seed synthetic investigation case with synthetic evidence across all 6 techniques."""
    from seed_data import create_synthetic_dataset
    result = create_synthetic_dataset()
    return result