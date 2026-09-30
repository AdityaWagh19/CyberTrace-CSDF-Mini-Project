import sqlite3
from collections import defaultdict
from database import DB_PATH, DEFAULT_CIA_SCORES


def get_case_db(case_id: int = None):
    """Get database connection and case data."""
    conn = sqlite3.connect(str(DB_PATH))
    c = conn.cursor()

    if case_id:
        c.execute("SELECT case_id, case_name, investigator, created_at, status, description FROM cases WHERE case_id=?", (case_id,))
        case = c.fetchone()
        c.execute("SELECT evidence_id, case_id, file_name, evidence_type, source, collected_at, sha256_hash, status, notes FROM evidence WHERE case_id=?", (case_id,))
        evidence = c.fetchall()
        c.execute("SELECT finding_id, case_id, evidence_id, technique, finding, severity, confidence, created_at FROM findings WHERE case_id=?", (case_id,))
        findings = c.fetchall()
        c.execute("SELECT score_id, technique, confidentiality, integrity, availability, justification FROM cia_scores WHERE case_id=?", (case_id,))
        cia_scores = c.fetchall()
    else:
        case = None
        evidence = []
        findings = []
        cia_scores = []

    conn.close()
    return case, evidence, findings, cia_scores


def severity_to_numeric(sev) -> float:
    """Normalize severity to a 0-10 scale."""
    if isinstance(sev, (int, float)):
        return min(max(float(sev), 0.0), 10.0)
    if isinstance(sev, str):
        val = sev.strip().upper()
        if val in ("CRITICAL", "VERY HIGH"):
            return 9.5
        elif val == "HIGH":
            return 8.0
        elif val == "MEDIUM":
            return 5.0
        elif val == "LOW":
            return 2.5
        elif val == "INFO":
            return 1.0
        try:
            return min(max(float(val), 0.0), 10.0)
        except ValueError:
            return 5.0
    return 5.0


def calculate_risk_score(severity: float, impact: float, confidence: float, corroborating: float) -> dict:
    """
    Calculate risk score using project formula:
    Risk = 0.35A + 0.30I + 0.20C + 0.15E (normalized to 0-10)
    """
    # Normalize inputs to 0-10
    a = min(max(float(severity), 0.0), 10.0)
    i = min(max(float(impact), 0.0), 10.0)
    c = min(max(float(confidence), 0.0), 10.0)
    e = min(max(float(corroborating), 0.0), 10.0)

    score = round(0.35 * a + 0.30 * i + 0.20 * c + 0.15 * e, 2)

    if score >= 7.0:
        level = "HIGH"
    elif score >= 4.0:
        level = "MEDIUM"
    else:
        level = "LOW"

    return {
        "score": score,
        "level": level,
        "components": {
            "severity_A": a,
            "impact_I": i,
            "confidence_C": c,
            "corroborating_E": e,
        }
    }


def evaluate_ci_scores(technique: str, confidence_weight: float = 1.0) -> dict:
    """Return proposed CIA scores for a technique based on project documentation."""
    cia_base = {
        item[0]: {"confidentiality": item[1], "integrity": item[2], "availability": item[3], "justification": item[4]}
        for item in DEFAULT_CIA_SCORES
    }

    # Normalize technique lookup
    matched = None
    for name, data in cia_base.items():
        if technique.lower() in name.lower() or name.lower() in technique.lower():
            matched = (name, data)
            break

    if matched:
        tech_name, scores = matched
    else:
        tech_name = technique
        scores = {"confidentiality": 5, "integrity": 5, "availability": 5, "justification": "General forensic technique"}

    total = scores["confidentiality"] + scores["integrity"] + scores["availability"]

    return {
        "technique": tech_name,
        "confidentiality": scores["confidentiality"],
        "integrity": scores["integrity"],
        "availability": scores["availability"],
        "total": total,
        "justification": scores.get("justification", ""),
        "interpretation": get_cia_interpretation(total),
    }


def get_cia_interpretation(total_score: int) -> str:
    """Get interpretation of CIA total score."""
    if total_score >= 24:
        return "Very strong contribution"
    elif total_score >= 21:
        return "Strong contribution"
    elif total_score >= 17:
        return "Moderate contribution"
    else:
        return "Weak contribution"


def correlate_findings(case_id: int) -> dict:
    """Correlate findings from different forensic techniques for a case."""
    conn = sqlite3.connect(str(DB_PATH))
    c = conn.cursor()

    # Get all findings for the case
    c.execute("SELECT technique, finding, severity, confidence FROM findings WHERE case_id=?", (case_id,))
    findings = c.fetchall()

    # Get all CIA scores
    c.execute("SELECT technique, confidentiality, integrity, availability, justification FROM cia_scores WHERE case_id=?", (case_id,))
    cia_results = c.fetchall()

    conn.close()

    # Build correlation analysis
    technique_findings = defaultdict(list)
    for technique, finding, severity, confidence in findings:
        technique_findings[technique].append({
            "finding": finding,
            "severity": severity or "MEDIUM",
            "severity_num": severity_to_numeric(severity),
            "confidence": float(confidence) if confidence is not None else 8.0,
        })

    finding_counts = {tech: len(fds) for tech, fds in technique_findings.items()}
    correlation_triggers = []
    high_severity_techniques = []

    for tech, fds in technique_findings.items():
        sev_nums = [fd["severity_num"] for fd in fds]
        conf_scores = [fd["confidence"] for fd in fds]

        has_severe = any(s >= 7.0 for s in sev_nums)
        avg_conf = sum(conf_scores) / len(conf_scores) if conf_scores else 5.0

        if has_severe:
            high_severity_techniques.append(tech)

        if has_severe or avg_conf >= 7.0:
            correlation_triggers.append({
                "technique": tech,
                "trigger_reason": "High severity or high confidence findings identified",
                "findings_count": len(fds),
            })

    # Determine overall incident narrative & risk level
    if not technique_findings:
        incident_type = "No suspicious findings recorded yet"
        risk_level = "LOW"
        risk_score_val = 1.0
    elif len(high_severity_techniques) >= 3:
        incident_type = "Multi-Vector Attack: Correlated unauthorized access, tampering, and malicious activity"
        risk_level = "HIGH"
        risk_score_val = 8.5
    elif len(high_severity_techniques) >= 1 or len(technique_findings) >= 2:
        incident_type = "Suspicious Multi-Source Activity Detected"
        risk_level = "MEDIUM"
        risk_score_val = 5.8
    else:
        incident_type = "Isolated low-severity events"
        risk_level = "LOW"
        risk_score_val = 2.5

    # Safe calculation using formula
    all_sevs = [fd["severity_num"] for fds in technique_findings.values() for fd in fds]
    all_confs = [fd["confidence"] for fds in technique_findings.values() for fd in fds]

    max_sev = max(all_sevs) if all_sevs else 2.0
    avg_conf = (sum(all_confs) / len(all_confs)) if all_confs else 5.0
    impact_score = min(len(high_severity_techniques) * 3.0 + (2.0 if len(technique_findings) > 1 else 0.0), 10.0)
    corr_score = min(len(correlation_triggers) * 2.5, 10.0)

    calculated = calculate_risk_score(
        severity=max_sev,
        impact=impact_score,
        confidence=avg_conf,
        corroborating=corr_score,
    )

    if technique_findings:
        risk_level = calculated["level"]
        risk_score_val = calculated["score"]

    formatted_cia = [
        {
            "technique": row[0],
            "confidentiality": row[1],
            "integrity": row[2],
            "availability": row[3],
            "total": row[1] + row[2] + row[3],
            "justification": row[4] or "",
            "interpretation": get_cia_interpretation(row[1] + row[2] + row[3]),
        }
        for row in cia_results
    ]

    return {
        "case_id": case_id,
        "incident_type": incident_type,
        "risk_level": risk_level,
        "risk_score": risk_score_val,
        "risk_calculation": calculated,
        "high_severity_techniques": high_severity_techniques,
        "finding_counts_by_technique": finding_counts,
        "correlation_triggers": correlation_triggers,
        "total_findings": len(findings),
        "cia_scores": formatted_cia,
    }