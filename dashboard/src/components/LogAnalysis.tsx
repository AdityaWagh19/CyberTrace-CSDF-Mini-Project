import React, { useState } from "react";
import { Card, Button, Form, Row, Col, Table, Badge, Alert } from "react-bootstrap";
import axios from "axios";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:8000";

interface LogAnalysisProps {
  caseId: string;
}

export const LogAnalysis: React.FC<LogAnalysisProps> = ({ caseId }) => {
  const [logResults, setLogResults] = useState<any>(null);
  const [file, setFile] = useState<File | null>(null);
  const sampleFile = "auth_logs.csv";
  const [threshold, setThreshold] = useState<number>(5);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const runAnalysis = async (fileName: string) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      // 1. General analysis
      const generalRes = await axios.post(`${API_BASE}/api/forensics/analyze-logs/`, {
        file_path: fileName,
        case_id: Number(caseId),
      });

      // 2. Brute force check
      const bfRes = await axios.post(`${API_BASE}/api/forensics/detect-brute-force/`, {
        file_path: fileName,
        threshold: threshold,
        case_id: Number(caseId),
      });

      // 3. Off hours logins
      const offHoursRes = await axios.post(`${API_BASE}/api/forensics/off-hours-logins/`, {
        file_path: fileName,
        case_id: Number(caseId),
      });

      // 4. Unknown IPs
      const unknownIpRes = await axios.post(`${API_BASE}/api/forensics/unknown-ip/`, {
        file_path: fileName,
        case_id: Number(caseId),
      });

      setLogResults({
        general: generalRes.data,
        bruteForce: bfRes.data,
        offHours: offHoursRes.data,
        unknownIp: unknownIpRes.data,
      });
    } catch (err: any) {
      console.error("Log analysis error:", err);
      setErrorMsg(err.response?.data?.detail || err.message || "Failed to analyze log file.");
    } finally {
      setLoading(false);
    }
  };

  const handleUploadAndAnalyze = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("evidence_type", "auth_log");
      formData.append("case_id", caseId);
      formData.append("source", "Uploaded Authentication Log");

      await axios.post(`${API_BASE}/api/evidence/upload/`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      await runAnalysis(file.name);
    } catch (err: any) {
      setErrorMsg("Failed to upload evidence file: " + err.message);
      setLoading(false);
    }
  };

  const handleUseSample = () => {
    runAnalysis(sampleFile);
  };

  return (
    <Card className="shadow-sm border-0 mb-4">
      <Card.Header className="bg-primary text-white py-3">
        <h5 className="mb-0">Technique 1: Log Forensics Analysis</h5>
      </Card.Header>
      <Card.Body className="p-4">
        <p className="text-muted">
          Examines authentication, operating system, and access logs to detect brute-force attempts,
          unauthorized accounts, anomalous login timestamps, and untrusted IP origins.
        </p>

        {errorMsg && <Alert variant="danger" onClose={() => setErrorMsg(null)} dismissible>{errorMsg}</Alert>}

        <Row className="g-3 mb-4">
          <Col xs={12} md={6}>
            <Card className="p-3 border bg-light h-100">
              <h6 className="fw-bold">Option A: Upload Log File (.csv / .log)</h6>
              <Form.Group className="mb-3">
                <Form.Control
                  type="file"
                  onChange={(e: any) => setFile(e.target.files?.[0] || null)}
                  accept=".csv,.log,.txt"
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label className="small fw-bold">Brute-Force Threshold (Failed Attempts)</Form.Label>
                <Form.Control
                  type="number"
                  value={threshold}
                  onChange={(e) => setThreshold(Number(e.target.value))}
                  min={2}
                  max={50}
                />
              </Form.Group>
              <Button
                variant="primary"
                onClick={handleUploadAndAnalyze}
                disabled={!file || loading}
              >
                {loading ? "Analyzing..." : "Upload & Analyze Log"}
              </Button>
            </Card>
          </Col>

          <Col xs={12} md={6}>
            <Card className="p-3 border bg-light h-100 d-flex flex-column justify-content-between">
              <div>
                <h6 className="fw-bold">Option B: Use Pre-Loaded Synthetic Dataset</h6>
                <p className="small text-muted mb-2">
                  Test with <code>auth_logs.csv</code> containing 12 failed attempts from <code>192.168.1.20</code>,
                  a subsequent successful login, off-hours access at 02:45 AM, and unknown external IPs.
                </p>
              </div>
              <Button
                variant="outline-primary"
                onClick={handleUseSample}
                disabled={loading}
              >
                {loading ? "Processing..." : "Run Analysis on Sample (auth_logs.csv)"}
              </Button>
            </Card>
          </Col>
        </Row>

        {logResults && (
          <Card className="border mt-4">
            <Card.Header className="bg-dark text-white d-flex justify-content-between align-items-center">
              <span className="fw-bold">Analysis Results & Detection Summary</span>
              {logResults.bruteForce?.brute_force_detected && (
                <Badge bg="danger" className="px-3 py-2">BRUTE FORCE DETECTED</Badge>
              )}
            </Card.Header>
            <Card.Body className="p-4">
              <Row className="g-3 mb-4 text-center">
                <Col xs={6} md={3}>
                  <Card className="p-2 bg-light">
                    <span className="small text-muted">Total Events</span>
                    <h4>{logResults.general?.total_records || 0}</h4>
                  </Card>
                </Col>
                <Col xs={6} md={3}>
                  <Card className="p-2 bg-light">
                    <span className="small text-muted">Failed Logins</span>
                    <h4 className="text-danger">{logResults.general?.total_failed || 0}</h4>
                  </Card>
                </Col>
                <Col xs={6} md={3}>
                  <Card className="p-2 bg-light">
                    <span className="small text-muted">Successful Logins</span>
                    <h4 className="text-success">{logResults.general?.total_successful || 0}</h4>
                  </Card>
                </Col>
                <Col xs={6} md={3}>
                  <Card className="p-2 bg-light">
                    <span className="small text-muted">Off-Hours Logins</span>
                    <h4 className="text-warning">{logResults.offHours?.total_off_hours_logins || 0}</h4>
                  </Card>
                </Col>
              </Row>

              {/* Brute Force Findings */}
              {logResults.bruteForce?.brute_force_entries?.length > 0 && (
                <div className="mb-4">
                  <h6 className="text-danger fw-bold">Brute-Force Attack Sources (&gt;= {threshold} failures):</h6>
                  <Table responsive striped bordered hover size="sm">
                    <thead>
                      <tr>
                        <th>Targeted Username</th>
                        <th>Attacker Source IP</th>
                        <th>Failed Attempts</th>
                        <th>Risk Assessment</th>
                      </tr>
                    </thead>
                    <tbody>
                      {logResults.bruteForce.brute_force_entries.map((entry: any, i: number) => (
                        <tr key={i}>
                          <td><strong>{entry.username}</strong></td>
                          <td><code>{entry.source_ip}</code></td>
                          <td><Badge bg="danger">{entry.failed_attempts}</Badge></td>
                          <td><Badge bg="danger">HIGH RISK</Badge></td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              )}

              {/* Subsequent Success After Failure */}
              {logResults.general?.success_after_failure?.length > 0 && (
                <div className="alert alert-danger mb-4">
                  <h6 className="fw-bold mb-1">Critical Compromise Pattern: Successful Login After Multiple Failures</h6>
                  {logResults.general.success_after_failure.map((item: any, i: number) => (
                    <div key={i} className="small">
                      Account <strong>'{item.username}'</strong> was compromised from <code>{item.source_ip}</code> after {item.failed_attempts} failed login attempts!
                    </div>
                  ))}
                </div>
              )}

              {/* Off-Hours Logins */}
              {logResults.offHours?.off_hours_logins?.length > 0 && (
                <div className="mb-4">
                  <h6 className="text-warning fw-bold">Off-Hours Logins Detected (Outside 07:00 - 20:00):</h6>
                  <Table responsive striped bordered hover size="sm">
                    <thead>
                      <tr>
                        <th>Timestamp</th>
                        <th>User</th>
                        <th>Source IP</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {logResults.offHours.off_hours_logins.map((entry: any, i: number) => (
                        <tr key={i}>
                          <td>{entry.timestamp}</td>
                          <td>{entry.username}</td>
                          <td><code>{entry.source_ip}</code></td>
                          <td><Badge bg="warning" text="dark">{entry.event}</Badge></td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              )}
            </Card.Body>
          </Card>
        )}
      </Card.Body>
    </Card>
  );
};