import React, { useState } from "react";
import { Card, Button, Form, Row, Col, Table, Badge, Alert } from "react-bootstrap";
import axios from "axios";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:8000";

interface DeletedFileAnalysisProps {
  caseId: string;
}

export const DeletedFileAnalysis: React.FC<DeletedFileAnalysisProps> = ({ caseId }) => {
  const [file, setFile] = useState<File | null>(null);
  const [deletedResults, setDeletedResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const runAnalysis = async (fileName: string) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      // 1. Deletion events
      const delRes = await axios.post(`${API_BASE}/api/deleted/analyze/`, {
        file_path: fileName,
        case_id: Number(caseId),
      });

      // 2. Repeated deletions
      const repRes = await axios.post(`${API_BASE}/api/deleted/repeated/`, {
        file_path: fileName,
      });

      // 3. Timeline
      const timeRes = await axios.post(`${API_BASE}/api/deleted/timeline/`, {
        file_path: fileName,
      });

      setDeletedResults({
        events: delRes.data,
        repeated: repRes.data,
        timeline: timeRes.data,
      });
    } catch (err: any) {
      console.error("Deleted file analysis error:", err);
      setErrorMsg(err.response?.data?.detail || err.message || "Failed to analyze deletion events.");
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
      formData.append("evidence_type", "event_log");
      formData.append("case_id", caseId);
      formData.append("source", "Audit Daemon Log");

      await axios.post(`${API_BASE}/api/evidence/upload/`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      await runAnalysis(file.name);
    } catch (err: any) {
      setErrorMsg("Failed to upload evidence file: " + err.message);
      setLoading(false);
    }
  };

  return (
    <Card className="shadow-sm border-0 mb-4">
      <Card.Header className="bg-primary text-white py-3">
        <h5 className="mb-0">Technique 6: Deleted-File &amp; Anti-Forensics Analysis</h5>
      </Card.Header>
      <Card.Body className="p-4">
        <p className="text-muted">
          Reconstructs file lifecycle timelines (creation, modification, deletion) to detect
          tampering, targeted log wipeouts, and evidence destruction events.
        </p>

        {errorMsg && <Alert variant="danger" onClose={() => setErrorMsg(null)} dismissible>{errorMsg}</Alert>}

        <Row className="g-3 mb-4">
          <Col xs={12} md={6}>
            <Card className="p-3 border bg-light h-100">
              <h6 className="fw-bold">Option A: Upload File Events CSV</h6>
              <Form.Group className="mb-3">
                <Form.Control
                  type="file"
                  onChange={(e: any) => setFile(e.target.files?.[0] || null)}
                  accept=".csv,.log,.txt"
                />
              </Form.Group>
              <Button
                variant="primary"
                onClick={handleUploadAndAnalyze}
                disabled={!file || loading}
              >
                {loading ? "Analyzing Events..." : "Upload & Analyze Deletions"}
              </Button>
            </Card>
          </Col>

          <Col xs={12} md={6}>
            <Card className="p-3 border bg-light h-100 d-flex flex-column justify-content-between">
              <div>
                <h6 className="fw-bold">Option B: Use Pre-Loaded Audit Log Dataset</h6>
                <p className="small text-muted mb-2">
                  Test with <code>file_events.csv</code> containing evidence destruction targeting
                  <code>/var/log/audit.log</code>, <code>/etc/shadow_backup</code>, and <code>/var/log/auth.log</code>.
                </p>
              </div>
              <Button
                variant="outline-primary"
                onClick={() => runAnalysis("file_events.csv")}
                disabled={loading}
              >
                {loading ? "Processing Events..." : "Run Analysis on Sample (file_events.csv)"}
              </Button>
            </Card>
          </Col>
        </Row>

        {deletedResults && (
          <Card className="border mt-4">
            <Card.Header className="bg-dark text-white d-flex justify-content-between align-items-center">
              <span className="fw-bold">Deletion Events &amp; Anti-Forensics Indicators</span>
              {deletedResults.events?.suspicious_deletions > 0 && (
                <Badge bg="danger" className="px-3 py-2">EVIDENCE DESTRUCTION IDENTIFIED</Badge>
              )}
            </Card.Header>
            <Card.Body className="p-4">
              <Row className="g-3 mb-4 text-center">
                <Col xs={6} md={3}>
                  <Card className="p-2 bg-light">
                    <span className="small text-muted">Total Events</span>
                    <h4>{deletedResults.events?.total_events || 0}</h4>
                  </Card>
                </Col>
                <Col xs={6} md={3}>
                  <Card className="p-2 bg-light">
                    <span className="small text-muted">Deletions</span>
                    <h4 className="text-warning">{deletedResults.events?.total_deletions || 0}</h4>
                  </Card>
                </Col>
                <Col xs={6} md={3}>
                  <Card className="p-2 bg-light">
                    <span className="small text-muted">Sensitive Files Deleted</span>
                    <h4 className="text-danger">{deletedResults.events?.suspicious_deletions || 0}</h4>
                  </Card>
                </Col>
                <Col xs={6} md={3}>
                  <Card className="p-2 bg-light">
                    <span className="small text-muted">Repeated Deletions</span>
                    <h4>{deletedResults.repeated?.total_files_with_repeated_deletions || 0}</h4>
                  </Card>
                </Col>
              </Row>

              {/* Suspicious Deletions Table */}
              {deletedResults.events?.suspicious_events?.length > 0 && (
                <div className="mb-4">
                  <h6 className="text-danger fw-bold">Critical Sensitive Files Deleted:</h6>
                  <Table responsive striped bordered hover size="sm">
                    <thead>
                      <tr>
                        <th>Timestamp</th>
                        <th>User / Actor</th>
                        <th>Deleted File Path</th>
                        <th>Preserved Hash</th>
                        <th>Classification</th>
                      </tr>
                    </thead>
                    <tbody>
                      {deletedResults.events.suspicious_events.map((ev: any, idx: number) => (
                        <tr key={idx}>
                          <td>{ev.timestamp}</td>
                          <td><strong>{ev.user}</strong></td>
                          <td><code>{ev.path}</code></td>
                          <td><span className="font-monospace small">{ev.hash?.substring(0, 16)}...</span></td>
                          <td><Badge bg="danger">EVIDENCE DESTRUCTION</Badge></td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              )}

              {/* Timeline Overview */}
              {deletedResults.timeline && (
                <div className="alert alert-secondary mb-0">
                  <h6 className="fw-bold mb-2">Event Timing Lifecycle:</h6>
                  <div className="small">
                    <strong>Earliest Recorded Deletion:</strong> {deletedResults.timeline.earliest_deletion || "N/A"}
                    <br />
                    <strong>Latest Recorded Deletion:</strong> {deletedResults.timeline.latest_deletion || "N/A"}
                  </div>
                </div>
              )}
            </Card.Body>
          </Card>
        )}
      </Card.Body>
    </Card>
  );
};