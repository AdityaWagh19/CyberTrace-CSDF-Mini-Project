import React, { useEffect, useState, useCallback } from "react";
import { Row, Col, Button } from "react-bootstrap";
import axios from "axios";
import { IconRefresh, IconCheck } from "../icons";
import { MOCK_CASES } from "../mockData";

import { API_BASE } from "../apiConfig";

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
      if (res.data && typeof res.data === "object" && !Array.isArray(res.data) && res.data.case_name) {
        setDashboardData(res.data);
      } else {
        const matched = MOCK_CASES.find((c) => String(c.case_id) === String(caseId)) || MOCK_CASES[0];
        setDashboardData(matched);
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

              {/* Visual Timeline Waveform Graph */}
              <div className="p-3 bg-white rounded border mb-3">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div>
                    <span className="small fw-bold text-dark d-block">Incident Attack Velocity &amp; Chronology</span>
                    <span className="text-muted" style={{ fontSize: "0.75rem" }}>Timeline correlation from 08:30 to 11:30 incident window</span>
                  </div>
                  <div className="d-flex align-items-center gap-3 small text-muted">
                    <span className="d-flex align-items-center gap-1">
                      <span style={{ width: 8, height: 8, backgroundColor: "#007bff", borderRadius: 2 }}></span>
                      Threat Activity
                    </span>
                    <span className="d-flex align-items-center gap-1">
                      <span style={{ width: 8, height: 8, backgroundColor: "#ced4da", borderRadius: 2 }}></span>
                      Baseline Normal
                    </span>
                  </div>
                </div>

                <div style={{ width: "100%", height: "140px", overflow: "hidden" }}>
                  <svg viewBox="0 0 700 130" width="100%" height="130">
                    <defs>
                      <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#007bff" stopOpacity="0.20" />
                        <stop offset="100%" stopColor="#007bff" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>

                    {/* Horizontal Reference Lines */}
                    <line x1="0" y1="25" x2="700" y2="25" stroke="#f1f3f6" strokeWidth="1" strokeDasharray="3,3" />
                    <line x1="0" y1="65" x2="700" y2="65" stroke="#f1f3f6" strokeWidth="1" strokeDasharray="3,3" />
                    <line x1="0" y1="105" x2="700" y2="105" stroke="#f1f3f6" strokeWidth="1" strokeDasharray="3,3" />

                    {/* Baseline Normal Line */}
                    <path
                      d="M0,110 Q100,105 200,108 T400,102 T600,106 T700,108"
                      fill="none"
                      stroke="#ced4da"
                      strokeWidth="1.5"
                      strokeDasharray="4,4"
                    />

                    {/* Incident Curve Filled Area */}
                    <path
                      d="M0,115 Q70,110 140,85 T280,20 T420,55 T540,18 T630,50 T700,12 L700,130 L0,130 Z"
                      fill="url(#areaGradient)"
                    />

                    {/* Incident Line */}
                    <path
                      d="M0,115 Q70,110 140,85 T280,20 T420,55 T540,18 T630,50 T700,12"
                      fill="none"
                      stroke="#007bff"
                      strokeWidth="2.5"
                    />

                    {/* Threat Phase Indicators */}
                    <circle cx="140" cy="85" r="4.5" fill="#007bff" />
                    <circle cx="280" cy="20" r="5" fill="#c4183c" />
                    <circle cx="420" cy="55" r="4.5" fill="#ffb400" />
                    <circle cx="540" cy="18" r="5" fill="#c4183c" />
                    <circle cx="700" cy="12" r="4.5" fill="#17c671" />
                  </svg>
                </div>

                <div className="d-flex justify-content-between text-muted pt-2 border-top" style={{ fontSize: "0.72rem" }}>
                  <span>08:30 Recon Scan</span>
                  <span>08:45 SSH Brute Force</span>
                  <span>09:22 Exfiltration (14MB)</span>
                  <span>10:00 Malware Execution</span>
                  <span>11:00 Anti-Forensic Wipe</span>
                </div>
              </div>

              {/* Brief Case Information Block */}
              <div className="p-3 bg-light rounded border">
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