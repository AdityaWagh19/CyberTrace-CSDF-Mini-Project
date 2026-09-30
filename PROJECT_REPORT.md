# Cyber Security and Digital Forensics (CSDF) Mini Project Report

---

## 1. Mini Project Title
**CyberTrace: A Unified Multi-Vector Digital Forensics and Evidence Correlation Framework for Multi-Layer Incident Investigation**

---

## 2. Problem Statement
Contemporary cyber incidents, notably targeted ransomware campaigns, insider threats, and Advanced Persistent Threats (APTs), operate across multiple architectural tiers within an enterprise infrastructure. An adversary typically conducts initial network reconnaissance, executes brute-force authentication attempts against perimeter services, establishes persistence using encrypted payloads, stages confidential intellectual property, exfiltrates data over non-standard ports, and ultimately executes anti-forensic wiping procedures to purge event trails.

Traditional digital forensic investigation workflows suffer from significant operational limitations:
1. **Toolchain Fragmentation**: Examiners are forced to alternate between disparate, standalone command-line utilities (e.g., `grep`/`awk` for syslog parsing, `tcpdump`/`tshark` for packet captures, `sha256sum` for hashing, `exiftool` for metadata extraction, and custom scripts for carving). This fragmentation increases cognitive load and prolongs Mean Time to Detect and Remediate (MTTD/MTTR).
2. **Custodial Chain Inconsistency**: Maintaining a verifiable, tamper-evident Chain of Custody adhering to statutory standards (such as NIST SP 800-86) is error-prone when evidence files are manually handled across separate environments.
3. **Absence of Cross-Vector Correlation**: Isolated forensic indicators fail to convey the broader attack narrative. A failed login attempt in isolation appears benign; however, when correlated with a concurrent network port scan and subsequent high-entropy file creation, it indicates an active intrusion.
4. **Lack of Objective Security Triad Evaluation**: Conventional forensics produces qualitative logs but lacks an empirical framework to quantify how individual forensic disciplines contribute to the fundamental tenets of information security: Confidentiality, Integrity, and Availability (CIA Triad).

CyberTrace addresses these deficiencies by providing a centralized, automated digital forensics suite that unifies ingestion, cryptographic verification, heuristic detection across six forensic layers, temporal correlation, and quantitative CIA Triad benchmarking within an intuitive web interface.

---

## 3. Objectives
The primary objectives of this project are:
1. **Automated Evidence Ingestion and Integrity Verification**: Implement an evidence intake ledger that computes cryptographic baselines (SHA-256 and MD5) at the point of ingestion to guarantee immutable chain of custody compliance.
2. **Modular Multi-Layer Forensic Analysis**: Design and implement six specialized forensic detection modules:
   - *Technique 1 (Authentication Log Forensics)*: Rapid identification of credential-stuffing bursts, dictionary attacks, and unauthorized off-hours logins.
   - *Technique 2 (Network Traffic & Packet Capture Forensics)*: Protocol dissection, TCP SYN port scan recognition, and volumetric outbound exfiltration detection.
   - *Technique 3 (File Integrity Monitoring)*: Cryptographic baseline comparison to isolate unauthorized permission escalation and database record tampering.
   - *Technique 4 (Malware Signature & Entropy Analysis)*: Shannon entropy computation to detect packed/encrypted payloads, signature verification, and heuristic string matching.
   - *Technique 5 (Document & Filesystem Metadata Forensics)*: Extraction of structural metadata from document artifacts, detection of timestomping anomalies, and author attribution.
   - *Technique 6 (Deleted-File & Anti-Forensics Analysis)*: Filesystem journal parsing, deletion velocity computation, and detection of specialized file wiper execution signatures.
3. **Chronological Correlation Engine**: Aggregate discrete forensic anomalies across all six layers into an integrated temporal ledger and attack velocity progression.
4. **Empirical CIA Triad Benchmarking**: Establish a standardized scoring model (1-10 scale per dimension, maximum 30 points per technique) to mathematically quantify the protective and analytical contribution of each forensic discipline.
5. **Evidentiary Dossier Compilation**: Provide automated generation of formal forensic investigation dossiers and structured reports suitable for judicial submission and executive briefings.

---

## 4. Hardware and Software Requirements

### 4.1 Hardware Requirements
- **Processor**: Multi-core x86_64 CPU (Intel Core i5/i7 or AMD Ryzen 5/7, 4 cores minimum, 2.4 GHz or higher).
- **Random Access Memory (RAM)**: 8 GB minimum (16 GB recommended for high-volume network packet capture reassembly and entropy matrix processing).
- **Secondary Storage**: Solid State Drive (SSD) with a minimum of 10 GB available storage for forensic disk images, packet capture repositories, and local database storage.
- **Network Interface**: Gigabit Ethernet (10/100/1000 Mbps) or 802.11ac/ax wireless adapter supporting promiscuous capture mode.
- **Display Resolution**: 1366 x 768 minimum (1920 x 1080 Full HD recommended for data visualization).

### 4.2 Software Requirements
- **Operating System**: Platform-independent deployment verified on Microsoft Windows 10/11, Ubuntu Linux 22.04 LTS, and macOS Monterey (or later).
- **Backend Runtime & Language**: Python 3.10 to 3.12 (standard CPython implementation).
- **Web Framework & API**: FastAPI 0.100+ with Starlette, ASGI server Uvicorn, and Pydantic v2 for data validation.
- **Database Management System**: SQLite 3 (embedded relational database with WAL journal mode for ACID custody logging).
- **Core Forensic Libraries**:
  - `hashlib` & `crypto`: Cryptographic digest computation (SHA-256, MD5).
  - `scapy` / Native Dissector: Packet capture (PCAP/PCAPNG) parsing, protocol decode, and packet-level inspection.
  - `pypdf` / `reportlab`: PDF dictionary metadata extraction, font inspection, and synthetic artifact compilation.
  - `math`: Implementation of Shannon entropy calculations.
- **Frontend Architecture & Toolchain**:
  - React 18/19 with TypeScript for type-safe user interface development.
  - React-Bootstrap & Bootstrap 5 for responsive layout grids and form controls.
  - Plotly.js / `react-plotly.js` for polar radar projections and comparative CIA benchmark visualizations.
  - `jspdf` & `jspdf-autotable` for client-side forensic dossier generation.
- **Testing & Deployment**:
  - Pytest with Pytest-Asyncio and Pytest-Cov for automated unit and integration testing.
  - Vercel Serverless Platform for continuous integration, serverless function routing, and static frontend delivery.

---

## 5. Dataset Description
The system evaluates real-world attack vectors using a curated suite of forensic artifacts representing an advanced ransomware and data exfiltration incident targeting an enterprise finance infrastructure (`evidence/` directory):

| Artifact Identifier | Evidence Class | File Size | Description and Encoded Incident Indicators |
|---|---|---|---|
| `auth_logs.csv` | System Authentication Log | 48 KB | 1,240 structured authentication records from Linux `/var/log/auth.log` and PAM subsystem. Contains a brute-force sequence of 12 failed SSH attempts within 54 seconds originating from IP `192.168.1.20`, followed by an anomalous weekend login at 02:45 AM from untrusted geolocation `198.51.100.45`. |
| `sample_capture.pcap` | Network Packet Capture | 2,560 KB | Raw network traffic capture from interface `eth0`. Encodes an initial TCP SYN reconnaissance sweep targeting management ports (22, 80, 443, 3389), DNS exfiltration requests to high-entropy domains, and a burst outbound transmission of 14.2 MB over TCP port 4444. |
| `users.csv` & `users_tampered.csv` | Filesystem & Database Baseline | 14 KB / 15 KB | Integrity baseline pair of active user accounts. The tampered version introduces unauthorized privilege escalation (assigning root UID 0 to account `svc_backup`), appended administrative credentials, and cryptographic hash divergence. |
| `test_malware_sample.bin` | Binary Executable Payload | 32 KB | Compiled malicious binary artifact exhibiting high Shannon entropy (7.84 / 8.00), signaling active packing/encryption. Encodes hardcoded strings associated with shadow copy deletion (`vssadmin.exe delete shadows /all /quiet`) and ransomware extension manipulation (`.locked`). |
| `incident_briefing.pdf` | Document Metadata Artifact | 28 KB | Portable Document Format (PDF v1.7) briefing document containing altered structural metadata dictionaries, tool discrepancies (`ReportLab 4.0`), suspicious author attribution (`External Intruder`), and timestomped creation/modification discrepancies. |
| `file_events.csv` | Filesystem Journal Audit | 22 KB | Linux `auditd` and filesystem notification records capturing rapid anti-forensic indicator removal: 23 deletion events within a 4-minute window, including invocations of secure file destruction utilities (`sdelete.exe`, `shred`) targeting `/var/log/audit.log` and database shadow copies. |

---

## 6. Methodology and Algorithms

### 6.1 Cryptographic Chain of Custody Verification
To satisfy the legal standard of evidence admissibility, all acquired artifacts pass through a deterministic hashing pipeline immediately upon ingestion.

**Cryptographic Hash Formulation**:
Given an input byte sequence $M \in \{0, 1\}^*$:
$$H_{\text{SHA-256}}(M) = \text{SHA-256}(M)$$
$$H_{\text{MD5}}(M) = \text{MD5}(M)$$

The computed digest is recorded in the immutable SQLite custody table with the capturing officer identity, acquisition source, and UTC timestamp. Subsequent integrity verification recalculates $H_{\text{current}}(M)$ and verifies that:
$$H_{\text{current}}(M) = H_{\text{baseline}}(M)$$
Any divergence triggers an immediate evidence tampering alert.

### 6.2 Authentication Log Heuristic & Sliding-Window Algorithm
To detect distributed brute-force and credential stuffing without relying on external cloud APIs, the engine employs a stateful sliding-window heuristic:
1. Parse log stream into structured tuples: $E_i = (t_i, \text{ip}_i, \text{user}_i, \text{status}_i)$.
2. Group records by unique source IP $\text{ip}_i$ over time window $\Delta t = [t_0, t_0 + W]$.
3. Compute the failure density:
   $$F(\text{ip}) = \sum_{k \in \Delta t} \mathbb{I}(\text{status}_k = \text{FAILURE})$$
   where $\mathbb{I}(\cdot)$ is the indicator function.
4. If $F(\text{ip}) \ge \theta_{\text{threshold}}$ (default $\theta = 5$), classify the source IP as a brute-force attacker.
5. In parallel, flag any authentication event where the timestamp satisfies:
   $$t_{\text{hour}} \in [00:00, 05:00] \quad \lor \quad t_{\text{day}} \in \{\text{Saturday}, \text{Sunday}\}$$

### 6.3 Shannon Entropy Analysis for Malware Detection
Packed, encrypted, or obfuscated payloads exhibit elevated information entropy compared to plaintext code or standard compiled software.

**Shannon Entropy Formulation**:
Let $S = (b_1, b_2, \dots, b_N)$ represent the byte sequence of a binary file where each byte $b_k \in [0, 255]$. The empirical probability of occurrence $P(x)$ for byte value $x$ is:
$$P(x) = \frac{\sum_{j=1}^N \mathbb{I}(b_j = x)}{N}$$
The Shannon entropy $H(S)$ in bits per byte is defined as:
$$H(S) = - \sum_{x=0}^{255} P(x) \log_2 P(x)$$
- Normal executable range: $4.5 \le H(S) \le 6.8$ bits/byte.
- Packed / Encrypted threshold: $H(S) \ge 7.2$ bits/byte.
Files exceeding this threshold are flagged as probable ransomware binaries or encrypted staging payloads.

### 6.4 Timestomp Inconsistency Detection
Adversaries frequently employ timestomping techniques to forge filesystem metadata. The metadata engine checks for chronological consistency:
$$\Delta t_{\text{anomaly}} = \begin{cases}
\text{TRUE} & \text{if } t_{\text{modified}} < t_{\text{created}} \\
\text{TRUE} & \text{if } t_{\text{accessed}} < t_{\text{modified}} \\
\text{FALSE} & \text{otherwise}
\end{cases}$$
If an artifact claims modification prior to its creation date, an anti-forensic timestomping anomaly is logged.

### 6.5 Deletion Velocity and Wiper Pattern Recognition
Anti-forensic log wiping is characterized by high-frequency file unlinking operations over brief intervals.

**Deletion Rate Formulation**:
Let $D$ denote the set of deletion events within time interval $[t_{\text{start}}, t_{\text{end}}]$:
$$R_{\text{del}} = \frac{|D|}{t_{\text{end}} - t_{\text{start}}} \quad (\text{events per minute})$$
If $R_{\text{del}} > 5.0 \text{ events/min}$ and executed command strings match known wiper binaries ($P \in \{\text{sdelete}, \text{shred}, \text{rm -rf}, \text{vssadmin}\}$), the activity is designated as deliberate evidence destruction.

### 6.6 Quantitative CIA Triad Scoring Matrix
Each of the six forensic modules is evaluated across Confidentiality ($C$), Integrity ($I$), and Availability ($A$) on a normalized scale of 1 to 10:
$$\text{Score}_k = C_k + I_k + A_k, \quad \text{Score}_k \in [3, 30]$$
The composite evaluation metric across all $K = 6$ techniques is computed as:
$$\text{CIA}_{\text{Benchmark}} = \sum_{k=1}^6 \text{Score}_k, \quad \text{Max} = 180$$
$$\text{Coverage Ratio } (\eta) = \frac{\text{CIA}_{\text{Benchmark}}}{180} \times 100\%$$

---

## 7. Practical Implementation

### 7.1 Architecture and Data Flow
CyberTrace utilizes an asynchronous, service-oriented architecture:
1. **Data Layer**: SQLite database (`evidence.db`) maintaining schema tables for `cases`, `evidence`, `findings`, and `cia_benchmarks`.
2. **Analysis Engine (FastAPI Backend)**: Stateless REST endpoints executing forensic operations on demand, supporting both uploaded custom evidence and pre-seeded incident datasets.
3. **User Interface (React + TypeScript)**: Modular single-page dashboard organizing workflows into clear investigative stages:
   - *Investigation Overview*: Executive KPIs, chronological threat progression stepper, severity distributions, and correlated findings ledger.
   - *Evidence Registry*: File ingestion form with real-time SHA-256 calculation and custody ledger table.
   - *Dedicated Technique Consoles*: Individual consoles for Log Forensics, Network PCAP Dissection, Malware Analysis, Metadata Extraction, and Deleted-File Wiper Examination.
   - *CIA Triad Matrix*: Interactive grouped bar charts and polar radar projections comparing technique efficacy.
   - *Forensic Dossier*: Complete preview document with instant JSON export and formal PDF report generation.

### 7.2 Forensic Layer Execution Results

#### Technique 1: Log Forensics
- Ingested 1,240 records from `auth_logs.csv`.
- Detected 12 consecutive failed root logins from `192.168.1.20` within 54 seconds (Brute Force detected, confidence 9.0/10).
- Isolated anomalous off-hours session: User `svc_admin` logged in from external IP `198.51.100.45` at 02:45 AM.

#### Technique 2: Network Forensics
- Processed 2.5 MB PCAP capture stream.
- Identified TCP SYN port scanning targeting internal ports 22, 80, 443, and 3389.
- Flagged data exfiltration alert: 14.2 MB compressed payload transmitted to external address on TCP port 4444.

#### Technique 3: File Integrity Analysis
- Baseline hash (`b41d2f...`) vs. host image hash (`7c0e5d...`) revealed unauthorized alteration of `/etc/passwd` and database records.
- Isolated unauthorized elevation of privilege: `svc_backup` modified to UID 0 (root equivalent).

#### Technique 4: Malware Signature & Entropy Analysis
- Analyzed `test_malware_sample.bin`.
- Measured Shannon entropy: **7.84 bits/byte** (Threshold: 7.2 bits/byte) confirming cryptographic packing.
- Extracted indicators: Hardcoded ransomware note strings, shadow copy deletion invocations, and malicious payload classification.

#### Technique 5: Metadata Forensics
- Dissected `incident_briefing.pdf`.
- Extracted internal creator string: `ReportLab PDF Library 4.0` with Author `External Intruder`.
- Detected metadata timestomping: modification timestamp preceded creation date by 14 hours.

#### Technique 6: Deleted-File Anti-Forensics Analysis
- Examined filesystem audit journal `file_events.csv`.
- Detected burst deletion: 23 files deleted within 4.1 minutes (rate: 5.75 files/min).
- Isolated execution of secure wiper tools `sdelete.exe` and `shred` targeting `/var/log/audit/audit.log` to obscure unauthorized intrusion.

### 7.3 CIA Triad Benchmark Evaluation Summary
The quantitative scoring matrix produced the following empirical distribution:

| Forensic Discipline | Confidentiality (10) | Integrity (10) | Availability (10) | Total Score (30) | Contribution Assessment |
|---|:---:|:---:|:---:|:---:|---|
| **Log Forensics** | 8 | 8 | 7 | **23** / 30 | Strong contribution |
| **Network Forensics** | 9 | 7 | 9 | **25** / 30 | Very strong contribution |
| **File Integrity Monitoring** | 5 | 10 | 7 | **22** / 30 | Strong contribution |
| **Malware Analysis** | 8 | 8 | 8 | **24** / 30 | Very strong contribution |
| **Metadata Forensics** | 6 | 7 | 5 | **18** / 30 | Moderate contribution |
| **Deleted-File Analysis** | 7 | 9 | 6 | **22** / 30 | Strong contribution |
| **Composite Triad Benchmark** | **43** / 60 | **49** / 60 | **42** / 60 | **134** / 180 | **Overall Coverage: 74.4%** |

---

## 8. Conclusion
The CyberTrace project demonstrates that unified, multi-vector digital forensic analysis offers substantial advantages over isolated, single-layer investigation approaches. By combining six distinct forensic disciplines into an integrated correlation pipeline, the platform eliminates investigative silos, preserves strict cryptographic chain of custody compliance, and reconstructs the end-to-end attack lifecycle of advanced cyber incidents.

Key accomplishments achieved in this project include:
1. **Deterministic Evidentiary Integrity**: Implementation of immediate SHA-256 baseline hashing ensuring verifiable Chain of Custody adhering to NIST SP 800-86 standards.
2. **Multi-Layer Threat Visibility**: Successful automated detection of network scanning, credential brute-forcing, file tampering, packed ransomware execution, document metadata manipulation, and anti-forensic wiper invocations.
3. **Empirical Benchmarking**: Formalization of the CIA Triad benchmark matrix, providing quantifiable metrics on how each forensic discipline supports enterprise security posture.
4. **Cloud-Native Deployment**: Successful optimization and deployment on Vercel utilizing serverless Python backend functions and a modern, responsive React interface.

### Future Scope
Future enhancements to the CyberTrace framework include:
- **Volatile Memory Forensics**: Integration of Volatility 3 framework bindings for automated memory dump acquisition and kernel-level rootkit detection.
- **Automated Graph Correlation**: Implementation of Neo4j graph databases to visualize multi-hop adversary lateral movement dynamically.
- **Threat Intelligence Exchange**: Integration of STIX/TAXII protocols for automated threat indicator sharing with global Computer Emergency Response Teams (CERTs).
