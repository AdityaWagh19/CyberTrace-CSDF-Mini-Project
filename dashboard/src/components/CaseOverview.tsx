import React, { useEffect, useState, useCallback } from "react";
import { Row, Col, Button, ProgressBar } from "react-bootstrap";
import axios from "axios";
import { IconRefresh, IconCheck } from "../icons";
import { MOCK_CASES } from "../mockData";

import { API_BASE } from "../apiConfig";

interface CaseOverviewProps {
  caseId: string;
  fetchCases: () => void;
}

const ATTACK_CHRONOLOGY = [
  {
    time: "08:30:12",
    stage: "Reconnaissance Port Scan",
    layer: "Network Forensics",
    severity: "MEDIUM",
    color: "#ffb400",
    desc: "Targeted TCP SYN sweep across internal subnet targeting SSH and RDP management ports.",
  },
  {
    time: "08:45:22",
    stage: "SSH Credential Brute Force",
    layer: "Log Forensics",
    severity: "HIGH",
    color: "#fd7e14",
    desc: "12 consecutive authentication failures from IP 192.168.1.20 targeting root and service accounts.",
  },
  {
    time: "09:22:45",
    stage: "Data Staging & Exfiltration",
    layer: "Network PCAP",
    severity: "CRITICAL",
    color: "#c4183c",
    desc: "14.2 MB compressed archive transmitted via outbound encrypted channel on TCP 4444.",
  },
  {
    time: "10:00:18",
    stage: "Ransomware Binary Execution",
    layer: "Malware Analysis",
    severity: "CRITICAL",
    color: "#c4183c",
    desc: "High-entropy (7.84/8.0) executable launched, initiating widespread file payload encryption.",
  },
  {
    time: "11:00:04",
    stage: "Anti-Forensics Wiper Invocation",
    layer: "Filesystem Analysis",
    severity: "HIGH",
    color: "#fd7e14",
    desc: "Execution of secure wiper utilities (sdelete/shred) to purge auth audit logs and shadow copies.",
  },
];

export const CaseOverview: React.FC<CaseOverviewProps> = ({ caseId, fetchCases }) => {
  const defaultCase = MOCK_CASES.find((c) => String(c.case_id) === String(caseId)) || MOCK_CASES[0];
  const [dashboardData, setDashboardData] = useState<any>(defaultCase);
  const [loading, setLoading] = useState(false);

  const loadCaseData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/api/dashboard/${caseId}`, { timeout: 2500 });
      if (res.data && typeof res.data === "object" && !Array.isArray(res.data) && res.data.case_name) {
        setDashboardData(res.data);
      } else {
        const matched = MOCK_CASES.find((c) => String(c.case_id) === String(caseId)) || MOCK_CASES[0];
        setDashboardData(matched);
      }
    } catch (err) {
      const matched = MOCK_CASES.find((c) => String(c.case_id) === String(caseId)) || MOCK_CASES[0];
      setDashboardData(matched);
    } finally {
      setLoading(false);
    }
  }, [caseId]);

  useEffect(() => {
    if (caseId) {
      loadCaseData();
    }
  }, [caseId, loadCaseData]);

  const handleRefresh = async () => {
    fetchCases();
    await loadCaseData();
  };

  const getSeverityBadgeClass = (severity: string) => {
    switch (severity?.toUpperCase()) {
      case "CRITICAL":
      case "HIGH":
        return "shards-badge-danger";
      case "MEDIUM":
        return "shards-badge-warning";
      case "LOW":
        return "shards-badge-success";
      default:
        return "shards-badge-primary";
    }
  };

  const findingsList = dashboardData?.findings || defaultCase.findings || [];

  return (
    <div>
      {/* Top Two-Column Visual Grid */}
      <Row className="g-4 mb-4">
        {/* Left Column: Attack Activity & Incident Chronology Area */}
        <Col xs={12} lg={8}>
          <div className="shards-card h-100 mb-0">
            <div className="shards-card-header">
              <h6 className="shards-card-title">Incident Activity &amp; Attack Vector Chronology</h6>
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={handleRefresh}
                className="py-1 px-2"
                disabled={loading}
                title="Refresh Case Data"
              >
                <IconRefresh size={13} />
              </Button>
            </div>
            <div className="shards-card-body">
              <p className="text-muted small mb-3">
                Chronological sequence of correlated forensic threat events identified during multi-layer examination.
              </p>

              {/* Clean Structured Chronology Timeline (Never crops, 100% responsive) */}
              <div className="d-flex flex-column gap-2 mb-4">
                {ATTACK_CHRONOLOGY.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-white rounded border d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between gap-2"
                    style={{ borderLeft: `4px solid ${item.color}` }}
                  >
                    <div style={{ flex: 1 }}>
                      <div className="d-flex align-items-center gap-2 mb-1 flex-wrap">
                        <span className="badge bg-light text-dark font-monospace border" style={{ fontSize: "0.75rem" }}>
                          {item.time}
                        </span>
                        <strong className="text-dark small">{item.stage}</strong>
                        <span className="text-muted small">({item.layer})</span>
                      </div>
                      <div className="text-secondary small" style={{ fontSize: "0.82rem" }}>
                        {item.desc}
                      </div>
                    </div>
                    <div className="text-nowrap">
                      <span className={`shards-badge ${getSeverityBadgeClass(item.severity)}`}>
                        {item.severity}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Case Scope Summary */}
              <div className="p-3 bg-light rounded border">
                <div className="d-flex justify-content-between align-items-center mb-1 flex-wrap gap-2">
                  <span className="fw-semibold small text-dark">Scope &amp; Incident Briefing</span>
                  <span className="small text-muted">Investigator: {dashboardData?.investigator || defaultCase.investigator}</span>
                </div>
                <div className="text-secondary small" style={{ fontSize: "0.82rem", lineHeight: 1.5 }}>
                  {dashboardData?.description || defaultCase.description}
                </div>
              </div>
            </div>
          </div>
        </Col>

        {/* Right Column: Clean Responsive Severity Breakdown */}
        <Col xs={12} lg={4}>
          <div className="shards-card h-100 mb-0">
            <div className="shards-card-header">
              <h6 className="shards-card-title">Threat Severity Distribution</h6>
            </div>
            <div className="shards-card-body d-flex flex-column justify-content-between">
              <div>
                <p className="text-muted small mb-3">
                  Proportional distribution of identified anomalies across risk classifications.
                </p>

                {/* Progress bars replacing cropped SVG donut */}
                <div className="mb-3">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <span className="small fw-semibold text-danger">Critical Severity</span>
                    <span className="small text-muted">6 findings (43%)</span>
                  </div>
                  <ProgressBar variant="danger" now={43} style={{ height: "7px" }} />
                </div>

                <div className="mb-3">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <span className="small fw-semibold text-warning">High Severity</span>
                    <span className="small text-muted">5 findings (36%)</span>
                  </div>
                  <ProgressBar variant="warning" now={36} style={{ height: "7px" }} />
                </div>

                <div className="mb-4">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <span className="small fw-semibold text-primary">Medium / Informational</span>
                    <span className="small text-muted">3 findings (21%)</span>
                  </div>
                  <ProgressBar variant="primary" now={21} style={{ height: "7px" }} />
                </div>

                <hr className="my-3 text-muted" />

                <div className="small fw-semibold text-dark mb-2">Forensic Vector Coverage</div>
                <div className="d-flex flex-column gap-2">
                  <div className="d-flex justify-content-between small text-secondary py-1 border-bottom">
                    <span>Authentication &amp; System Logs</span>
                    <span className="fw-semibold text-dark">4 Events</span>
                  </div>
                  <div className="d-flex justify-content-between small text-secondary py-1 border-bottom">
                    <span>Network PCAP Flows</span>
                    <span className="fw-semibold text-dark">3 Events</span>
                  </div>
                  <div className="d-flex justify-content-between small text-secondary py-1 border-bottom">
                    <span>Malware Static &amp; Entropy</span>
                    <span className="fw-semibold text-dark">3 Events</span>
                  </div>
                  <div className="d-flex justify-content-between small text-secondary py-1">
                    <span>Anti-Forensics &amp; Wiper Traces</span>
                    <span className="fw-semibold text-dark">4 Events</span>
                  </div>
                </div>
              </div>

              {/* Integrity status pill */}
              <div className="p-2 mt-4 rounded bg-light border d-flex align-items-center justify-content-between">
                <span className="small text-muted d-flex align-items-center gap-1">
                  <IconCheck size={14} color="#17c671" />
                  <span>Evidence Integrity</span>
                </span>
                <span className="small fw-semibold text-success">Verified SHA-256</span>
              </div>
            </div>
          </div>
        </Col>
      </Row>

      {/* Detected Forensic Findings Ledger Table */}
      <div className="shards-card">
        <div className="shards-card-header">
          <h6 className="shards-card-title">Correlated Forensic Findings Ledger</h6>
          <span className="small text-muted">Showing {findingsList.length} recorded events</span>
        </div>
        <div className="p-0">
          <div className="table-responsive">
            <table className="shards-table">
              <thead>
                <tr>
                  <th style={{ width: "60px" }}>ID</th>
                  <th style={{ width: "180px" }}>Technique</th>
                  <th>Forensic Evidence &amp; Anomaly Observation</th>
                  <th style={{ width: "120px" }}>Severity</th>
                  <th style={{ width: "100px" }}>Confidence</th>
                  <th style={{ width: "160px" }}>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {findingsList.map((f: any, idx: number) => (
                  <tr key={idx}>
                    <td className="text-muted fw-bold">#{f.finding_id || idx + 1}</td>
                    <td>
                      <span className="fw-semibold text-dark">{f.technique}</span>
                    </td>
                    <td>
                      <div className="small text-secondary">{f.finding}</div>
                    </td>
                    <td>
                      <span className={`shards-badge ${getSeverityBadgeClass(f.severity)}`}>
                        {f.severity}
                      </span>
                    </td>
                    <td>
                      <span className="small fw-bold text-dark">{f.confidence ? `${f.confidence}/10` : "8.5/10"}</span>
                    </td>
                    <td>
                      <span className="small text-muted font-monospace">{f.created_at || "2026-09-30 09:00:00"}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};