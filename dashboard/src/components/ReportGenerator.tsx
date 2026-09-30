import React, { useEffect, useState } from "react";
import { Card, Button, Badge, Row, Col, Table, Alert } from "react-bootstrap";
import axios from "axios";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:8000";

interface ReportGeneratorProps {
  caseId: string;
}

export const ReportGenerator: React.FC<ReportGeneratorProps> = ({ caseId }) => {
  const [reportData, setReportData] = useState<any>(null);
  const [generating, setGenerating] = useState(false);
  const [showHtmlView, setShowHtmlView] = useState(false);

  useEffect(() => {
    const loadReportData = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/dashboard/${caseId}`);
        setReportData(res.data);
      } catch (err) {
        console.error("Failed to load report data:", err);
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
      doc.setFillColor(13, 110, 253);
      doc.rect(0, 0, 210, 30, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.text("Cyber Crime Investigation Forensic Analysis Report", 14, 20);

      doc.setTextColor(0, 0, 0);
      doc.setFontSize(11);
      doc.text(`Case ID: ${reportData.case_id}`, 14, 40);
      doc.text(`Case Name: ${reportData.case_name || "N/A"}`, 14, 46);
      doc.text(`Investigator: ${reportData.investigator || "N/A"}`, 14, 52);
      doc.text(`Report Date: ${new Date().toLocaleDateString()}`, 14, 58);
      doc.text(`Overall Threat / Risk Level: ${reportData.risk_level} (${reportData.risk_score}/10)`, 14, 64);

      // Section 1: Executive Summary
      doc.setFontSize(14);
      doc.setTextColor(13, 110, 253);
      doc.text("1. Executive Summary & Correlation", 14, 76);
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(10);
      const summary = reportData.correlation?.incident_type || "No suspicious correlation detected.";
      const splitSummary = doc.splitTextToSize(`Incident Assessment: ${summary}`, 180);
      doc.text(splitSummary, 14, 84);

      // Section 2: Evidence Inventory
      let currentY = 100;
      doc.setFontSize(14);
      doc.setTextColor(13, 110, 253);
      doc.text("2. Digital Evidence Inventory & Hash Integrity", 14, currentY);

      const evHeaders = ["ID", "File Name", "Type", "SHA-256 Hash", "Status"];
      const evData = (reportData.evidence_list || []).map((ev: any) => [
        ev.evidence_id,
        ev.file_name,
        ev.evidence_type,
        ev.sha256_hash?.substring(0, 18) + "...",
        ev.status || "VERIFIED",
      ]);

      autoTable(doc, {
        head: [evHeaders],
        body: evData,
        startY: currentY + 6,
        theme: "striped",
        headStyles: { fillColor: [33, 37, 41] },
      });

      // Section 3: Findings Table
      doc.addPage();
      doc.setFontSize(14);
      doc.setTextColor(13, 110, 253);
      doc.text("3. Forensic Findings Across 6 Techniques", 14, 20);

      const findingsHeaders = ["#", "Technique", "Observed Finding", "Severity"];
      const findingsData = (reportData.findings_list || []).map((f: any, idx: number) => [
        idx + 1,
        f.technique,
        f.finding,
        f.severity,
      ]);

      autoTable(doc, {
        head: [findingsHeaders],
        body: findingsData,
        startY: 26,
        theme: "grid",
        headStyles: { fillColor: [13, 110, 253] },
        columnStyles: { 2: { cellWidth: 100 } },
      });

      // Section 4: CIA Matrix
      doc.addPage();
      doc.setFontSize(14);
      doc.setTextColor(13, 110, 253);
      doc.text("4. CIA Triad Comparative Evaluation Matrix", 14, 20);

      const ciaHeaders = ["Forensic Technique", "Confidentiality", "Integrity", "Availability", "Total", "Assessment"];
      const ciaData = (reportData.cia_scores || []).map((s: any) => [
        s.technique,
        `${s.confidentiality}/10`,
        `${s.integrity}/10`,
        `${s.availability}/10`,
        `${s.total}/30`,
        s.interpretation,
      ]);

      autoTable(doc, {
        head: [ciaHeaders],
        body: ciaData,
        startY: 26,
        theme: "striped",
        headStyles: { fillColor: [25, 135, 84] },
      });

      // Save PDF
      doc.save(`forensic_report_case_${reportData.case_id}.pdf`);
    } catch (err) {
      console.error("PDF generation error:", err);
      alert("Error generating PDF: " + err);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Card className="shadow-sm border-0 mb-4">
      <Card.Header className="bg-primary text-white py-3">
        <h5 className="mb-0">Investigation Forensic Report Generator</h5>
      </Card.Header>
      <Card.Body className="p-4">
        {reportData ? (
          <div>
            <div className="d-flex justify-content-between align-items-center mb-4 p-3 bg-light rounded border">
              <div>
                <h5 className="mb-1">{reportData.case_name || `Case #${reportData.case_id}`}</h5>
                <p className="text-muted small mb-0">
                  Lead Investigator: <strong>{reportData.investigator}</strong> • Evidence Items: <strong>{reportData.evidence_count}</strong> • Findings: <strong>{reportData.findings_count}</strong>
                </p>
              </div>
              <div>
                <Badge bg={reportData.risk_level === "HIGH" ? "danger" : "warning"} className="fs-6 px-3 py-2">
                  Risk Level: {reportData.risk_level}
                </Badge>
              </div>
            </div>

            <div className="d-flex gap-2 mb-4">
              <Button variant="primary" onClick={generatePdfReport} disabled={generating}>
                {generating ? "Exporting PDF..." : "Export Official PDF Report"}
              </Button>
              <Button variant="outline-dark" onClick={() => setShowHtmlView(!showHtmlView)}>
                {showHtmlView ? "Hide Report Preview" : "Preview Full HTML Report"}
              </Button>
            </div>

            {/* In-Browser Report Preview */}
            {showHtmlView && (
              <Card className="border p-4 bg-white shadow-sm print-area">
                <div className="text-center border-bottom pb-3 mb-4">
                  <h3 className="text-primary fw-bold">CyberTrace Forensic Investigation Report</h3>
                  <p className="text-muted">Multi-Technique Digital Forensic Examination &amp; CIA Analysis</p>
                </div>

                <Row className="mb-4">
                  <Col md={6}>
                    <p><strong>Case ID:</strong> {reportData.case_id}</p>
                    <p><strong>Case Title:</strong> {reportData.case_name}</p>
                  </Col>
                  <Col md={6}>
                    <p><strong>Lead Examiner:</strong> {reportData.investigator}</p>
                    <p><strong>Date of Examination:</strong> {new Date().toLocaleDateString()}</p>
                  </Col>
                </Row>

                <h5 className="border-bottom pb-2 text-primary">1. Executive Summary &amp; Correlation</h5>
                <div className="alert alert-danger">
                  <strong>Correlated Threat Pattern:</strong> {reportData.correlation?.incident_type}
                </div>

                <h5 className="border-bottom pb-2 text-primary mt-4">2. Digital Evidence Inventory</h5>
                <Table responsive striped bordered size="sm" className="mb-4">
                  <thead className="table-dark">
                    <tr>
                      <th>#</th>
                      <th>File Name</th>
                      <th>Type</th>
                      <th>Acquired Timestamp</th>
                      <th>SHA-256 Hash</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(reportData.evidence_list || []).map((ev: any, i: number) => (
                      <tr key={i}>
                        <td>{ev.evidence_id}</td>
                        <td><code>{ev.file_name}</code></td>
                        <td>{ev.evidence_type}</td>
                        <td>{ev.collected_at}</td>
                        <td><span className="font-monospace small">{ev.sha256_hash}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </Table>

                <h5 className="border-bottom pb-2 text-primary mt-4">3. Correlated Forensic Findings</h5>
                <Table responsive striped bordered size="sm" className="mb-4">
                  <thead className="table-primary">
                    <tr>
                      <th>Technique</th>
                      <th>Specific Forensic Finding</th>
                      <th>Severity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(reportData.findings_list || []).map((f: any, i: number) => (
                      <tr key={i}>
                        <td><strong>{f.technique}</strong></td>
                        <td>{f.finding}</td>
                        <td><Badge bg={f.severity === "CRITICAL" || f.severity === "HIGH" ? "danger" : "warning"}>{f.severity}</Badge></td>
                      </tr>
                    ))}
                  </tbody>
                </Table>

                <h5 className="border-bottom pb-2 text-primary mt-4">4. CIA Triad Comparative Matrix</h5>
                <Table responsive striped bordered size="sm">
                  <thead className="table-success">
                    <tr>
                      <th>Forensic Technique</th>
                      <th>Confidentiality</th>
                      <th>Integrity</th>
                      <th>Availability</th>
                      <th>Total Score</th>
                      <th>Contribution</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(reportData.cia_scores || []).map((s: any, i: number) => (
                      <tr key={i}>
                        <td>{s.technique}</td>
                        <td>{s.confidentiality}/10</td>
                        <td>{s.integrity}/10</td>
                        <td>{s.availability}/10</td>
                        <td><strong>{s.total}/30</strong></td>
                        <td>{s.interpretation}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Card>
            )}
          </div>
        ) : (
          <Alert variant="info">Select a case to view and generate the investigation report.</Alert>
        )}
      </Card.Body>
    </Card>
  );
};