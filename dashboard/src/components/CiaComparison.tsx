import React, { useEffect, useState, useCallback } from "react";
import { Row, Col, Alert } from "react-bootstrap";
import axios from "axios";
import createPlotlyComponent from "react-plotly.js/factory";
import { IconCiaTriad, IconCheck } from "../icons";
import { API_BASE } from "../apiConfig";

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
  const [techniqueScores, setTechniqueScores] = useState<any[]>(DEFAULT_SCORES);
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
      const res = await axios.get(`${API_BASE}/api/dashboard/${caseId}`, { timeout: 2500 });
      const scores = res.data?.cia_scores?.length > 0 ? res.data.cia_scores : DEFAULT_SCORES;
      setTechniqueScores(scores);
    } catch (err: any) {
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

  const generateBarData = () => {
    const labels = ["Logs", "Network", "Integrity", "Malware", "Metadata", "Anti-Forensics"];
    const conf = techniqueScores.map((s) => s.confidentiality);
    const integ = techniqueScores.map((s) => s.integrity);
    const avail = techniqueScores.map((s) => s.availability);

    return {
      data: [
        { x: labels, y: conf, name: "Confidentiality", type: "bar" as const, marker: { color: "#007bff" } },
        { x: labels, y: integ, name: "Integrity", type: "bar" as const, marker: { color: "#17c671" } },
        { x: labels, y: avail, name: "Availability", type: "bar" as const, marker: { color: "#ffb400" } },
      ],
      layout: {
        barmode: "group" as const,
        autosize: true,
        height: 340,
        margin: { b: 35, l: 35, r: 15, t: 25 },
        legend: { orientation: "h" as const, x: 0, y: 1.15, font: { size: 11 } },
        yaxis: { range: [0, 11], dtick: 2, gridcolor: "#f1f3f6", zeroline: false },
        xaxis: { gridcolor: "transparent", tickfont: { size: 11, color: "#5a6169" } },
        plot_bgcolor: "#ffffff",
        paper_bgcolor: "#ffffff",
      },
    };
  };

  const generateRadarData = () => {
    const labels = ["Logs", "Network", "Integrity", "Malware", "Metadata", "Anti-Forensics"];
    const conf = techniqueScores.map((s) => s.confidentiality);
    const integ = techniqueScores.map((s) => s.integrity);
    const avail = techniqueScores.map((s) => s.availability);

    return {
      data: [
        {
          type: "scatterpolar" as const,
          r: [...conf, conf[0]],
          theta: [...labels, labels[0]],
          fill: "toself" as const,
          name: "Confidentiality",
          line: { color: "#007bff", width: 2 },
        },
        {
          type: "scatterpolar" as const,
          r: [...integ, integ[0]],
          theta: [...labels, labels[0]],
          fill: "toself" as const,
          name: "Integrity",
          line: { color: "#17c671", width: 2 },
        },
        {
          type: "scatterpolar" as const,
          r: [...avail, avail[0]],
          theta: [...labels, labels[0]],
          fill: "toself" as const,
          name: "Availability",
          line: { color: "#ffb400", width: 2 },
        },
      ],
      layout: {
        polar: {
          radialaxis: { visible: true, range: [0, 10], tickfont: { size: 9 }, gridcolor: "#f1f3f6" },
          angularaxis: { tickfont: { size: 11, color: "#5a6169" } },
          bgcolor: "#fafbfe",
        },
        autosize: true,
        height: 340,
        margin: { b: 30, l: 30, r: 30, t: 25 },
        legend: { orientation: "h" as const, x: 0, y: 1.15, font: { size: 11 } },
        paper_bgcolor: "#ffffff",
      },
    };
  };

  const barChart = generateBarData();
  const radarChart = generateRadarData();

  return (
    <div>
      {/* Module Overview Card */}
      <div className="shards-card mb-4">
        <div className="shards-card-header">
          <h6 className="shards-card-title d-flex align-items-center gap-2">
            <IconCiaTriad size={16} />
            <span>Technique Evaluation: CIA Triad Matrix &amp; Comparative Benchmark</span>
          </h6>
          <span className="shards-badge shards-badge-primary">Standardized 1-10 Scale</span>
        </div>
        <div className="shards-card-body">
          <p className="text-muted small mb-0">
            Systematic benchmark evaluating all six digital forensic techniques against the fundamental security triad:
            Confidentiality (privacy and secrecy), Integrity (tamper resistance and authenticity), and Availability (continuity and access).
          </p>
          {errorMsg && <Alert variant="warning" className="mt-3 py-2 px-3 small">{errorMsg}</Alert>}
        </div>
      </div>

      {/* Evaluation Matrix Table */}
      <div className="shards-card mb-4">
        <div className="shards-card-header">
          <h6 className="shards-card-title">CIA Evaluation Matrix &amp; Technique Contributions</h6>
          <span className="shards-badge shards-badge-success">Triad Benchmark: 134 / 180</span>
        </div>
        <div className="p-0">
          <div className="table-responsive">
            <table className="shards-table">
              <thead>
                <tr>
                  <th>Forensic Technique</th>
                  <th className="text-center" style={{ width: "140px" }}>Confidentiality</th>
                  <th className="text-center" style={{ width: "120px" }}>Integrity</th>
                  <th className="text-center" style={{ width: "120px" }}>Availability</th>
                  <th className="text-center" style={{ width: "130px" }}>Total Score</th>
                  <th>Contribution Assessment &amp; Justification</th>
                </tr>
              </thead>
              <tbody>
                {techniqueScores.map((s: any, idx: number) => {
                  const total = getTotal(s);
                  return (
                    <tr key={idx}>
                      <td className="fw-bold text-dark">{s.technique}</td>
                      <td className="text-center">
                        <span className="shards-badge shards-badge-primary">{s.confidentiality} / 10</span>
                      </td>
                      <td className="text-center">
                        <span className="shards-badge shards-badge-success">{s.integrity} / 10</span>
                      </td>
                      <td className="text-center">
                        <span className="shards-badge shards-badge-warning">{s.availability} / 10</span>
                      </td>
                      <td className="text-center fw-bold">
                        <span className="fs-6 text-dark">{total}</span>
                        <span className="small text-muted"> / 30</span>
                      </td>
                      <td>
                        <div className="small text-secondary mb-1">{s.justification}</div>
                        <span className={`shards-badge ${total >= 23 ? "shards-badge-success" : total >= 20 ? "shards-badge-primary" : "shards-badge-dark"}`}>
                          {getInterpretation(total)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Visual Charts Row */}
      <Row className="g-4 mb-4">
        <Col xs={12} lg={6}>
          <div className="shards-card h-100">
            <div className="shards-card-header">
              <h6 className="shards-card-title">Grouped Bar Matrix Analysis</h6>
              <span className="small text-muted d-flex align-items-center gap-1">
                <IconCheck size={12} color="#17c671" />
                <span>Interactive Plot</span>
              </span>
            </div>
            <div className="shards-card-body p-2" style={{ minHeight: "350px", overflow: "hidden" }}>
              {PlotComponent ? (
                <PlotComponent
                  data={barChart.data as any}
                  layout={barChart.layout as any}
                  useResizeHandler={true}
                  config={{ responsive: true, displayModeBar: false }}
                  style={{ width: "100%", height: "340px" }}
                />
              ) : (
                <div className="d-flex align-items-center justify-content-center" style={{ height: "340px" }}>
                  <span className="text-muted small">Loading chart engine...</span>
                </div>
              )}
            </div>
          </div>
        </Col>

        <Col xs={12} lg={6}>
          <div className="shards-card h-100">
            <div className="shards-card-header">
              <h6 className="shards-card-title">Polar Radar Triad Projection</h6>
              <span className="small text-muted d-flex align-items-center gap-1">
                <IconCheck size={12} color="#17c671" />
                <span>Polar Axis</span>
              </span>
            </div>
            <div className="shards-card-body p-2" style={{ minHeight: "350px", overflow: "hidden" }}>
              {PlotComponent ? (
                <PlotComponent
                  data={radarChart.data as any}
                  layout={radarChart.layout as any}
                  useResizeHandler={true}
                  config={{ responsive: true, displayModeBar: false }}
                  style={{ width: "100%", height: "340px" }}
                />
              ) : (
                <div className="d-flex align-items-center justify-content-center" style={{ height: "340px" }}>
                  <span className="text-muted small">Loading chart engine...</span>
                </div>
              )}
            </div>
          </div>
        </Col>
      </Row>
    </div>
  );
};