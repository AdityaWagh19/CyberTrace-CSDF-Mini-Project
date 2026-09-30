import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Badge,
  Nav,
  Navbar,
  Modal,
  Form,
  Alert,
} from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";

import { CaseOverview } from "./components/CaseOverview";
import { EvidenceRegistry } from "./components/EvidenceRegistry";
import { LogAnalysis } from "./components/LogAnalysis";
import { NetworkAnalysis } from "./components/NetworkAnalysis";
import { MalwareAnalysis } from "./components/MalwareAnalysis";
import { MetadataAnalysis } from "./components/MetadataAnalysis";
import { DeletedFileAnalysis } from "./components/DeletedFileAnalysis";
import { CiaComparison } from "./components/CiaComparison";
import { ReportGenerator } from "./components/ReportGenerator";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:8000";

// Fallback demo data for static deployment (GitHub Pages) when backend is offline
const DEMO_CASE = {
  case_id: 1,
  case_name: "CASE-2026-001: Suspicious Login and File Tampering Investigation",
  investigator: "Cyber Forensics Team",
  created_at: "2026-09-10 09:30:00",
  status: "OPEN",
  description: "Investigation into unauthorized login, port scanning, credential tampering, and audit log deletion.",
  evidence_count: 8,
  findings_count: 7,
  risk_level: "HIGH",
  risk_score: 8.5,
};

function App() {
  const [caseId, setCaseId] = useState<string>("1");
  const [cases, setCases] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<string>("case-overview");
  const [showNewCaseModal, setShowNewCaseModal] = useState<boolean>(false);
  const [newCaseName, setNewCaseName] = useState<string>("");
  const [newInvestigator, setNewInvestigator] = useState<string>("Forensic Analyst");
  const [newDescription, setNewDescription] = useState<string>("");
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);

  const fetchCases = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/cases/`, { timeout: 3000 });
      setCases(res.data);
      if (res.data.length > 0 && !caseId) {
        setCaseId(String(res.data[0].case_id));
      }
      setIsDemoMode(false);
    } catch (err) {
      console.warn("Backend API not reachable. Switching to Interactive Offline/Demo mode.", err);
      setIsDemoMode(true);
      setCases([DEMO_CASE]);
      setCaseId("1");
    }
  }, [caseId]);

  useEffect(() => {
    fetchCases();
  }, [fetchCases]);

  const handleCreateCase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCaseName.trim()) return;

    try {
      const res = await axios.post(`${API_BASE}/api/cases/`, {
        case_name: newCaseName,
        investigator: newInvestigator,
        description: newDescription,
      });
      setShowNewCaseModal(false);
      setNewCaseName("");
      setNewDescription("");
      await fetchCases();
      if (res.data.case_id) {
        setCaseId(String(res.data.case_id));
        setActiveTab("case-overview");
      }
    } catch (err) {
      console.error("Failed to create case:", err);
      // Demo mode fallback
      const mockId = String(cases.length + 1);
      const mockCase = {
        case_id: Number(mockId),
        case_name: newCaseName,
        investigator: newInvestigator,
        created_at: new Date().toISOString(),
        status: "OPEN",
        description: newDescription,
        evidence_count: 0,
        findings_count: 0,
        risk_level: "LOW",
        risk_score: 1.0,
      };
      setCases([...cases, mockCase]);
      setCaseId(mockId);
      setShowNewCaseModal(false);
    }
  };

  const navItems = [
    { key: "case-overview", label: "Case Overview", icon: "📊" },
    { key: "evidence-registry", label: "Evidence Registry", icon: "📁" },
    { key: "log-analysis", label: "1. Log Forensics", icon: "📝" },
    { key: "network-analysis", label: "2. Network Forensics", icon: "🌐" },
    { key: "malware-analysis", label: "3. Malware Analysis", icon: "🦠" },
    { key: "metadata-analysis", label: "4. Metadata Forensics", icon: "🏷️" },
    { key: "deleted-file", label: "5. Deleted-File Analysis", icon: "🗑️" },
    { key: "cia-comparison", label: "6. CIA Triad Matrix", icon: "⚖️" },
    { key: "report", label: "Investigation Report", icon: "📄" },
  ];

  return (
    <div className="bg-light min-vh-100 pb-5">
      {/* Navbar */}
      <Navbar bg="dark" variant="dark" expand="lg" className="shadow-sm py-3 px-3">
        <Container fluid>
          <Navbar.Brand className="d-flex align-items-center gap-2">
            <span className="fs-3">🛡️</span>
            <div>
              <div className="fw-bold fs-5 text-white">CyberTrace</div>
              <div className="text-muted small" style={{ fontSize: "0.75rem" }}>
                Cyber Crime Investigation &amp; Forensic Analysis System
              </div>
            </div>
          </Navbar.Brand>

          <Navbar.Toggle aria-controls="navbar-cases" />
          <Navbar.Collapse id="navbar-cases" className="justify-content-end">
            <div className="d-flex align-items-center gap-3">
              {isDemoMode && (
                <Badge bg="warning" text="dark" className="px-3 py-2">
                  Static / Demo Mode
                </Badge>
              )}

              <Form.Select
                size="sm"
                value={caseId || ""}
                onChange={(e) => setCaseId(e.target.value)}
                style={{ width: "240px" }}
              >
                {cases.map((c) => (
                  <option key={c.case_id} value={String(c.case_id)}>
                    Case #{c.case_id}: {c.case_name?.substring(0, 24)}...
                  </option>
                ))}
              </Form.Select>

              <Button variant="outline-light" size="sm" onClick={() => setShowNewCaseModal(true)}>
                + New Case
              </Button>
            </div>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <Container fluid className="mt-4 px-4">
        {/* Banner Alert if Static / Demo mode */}
        {isDemoMode && (
          <Alert variant="info" className="py-2 px-3 small d-flex justify-content-between align-items-center mb-3">
            <span>
              ℹ️ <strong>Demonstration Mode:</strong> The dashboard is operating in client-side preview mode (ideal for GitHub Pages). To connect live backend, launch FastAPI at <code>http://localhost:8000</code>.
            </span>
            <Button size="sm" variant="outline-primary" onClick={fetchCases}>
              Retry Live Connect
            </Button>
          </Alert>
        )}

        <Row className="g-4">
          {/* Sidebar Navigation */}
          <Col xs={12} lg={3} xl={2}>
            <Card className="shadow-sm border-0 sticky-top" style={{ top: "20px" }}>
              <Card.Header className="bg-secondary text-white py-2 fw-bold small text-uppercase">
                Forensic Modules
              </Card.Header>
              <Card.Body className="p-2">
                <Nav className="flex-column" variant="pills">
                  {navItems.map((item) => (
                    <Nav.Item key={item.key} className="mb-1">
                      <Nav.Link
                        active={activeTab === item.key}
                        onClick={() => setActiveTab(item.key)}
                        className={`d-flex align-items-center gap-2 py-2 px-3 rounded text-truncate ${
                          activeTab === item.key ? "bg-primary text-white" : "text-dark"
                        }`}
                        style={{ cursor: "pointer" }}
                      >
                        <span>{item.icon}</span>
                        <span className="small fw-semibold">{item.label}</span>
                      </Nav.Link>
                    </Nav.Item>
                  ))}
                </Nav>
              </Card.Body>
            </Card>
          </Col>

          {/* Main Work Area */}
          <Col xs={12} lg={9} xl={10}>
            {activeTab === "case-overview" && (
              <CaseOverview caseId={caseId} fetchCases={fetchCases} />
            )}
            {activeTab === "evidence-registry" && (
              <EvidenceRegistry caseId={caseId} />
            )}
            {activeTab === "log-analysis" && (
              <LogAnalysis caseId={caseId} />
            )}
            {activeTab === "network-analysis" && (
              <NetworkAnalysis caseId={caseId} />
            )}
            {activeTab === "malware-analysis" && (
              <MalwareAnalysis caseId={caseId} />
            )}
            {activeTab === "metadata-analysis" && (
              <MetadataAnalysis caseId={caseId} />
            )}
            {activeTab === "deleted-file" && (
              <DeletedFileAnalysis caseId={caseId} />
            )}
            {activeTab === "cia-comparison" && (
              <CiaComparison caseId={caseId} />
            )}
            {activeTab === "report" && (
              <ReportGenerator caseId={caseId} />
            )}
          </Col>
        </Row>
      </Container>

      {/* New Case Modal */}
      <Modal show={showNewCaseModal} onHide={() => setShowNewCaseModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Create New Forensic Investigation</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleCreateCase}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label className="fw-bold">Case Title / Identifier</Form.Label>
              <Form.Control
                type="text"
                placeholder="e.g. Ransomware Incident - Finance Server"
                value={newCaseName}
                onChange={(e) => setNewCaseName(e.target.value)}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="fw-bold">Lead Investigator</Form.Label>
              <Form.Control
                type="text"
                value={newInvestigator}
                onChange={(e) => setNewInvestigator(e.target.value)}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="fw-bold">Case Description &amp; Scope</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                placeholder="Scope of digital evidence examination..."
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowNewCaseModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Create Case
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
}

export default App;