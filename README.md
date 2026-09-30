# CyberTrace: Cyber Crime Investigation & Forensic Analysis System

[![Test Suite](https://img.shields.io/badge/pytest-9%20passed-brightgreen.svg)]()
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100%2B-009688.svg?logo=fastapi&logoColor=white)]()
[![React](https://img.shields.io/badge/React-19.x-61DAFB.svg?logo=react&logoColor=black)]()
[![TypeScript](https://img.shields.io/badge/TypeScript-4.9%2B-blue.svg?logo=typescript&logoColor=white)]()
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)]()

> A unified digital forensics investigation system and interactive web dashboard implementing six cyber forensic techniques, CIA Triad scoring matrix, automated suspicious event correlation, and multi-format evidence reporting.

---

## 🔍 Forensic Techniques Supported

1. **Authentication & System Log Forensics**
   - Brute-force detection (failed attempts thresholding)
   - Off-hours anomalous login identification (night/weekend access)
   - Unknown and untrusted IP geolocation analysis

2. **Network Packet Capture (PCAP) Forensics**
   - High-speed native packet dissection and PyShark integration
   - Port scan detection (SYN scans, distributed sweeps)
   - Large outbound data exfiltration transfers
   - DNS query analysis and suspicious domain querying

3. **Cryptographic File Integrity Verification**
   - SHA-256 and MD5 cryptographic baseline auditing
   - Tamper detection against recorded custody hashes
   - Batch directory hashing and baseline change reports

4. **Malware Signature & Behavioral Analysis**
   - Known malicious hash database matching
   - Shannon entropy analysis for encrypted/packed executables
   - Suspicious extension & double-extension detection (`.exe`, `.scr`, `.ps1`, `.bat`)
   - YARA rule signature matching

5. **Document & File Metadata Forensics**
   - PDF embedded metadata extraction (Author, Producer, Creation Date, Mod Date)
   - Image EXIF parsing (camera make/model, timestamps, software)
   - Filesystem timestamp discrepancy & anomaly auditing (timestomping detection)

6. **Deleted-File Event & Anti-Forensics Analysis**
   - Forensic deletion event log parsing
   - Mass deletion & log clearing detection (evidence destruction attempts)
   - Secure deletion tool marker identification (sdelete, shred indicators)
   - Timeline reconstruction of anti-forensic activity

---

## 🛡️ CIA Triad Evaluation Matrix

CyberTrace evaluates and benchmarks all six forensic techniques across the **Confidentiality, Integrity, and Availability (CIA)** triad on a standardized 1–10 scale:

| Forensic Technique | Confidentiality | Integrity | Availability | Total Score | Key Contribution |
|---|:---:|:---:|:---:|:---:|---|
| **Log Forensics** | 8/10 | 8/10 | 7/10 | **23/30** | Detects unauthorized access & event timelines |
| **Network Forensics** | 9/10 | 7/10 | 9/10 | **25/30** | Identifies exfiltration, scans & DoS disruptions |
| **File Integrity Analysis** | 5/10 | 10/10 | 7/10 | **22/30** | Mathematically proves file tampering |
| **Malware Signature Analysis** | 8/10 | 8/10 | 8/10 | **24/30** | Identifies malicious payload & persistence |
| **Metadata Forensics** | 6/10 | 7/10 | 5/10 | **18/30** | Reconstructs user context & timestamps |
| **Deleted-File Analysis** | 7/10 | 9/10 | 6/10 | **22/30** | Detects anti-forensic evidence destruction |

---

## 📁 Repository Structure

```
├── .github/workflows/
│   └── deploy-pages.yml         # GitHub Actions CI/CD for GitHub Pages
├── dashboard/                   # React + TypeScript Web Dashboard
│   ├── public/                  # Static assets and index.html
│   ├── src/
│   │   ├── components/          # Forensic UI modules (Overview, Logs, PCAP, etc.)
│   │   ├── App.tsx              # Main dashboard application shell
│   │   └── declarations.d.ts    # TypeScript type definitions
│   ├── package.json             # NPM package dependencies
│   └── tsconfig.json            # TypeScript configuration
├── evidence/                    # Synthetic evidence files for testing & demo
│   ├── auth_logs.csv            # Authentication attempt logs
│   ├── sample_capture.pcap      # Network packet capture
│   ├── file_events.csv          # Filesystem deletion & modification events
│   ├── incident_briefing.pdf    # PDF document with forensic metadata
│   ├── users.csv                # Baseline integrity file
│   └── users_tampered.csv       # Tampered file sample
├── src/
│   └── api/                     # Python FastAPI Backend
│       ├── app.py               # REST API endpoints & lifespan handler
│       ├── database.py          # SQLite schema & custody registry
│       ├── seed_data.py         # Synthetic case generator
│       ├── log_forensics.py     # Technique 1: Log analyzer
│       ├── network_forensics.py # Technique 2: PCAP analyzer
│       ├── file_integrity.py    # Technique 3: Cryptographic hashing
│       ├── malware_analysis.py  # Technique 4: Malware signatures & entropy
│       ├── metadata_forensics.py# Technique 5: PDF/EXIF metadata
│       ├── deleted_file_analysis.py # Technique 6: Anti-forensics analyzer
│       └── correlation_engine.py# Cross-technique risk scoring
├── tests/
│   └── test_forensics.py        # Automated test suite covering all modules
├── pyrightconfig.json           # Python language server path configuration
├── requirements.txt             # Python backend dependencies
└── README.md                    # Project documentation
```

---

## 🚀 Quickstart Guide

### 1. Backend Setup (FastAPI)

1. **Clone the repository**:
   ```bash
   git clone https://github.com/AdityaWagh19/CyberTrace-CSDF-Mini-Project.git
   cd CyberTrace-CSDF-Mini-Project
   ```

2. **Install Python dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Start the API server**:
   ```bash
   python -m uvicorn app:app --app-dir src/api --host 127.0.0.1 --port 8000 --reload
   ```
   Interactive Swagger API docs will be available at: `http://127.0.0.1:8000/docs`.

### 2. Frontend Setup (React Dashboard)

1. **Navigate to the dashboard directory**:
   ```bash
   cd dashboard
   ```

2. **Install dependencies and start development server**:
   ```bash
   npm install
   npm start
   ```
   The interactive dashboard will open at: `http://localhost:3000`.

---

## 🧪 Running Automated Tests

Run the full pytest suite from the project root:

```bash
pytest tests/test_forensics.py -v
```

All 9 end-to-end tests verify:
- SQLite schema initialization & synthetic seeding
- Log forensics & brute-force detection
- Network PCAP dissection & large transfer detection
- File cryptographic integrity & tamper detection
- Malware hash matching & entropy calculation
- PDF and file metadata extraction
- Anti-forensics & mass deletion detection
- Correlation engine CIA score aggregation
- FastAPI REST endpoints

---

## 🌐 Deployment

### GitHub Pages (Frontend)
The React dashboard is configured for automatic deployment to **GitHub Pages** via the included [deploy-pages.yml](.github/workflows/deploy-pages.yml) workflow.
- In your GitHub repository: Go to **Settings > Pages > Build and deployment**.
- Select **Source: GitHub Actions**.
- On push to `main`, GitHub Actions automatically builds and deploys the static dashboard.
- *Note*: When accessed on GitHub Pages without a local backend, the dashboard seamlessly operates in **Interactive Demo Mode**, showcasing pre-loaded cases, CIA spider radar charts, and sample analysis results.

### Backend Hosting (FastAPI)
The backend can be deployed to any platform supporting Python containers (e.g. Render, Railway, Hugging Face Spaces):
```bash
uvicorn app:app --app-dir src/api --host 0.0.0.0 --port $PORT
```
Point `REACT_APP_API_URL` in `dashboard/.env` to your deployed backend URL.

---

## 📄 License
This project is licensed under the MIT License.
