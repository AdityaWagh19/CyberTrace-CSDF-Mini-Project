import React, { useEffect, useState, useCallback } from "react";
import { Card, Table, Badge, Row, Col, Alert } from "react-bootstrap";
import axios from "axios";
import createPlotlyComponent from "react-plotly.js/factory";

let cachedPlot: any = null;
const getPlotComponent = () => {
  if (cachedPlot) return cachedPlot;
  const plotly = typeof window !== "undefined" ? (window as any).Plotly : null;
  if (plotly) {
    cachedPlot = createPlotlyComponent(plotly);
    return cachedPlot;
  }
  return null;
};

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:8000";

interface CiaComparisonProps {
  caseId: string;
}

const DEFAULT_SCORES = [
  { technique: "Log Forensics", confidentiality: 8, integrity: 8, availability: 7, justification: "Detects unauthorized access and event timelines" },
  { technique: "Network Forensics", confidentiality: 9, integrity: 7, availability: 9, justification: "Identifies data transfer, scans, and disruption" },
  { technique: "File Integrity Analysis", confidentiality: 5, integrity: 10, availability: 7, justification: "Proves whether files were modified" },
  { technique: "Malware Signature Analysis", confidentiality: 8, integrity: 8, availability: 8, justification: "Detects malicious files and persistence indicators" },
  { technique: "Metadata Forensics", confidentiality: 6, integrity: 7, availability: 5, justification: "Provides file context and timeline clues" },
  { technique: "Deleted-File Analysis", confidentiality: 7, integrity: 9, availability: 6, justification: "Identifies evidence destruction and data loss" },
];

export const CiaComparison: React.FC<CiaComparisonProps> = ({ caseId }) => {
  const [PlotComponent, setPlotComponent] = useState<any>(() => getPlotComponent());
  const [techniqueScores, setTechniqueScores] = useState<any[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!PlotComponent) {
      const interval = setInterval(() => {
        const comp = getPlotComponent();
        if (comp) {
          setPlotComponent(() => comp);
          clearInterval(interval);
        }
      }, 100);
      return () => clearInterval(interval);
    }
  }, [PlotComponent]);

  const fetchCiaData = useCallback(async () => {
    setErrorMsg(null);
    try {
      const res = await axios.get(`${API_BASE}/api/dashboard/${caseId}`);
      const scores = res.data?.cia_scores?.length > 0 ? res.data.cia_scores : DEFAULT_SCORES;
      setTechniqueScores(scores);
    } catch (err: any) {
      console.error("Failed to fetch CIA data, using default matrix:", err);
      setTechniqueScores(DEFAULT_SCORES);
    }
  }, [caseId]);

  useEffect(() => {
    if (caseId) {
      fetchCiaData();
    }
  }, [caseId, fetchCiaData]);

  const getTotal = (s: any) => {
    return (s.confidentiality || 0) + (s.integrity || 0) + (s.availability || 0);
  };

  const getInterpretation = (total: number) => {
    if (total >= 24) return "Very strong contribution";
    if (total >= 21) return "Strong contribution";
    if (total >= 17) return "Moderate contribution";
    return "Weak contribution";
  };

  // Grouped Bar Chart Traces
  const generateBarData = () => {
    const techniques = techniqueScores.map((s) => s.technique);
    const conf = techniqueScores.map((s) => s.confidentiality);
    const integ = techniqueScores.map((s) => s.integrity);
    const avail = techniqueScores.map((s) => s.availability);

    return {
      data: [
        { x: techniques, y: conf, name: "Confidentiality", type: "bar" as const, marker: { color: "#0d6efd" } },
        { x: techniques, y: integ, name: "Integrity", type: "bar" as const, marker: { color: "#198754" } },
        { x: techniques, y: avail, name: "Availability", type: "bar" as const, marker: { color: "#ffc107" } },
      ],
      layout: {
        barmode: "group" as const,
        title: { text: "Forensic Technique Comparison across CIA Triad" },
        yaxis: { title: { text: "Score (1-10)" }, range: [0, 11], dtick: 2 },
        xaxis: { tickangle: -15 },
        margin: { b: 80, l: 50, r: 20, t: 50 },
        autosize: true,
      },
    };
  };

  // Radar / Spider Chart Traces
  const generateRadarData = () => {
    const techniques = techniqueScores.map((s) => s.technique);
    const conf = techniqueScores.map((s) => s.confidentiality);
    const integ = techniqueScores.map((s) => s.integrity);
    const avail = techniqueScores.map((s) => s.availability);

    return {
      data: [
        {
          type: "scatterpolar" as const,
          r: [...conf, conf[0]],
          theta: [...techniques, techniques[0]],
          fill: "toself" as const,
          name: "Confidentiality",
          line: { color: "#0d6efd" },
        },
        {
          type: "scatterpolar" as const,
          r: [...integ, integ[0]],
          theta: [...techniques, techniques[0]],
          fill: "toself" as const,
          name: "Integrity",
          line: { color: "#198754" },
        },
        {
          type: "scatterpolar" as const,
          r: [...avail, avail[0]],
          theta: [...techniques, techniques[0]],
          fill: "toself" as const,
          name: "Availability",
          line: { color: "#ffc107" },
        },
      ],
      layout: {
        polar: {
          radialaxis: { visible: true, range: [0, 10] },
        },
        title: { text: "CIA Triad Radar Analysis" },
        margin: { b: 50, l: 50, r: 50, t: 50 },
        autosize: true,
      },
    };
  };

  const barChart = generateBarData();
  const radarChart = generateRadarData();

  return (
    <Card className="shadow-sm border-0 mb-4">
      <Card.Header className="bg-primary text-white py-3">
        <h5 className="mb-0">Technique Comparison: CIA Triad Evaluation Matrix</h5>
      </Card.Header>
      <Card.Body className="p-4">
        <p className="text-muted">
          Evaluates and benchmarks all six cyber forensic techniques against the CIA triad
          (Confidentiality, Integrity, and Availability) on a standardized 1–10 scale.
        </p>

        {errorMsg && <Alert variant="warning">{errorMsg}</Alert>}

        <Card className="border mb-4">
          <Card.Header className="bg-dark text-white fw-bold">
            CIA Evaluation Matrix (1–10 Scale)
          </Card.Header>
          <Card.Body className="p-0">
            <Table responsive striped bordered hover className="align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>Forensic Technique</th>
                  <th className="text-center text-primary">Confidentiality</th>
                  <th className="text-center text-success">Integrity</th>
                  <th className="text-center text-warning">Availability</th>
                  <th className="text-center fw-bold">Total Score</th>
                  <th>Contribution Assessment</th>
                </tr>
              </thead>
              <tbody>
                {techniqueScores.map((s: any, idx: number) => {
                  const total = getTotal(s);
                  return (
                    <tr key={idx}>
                      <td className="fw-bold">{s.technique}</td>
                      <td className="text-center"><Badge bg="primary">{s.confidentiality}/10</Badge></td>
                      <td className="text-center"><Badge bg="success">{s.integrity}/10</Badge></td>
                      <td className="text-center"><Badge bg="warning" text="dark">{s.availability}/10</Badge></td>
                      <td className="text-center fw-bold fs-6">{total} / 30</td>
                      <td>
                        <span className="small text-muted d-block">{s.justification}</span>
                        <Badge bg={total >= 23 ? "success" : total >= 20 ? "primary" : "secondary"}>
                          {getInterpretation(total)}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </Card.Body>
        </Card>

        {/* Charts Row */}
        <Row className="g-4 mb-4">
          <Col xs={12} lg={6}>
            <Card className="border h-100 p-2">
              {PlotComponent ? (
                <PlotComponent
                  data={barChart.data as any}
                  layout={barChart.layout as any}
                  useResizeHandler={true}
                  style={{ width: "100%", height: "400px" }}
                />
              ) : (
                <div className="d-flex align-items-center justify-content-center" style={{ height: "400px" }}>
                  <span className="text-muted">Loading visualization engine...</span>
                </div>
              )}
            </Card>
          </Col>
          <Col xs={12} lg={6}>
            <Card className="border h-100 p-2">
              {PlotComponent ? (
                <PlotComponent
                  data={radarChart.data as any}
                  layout={radarChart.layout as any}
                  useResizeHandler={true}
                  style={{ width: "100%", height: "400px" }}
                />
              ) : (
                <div className="d-flex align-items-center justify-content-center" style={{ height: "400px" }}>
                  <span className="text-muted">Loading visualization engine...</span>
                </div>
              )}
            </Card>
          </Col>
        </Row>
      </Card.Body>
    </Card>
  );
};