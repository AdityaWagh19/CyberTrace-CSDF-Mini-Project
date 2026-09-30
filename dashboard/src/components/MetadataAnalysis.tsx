import React, { useState } from "react";
import { Card, Button, Form, Row, Col, Table, Badge, Alert } from "react-bootstrap";
import axios from "axios";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:8000";

interface MetadataAnalysisProps {
  caseId: string;
}

export const MetadataAnalysis: React.FC<MetadataAnalysisProps> = ({ caseId }) => {
  const [file, setFile] = useState<File | null>(null);
  const [metaResults, setMetaResults] = useState<any>(null);
  const [compareResults, setCompareResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const analyzeFile = async (fileName: string) => {
    setLoading(true);
    setErrorMsg(null);
    setCompareResults(null);
    try {
      let res: any;
      if (fileName.toLowerCase().endsWith(".pdf")) {
        res = await axios.post(`${API_BASE}/api/metadata/pdf/`, {
          file_path: fileName,
          case_id: Number(caseId),
        });
      } else if (fileName.toLowerCase().match(/\.(jpg|jpeg|png|bmp)$/)) {
        res = await axios.post(`${API_BASE}/api/metadata/image/`, {
          file_path: fileName,
          case_id: Number(caseId),
        });
      } else {
        res = await axios.post(`${API_BASE}/api/metadata/basic/`, {
          file_path: fileName,
          case_id: Number(caseId),
        });
      }
      setMetaResults(res.data);
    } catch (err: any) {
      console.error("Metadata error:", err);
      setErrorMsg(err.response?.data?.detail || err.message || "Failed to extract metadata.");
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
      formData.append("evidence_type", "document");
      formData.append("case_id", caseId);
      formData.append("source", "Evidence Metadata Queue");

      await axios.post(`${API_BASE}/api/evidence/upload/`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      await analyzeFile(file.name);
    } catch (err: any) {
      setErrorMsg("Failed to upload evidence file: " + err.message);
      setLoading(false);
    }
  };

  const runSampleComparison = async () => {
    setLoading(true);
    setErrorMsg(null);
    setMetaResults(null);
    try {
      const res = await axios.post(`${API_BASE}/api/metadata/compare/`, {
        original_path: "users.csv",
        working_copy_path: "users_tampered.csv",
        case_id: Number(caseId),
      });
      setCompareResults(res.data);
    } catch (err: any) {
      setErrorMsg("Failed to compare metadata: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="shadow-sm border-0 mb-4">
      <Card.Header className="bg-primary text-white py-3">
        <h5 className="mb-0">Technique 5: Metadata Forensics Analysis</h5>
      </Card.Header>
      <Card.Body className="p-4">
        <p className="text-muted">
          Extracts internal document properties (author, creator tool, revision timestamps),
          image EXIF headers, and detects timestamp discrepancies or timestomping anomalies.
        </p>

        {errorMsg && <Alert variant="danger" onClose={() => setErrorMsg(null)} dismissible>{errorMsg}</Alert>}

        <Row className="g-3 mb-4">
          <Col xs={12} md={6}>
            <Card className="p-3 border bg-light h-100">
              <h6 className="fw-bold">Option A: Upload File for Metadata Extraction</h6>
              <Form.Group className="mb-3">
                <Form.Control
                  type="file"
                  onChange={(e: any) => setFile(e.target.files?.[0] || null)}
                  accept=".pdf,.docx,.jpg,.jpeg,.png,.txt,.csv"
                />
              </Form.Group>
              <Button
                variant="primary"
                onClick={handleUploadAndAnalyze}
                disabled={!file || loading}
              >
                {loading ? "Extracting..." : "Upload & Extract Metadata"}
              </Button>
            </Card>
          </Col>

          <Col xs={12} md={6}>
            <Card className="p-3 border bg-light h-100 d-flex flex-column justify-content-between">
              <div>
                <h6 className="fw-bold">Option B: Use Pre-Loaded Forensic Evidence</h6>
                <p className="small text-muted mb-2">
                  Extract metadata from embedded sample files or compare original vs tampered copies:
                </p>
                <div className="d-flex flex-column gap-2">
                  <Button
                    variant="outline-primary"
                    size="sm"
                    onClick={() => analyzeFile("incident_briefing.pdf")}
                    disabled={loading}
                  >
                    1. Extract PDF Metadata (incident_briefing.pdf)
                  </Button>
                  <Button
                    variant="outline-warning"
                    size="sm"
                    onClick={runSampleComparison}
                    disabled={loading}
                  >
                    2. Compare Metadata: Original vs Tampered (users.csv vs users_tampered.csv)
                  </Button>
                </div>
              </div>
            </Card>
          </Col>
        </Row>

        {metaResults && (
          <Card className="border mt-4">
            <Card.Header className="bg-dark text-white fw-bold">
              Extracted File Metadata &amp; Document Properties
            </Card.Header>
            <Card.Body className="p-4">
              <Table responsive bordered hover className="align-middle">
                <tbody>
                  <tr>
                    <td className="fw-bold" style={{ width: "30%" }}>File Name</td>
                    <td><code>{metaResults.name}</code></td>
                  </tr>
                  <tr>
                    <td className="fw-bold">File Format / Format Detected</td>
                    <td><Badge bg="info" text="dark">{metaResults.format || metaResults.extension || "N/A"}</Badge></td>
                  </tr>
                  <tr>
                    <td className="fw-bold">File Size</td>
                    <td>{metaResults.size} bytes</td>
                  </tr>
                  {metaResults.author && (
                    <tr>
                      <td className="fw-bold text-danger">Embedded Author</td>
                      <td><Badge bg="danger" className="fs-6">{metaResults.author}</Badge></td>
                    </tr>
                  )}
                  {metaResults.creator && (
                    <tr>
                      <td className="fw-bold text-danger">Creating Application / Tool</td>
                      <td><code>{metaResults.creator}</code></td>
                    </tr>
                  )}
                  {metaResults.created && (
                    <tr>
                      <td className="fw-bold">Creation Timestamp</td>
                      <td>{metaResults.created}</td>
                    </tr>
                  )}
                  {metaResults.modified && (
                    <tr>
                      <td className="fw-bold">Last Modified Timestamp</td>
                      <td>{metaResults.modified}</td>
                    </tr>
                  )}
                  {metaResults.timestamp_anomaly !== undefined && (
                    <tr>
                      <td className="fw-bold">Timestamp Integrity Check</td>
                      <td>
                        {metaResults.timestamp_anomaly ? (
                          <Badge bg="warning" text="dark">ANOMALY DETECTED: Modification precedes creation</Badge>
                        ) : (
                          <Badge bg="success">CONSISTENT</Badge>
                        )}
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        )}

        {compareResults && (
          <Card className="border mt-4">
            <Card.Header className="bg-dark text-white fw-bold">
              Metadata Comparison: Original vs Working Copy
            </Card.Header>
            <Card.Body className="p-4">
              <div className="alert alert-warning mb-3">
                <strong>Tampering Detection Result:</strong>{" "}
                {compareResults.tampering_suspected ? "MODIFICATIONS CONFIRMED - Discrepancy between copies" : "No metadata divergence"}
              </div>
              <Table responsive striped bordered hover size="sm">
                <thead>
                  <tr>
                    <th>Attribute</th>
                    <th>Original ({compareResults.original_file})</th>
                    <th>Working Copy ({compareResults.working_file})</th>
                    <th>Discrepancy</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(compareResults.changes || {}).map(([key, val]: any, i: number) => (
                    <tr key={i}>
                      <td className="fw-bold">{key}</td>
                      <td>{String(val.original)}</td>
                      <td>{String(val.working_copy)}</td>
                      <td>
                        {val.changed ? (
                          <Badge bg="danger">CHANGED</Badge>
                        ) : (
                          <Badge bg="success">MATCH</Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        )}
      </Card.Body>
    </Card>
  );
};