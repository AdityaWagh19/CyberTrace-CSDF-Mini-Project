import React, { useState } from "react";
import { Card, Button, Form, Row, Col, Table, Badge, Alert } from "react-bootstrap";
import axios from "axios";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:8000";

interface NetworkAnalysisProps {
  caseId: string;
}

export const NetworkAnalysis: React.FC<NetworkAnalysisProps> = ({ caseId }) => {
  const [pcapResults, setPcapResults] = useState<any>(null);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const runAnalysis = async (fileName: string) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      // 1. General capture analysis & port scan
      const captureRes = await axios.post(`${API_BASE}/api/forensics/analyze-pcap/`, {
        file_path: fileName,
        packet_limit: 5000,
        case_id: Number(caseId),
      });

      // 2. Large data transfers
      const transfersRes = await axios.post(`${API_BASE}/api/forensics/large-transfers/`, {
        file_path: fileName,
        threshold_bytes: 1000,
        case_id: Number(caseId),
      });

      // 3. DNS queries
      const dnsRes = await axios.post(`${API_BASE}/api/forensics/dns-queries/`, {
        file_path: fileName,
        case_id: Number(caseId),
      });

      setPcapResults({
        general: captureRes.data,
        transfers: transfersRes.data,
        dns: dnsRes.data,
      });
    } catch (err: any) {
      console.error("PCAP analysis error:", err);
      setErrorMsg(err.response?.data?.detail || err.message || "Failed to analyze PCAP file.");
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
      formData.append("evidence_type", "pcap");
      formData.append("case_id", caseId);
      formData.append("source", "Network Sniffer Capture");

      await axios.post(`${API_BASE}/api/evidence/upload/`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      await runAnalysis(file.name);
    } catch (err: any) {
      setErrorMsg("Failed to upload PCAP: " + err.message);
      setLoading(false);
    }
  };

  const handleUseSample = () => {
    runAnalysis("sample_capture.pcap");
  };

  return (
    <Card className="shadow-sm border-0 mb-4">
      <Card.Header className="bg-primary text-white py-3">
        <h5 className="mb-0">Technique 2: Network Forensics Analysis</h5>
      </Card.Header>
      <Card.Body className="p-4">
        <p className="text-muted">
          Performs packet-capture inspection to detect port scanning reconnaissance,
          command-and-control (C2) DNS queries, protocol anomalies, and abnormal data transfers.
        </p>

        {errorMsg && <Alert variant="danger" onClose={() => setErrorMsg(null)} dismissible>{errorMsg}</Alert>}

        <Row className="g-3 mb-4">
          <Col xs={12} md={6}>
            <Card className="p-3 border bg-light h-100">
              <h6 className="fw-bold">Option A: Upload Packet Capture (.pcap / .pcapng)</h6>
              <Form.Group className="mb-3">
                <Form.Control
                  type="file"
                  onChange={(e: any) => setFile(e.target.files?.[0] || null)}
                  accept=".pcap,.pcapng,.cap"
                />
              </Form.Group>
              <Button
                variant="primary"
                onClick={handleUploadAndAnalyze}
                disabled={!file || loading}
              >
                {loading ? "Analyzing Packets..." : "Upload & Analyze PCAP"}
              </Button>
            </Card>
          </Col>

          <Col xs={12} md={6}>
            <Card className="p-3 border bg-light h-100 d-flex flex-column justify-content-between">
              <div>
                <h6 className="fw-bold">Option B: Use Pre-Loaded Synthetic Capture</h6>
                <p className="small text-muted mb-2">
                  Test with <code>sample_capture.pcap</code> containing 25-port SYN sweep from <code>192.168.1.20</code>,
                  C2 domain queries (<code>c2-command.dark-tunnel.net</code>), and exfiltration packets.
                </p>
              </div>
              <Button
                variant="outline-primary"
                onClick={handleUseSample}
                disabled={loading}
              >
                {loading ? "Processing Capture..." : "Run Analysis on Sample (sample_capture.pcap)"}
              </Button>
            </Card>
          </Col>
        </Row>

        {pcapResults && (
          <Card className="border mt-4">
            <Card.Header className="bg-dark text-white d-flex justify-content-between align-items-center">
              <span className="fw-bold">Network Capture Findings</span>
              {Object.keys(pcapResults.general?.port_scan_detections || {}).length > 0 && (
                <Badge bg="danger" className="px-3 py-2">PORT SCAN IDENTIFIED</Badge>
              )}
            </Card.Header>
            <Card.Body className="p-4">
              <Row className="g-3 mb-4 text-center">
                <Col xs={6} md={3}>
                  <Card className="p-2 bg-light">
                    <span className="small text-muted">Total Packets</span>
                    <h4>{pcapResults.general?.total_packets_analyzed || 0}</h4>
                  </Card>
                </Col>
                <Col xs={6} md={3}>
                  <Card className="p-2 bg-light">
                    <span className="small text-muted">Outbound Bytes</span>
                    <h4>{pcapResults.transfers?.total_outbound_bytes || pcapResults.general?.total_outbound_bytes || 0}</h4>
                  </Card>
                </Col>
                <Col xs={6} md={3}>
                  <Card className="p-2 bg-light">
                    <span className="small text-muted">Large Transfers</span>
                    <h4 className="text-warning">{pcapResults.transfers?.large_transfers || 0}</h4>
                  </Card>
                </Col>
                <Col xs={6} md={3}>
                  <Card className="p-2 bg-light">
                    <span className="small text-muted">Suspicious DNS</span>
                    <h4 className="text-danger">{pcapResults.dns?.suspicious_count || 0}</h4>
                  </Card>
                </Col>
              </Row>

              {/* Port Scan Findings */}
              {pcapResults.general?.port_scan_detections && Object.keys(pcapResults.general.port_scan_detections).length > 0 && (
                <div className="mb-4">
                  <h6 className="text-danger fw-bold">Reconnaissance Port Scans Detected:</h6>
                  <Table responsive striped bordered hover size="sm">
                    <thead>
                      <tr>
                        <th>Source IP Address</th>
                        <th>Distinct Ports Contacted</th>
                        <th>Attack Classification</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(pcapResults.general.port_scan_detections).map(([ip, count]: any, i: number) => (
                        <tr key={i}>
                          <td><code>{ip}</code></td>
                          <td><Badge bg="danger">{count} destination ports</Badge></td>
                          <td><Badge bg="danger">SYN Stealth / Port Sweep</Badge></td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              )}

              {/* Suspicious DNS Queries */}
              {pcapResults.dns?.suspicious_queries?.length > 0 && (
                <div className="mb-4">
                  <h6 className="text-danger fw-bold">Suspicious Command &amp; Control (C2) DNS Queries:</h6>
                  <ul className="list-group mb-3">
                    {pcapResults.dns.suspicious_queries.map((q: string, i: number) => (
                      <li key={i} className="list-group-item list-group-item-danger d-flex justify-content-between align-items-center">
                        <code>{q}</code>
                        <Badge bg="danger">MALICIOUS DOMAIN</Badge>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Protocol Distribution */}
              {pcapResults.general?.protocol_distribution && Object.keys(pcapResults.general.protocol_distribution).length > 0 && (
                <div className="mb-3">
                  <h6 className="fw-bold">Observed Protocols:</h6>
                  <div className="d-flex gap-2 flex-wrap">
                    {Object.entries(pcapResults.general.protocol_distribution).map(([proto, count]: any, i: number) => (
                      <Badge key={i} bg="secondary" className="px-3 py-2 fs-6">
                        {proto}: {count}
                      </Badge>
                    ))}
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