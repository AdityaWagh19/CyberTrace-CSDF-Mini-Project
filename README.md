# CyberTrace: Digital Forensics & Incident Response Platform

[![Test Suite](https://img.shields.io/badge/pytest-9%20passed-brightgreen.svg)]()
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100%2B-009688.svg?logo=fastapi&logoColor=white)]()
[![React](https://img.shields.io/badge/React-19.x-61DAFB.svg?logo=react&logoColor=black)]()
[![TypeScript](https://img.shields.io/badge/TypeScript-4.9%2B-blue.svg?logo=typescript&logoColor=white)]()
[![License](https://img.shields.io/badge/License-MIT-blue.svg)]()

CyberTrace is a digital forensics investigation and incident response (DFIR) platform engineered with six forensic analysis pipelines, an automated cross-source correlation engine, a CIA Triad scoring matrix, and an interactive Shards-style investigation dashboard.

The system supports dual-mode operation:
1. **Live Backend Mode**: Connected to a high-throughput Python FastAPI REST service backed by SQLite and forensic analysis workers.
2. **Interactive Live Demo Mode**: Fully standalone client-side execution for presentations, portfolio demonstrations, and static deployments (Vercel, GitHub Pages) without requiring a running backend.

---

## Architecture and Core Modules

### 1. Authentication & System Log Forensics
- **Brute-Force Detection**: Time-window thresholding identifying repeated failed attempts per username/IP.
- **Off-Hours Anomaly Detection**: Flags authentications occurring outside standard enterprise hours (20:00 - 06:00) and weekends.
- **Geographic & Subnet Risk Auditing**: Highlights access requests originating from untrusted CIDR blocks.

### 2. Network Packet Capture (PCAP) Forensics
- **Deep Packet Inspection**: Native frame parsing and PyShark protocol dissection.
- **Port Scan Identification**: Recognizes SYN scan patterns and distributed horizontal sweeps.
- **Data Exfiltration Detection**: Detects large outbound streams exceeding configurable transfer thresholds.
- **DNS Query Auditing**: Tracks suspicious domain queries and TXT record tunneling attempts.

### 3. Cryptographic File Integrity & Chain of Custody
- **Cryptographic Auditing**: Computes SHA-256 and MD5 hashes across evidence artifacts.
- **Tamper Detection**: Validates incoming file hashes against an immutable custody baseline ledger.
- **Client-Side Hashing**: In Live Demo Mode, uses the browser Web Crypto API (`crypto.subtle.digest`) for in-memory hashing without server dependency.

### 4. Malware Signature & Behavioral Analysis
- **Known Threat Matching**: Queries known threat hashes against high-risk malware registries.
- **Shannon Entropy Gauge**: Measures byte randomness (0-8 scale) to identify packed, obfuscated, or encrypted payloads.
- **Heuristic Pattern Engine**: Evaluates executable file headers, suspicious extensions, and YARA signature indicators.

### 5. Document & File Metadata Forensics
- **PDF & Office Metadata Extraction**: Parses author, producer, creation/modification timestamps, and tool signatures.
- **Tamper & Discrepancy Auditing**: Compares declared document creation times against filesystem access records to detect timestomping.

### 6. Anti-Forensics & Deletion Event Analysis
- **Deletion Event Chronology**: Parses forensic deletion events to identify mass purging attempts.
- **Wiping Tool Detection**: Identifies artifacts left by secure deletion utilities (e.g., Sysinternals `sdelete`, Linux `shred`).

### 7. Correlation Engine & CIA Triad Scoring
- Aggregates findings from all six modules into an overall case risk score (0-100) and confidence tier.
- Maps findings across the Confidentiality, Integrity, and Availability (CIA) triad.
- Visualizes metrics using dynamic Plotly radar and grouped comparative charts.

---

## CIA Triad Evaluation Matrix

| Forensic Technique | Confidentiality | Integrity | Availability | Composite Score | Primary Capability |
|---|:---:|:---:|:---:|:---:|---|
| **Log Forensics** | 8/10 | 8/10 | 7/10 | **23/30** | Unauthorized access identification & timeline mapping |
| **Network Forensics** | 9/10 | 7/10 | 9/10 | **25/30** | Data exfiltration, scan sweeps, and service disruption |
| **File Integrity** | 5/10 | 10/10 | 7/10 | **22/30** | Mathematical proof of file tampering |
| **Malware Analysis** | 8/10 | 8/10 | 8/10 | **24/30** | Malicious payload detection and persistence analysis |
| **Metadata Forensics** | 6/10 | 7/10 | 5/10 | **18/30** | Author provenance and timestamp reconstruction |
| **Anti-Forensics** | 7/10 | 9/10 | 6/10 | **22/30** | Evidence destruction identification & recovery |

---

## Live Demo Feature

CyberTrace includes a built-in **Live Demo Mode** designed specifically for web hosting, project showcases, and evaluations where hosting a dedicated Python backend is unnecessary or prohibited:

- **Instant Switching**: Toggle between "Live Demo Mode" and "Backend API Mode" directly from the top navigation bar.
- **Multi-Case Investigation**: Switch seamlessly between three pre-configured forensic cases:
  - *Case CR-2026-0881*: Financial Database Intrusion & Ransomware Exfiltration.
  - *Case CR-2026-0904*: Insider Document Exfiltration & Metadata Alteration.
  - *Case CR-2026-0918*: Supply Chain Tampering & Anti-Forensics Shredding.
- **In-Browser Interactive Workflows**:
  - Drag and drop evidence files to calculate genuine SHA-256 hashes via the browser's native Web Crypto API.
  - Run instant client-side log, network, malware, metadata, and anti-forensics simulations.
  - Generate full multi-page PDF forensic evidence reports on the fly using `jspdf` and `jspdf-autotable`.

---

## Project Structure

```
├── vercel.json                  # Vercel deployment configuration
├── requirements.txt             # Python backend dependencies
├── pyrightconfig.json           # Python static analysis configuration
├── .github/workflows/
│   └── deploy-pages.yml         # GitHub Actions workflow for GitHub Pages
├── dashboard/                   # React + TypeScript frontend
│   ├── public/
│   │   ├── index.html           # HTML template with CDN Plotly integration
│   │   └── manifest.json        # Web app manifest
│   ├── src/
│   │   ├── components/          # Forensic UI modules
│   │   │   ├── CaseOverview.tsx
│   │   │   ├── EvidenceRegistry.tsx
│   │   │   ├── LogAnalysis.tsx
│   │   │   ├── NetworkAnalysis.tsx
│   │   │   ├── MalwareAnalysis.tsx
│   │   │   ├── MetadataAnalysis.tsx
│   │   │   ├── DeletedFileAnalysis.tsx
│   │   │   ├── CiaComparison.tsx
│   │   │   └── ReportGenerator.tsx
│   │   ├── icons.tsx            # Clean vector SVG icons
│   │   ├── mockData.ts          # Embedded cases for Live Demo mode
│   │   ├── shards-theme.css     # Shards dashboard design system
│   │   ├── App.tsx              # Main dashboard shell and navigation
│   │   └── index.tsx            # Application entrypoint
│   └── package.json
├── evidence/                    # Synthetic evidence artifacts
│   ├── auth_logs.csv
│   ├── sample_capture.pcap
│   ├── file_events.csv
│   ├── incident_briefing.pdf
│   ├── users.csv
│   └── users_tampered.csv
├── src/api/                     # FastAPI backend
│   ├── app.py                   # REST endpoints & lifespan lifecycle
│   ├── database.py              # SQLite schema & custody management
│   ├── seed_data.py             # Synthetic case generator
│   ├── log_forensics.py         # Log parser and anomaly detector
│   ├── network_forensics.py     # PCAP and flow inspector
│   ├── file_integrity.py        # Cryptographic auditing engine
│   ├── malware_analysis.py      # Shannon entropy and YARA matcher
│   ├── metadata_forensics.py    # Document metadata parser
│   ├── deleted_file_analysis.py # Anti-forensics and timeline reconstruction
│   └── correlation_engine.py    # Cross-source correlation & CIA scoring
└── tests/
    └── test_forensics.py        # Complete automated test suite
```

---

## Deployment Guide

### Deploying to Vercel

The project includes root-level `vercel.json` configuration for zero-configuration deployment:

1. Push your repository to GitHub.
2. Log in to [Vercel](https://vercel.com/) and click **Add New Project**.
3. Import the `CyberTrace-CSDF-Mini-Project` repository.
4. Set the following build settings (automatically detected from `vercel.json`):
   - **Framework Preset**: Create React App
   - **Build Command**: `cd dashboard && npm run build`
   - **Output Directory**: `dashboard/build`
5. Click **Deploy**.

The deployed site operates immediately in **Live Demo Mode**, allowing any evaluator to test all forensic modules, run simulations, inspect CIA charts, and export PDF reports directly in the browser.

### Deploying to GitHub Pages

The included workflow [deploy-pages.yml](.github/workflows/deploy-pages.yml) automates static deployment:
1. Navigate to repository **Settings > Pages > Build and deployment**.
2. Select **Source: GitHub Actions**.
3. Commit to the `main` branch to trigger the build and deployment.

---

## Local Development Setup

### 1. Backend (FastAPI)

Prerequisites: Python 3.10+

```bash
# Clone the repository
git clone https://github.com/AdityaWagh19/CyberTrace-CSDF-Mini-Project.git
cd CyberTrace-CSDF-Mini-Project

# Install backend dependencies
pip install -r requirements.txt

# Launch FastAPI server
python -m uvicorn app:app --app-dir src/api --host 127.0.0.1 --port 8000 --reload
```

Interactive API documentation will be accessible at `http://127.0.0.1:8000/docs`.

### 2. Frontend (React + TypeScript)

Prerequisites: Node.js 18+ and npm

```bash
cd dashboard

# Install dependencies
npm install

# Start local development server
npm start
```

The Shards dashboard will open at `http://localhost:3000`.

---

## Automated Verification

Execute the pytest suite covering all forensic modules, database persistence, and REST endpoints:

```bash
python -m pytest tests/test_forensics.py -v
```

Test coverage includes:
- SQLite schema generation and synthetic case seeding.
- Authentication log ingestion and brute-force thresholding.
- PCAP frame dissection and exfiltration identification.
- Cryptographic hash verification and baseline comparison.
- Shannon entropy calculation and malicious hash lookup.
- Document metadata extraction and timestomp detection.
- File deletion event parsing and secure wiper detection.
- Risk aggregation and CIA matrix scoring.
- FastAPI endpoint responses and schemas.

---

## Technical Specifications

- **Frontend**: React 19, TypeScript, React-Bootstrap, Plotly CDN, Recharts, jsPDF, AutoTable.
- **Backend**: FastAPI, Uvicorn, SQLite3, PyShark, PyPDF, Scapy, NumPy.
- **Design System**: Shards Dashboard aesthetic (Inter font, subtle card borders, KPI metric cards with SVG sparklines, zero emojis, clean SVG iconography).
- **License**: MIT
