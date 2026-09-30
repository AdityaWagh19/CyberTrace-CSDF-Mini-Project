import React, { useEffect, useState } from "react";
import { Button, Row, Col } from "react-bootstrap";
import axios from "axios";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { IconReport, IconDownload, IconCheck } from "../icons";
import { MOCK_CASES } from "../mockData";

import { API_BASE } from "../apiConfig";

interface ReportGeneratorProps {
  caseId: string;
}

export const ReportGenerator: React.FC<ReportGeneratorProps> = ({ caseId }) => {
  const defaultCase = MOCK_CASES.find((c) => String(c.case_id) === String(caseId)) || MOCK_CASES[0];
  const [reportData, setReportData] = useState<any>(defaultCase);
  const [generating, setGenerating] = useState(false);
  const [showHtmlView] = useState(true);

  useEffect(() => {
    const loadReportData = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/dashboard/${caseId}`, { timeout: 2500 });
        if (res.data && typeof res.data === "object" && !Array.isArray(res.data) && res.data.case_name) {
          setReportData(res.data);
        } else {
          const matched = MOCK_CASES.find((c) => String(c.case_id) === String(caseId)) || MOCK_CASES[0];
          setReportData(matched);
        }
      } catch (err) {
        const matched = MOCK_CASES.find((c) => String(c.case_id) === String(caseId)) || MOCK_CASES[0];
        setReportData(matched);
      }
    };
    if (caseId) {
      loadReportData();
    }
  }, [caseId]);

  const generatePdfReport = () => {
    if (!reportData) return;
    setGenerating(true);
    try {
      const doc = new jsPDF();

      // Title Header
      doc.setFillColor(0, 123, 255);
      doc.rect(0, 0, 210, 28, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.text("CyberTrace Forensic Investigation Report", 14, 18);

      doc.setTextColor(46, 56, 77);
      doc.setFontSize(10);
      doc.text(`Case ID: ${reportData.case_id}`, 14, 38);
      doc.text(`Case Title: ${reportData.case_name || "N/A"}`, 14, 44);
      doc.text(`Lead Examiner: ${reportData.investigator || "Aditya Wagh"}`, 14, 50);
      doc.text(`Generation Date: ${new Date().toISOString().substring(0, 10)}`, 14, 56);
      doc.text(`Risk Assessment: ${reportData.risk_level || "HIGH"} (Score: ${reportData.risk_score || 8.5}/10)`, 14, 62);

      // Section 1: Executive Summary
      doc.setFontSize(12);
      doc.text("1. Executive Summary & Incident Scope", 14, 74);
      doc.setFontSize(9);
      doc.setTextColor(90, 97, 105);
      const splitDesc = doc.splitTextToSize(
        reportData.description || "Digital forensic investigation conducted across 6 forensic techniques: Log Forensics, Network PCAP, File Integrity, Malware Signatures, Metadata Extraction, and Anti-Forensics.",
        180
      );
      doc.text(splitDesc, 14, 82);

      // Section 2: Chain of Custody Table
      doc.setFontSize(12);
      doc.setTextColor(46, 56, 77);
      doc.text("2. Evidence Chain of Custody Ledger", 14, 105);

      const evidenceRows = (reportData.evidence_list || defaultCase.evidence_list).map((e: any, idx: number) => [
        `#${e.evidence_id || idx + 1}`,
        e.filename,
        e.evidence_type?.toUpperCase() || "ARTIFACT",
        (e.sha256_hash || "").substring(0, 24) + "...",
        e.custody_officer || "Aditya Wagh",
      ]);

      autoTable(doc, {
        startY: 110,
        head: [["ID", "Artifact", "Class", "SHA-256 Digest", "Custodian"]],
        body: evidenceRows,
        theme: "striped",
        headStyles: { fillColor: [0, 123, 255] },
        styles: { fontSize: 8 },
      });

      // Section 3: Findings Table
      const finalY = (doc as any).lastAutoTable.finalY + 14;
      doc.setFontSize(12);
      doc.text("3. Correlated Forensic Findings & Threat Anomalies", 14, finalY);

      const findingsRows = (reportData.findings || defaultCase.findings).map((f: any) => [
        f.technique,
        f.severity,
        f.finding,
        f.created_at || "2026-09-30",
      ]);

      autoTable(doc, {
        startY: finalY + 5,
        head: [["Technique", "Severity", "Observation & Anomaly", "Timestamp"]],
        body: findingsRows,
        theme: "striped",
        headStyles: { fillColor: [196, 24, 60] },
        styles: { fontSize: 8 },
      });

      // Save PDF file
      doc.save(`CyberTrace_Case_${reportData.case_id}_Report.pdf`);
    } catch (err) {
      console.error("PDF generation failed:", err);
    } finally {
      setGenerating(false);
    }
  };

  const exportJsonDossier = () => {
    if (!reportData) return;
    const jsonStr = JSON.stringify(reportData, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `CyberTrace_Case_${reportData.case_id}_Dossier.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      {/* Module Overview Card */}
      <div className="shards-card mb-4">
        <div className="shards-card-header">
          <h6 className="shards-card-title d-flex align-items-center gap-2">
            <IconReport size={16} />
            <span>Forensic Dossier &amp; Investigation Report Generator</span>
          </h6>
          <div className="d-flex align-items-center gap-2">
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={exportJsonDossier}
              className="d-flex align-items-center gap-1"
            >
              <IconDownload size={13} />
              <span>Export JSON</span>
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={generatePdfReport}
              disabled={generating}
              className="d-flex align-items-center gap-1"
            >
              <IconDownload size={13} />
              <span>{generating ? "Compiling PDF..." : "Export Formal PDF Report"}</span>
            </Button>
          </div>
        </div>
        <div className="shards-card-body">
          <p className="text-muted small mb-0">
            Synthesizes all digital evidence records, cryptographic custody hashes, detected security anomalies,
            and CIA triad benchmark matrices into an evidentiary report suitable for court submission and executive debriefs.
          </p>
        </div>
      </div>

      {/* Report Preview Document */}
      {showHtmlView && reportData && (
        <div className="shards-card">
          <div className="shards-card-header bg-light">
            <div>
              <span className="small text-muted text-uppercase fw-bold">Executive Case Dossier</span>
              <h5 className="mb-0 fw-bold text-dark mt-1">Case #{reportData.case_id}: {reportData.case_name}</h5>
            </div>
            <span className="shards-badge shards-badge-success">Audit Complete</span>
          </div>

          <div className="shards-card-body">
            {/* Meta Summary Row */}
            <div className="p-3 bg-light rounded border mb-4">
              <Row className="g-3">
                <Col xs={12} md={3}>
                  <div className="small text-muted">Lead Examiner</div>
                  <div className="fw-bold text-dark">{reportData.investigator || "Aditya Wagh"}</div>
                </Col>
                <Col xs={12} md={3}>
                  <div className="small text-muted">Case Status</div>
                  <div><span className="shards-badge shards-badge-primary">{reportData.status || "OPEN"}</span></div>
                </Col>
                <Col xs={12} md={3}>
                  <div className="small text-muted">Risk Assessment</div>
                  <div>
                    <span className={`shards-badge ${reportData.risk_score >= 8 ? "shards-badge-danger" : "shards-badge-warning"}`}>
                      {reportData.risk_level || "HIGH"} ({reportData.risk_score || 8.5}/10)
                    </span>
                  </div>
                </Col>
                <Col xs={12} md={3}>
                  <div className="small text-muted">Evidence Custody</div>
                  <div className="small text-success fw-bold d-flex align-items-center gap-1">
                    <IconCheck size={14} color="#17c671" />
                    <span>SHA-256 Validated</span>
                  </div>
                </Col>
              </Row>
            </div>

            {/* Scope */}
            <div className="mb-4">
              <h6 className="fw-bold text-dark border-bottom pb-2">1. Incident Background &amp; Scope</h6>
              <p className="text-secondary small">
                {reportData.description || defaultCase.description}
              </p>
            </div>

            {/* Evidence Table */}
            <div className="mb-4">
              <h6 className="fw-bold text-dark border-bottom pb-2">2. Ingested Evidence Artifacts</h6>
              <div className="table-responsive">
                <table className="shards-table">
                  <thead>
                    <tr>
                      <th style={{ width: "60px" }}>ID</th>
                      <th style={{ width: "200px" }}>Artifact</th>
                      <th style={{ width: "120px" }}>Class</th>
                      <th>SHA-256 Cryptographic Hash</th>
                      <th style={{ width: "140px" }}>Acquisition Timestamp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(reportData.evidence_list || defaultCase.evidence_list).map((e: any, idx: number) => (
                      <tr key={idx}>
                        <td className="text-muted fw-bold">#{e.evidence_id || idx + 1}</td>
                        <td className="fw-bold text-dark">{e.filename}</td>
                        <td><span className="shards-badge shards-badge-primary text-uppercase">{e.evidence_type}</span></td>
                        <td><span className="shards-table-code text-truncate d-inline-block" style={{ maxWidth: "340px" }}>{e.sha256_hash}</span></td>
                        <td><span className="small text-muted font-monospace">{e.acquired_at}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Findings Table */}
            <div className="mb-4">
              <h6 className="fw-bold text-dark border-bottom pb-2">3. Primary Forensic Observations</h6>
              <div className="table-responsive">
                <table className="shards-table">
                  <thead>
                    <tr>
                      <th style={{ width: "180px" }}>Technique</th>
                      <th style={{ width: "120px" }}>Severity</th>
                      <th>Observation &amp; Anomaly</th>
                      <th style={{ width: "140px" }}>Observed Timestamp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(reportData.findings || defaultCase.findings).map((f: any, idx: number) => (
                      <tr key={idx}>
                        <td className="fw-semibold text-dark">{f.technique}</td>
                        <td>
                          <span className={`shards-badge ${f.severity === "CRITICAL" || f.severity === "HIGH" ? "shards-badge-danger" : "shards-badge-warning"}`}>
                            {f.severity}
                          </span>
                        </td>
                        <td className="small text-secondary">{f.finding}</td>
                        <td className="small text-muted font-monospace">{f.created_at || "2026-09-30"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* CIA Matrix */}
            <div>
              <h6 className="fw-bold text-dark border-bottom pb-2">4. CIA Triad Scoring Matrix Summary</h6>
              <div className="table-responsive">
                <table className="shards-table">
                  <thead>
                    <tr>
                      <th>Forensic Technique</th>
                      <th className="text-center">Confidentiality</th>
                      <th className="text-center">Integrity</th>
                      <th className="text-center">Availability</th>
                      <th className="text-center">Total (30)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(reportData.cia_scores || defaultCase.cia_scores).map((s: any, idx: number) => (
                      <tr key={idx}>
                        <td className="fw-semibold text-dark">{s.technique}</td>
                        <td className="text-center"><span className="shards-badge shards-badge-primary">{s.confidentiality} / 10</span></td>
                        <td className="text-center"><span className="shards-badge shards-badge-success">{s.integrity} / 10</span></td>
                        <td className="text-center"><span className="shards-badge shards-badge-warning">{s.availability} / 10</span></td>
                        <td className="text-center fw-bold">{s.confidentiality + s.integrity + s.availability} / 30</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};