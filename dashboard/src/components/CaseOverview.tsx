import React, { useEffect, useState, useCallback } from "react";
import { Row, Col, Button } from "react-bootstrap";
import axios from "axios";
import { IconRefresh, IconCheck } from "../icons";
import { MOCK_CASES } from "../mockData";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:8000";

interface CaseOverviewProps {
  caseId: string;
  fetchCases: () => void;
}

export const CaseOverview: React.FC<CaseOverviewProps> = ({ caseId, fetchCases }) => {
  const defaultCase = MOCK_CASES.find((c) => String(c.case_id) === String(caseId)) || MOCK_CASES[0];
  const [dashboardData, setDashboardData] = useState<any>(defaultCase);
  const [loading, setLoading] = useState(false);

  const loadCaseData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/api/dashboard/${caseId}`, { timeout: 2500 });
      if (res.data) {
        setDashboardData(res.data);
      }
    } catch (err) {
      // In Demo / Vercel mode, use the rich mock data
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
      {/* Top Two-Column Visual Grid matching Shards Screenshot */}
      <Row className="g-4 mb-4">
        {/* Left Column: Attack Activity & Incident Chronology Area */}
        <Col xs={12} lg={8}>
          <div className="shards-card h-100">
            <div className="shards-card-header">
              <h6 className="shards-card-title">Incident Activity &amp; Attack Vector Chronology</h6>
              <div className="d-flex align-items-center gap-2">
                <span className="shards-badge shards-badge-primary">Live Triage</span>
                <Button
                  variant="outline-secondary"
                  size="sm"
                  onClick={handleRefresh}
                  className="py-1 px-2"
                  disabled={loading}
                >
                  <IconRefresh size={13} />
                </Button>
              </div>
            </div>
            <div className="shards-card-body">
              <p className="text-muted small mb-3">
                Chronological aggregation of threat events detected across all six forensic layers during incident execution.
              </p>

              {/* Visual Timeline Waveform Graph matching Shards Users Overview */}
              <div className="p-3 bg-light rounded border mb-3">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span className="small fw-bold text-secondary">Attack Velocity &amp; Event Density (08:00 - 12:00)</span>
                  <div className="d-flex align-items-center gap-3 small text-muted">
                    <span className="d-flex align-items-center gap-1">
                      <span style={{ width: 10, height: 10, backgroundColor: "#007bff", borderRadius: 2 }}></span>
                      Current Incident
                    </span>
                    <span className="d-flex align-items-center gap-1">
                      <span style={{ width: 10, height: 10, backgroundColor: "#e1e5eb", borderRadius: 2 }}></span>
                      Baseline Average
                    </span>
                  </div>
                </div>

                <svg viewBox="0 0 700 160" width="100%" height="160" preserveAspectRatio="none">
                  {/* Grid Lines */}
                  <line x1="0" y1="40" x2="700" y2="40" stroke="#e8ecf2" strokeDasharray="3,3" />
                  <line x1="0" y1="80" x2="700" y2="80" stroke="#e8ecf2" strokeDasharray="3,3" />
                  <line x1="0" y1="120" x2="700" y2="120" stroke="#e8ecf2" strokeDasharray="3,3" />

                  {/* Baseline curve */}
                  <path
                    d="M0,140 Q100,130 200,135 T400,120 T600,130 T700,135"
                    fill="none"
                    stroke="#ced4da"
                    strokeWidth="2"
                    strokeDasharray="4,4"
                  />

                  {/* Incident Curve with Fill */}
                  <defs>
                    <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#007bff" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#007bff" stopOpacity="0.01" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M0,145 Q80,135 150,110 T280,30 T420,70 T550,25 T640,65 T700,15"
                    fill="none"
                    stroke="#007bff"
                    strokeWidth="3"
                  />
                  <path
                    d="M0,145 Q80,135 150,110 T280,30 T420,70 T550,25 T640,65 T700,15 L700,160 L0,160 Z"
                    fill="url(#areaGradient)"
                  />

                  {/* Highlight Points */}
                  <circle cx="150" cy="110" r="4" fill="#007bff" />
                  <circle cx="280" cy="30" r="5" fill="#c4183c" />
                  <circle cx="420" cy="70" r="4" fill="#ffb400" />
                  <circle cx="550" cy="25" r="5" fill="#c4183c" />
                  <circle cx="700" cy="15" r="4" fill="#17c671" />
                </svg>

                <div className="d-flex justify-content-between text-muted" style={{ fontSize: "0.72rem" }}>
                  <span>08:30 Recon Scan</span>
                  <span>08:45 SSH Brute Force</span>
                  <span>09:22 Exfiltration (14MB)</span>
                  <span>10:00 Malware Execution</span>
                  <span>11:00 Anti-Forensic Deletions</span>
                </div>
              </div>

              {/* Brief Case Information Block */}
              <div className="p-3 bg-white rounded border">
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <span className="fw-bold small text-dark">Scope &amp; Incident Summary</span>
                  <span className="small text-muted">Investigator: {dashboardData?.investigator || defaultCase.investigator}</span>
                </div>
                <div className="text-secondary small">
                  {dashboardData?.description || defaultCase.description}
                </div>
              </div>
            </div>
          </div>
        </Col>

        {/* Right Column: Techniques Breakdown Widget matching Shards Users by Device */}
        <Col xs={12} lg={4}>
          <div className="shards-card h-100">
            <div className="shards-card-header">
              <h6 className="shards-card-title">Technique Severity Distribution</h6>
            </div>
            <div className="shards-card-body d-flex flex-column justify-content-between">
              {/* Donut Chart SVG */}
              <div className="d-flex justify-content-center py-2">
                <svg width="170" height="170" viewBox="0 0 42 42">
                  <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#f1f3f8" strokeWidth="5"></circle>
                  {/* Critical / High (Red) 45% */}
                  <circle
                    cx="21" cy="21" r="15.915" fill="transparent" stroke="#c4183c" strokeWidth="5"
                    strokeDasharray="45 55" strokeDashoffset="25"
                  ></circle>
                  {/* Network / Log (Blue) 30% */}
                  <circle
                    cx="21" cy="21" r="15.915" fill="transparent" stroke="#007bff" strokeWidth="5"
                    strokeDasharray="30 70" strokeDashoffset="80"
                  ></circle>
                  {/* Warning / Medium (Amber) 25% */}
                  <circle
                    cx="21" cy="21" r="15.915" fill="transparent" stroke="#ffb400" strokeWidth="5"
                    strokeDasharray="25 75" strokeDashoffset="50"
                  ></circle>
                  {/* Center Text */}
                  <text x="21" y="20" textAnchor="middle" fontSize="5" fontWeight="bold" fill="#2e384d">14</text>
                  <text x="21" y="25" textAnchor="middle" fontSize="3" fill="#818ea3">FINDINGS</text>
                </svg>
              </div>

              {/* Legend with Metrics */}
              <div className="mt-3">
                <div className="d-flex justify-content-between align-items-center py-1 border-bottom">
                  <span className="small d-flex align-items-center gap-2">
                    <span style={{ width: 8, height: 8, backgroundColor: "#c4183c", borderRadius: "50%" }}></span>
                    Critical Severity Alerts
                  </span>
                  <span className="small fw-bold text-dark">45% (6)</span>
                </div>
                <div className="d-flex justify-content-between align-items-center py-1 border-bottom">
                  <span className="small d-flex align-items-center gap-2">
                    <span style={{ width: 8, height: 8, backgroundColor: "#007bff", borderRadius: "50%" }}></span>
                    High Confidence Detections
                  </span>
                  <span className="small fw-bold text-dark">30% (5)</span>
                </div>
                <div className="d-flex justify-content-between align-items-center py-1">
                  <span className="small d-flex align-items-center gap-2">
                    <span style={{ width: 8, height: 8, backgroundColor: "#ffb400", borderRadius: "50%" }}></span>
                    Medium / Informational
                  </span>
                  <span className="small fw-bold text-dark">25% (3)</span>
                </div>
              </div>

              {/* Integrity status pill */}
              <div className="p-2 mt-3 rounded bg-light border d-flex align-items-center justify-content-between">
                <span className="small text-muted d-flex align-items-center gap-1">
                  <IconCheck size={14} color="#17c671" />
                  <span>Chain of Custody</span>
                </span>
                <span className="shards-badge shards-badge-success">Intact</span>
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