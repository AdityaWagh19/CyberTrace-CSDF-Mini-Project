import React, { useEffect, useState, useCallback } from "react";
import { Card, Button, Badge, Row, Col, Table } from "react-bootstrap";
import axios from "axios";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:8000";

interface CaseOverviewProps {
  caseId: string;
  fetchCases: () => void;
}

export const CaseOverview: React.FC<CaseOverviewProps> = ({ caseId, fetchCases }) => {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const loadCaseData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/api/dashboard/${caseId}`);
      setDashboardData(res.data);
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
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

  const getRiskBadgeVariant = (level: string) => {
    switch (level?.toUpperCase()) {
      case "HIGH":
      case "CRITICAL":
        return "danger";
      case "MEDIUM":
        return "warning";
      case "LOW":
        return "success";
      default:
        return "secondary";
    }
  };

  return (
    <Card className="shadow-sm border-0 mb-4">
      <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center py-3">
        <h5 className="mb-0">Case Overview: {dashboardData?.case_name || `Case #${caseId}`}</h5>
        <Badge bg="light" text="dark" className="px-3 py-2 fs-6">
          Status: {dashboardData?.status || "OPEN"}
        </Badge>
      </Card.Header>
      <Card.Body className="p-4">
        <Row className="g-3 mb-4">
          <Col xs={12} sm={6} md={3}>
            <Card className="h-100 border text-center p-3 bg-light">
              <span className="text-muted small">Investigator</span>
              <h5 className="mt-2 text-dark">{dashboardData?.investigator || "Forensic Analyst"}</h5>
            </Card>
          </Col>
          <Col xs={12} sm={6} md={3}>
            <Card className="h-100 border text-center p-3 bg-light">
              <span className="text-muted small">Evidence Registered</span>
              <h3 className="mt-1 text-primary">{dashboardData?.evidence_count || 0}</h3>
            </Card>
          </Col>
          <Col xs={12} sm={6} md={3}>
            <Card className="h-100 border text-center p-3 bg-light">
              <span className="text-muted small">Forensic Findings</span>
              <h3 className="mt-1 text-info">{dashboardData?.findings_count || 0}</h3>
            </Card>
          </Col>
          <Col xs={12} sm={6} md={3}>
            <Card className="h-100 border text-center p-3 bg-light">
              <span className="text-muted small">Overall Risk Level</span>
              <div className="mt-2">
                <Badge bg={getRiskBadgeVariant(dashboardData?.risk_level)} className="fs-6 px-3 py-2">
                  {dashboardData?.risk_level || "LOW"}
                </Badge>
              </div>
            </Card>
          </Col>
        </Row>

        {dashboardData?.description && (
          <div className="alert alert-info py-2 px-3 mb-4">
            <strong>Case Scope & Description:</strong> {dashboardData.description}
          </div>
        )}

        {dashboardData?.correlation && (
          <Card className="border mb-4">
            <Card.Header className="bg-dark text-white fw-bold">
              Multi-Technique Correlation Assessment
            </Card.Header>
            <Card.Body>
              <h6>
                <strong>Incident Classification:</strong>{" "}
                <span className="text-danger">{dashboardData.correlation.incident_type}</span>
              </h6>
              <p className="mb-2">
                <strong>Calculated Composite Risk Score:</strong>{" "}
                <span className="badge bg-danger fs-6">{dashboardData.correlation.risk_score} / 10.0</span>
              </p>
              {dashboardData.correlation.high_severity_techniques?.length > 0 && (
                <p className="mb-0 text-muted">
                  <strong>High Severity Disciplines:</strong>{" "}
                  {dashboardData.correlation.high_severity_techniques.join(" • ")}
                </p>
              )}
            </Card.Body>
          </Card>
        )}

        {dashboardData?.findings_list && dashboardData.findings_list.length > 0 && (
          <div className="mb-4">
            <h5 className="mb-3">Recorded Forensic Findings</h5>
            <Table responsive striped bordered hover className="align-middle">
              <thead className="table-dark">
                <tr>
                  <th>#</th>
                  <th>Forensic Technique</th>
                  <th>Observed Finding</th>
                  <th>Severity</th>
                  <th>Confidence</th>
                </tr>
              </thead>
              <tbody>
                {dashboardData.findings_list.map((f: any, idx: number) => (
                  <tr key={idx}>
                    <td>{idx + 1}</td>
                    <td><Badge bg="secondary">{f.technique}</Badge></td>
                    <td>{f.finding}</td>
                    <td>
                      <Badge bg={getRiskBadgeVariant(f.severity)}>{f.severity}</Badge>
                    </td>
                    <td>{f.confidence}/10</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        )}

        <div className="d-flex gap-2">
          <Button variant="primary" onClick={handleRefresh} disabled={loading}>
            {loading ? "Refreshing..." : "Refresh Case Data"}
          </Button>
        </div>
      </Card.Body>
    </Card>
  );
};