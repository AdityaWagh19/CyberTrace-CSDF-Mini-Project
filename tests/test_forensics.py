import os
import sys
import pytest
from pathlib import Path

# Add src and src/api to sys.path
TEST_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = TEST_DIR.parent
API_DIR = PROJECT_ROOT / "src" / "api"
sys.path.insert(0, str(API_DIR))

from database import (
    DB_PATH,
    EVIDENCE_DIR,
    init_db,
    calculate_sha256,
    calculate_md5,
    add_finding,
    initialize_case_cia_scores,
)
from seed_data import create_synthetic_dataset
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
    compare_metadata,
)
from deleted_file_analysis import (
    analyze_deletion_events,
    detect_repeated_deletions,
    analyze_deletion_timeline,
)
from correlation_engine import (
    get_case_db,
    correlate_findings,
    calculate_risk_score,
    evaluate_ci_scores,
    get_cia_interpretation,
)


@pytest.fixture(scope="session", autouse=True)
def setup_test_dataset():
    """Ensure database and synthetic evidence are seeded before running tests."""
    init_db()
    res = create_synthetic_dataset()
    assert res["status"] == "SUCCESS"


def test_database_and_case_initialization():
    case, evidence, findings, cia_scores = get_case_db(1)
    assert case is not None
    assert case[0] == 1  # case_id
    assert "Suspicious Login" in case[1]
    assert len(evidence) >= 7
    assert len(findings) >= 7
    assert len(cia_scores) == 6


def test_log_forensics_analysis():
    auth_log = str(EVIDENCE_DIR / "auth_logs.csv")
    res = analyze_logs(auth_log)
    assert "error" not in res
    assert res["total_failed"] >= 7
    assert res["total_successful"] >= 2
    assert len(res["suspicious_attempts"]) >= 1

    bf = detect_brute_force(auth_log, threshold=5)
    assert bf["brute_force_detected"] is True
    assert any(entry["username"] == "admin" for entry in bf["brute_force_entries"])

    off_hours = detect_off_hours_logins(auth_log)
    assert off_hours["total_off_hours_logins"] >= 1


def test_network_forensics_analysis():
    pcap_file = str(EVIDENCE_DIR / "sample_capture.pcap")
    res = capture_pcap_analysis(pcap_file)
    assert "error" not in res
    assert res["total_packets_analyzed"] >= 20

    # Verify port scan detection
    assert "192.168.1.20" in res["port_scan_detections"]
    assert res["port_scan_detections"]["192.168.1.20"] >= 15

    # Verify DNS query detection
    dns_res = detect_dns_queries(pcap_file)
    assert dns_res["total_dns_queries"] >= 1
    assert any("dark-tunnel" in q or "exfil" in q for q in dns_res["suspicious_queries"])


def test_file_integrity_analysis():
    orig_file = str(EVIDENCE_DIR / "users.csv")
    tampered_file = str(EVIDENCE_DIR / "users_tampered.csv")

    orig_hash = calculate_sha256(orig_file)

    # Verify unchanged file
    verified = verify_file_integrity(orig_file, orig_hash)
    assert verified["integrity_verified"] is True
    assert verified["status"] == "UNCHANGED"

    # Verify tampered file
    tampered_check = verify_file_integrity(tampered_file, orig_hash)
    assert tampered_check["integrity_verified"] is False
    assert tampered_check["status"] == "MODIFIED"


def test_malware_signature_analysis():
    malware_sample = str(EVIDENCE_DIR / "test_malware_sample.bin")
    hash_check = check_hash_against_database(malware_sample)
    assert hash_check["is_known_malware"] is True
    assert len(hash_check["matches"]) > 0

    script_path = str(EVIDENCE_DIR / "suspicious_script.ps1")
    yara_rule = """
    rule Suspicious_Script_Indicators {
        strings:
            $powershell = "powershell" nocase
            $download = "DownloadString" nocase
            $encoded = "-enc" nocase
        condition:
            2 of them
    }
    """
    yara_res = yara_rule_match(script_path, yara_rule)
    assert yara_res["matches_found"] is True
    assert len(yara_res["matched_patterns"]) >= 2

    # Suspicious extension check
    ext_res = suspicious_file_extension("exploit.exe")
    assert ext_res["is_suspicious"] is True
    ext_clean = suspicious_file_extension("document.pdf")
    assert ext_clean["is_suspicious"] is False

    # Entropy analysis
    entropy_res = entropy_analysis(script_path)
    assert "shannon_entropy" in entropy_res
    assert entropy_res["shannon_entropy"] > 0


def test_metadata_forensics_analysis():
    auth_log = str(EVIDENCE_DIR / "auth_logs.csv")
    meta = get_file_metadata(auth_log)
    assert "error" not in meta
    assert meta["size"] > 0
    assert "created" in meta
    assert "modified" in meta

    pdf_path = str(EVIDENCE_DIR / "incident_briefing.pdf")
    pdf_meta = get_pdf_metadata(pdf_path)
    assert "error" not in pdf_meta
    assert pdf_meta["format"] == "PDF"

    # Compare metadata between original and tampered
    comp = compare_metadata(
        str(EVIDENCE_DIR / "users.csv"),
        str(EVIDENCE_DIR / "users_tampered.csv"),
    )
    assert "error" not in comp
    assert comp["has_changes"] is True


def test_deleted_file_analysis():
    events_log = str(EVIDENCE_DIR / "file_events.csv")
    res = analyze_deletion_events(events_log)
    assert "error" not in res
    assert res["total_deletions"] >= 3
    assert res["suspicious_deletions"] >= 2

    repeated = detect_repeated_deletions(events_log)
    assert "error" not in repeated

    timeline = analyze_deletion_timeline(events_log)
    assert "error" not in timeline
    assert timeline["total_deleted"] >= 3


def test_correlation_engine_and_cia_scoring():
    # Test formula: 0.35A + 0.30I + 0.20C + 0.15E
    risk = calculate_risk_score(severity=9.0, impact=8.0, confidence=9.0, corroborating=8.0)
    assert risk["level"] == "HIGH"
    assert risk["score"] >= 7.0

    # Correlate findings for Case 1
    corr = correlate_findings(1)
    assert corr["case_id"] == 1
    assert corr["risk_level"] == "HIGH"
    assert corr["total_findings"] >= 7
    assert len(corr["cia_scores"]) == 6

    # Test CIA scoring module
    log_cia = evaluate_ci_scores("Log Forensics")
    assert log_cia["confidentiality"] == 8
    assert log_cia["integrity"] == 8
    assert log_cia["availability"] == 7
    assert log_cia["total"] == 23


def test_fastapi_endpoints():
    from fastapi.testclient import TestClient
    from app import app

    client = TestClient(app)

    # 1. Cases
    res = client.get("/api/cases/")
    assert res.status_code == 200
    cases = res.json()
    assert len(cases) >= 1

    # 2. Dashboard
    dash_res = client.get("/api/dashboard/1")
    assert dash_res.status_code == 200
    data = dash_res.json()
    assert data["case_id"] == 1
    assert data["evidence_count"] >= 7
    assert data["findings_count"] >= 7
    assert data["risk_level"] == "HIGH"
    assert len(data["cia_scores"]) == 6

    # 3. Log Forensics POST JSON
    log_res = client.post("/api/forensics/analyze-logs/", json={"file_path": "auth_logs.csv"})
    assert log_res.status_code == 200
    assert "total_failed" in log_res.json()

    # 4. PCAP POST JSON
    pcap_res = client.post("/api/forensics/analyze-pcap/", json={"file_path": "sample_capture.pcap"})
    assert pcap_res.status_code == 200
    assert pcap_res.json()["total_packets_analyzed"] >= 20

    # 5. Risk score endpoint
    risk_res = client.post("/api/risk/score/", json={"severity": 8, "impact": 8, "confidence": 9, "corroborating": 6})
    assert risk_res.status_code == 200
    assert risk_res.json()["level"] == "HIGH"
