import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
  Modal,
  Button,
  Form,
  Badge,
} from "react-bootstrap";
import "./shards-theme.css";

import {
  IconShield,
  IconDashboard,
  IconEvidence,
  IconLogs,
  IconNetwork,
  IconMalware,
  IconMetadata,
  IconAntiForensics,
  IconCiaTriad,
  IconReport,
  IconSearch,
  IconBell,
  IconPlus,
  IconRefresh,
  IconArrowUp,
  IconLock,
} from "./icons";

import { CaseOverview } from "./components/CaseOverview";
import { EvidenceRegistry } from "./components/EvidenceRegistry";
import { LogAnalysis } from "./components/LogAnalysis";
import { NetworkAnalysis } from "./components/NetworkAnalysis";
import { MalwareAnalysis } from "./components/MalwareAnalysis";
import { MetadataAnalysis } from "./components/MetadataAnalysis";
import { DeletedFileAnalysis } from "./components/DeletedFileAnalysis";
import { CiaComparison } from "./components/CiaComparison";
import { ReportGenerator } from "./components/ReportGenerator";

import { MOCK_CASES, MockCase } from "./mockData";

import { API_BASE } from "./apiConfig";

function App() {
  const [caseId, setCaseId] = useState<string>("1");
  const [cases, setCases] = useState<any[]>(MOCK_CASES);
  const [activeTab, setActiveTab] = useState<string>("case-overview");
  const [showNewCaseModal, setShowNewCaseModal] = useState<boolean>(false);
  const [newCaseName, setNewCaseName] = useState<string>("");
  const [newInvestigator, setNewInvestigator] = useState<string>("John Doe");
  const [newDescription, setNewDescription] = useState<string>("");
  const [isDemoMode, setIsDemoMode] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");

  const safeCases = Array.isArray(cases) && cases.length > 0 ? cases : MOCK_CASES;
  const currentCase = safeCases.find((c) => String(c.case_id) === String(caseId)) || safeCases[0] || MOCK_CASES[0];

  const fetchCases = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/cases/`, { timeout: 2500 });
      if (Array.isArray(res.data) && res.data.length > 0 && typeof res.data[0] === "object") {
        setCases(res.data);
        setIsDemoMode(false);
      } else {
        setCases(MOCK_CASES);
        setIsDemoMode(true);
      }
    } catch (err) {
      // Fallback gracefully to Live Demo mode
      setIsDemoMode(true);
      setCases(MOCK_CASES);
    }
  }, []);

  useEffect(() => {
    fetchCases();
  }, [fetchCases]);

  const toggleDemoMode = () => {
    if (isDemoMode) {
      fetchCases();
    } else {
      setIsDemoMode(true);
      setCases(MOCK_CASES);
    }
  };

  const handleCreateCase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCaseName.trim()) return;

    if (!isDemoMode) {
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
        if (res.data?.case_id) {
          setCaseId(String(res.data.case_id));
          setActiveTab("case-overview");
        }
        return;
      } catch (err) {
        console.warn("Failed to create on backend, creating in client-side state:", err);
      }
    }

    // Client-side demo case creation
    const newId = cases.length + 1;
    const newMock: MockCase = {
      case_id: newId,
      case_name: newCaseName,
      investigator: newInvestigator,
      created_at: new Date().toISOString().replace("T", " ").substring(0, 19),
      status: "OPEN",
      description: newDescription || "Forensic investigation initiated for digital evidence acquisition and triage.",
      evidence_count: 0,
      findings_count: 0,
      risk_level: "LOW",
      risk_score: 2.0,
      evidence_list: [],
      findings: [],
      cia_scores: MOCK_CASES[0].cia_scores,
    };

    setCases((prev) => [newMock, ...prev]);
    setCaseId(String(newId));
    setShowNewCaseModal(false);
    setNewCaseName("");
    setNewDescription("");
    setActiveTab("case-overview");
  };

  const navItems = [
    { key: "case-overview", label: "Investigation Overview", icon: <IconDashboard /> },
    { key: "evidence-registry", label: "Evidence Registry", icon: <IconEvidence /> },
    { key: "log-analysis", label: "Log Forensics", icon: <IconLogs /> },
    { key: "network-analysis", label: "Network Forensics", icon: <IconNetwork /> },
    { key: "malware-analysis", label: "Malware Analysis", icon: <IconMalware /> },
    { key: "metadata-analysis", label: "Metadata Forensics", icon: <IconMetadata /> },
    { key: "deleted-file", label: "Deleted-File Analysis", icon: <IconAntiForensics /> },
    { key: "cia-comparison", label: "CIA Triad Matrix", icon: <IconCiaTriad /> },
    { key: "report", label: "Forensic Report", icon: <IconReport /> },
  ];

  return (
    <div className="shards-layout">
      {/* Shards Left Sidebar */}
      <aside className="shards-sidebar">
        <div className="shards-sidebar-brand">
          <div className="shards-brand-logo">
            <IconShield size={18} color="#ffffff" />
          </div>
          <div>
            <div className="shards-brand-text">CyberTrace</div>
            <div className="shards-brand-sub">Forensic Suite</div>
          </div>
        </div>

        <div className="shards-sidebar-nav">
          <div className="shards-nav-heading">Investigation</div>
          {navItems.slice(0, 2).map((item) => (
            <div
              key={item.key}
              onClick={() => setActiveTab(item.key)}
              className={`shards-nav-link ${activeTab === item.key ? "active" : ""}`}
            >
              <span className="shards-nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </div>
          ))}

          <div className="shards-nav-heading">Forensic Modules</div>
          {navItems.slice(2, 7).map((item) => (
            <div
              key={item.key}
              onClick={() => setActiveTab(item.key)}
              className={`shards-nav-link ${activeTab === item.key ? "active" : ""}`}
            >
              <span className="shards-nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </div>
          ))}

          <div className="shards-nav-heading">Evaluation &amp; Dossier</div>
          {navItems.slice(7).map((item) => (
            <div
              key={item.key}
              onClick={() => setActiveTab(item.key)}
              className={`shards-nav-link ${activeTab === item.key ? "active" : ""}`}
            >
              <span className="shards-nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </div>
          ))}
        </div>

        <div className="shards-sidebar-footer">
          <div className="d-flex align-items-center justify-content-between text-muted small">
            <span className="d-flex align-items-center gap-1">
              <IconLock size={13} />
              <span>Custody: SHA-256</span>
            </span>
            <Badge bg={isDemoMode ? "warning" : "success"} text={isDemoMode ? "dark" : "white"}>
              {isDemoMode ? "Live Demo" : "Connected"}
            </Badge>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="shards-main">
        {/* Shards Top Navbar */}
        <header className="shards-navbar">
          <div className="shards-search-box">
            <IconSearch size={16} color="#9ba7b6" />
            <input
              type="text"
              className="shards-search-input"
              placeholder="Search evidence, hashes, or indicators..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="shards-navbar-right">
            {/* Live Demo Switch */}
            <div className="d-flex align-items-center gap-2">
              <span className="pulse-indicator"></span>
              <button
                onClick={toggleDemoMode}
                className="btn btn-sm btn-outline-secondary py-1 px-2 d-flex align-items-center gap-1"
                style={{ fontSize: "0.75rem", fontWeight: 600 }}
                title="Toggle between client-side simulation (Vercel) and local backend API"
              >
                <span>{isDemoMode ? "Demo Mode: Active" : "Backend: Online"}</span>
                <IconRefresh size={12} />
              </button>
            </div>

            {/* Case Selector Dropdown */}
            <Form.Select
              size="sm"
              value={caseId}
              onChange={(e) => setCaseId(e.target.value)}
              style={{ width: "230px", fontSize: "0.82rem", fontWeight: 600 }}
            >
              {safeCases.map((c) => (
                <option key={c.case_id} value={String(c.case_id)}>
                  Case #{c.case_id}: {c.case_name?.substring(0, 22)}...
                </option>
              ))}
            </Form.Select>

            {/* New Case Button */}
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowNewCaseModal(true)}
              className="d-flex align-items-center gap-1 py-1 px-3"
              style={{ fontSize: "0.82rem", fontWeight: 600 }}
            >
              <IconPlus size={14} />
              <span>New Case</span>
            </Button>

            {/* Notification Bell */}
            <div className="position-relative p-1 text-muted" style={{ cursor: "pointer" }} title="Security Threat Alerts">
              <IconBell size={18} color="#5a6169" />
              <span
                className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
                style={{ fontSize: "0.6rem" }}
              >
                3
              </span>
            </div>

            {/* User Profile Chip */}
            <div className="shards-user-chip">
              <div className="shards-user-avatar">JD</div>
              <div className="d-none d-md-block text-start">
                <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "#2e384d", lineHeight: 1.1 }}>
                  John Doe
                </div>
                <div style={{ fontSize: "0.68rem", color: "#818ea3" }}>
                  Lead Examiner
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Content Container */}
        <main className="shards-content">
          {/* Page Title & Breadcrumb Header */}
          <div className="shards-page-header d-flex flex-wrap align-items-center justify-content-between gap-3">
            <div>
              <div className="shards-page-category">Cyber Crime Forensic Investigation</div>
              <h1 className="shards-page-title d-flex align-items-center gap-2">
                <span>{currentCase.case_name}</span>
                <span className="shards-badge shards-badge-success">{currentCase.status}</span>
                <span className={`shards-badge ${currentCase.risk_score >= 8.0 ? "shards-badge-danger" : "shards-badge-warning"}`}>
                  Risk Score: {currentCase.risk_score} / 10
                </span>
              </h1>
            </div>

            <div className="d-flex align-items-center gap-2">
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={() => setActiveTab("report")}
                className="d-flex align-items-center gap-1"
                style={{ fontSize: "0.8rem", fontWeight: 600 }}
              >
                <IconReport size={14} />
                <span>Export Dossier</span>
              </Button>
            </div>
          </div>

          {/* Streamlined Executive KPI Row (Only on Overview to keep UI uncluttered) */}
          {activeTab === "case-overview" && (
            <div className="shards-stats-row mb-4">
              {/* Card 1: Evidence Items */}
              <div className="shards-stat-card">
                <div>
                  <div className="shards-stat-label">Total Evidence Items</div>
                  <div className="shards-stat-value">{currentCase.evidence_count || 8}</div>
                  <div className="shards-stat-change positive">
                    <IconArrowUp size={12} />
                    <span>100% Hash Verified</span>
                  </div>
                </div>
                <svg className="shards-stat-sparkline" viewBox="0 0 200 35" preserveAspectRatio="none">
                  <path d="M0,25 Q30,10 60,20 T120,8 T160,22 T200,10" fill="none" stroke="#007bff" strokeWidth="2" />
                  <path d="M0,25 Q30,10 60,20 T120,8 T160,22 T200,10 V35 H0 Z" fill="rgba(0,123,255,0.06)" />
                </svg>
              </div>

              {/* Card 2: Suspicious Findings */}
              <div className="shards-stat-card">
                <div>
                  <div className="shards-stat-label">Suspicious Findings</div>
                  <div className="shards-stat-value">{currentCase.findings_count || 14}</div>
                  <div className="shards-stat-change negative">
                    <IconArrowUp size={12} />
                    <span>Multi-Vector Threats</span>
                  </div>
                </div>
                <svg className="shards-stat-sparkline" viewBox="0 0 200 35" preserveAspectRatio="none">
                  <path d="M0,28 Q35,15 70,25 T130,5 T170,20 T200,12" fill="none" stroke="#c4183c" strokeWidth="2" />
                  <path d="M0,28 Q35,15 70,25 T130,5 T170,20 T200,12 V35 H0 Z" fill="rgba(196,24,60,0.06)" />
                </svg>
              </div>

              {/* Card 3: Overall Risk */}
              <div className="shards-stat-card">
                <div>
                  <div className="shards-stat-label">Investigation Risk</div>
                  <div className="shards-stat-value">{currentCase.risk_score || 8.5} <span style={{ fontSize: "0.85rem", color: "#818ea3" }}>/ 10</span></div>
                  <div className="shards-stat-change negative">
                    <span>Critical Risk Tier</span>
                  </div>
                </div>
                <svg className="shards-stat-sparkline" viewBox="0 0 200 35" preserveAspectRatio="none">
                  <path d="M0,22 Q35,10 70,20 T130,8 T170,18 T200,6" fill="none" stroke="#ffb400" strokeWidth="2" />
                  <path d="M0,22 Q35,10 70,20 T130,8 T170,18 T200,6 V35 H0 Z" fill="rgba(255,180,0,0.06)" />
                </svg>
              </div>

              {/* Card 4: CIA Benchmark */}
              <div className="shards-stat-card">
                <div>
                  <div className="shards-stat-label">CIA Benchmark Score</div>
                  <div className="shards-stat-value">134 <span style={{ fontSize: "0.85rem", color: "#818ea3" }}>/ 180</span></div>
                  <div className="shards-stat-change positive">
                    <IconArrowUp size={12} />
                    <span>6 Active Pipelines</span>
                  </div>
                </div>
                <svg className="shards-stat-sparkline" viewBox="0 0 200 35" preserveAspectRatio="none">
                  <path d="M0,26 Q30,14 65,22 T125,10 T165,16 T200,6" fill="none" stroke="#17c671" strokeWidth="2" />
                  <path d="M0,26 Q30,14 65,22 T125,10 T165,16 T200,6 V35 H0 Z" fill="rgba(23,198,113,0.06)" />
                </svg>
              </div>
            </div>
          )}

          {/* Module Router View */}
          <div className="shards-module-content">
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
          </div>
        </main>
      </div>

      {/* New Case Creation Modal */}
      <Modal show={showNewCaseModal} onHide={() => setShowNewCaseModal(false)} centered>
        <Modal.Header closeButton className="border-bottom pb-3">
          <Modal.Title className="fs-5 fw-bold" style={{ color: "#2e384d" }}>
            Create New Forensic Investigation
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleCreateCase}>
          <Modal.Body className="p-4">
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold small" style={{ color: "#5a6169" }}>Case Title / Identification</Form.Label>
              <Form.Control
                type="text"
                placeholder="e.g. Ransomware Incident - Database Host"
                value={newCaseName}
                onChange={(e) => setNewCaseName(e.target.value)}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold small" style={{ color: "#5a6169" }}>Lead Investigator</Form.Label>
              <Form.Control
                type="text"
                value={newInvestigator}
                onChange={(e) => setNewInvestigator(e.target.value)}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold small" style={{ color: "#5a6169" }}>Investigation Scope &amp; Summary</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                placeholder="Describe digital evidence acquisition scope..."
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer className="border-top pt-3">
            <Button variant="outline-secondary" size="sm" onClick={() => setShowNewCaseModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Create Case
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
}

export default App;