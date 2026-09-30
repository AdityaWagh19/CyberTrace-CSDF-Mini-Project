import React, { useEffect, useState, useCallback } from "react";
import { Card, Button, Table, Badge, Form, Row, Col, Alert } from "react-bootstrap";
import axios from "axios";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:8000";

interface EvidenceRegistryProps {
  caseId: string;
}

export const EvidenceRegistry: React.FC<EvidenceRegistryProps> = ({ caseId }) => {
  const [evidence, setEvidence] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [evidenceType, setEvidenceType] = useState("general");
  const [source, setSource] = useState("Investigator Acquisition");
  const [notes, setNotes] = useState("");
  const [uploadMsg, setUploadMsg] = useState<{ type: string; text: string } | null>(null);

  const fetchEvidence = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/api/dashboard/${caseId}`);
      setEvidence(res.data.evidence_list || []);
    } catch (err) {
      console.error("Failed to fetch evidence:", err);
    } finally {
      setLoading(false);
    }
  }, [caseId]);

  useEffect(() => {
    if (caseId) {
      fetchEvidence();
    }
  }, [caseId, fetchEvidence]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) return;

    const formData = new FormData();
    formData.append("file", uploadFile);
    formData.append("case_id", caseId);
    formData.append("evidence_type", evidenceType);
    formData.append("source", source);
    formData.append("notes", notes);

    try {
      await axios.post(`${API_BASE}/api/evidence/upload/`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setUploadMsg({ type: "success", text: `Successfully registered: ${uploadFile.name}` });
      setUploadFile(null);
      setNotes("");
      fetchEvidence();
    } catch (err: any) {
      setUploadMsg({ type: "danger", text: "Evidence upload failed: " + (err.response?.data?.detail || err.message) });
    }
  };

  const copyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    alert("SHA-256 hash copied to clipboard!");
  };

  return (
    <Card className="shadow-sm border-0 mb-4">
      <Card.Header className="bg-primary text-white py-3">
        <h5 className="mb-0">Evidence Registry & Chain of Custody</h5>
      </Card.Header>
      <Card.Body className="p-4">
        {/* Registration Form */}
        <Card className="border bg-light mb-4 p-3">
          <h6 className="fw-bold mb-3">Register New Digital Evidence</h6>
          {uploadMsg && <Alert variant={uploadMsg.type} onClose={() => setUploadMsg(null)} dismissible>{uploadMsg.text}</Alert>}
          <Form onSubmit={handleUpload}>
            <Row className="g-3">
              <Col xs={12} md={4}>
                <Form.Group>
                  <Form.Label className="small fw-bold">Select Evidence File</Form.Label>
                  <Form.Control
                    type="file"
                    onChange={(e: any) => setUploadFile(e.target.files?.[0] || null)}
                    required
                  />
                </Form.Group>
              </Col>
              <Col xs={12} md={3}>
                <Form.Group>
                  <Form.Label className="small fw-bold">Evidence Category</Form.Label>
                  <Form.Select value={evidenceType} onChange={(e) => setEvidenceType(e.target.value)}>
                    <option value="auth_log">Authentication Log</option>
                    <option value="pcap">PCAP Packet Capture</option>
                    <option value="file">File / Document</option>
                    <option value="binary">Suspicious Executable</option>
                    <option value="deletion_log">Deletion Event Log</option>
                    <option value="image">Image / Media</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col xs={12} md={3}>
                <Form.Group>
                  <Form.Label className="small fw-bold">Acquisition Source</Form.Label>
                  <Form.Control
                    type="text"
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                    placeholder="e.g. Linux VM /var/log"
                  />
                </Form.Group>
              </Col>
              <Col xs={12} md={2} className="d-flex align-items-end">
                <Button type="submit" variant="success" className="w-100" disabled={!uploadFile}>
                  Upload & Hash
                </Button>
              </Col>
            </Row>
          </Form>
        </Card>

        {loading ? (
          <div className="text-center py-4">Loading evidence repository...</div>
        ) : evidence.length === 0 ? (
          <div className="alert alert-warning">No evidence registered for this case yet. Upload files above.</div>
        ) : (
          <div>
            <Table responsive striped bordered hover className="align-middle">
              <thead className="table-dark">
                <tr>
                  <th>ID</th>
                  <th>File Name</th>
                  <th>Evidence Type</th>
                  <th>Source</th>
                  <th>Acquired At</th>
                  <th>SHA-256 Integrity Hash</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {evidence.map((ev: any, idx: number) => (
                  <tr key={idx}>
                    <td><strong>#{ev.evidence_id}</strong></td>
                    <td><code>{ev.file_name}</code></td>
                    <td><Badge bg="info" text="dark">{ev.evidence_type}</Badge></td>
                    <td>{ev.source || "N/A"}</td>
                    <td>{ev.collected_at || "N/A"}</td>
                    <td>
                      <span className="font-monospace small text-primary" title={ev.sha256_hash}>
                        {ev.sha256_hash?.substring(0, 18)}...
                      </span>
                    </td>
                    <td><Badge bg="success">{ev.status || "VERIFIED"}</Badge></td>
                    <td>
                      <Button size="sm" variant="outline-primary" onClick={() => copyHash(ev.sha256_hash)}>
                        Copy Hash
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
            <div className="d-flex justify-content-end mt-3">
              <Button variant="outline-secondary" size="sm" onClick={fetchEvidence}>
                Refresh Evidence Inventory
              </Button>
            </div>
          </div>
        )}
      </Card.Body>
    </Card>
  );
};