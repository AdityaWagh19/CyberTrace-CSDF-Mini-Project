# Cyber Crime Investigation and Forensic Analysis System

## 1. Project Overview

### 1.1 Project Title

**Cyber Crime Investigation and Forensic Analysis System Using Multiple Cyber Forensic Techniques**

### 1.2 Domain

- Cybersecurity
- Digital forensics
- Incident response
- Data analysis
- Information security

### 1.3 Abstract

Cybercrime investigations require the collection, preservation, examination, and analysis of digital evidence from multiple sources such as system logs, network traffic, files, metadata, and storage devices. A single forensic technique is usually insufficient because cyberattacks may leave evidence across different layers of a system.

This project proposes a **Cyber Crime Investigation and Forensic Analysis System** that accepts digital evidence and analyzes it using six forensic techniques:

1. Log forensics.
2. Network forensics.
3. File integrity analysis.
4. Malware signature analysis.
5. Metadata forensics.
6. Deleted-file and recovery analysis.

The system identifies suspicious activities such as brute-force attacks, port scanning, unauthorized access, file tampering, known malware indicators, suspicious metadata, and deletion events. It also evaluates each technique using the **CIA triad**: confidentiality, integrity, and availability.

The final system generates a dashboard and investigation report containing detected events, evidence summaries, risk levels, forensic results, and a comparative CIA matrix. The project is designed for educational and controlled laboratory use. It does not perform unauthorized monitoring, real-world intrusion, or destructive recovery operations.

Digital forensic investigation generally follows four major stages: collection, examination, analysis, and reporting. This project follows the same structure. [nist](https://www.nist.gov/news-events/news/2006/09/nist-guide-details-forensic-practices-data-analysis)

***

## 2. Introduction

### 2.1 Background

The increasing use of computers, mobile devices, cloud services, and networks has created more opportunities for cybercrime. Attackers may steal credentials, modify files, install malware, scan networks, access restricted resources, or delete evidence.

Digital forensics helps investigators answer questions such as:

- What happened?
- When did it happen?
- Which user, device, or IP address was involved?
- Which files or systems were affected?
- Was the evidence modified?
- What security properties were compromised?
- What evidence supports the conclusion?

According to forensic investigation principles, digital evidence should be identified, acquired, protected, examined, analyzed, and reported while preserving its integrity and chain of custody. [csrc.nist](https://csrc.nist.rip/library/NIST%20SB%202006-09%20Forensic%20Techniques;%20Helping%20Organizations%20Improve%20Their%20Responses%20To%20Information%20Security%20Incidents.pdf)

### 2.2 Problem Statement

Existing forensic tools often focus on a specific source of evidence. For example, Wireshark analyzes network packets, while file hashing verifies file integrity. Students and investigators need a unified system that can analyze different types of evidence and compare the strengths and limitations of each forensic technique.

The proposed system solves this problem by providing:

- A centralized evidence-management module.
- Multiple forensic analysis modules.
- Automated suspicious-event detection.
- SHA-256-based integrity verification.
- Malware signature and hash matching.
- CIA triad scoring.
- Visual charts and a final investigation report.

### 2.3 Motivation

The project is motivated by the need to understand how different forensic techniques contribute to cybercrime investigations. It also demonstrates that every technique has different capabilities.

For example:

- Log forensics is useful for identifying unauthorized access.
- Network forensics is useful for tracing suspicious communication.
- Hash analysis is strong for proving file modification.
- Metadata analysis provides contextual information.
- Malware analysis detects known malicious patterns.
- Deleted-file analysis helps identify attempted evidence destruction.

### 2.4 Objectives

The main objectives are:

1. To design a modular cyber forensic investigation system.
2. To collect and manage digital evidence in a structured manner.
3. To analyze system and authentication logs.
4. To analyze network packet-capture files.
5. To verify the integrity of files using cryptographic hashes.
6. To detect known malware using hashes and YARA rules.
7. To extract metadata from files.
8. To identify deleted-file events and simulate recovery analysis.
9. To compare techniques using confidentiality, integrity, and availability.
10. To generate a forensic report with evidence and conclusions.
11. To preserve evidence using read-only analysis and hash verification.

***

## 3. Scope of the Project

### 3.1 Included Scope

The system will support:

- CSV, TXT, JSON, and log-file evidence.
- PCAP and PCAPNG network captures.
- PDF, image, document, and general file metadata.
- File hashing using MD5 for identification and SHA-256 for integrity verification.
- Known malware hash comparison.
- Basic YARA rule scanning.
- Suspicious login and network-event detection.
- Simulated deleted-file tracking.
- CIA scoring and visualization.
- Evidence-based report generation.

### 3.2 Excluded Scope

The following features are outside the scope of the mini project:

- Live network interception.
- Unauthorized access to devices or accounts.
- Real malware execution.
- Full hard-disk recovery.
- Memory forensics.
- Mobile-device forensic extraction.
- Cloud-provider account investigation.
- Automatic attribution of an attack to a real person.
- Legal certification of evidence.

### 3.3 Ethical and Legal Boundary

The system must be tested only on:

- Self-generated logs.
- Publicly available datasets.
- Instructor-provided evidence.
- Test files created by the project team.
- Isolated virtual machines.
- Authorized packet captures.

The project must not be used to monitor networks, scan systems, collect credentials, or analyze private data without authorization.

***

## 4. Proposed System

### 4.1 High-Level Architecture

```text
                +----------------------+
                |    Evidence Input    |
                | Logs, PCAP, Files,   |
                | Metadata, Hash Lists |
                +----------+-----------+
                           |
                           v
                +----------------------+
                | Evidence Manager     |
                | - Case creation      |
                | - Evidence ID        |
                | - SHA-256 hashing     |
                | - Chain of custody    |
                +----------+-----------+
                           |
       +-------------------+-------------------+
       |                   |                   |
       v                   v                   v
+--------------+   +--------------+   +--------------+
| Log Forensics|   | Network      |   | File Integrity|
|              |   | Forensics    |   | Analysis      |
+--------------+   +--------------+   +--------------+
       |                   |                   |
       +-------------------+-------------------+
                           |
       +-------------------+-------------------+
       |                   |                   |
       v                   v                   v
+--------------+   +--------------+   +--------------+
| Malware      |   | Metadata     |   | Deleted File |
| Analysis     |   | Forensics    |   | Analysis     |
+--------------+   +--------------+   +--------------+
                           |
                           v
                +----------------------+
                | Correlation Engine    |
                | Risk and CIA Scoring  |
                +----------+-----------+
                           |
                           v
                +----------------------+
                | Dashboard and Report |
                | Charts, Findings,    |
                | Recommendations      |
                +----------------------+
```

### 4.2 Main Components

| Component | Responsibility |
|---|---|
| Case Manager | Creates and manages investigation cases |
| Evidence Manager | Registers, hashes, labels, and stores evidence |
| Log Analyzer | Detects failed logins, brute force, and suspicious access |
| Network Analyzer | Detects scans, unusual connections, and suspicious IPs |
| Integrity Analyzer | Compares current and baseline hashes |
| Malware Analyzer | Matches file hashes and YARA rules |
| Metadata Analyzer | Extracts timestamps, authors, and file properties |
| Deleted File Analyzer | Analyzes deletion records and recovery indicators |
| Correlation Engine | Combines evidence from different modules |
| CIA Evaluation Module | Scores techniques for confidentiality, integrity, and availability |
| Dashboard | Displays results using tables and charts |
| Report Generator | Produces an investigation report |

***

## 5. Forensic Techniques

## 5.1 Log Forensics

### Purpose

Log forensics analyzes authentication logs, operating-system events, application logs, and security logs to identify suspicious behavior.

### Example Evidence

```text
2026-09-10 10:05:12,admin,192.168.1.20,LOGIN_FAILED
2026-09-10 10:05:14,admin,192.168.1.20,LOGIN_FAILED
2026-09-10 10:05:17,admin,192.168.1.20,LOGIN_FAILED
2026-09-10 10:06:03,admin,192.168.1.20,LOGIN_SUCCESS
```

### Detection Rules

The module can identify:

- Multiple failed logins from one IP.
- Successful login after repeated failures.
- Access outside normal working hours.
- Login from an unknown IP.
- Privilege escalation.
- Access to sensitive resources.
- Repeated account lockouts.

### Example Algorithm

```python
import pandas as pd

logs = pd.read_csv("auth_logs.csv")

failed = logs[logs["event"] == "LOGIN_FAILED"]

attempts = (
    failed.groupby(["username", "source_ip"])
    .size()
    .reset_index(name="failed_attempts")
)

suspicious = attempts[attempts["failed_attempts"] >= 5]

print(suspicious)
```

### Expected Output

| Username | Source IP | Failed Attempts | Risk |
|---|---|---:|---|
| admin | 192.168.1.20 | 8 | High |
| student | 10.0.0.55 | 6 | Medium |

### Forensic Value

Log forensics helps reconstruct the timeline of an incident and identify possible unauthorized access. However, its reliability depends on whether logs were enabled, retained, synchronized, and protected from tampering.

***

## 5.2 Network Forensics

### Purpose

Network forensics analyzes packet-capture files to identify suspicious communication and attack patterns.

### Input

- `.pcap`
- `.pcapng`

### Detection Targets

- Port scanning.
- Excessive connection attempts.
- Communication with suspicious IP addresses.
- Unusual protocols.
- Large outbound data transfers.
- Repeated DNS requests.
- Connections to uncommon ports.
- Potential command-and-control traffic.

### Example PyShark Code

```python
import pyshark
from collections import Counter

capture = pyshark.FileCapture("sample.pcap", keep_packets=False)

destination_ports = Counter()
source_ips = Counter()

for packet in capture:
    try:
        if hasattr(packet, "ip"):
            source_ips[packet.ip.src] += 1

        if hasattr(packet, "tcp"):
            destination_ports[packet.tcp.dstport] += 1
    except AttributeError:
        continue

print("Top source IPs:", source_ips.most_common(10))
print("Top destination ports:", destination_ports.most_common(10))
```

### Port-Scan Heuristic

An IP may be flagged for port scanning if it contacts many distinct destination ports within a short time interval.

```python
from collections import defaultdict

ip_ports = defaultdict(set)

for packet in capture:
    try:
        if hasattr(packet, "ip") and hasattr(packet, "tcp"):
            ip_ports[packet.ip.src].add(packet.tcp.dstport)
    except AttributeError:
        continue

for ip, ports in ip_ports.items():
    if len(ports) >= 20:
        print(f"Possible port scan: {ip}, ports contacted: {len(ports)}")
```

### Limitations

Network analysis may not reveal encrypted payload contents. It can still identify metadata such as source IP, destination IP, protocol, ports, packet count, and traffic volume.

***

## 5.3 File Integrity Analysis

### Purpose

File integrity analysis determines whether evidence or important files have been modified.

### Method

The system calculates a cryptographic hash for each file. A later hash is compared with the original baseline hash.

SHA-256 is preferred for integrity verification because even a small file modification results in a different digest.

### Python Implementation

```python
import hashlib
from pathlib import Path

def calculate_sha256(file_path):
    sha256 = hashlib.sha256()

    with open(file_path, "rb") as file:
        for block in iter(lambda: file.read(4096), b""):
            sha256.update(block)

    return sha256.hexdigest()

file_path = Path("evidence/sample.txt")
print(calculate_sha256(file_path))
```

### Interpretation

| Result | Meaning |
|---|---|
| Current hash equals baseline hash | File is unchanged |
| Current hash differs from baseline hash | File may have been modified |
| File is missing | File may have been deleted or moved |
| Hash cannot be calculated | File may be inaccessible or corrupted |

### Important Design Principle

The system should calculate and store the evidence hash immediately after acquisition. The original evidence should be treated as read-only, while analysis should be performed on a working copy.

***

## 5.4 Malware Signature Analysis

### Purpose

Malware signature analysis identifies files that match known malicious hashes or predefined patterns.

### Detection Methods

- SHA-256 hash matching.
- MD5 hash matching for legacy identification.
- YARA rule scanning.
- Suspicious file-extension detection.
- Entropy analysis.
- Known string-pattern detection.

YARA rules use strings, binary patterns, regular expressions, and logical conditions to identify and classify files. [techdocs.broadcom](https://techdocs.broadcom.com/us/en/symantec-security-software/web-and-network-security/content-analysis/3-1/solution_malware_analysis/ma_about_yara.html)

### Example Hash Database

```json
{
  "known_malware_hashes": [
    "44d88612fea8a8f36de82e1278abb02f",
    "275a021bbfb6487f7a1f2c3a5e6d7b8c"
  ]
}
```

### Hash-Matching Code

```python
import json
import hashlib

def md5_hash(path):
    md5 = hashlib.md5()

    with open(path, "rb") as file:
        for block in iter(lambda: file.read(4096), b""):
            md5.update(block)

    return md5.hexdigest()

with open("malware_hashes.json") as file:
    database = json.load(file)

file_hash = md5_hash("evidence/sample.exe")

if file_hash in database["known_malware_hashes"]:
    print("Known malware hash detected")
else:
    print("No matching hash found")
```

### Example YARA Rule

```yara
rule Suspicious_Script_Indicators
{
    meta:
        author = "Forensic Analysis System"
        description = "Detects suspicious script indicators"

    strings:
        $powershell = "powershell" nocase
        $download = "downloadstring" nocase
        $encoded = "-enc" nocase

    condition:
        2 of them
}
```

### Important Limitation

A hash match can strongly identify a known file, but a non-match does not prove that a file is safe. Modified or previously unknown malware may evade simple signature matching.

***

## 5.5 Metadata Forensics

### Purpose

Metadata forensics extracts information embedded in files and file-system records.

### Metadata Examples

- File name.
- File size.
- Creation timestamp.
- Modification timestamp.
- Access timestamp.
- Author.
- Software used to create the file.
- GPS coordinates in images.
- Document title.
- File format.
- Camera model.

### Python Example

```python
from pathlib import Path
from datetime import datetime
from PyPDF2 import PdfReader

def get_file_metadata(path):
    file_path = Path(path)
    stat = file_path.stat()

    metadata = {
        "name": file_path.name,
        "size": stat.st_size,
        "created": datetime.fromtimestamp(stat.st_ctime),
        "modified": datetime.fromtimestamp(stat.st_mtime),
        "accessed": datetime.fromtimestamp(stat.st_atime)
    }

    if file_path.suffix.lower() == ".pdf":
        reader = PdfReader(str(file_path))
        metadata["document_metadata"] = reader.metadata

    return metadata

print(get_file_metadata("evidence/report.pdf"))
```

### Forensic Use

Metadata may help establish:

- Who created or edited a document.
- Whether a file was modified shortly before an incident.
- Whether timestamps are inconsistent.
- Whether a document came from a specific application.
- Whether image-location information exists.

### Limitation

Metadata can be deliberately changed or removed. It should be correlated with logs, hashes, and other evidence rather than treated as conclusive proof.

***

## 5.6 Deleted-File Detection and Recovery Analysis

### Purpose

This module demonstrates storage forensics by analyzing deletion records and recovery information without implementing low-level disk recovery.

### Simplified Model

The system maintains a record of:

- File creation.
- File modification.
- File deletion.
- File path.
- User responsible for the event.
- File hash.
- Recovery status.

### Example Deletion Log

```csv
timestamp,user,path,hash,event
2026-09-10 12:30:11,admin,/home/admin/report.docx,abc123,CREATED
2026-09-10 12:40:27,admin,/home/admin/report.docx,abc123,MODIFIED
2026-09-10 12:45:02,admin,/home/admin/report.docx,abc123,DELETED
```

### Detection Logic

The system should flag:

- Sensitive files deleted after unauthorized access.
- Files deleted shortly after malware detection.
- Repeated deletion of logs.
- Deleted files with preserved hashes.
- Files that disappeared without a recorded deletion event.

### Example Code

```python
import pandas as pd

events = pd.read_csv("file_events.csv")

deleted = events[events["event"] == "DELETED"]

suspicious = deleted[
    deleted["path"].str.contains(
        "password|credential|log|evidence",
        case=False,
        na=False
    )
]

print(suspicious)
```

### Limitation

This simplified technique does not recover raw disk sectors. A professional investigation would require forensic imaging and specialized tools such as Autopsy or The Sleuth Kit.

***

## 6. Evidence Management

## 6.1 Case Registration

Each investigation should have a unique case ID.

Example:

```text
Case ID: CASE-2026-001
Case Name: Suspicious Login and File Tampering Investigation
Investigator: Project Team
Created: 2026-09-10
Status: Under Analysis
```

## 6.2 Evidence Record

Each evidence item should contain:

| Field | Description |
|---|---|
| Evidence ID | Unique identifier |
| Case ID | Related investigation |
| File name | Original file name |
| Evidence type | Log, PCAP, document, image, etc. |
| Collection time | Time evidence was acquired |
| Source | Device, system, or dataset |
| Original hash | SHA-256 hash |
| Current hash | Latest calculated hash |
| Collector | Person or process that acquired evidence |
| Status | Original, working copy, analyzed |
| Notes | Additional observations |

## 6.3 Chain of Custody

The system should record every evidence-handling action:

```text
Evidence ID: EV-001
Action: Acquired
Performed by: Investigator A
Timestamp: 2026-09-10 09:15:00
SHA-256: <hash>
Description: Authentication log copied from test VM

Evidence ID: EV-001
Action: Analyzed
Performed by: Forensic Module
Timestamp: 2026-09-10 09:30:00
Description: Failed-login analysis completed
```

This improves accountability and demonstrates whether the evidence was handled consistently.

***

## 7. Correlation and Risk Analysis

Analyzing techniques independently is useful, but correlating their results makes the project stronger.

### Example Correlation Scenario

1. Log forensics detects 20 failed logins from one IP.
2. Network forensics detects the same IP contacting multiple ports.
3. File integrity analysis detects modification of `users.csv`.
4. Metadata analysis shows that the file was modified immediately after the login event.
5. Deleted-file analysis detects deletion of an audit log.
6. Malware analysis identifies a suspicious script in the same directory.

These findings provide stronger evidence than any individual result.

### Correlation Rule Example

```text
IF
    failed_logins >= 5
AND
    source_ip_contacts_many_ports = true
AND
    sensitive_file_modified = true
THEN
    incident_type = "Possible unauthorized access and file tampering"
    risk_level = "High"
```

### Risk Score

A simple risk score can be calculated as:

\[
Risk = 0.35A + 0.30I + 0.20C + 0.15E
\]

Where:

- \(A\) = alert severity.
- \(I\) = impact score.
- \(C\) = confidence in evidence.
- \(E\) = number of corroborating evidence sources.

All values can be normalized to a 0–10 scale.

***

## 8. CIA Evaluation Matrix

The CIA triad consists of:

- **Confidentiality:** Protection against unauthorized disclosure.
- **Integrity:** Protection against unauthorized modification.
- **Availability:** Protection against disruption or loss of access.

The scores below are proposed project scores on a 1–10 scale. They represent the usefulness of each technique for investigating a particular CIA property, not the security of the technique itself.

| Technique | Confidentiality | Integrity | Availability | Total | Main Contribution |
|---|---:|---:|---:|---:|---|
| Log Forensics | 8 | 8 | 7 | 23 | Detects unauthorized access and event timelines |
| Network Forensics | 9 | 7 | 9 | 25 | Identifies data transfer, scans, and disruption |
| File Integrity Analysis | 5 | 10 | 7 | 22 | Proves whether files were modified |
| Malware Signature Analysis | 8 | 8 | 8 | 24 | Detects malicious files and persistence indicators |
| Metadata Forensics | 6 | 7 | 5 | 18 | Provides file context and timeline clues |
| Deleted-File Analysis | 7 | 9 | 6 | 22 | Identifies evidence destruction and data loss |

### Scoring Interpretation

| Score Range | Interpretation |
|---|---|
| 1–3 | Weak contribution |
| 4–6 | Moderate contribution |
| 7–8 | Strong contribution |
| 9–10 | Very strong contribution |

### Justification

#### Log Forensics

Log analysis strongly supports confidentiality because it can detect unauthorized account access. It also supports integrity by showing file or configuration changes and availability by identifying service failures or account lockouts.

#### Network Forensics

Network analysis is strong for confidentiality because it can reveal suspicious data transfers. It is also valuable for availability investigations involving denial-of-service activity, scanning, or abnormal traffic volume.

#### File Integrity Analysis

Hash analysis is strongest for integrity. It can demonstrate that a file changed, but it generally cannot explain who modified the file or why it changed.

#### Malware Signature Analysis

Malware scanning supports all three CIA properties because malware may steal data, modify files, or disrupt services. Its main limitation is that signatures are less effective against unknown or heavily modified malware.

#### Metadata Forensics

Metadata helps provide context but is not always reliable because timestamps and author information can be modified. Therefore, its scores are lower than those of hashing and network analysis.

#### Deleted-File Analysis

Deleted-file analysis is useful for detecting evidence destruction, data loss, and attempts to conceal unauthorized activity.

***

## 9. Technology Stack

### 9.1 Programming Language

- Python 3.11 or later.

### 9.2 Libraries

| Requirement | Suggested Library |
|---|---|
| Data processing | Pandas |
| Hashing | hashlib |
| Network analysis | PyShark, Scapy |
| Packet capture | Wireshark |
| Metadata extraction | PyPDF2, Pillow, ExifTool |
| Malware rules | YARA |
| Visualization | Matplotlib, Plotly |
| Web dashboard | Streamlit |
| Database | SQLite |
| Reports | ReportLab |
| Testing | Pytest |

### 9.3 Optional Tools

- Autopsy for demonstrating professional disk-forensic workflows.
- The Sleuth Kit for file-system analysis.
- Docker for reproducible deployment.
- Git and GitHub for version control.

NIST describes packet sniffers, protocol analyzers, forensic software, evidence storage, and chain-of-custody records as important components of an incident-response capability. [nvlpubs.nist](https://nvlpubs.nist.gov/nistpubs/specialpublications/nist.sp.800-61r2.pdf)

***

## 10. Database Design

### 10.1 Cases Table

```sql
CREATE TABLE cases (
    case_id INTEGER PRIMARY KEY AUTOINCREMENT,
    case_name TEXT NOT NULL,
    investigator TEXT,
    created_at TEXT NOT NULL,
    status TEXT DEFAULT 'OPEN',
    description TEXT
);
```

### 10.2 Evidence Table

```sql
CREATE TABLE evidence (
    evidence_id INTEGER PRIMARY KEY AUTOINCREMENT,
    case_id INTEGER NOT NULL,
    file_name TEXT NOT NULL,
    evidence_type TEXT NOT NULL,
    source TEXT,
    collected_at TEXT,
    sha256_hash TEXT NOT NULL,
    status TEXT,
    notes TEXT,
    FOREIGN KEY (case_id) REFERENCES cases(case_id)
);
```

### 10.3 Findings Table

```sql
CREATE TABLE findings (
    finding_id INTEGER PRIMARY KEY AUTOINCREMENT,
    case_id INTEGER NOT NULL,
    evidence_id INTEGER,
    technique TEXT NOT NULL,
    finding TEXT NOT NULL,
    severity TEXT,
    confidence REAL,
    created_at TEXT NOT NULL,
    FOREIGN KEY (case_id) REFERENCES cases(case_id),
    FOREIGN KEY (evidence_id) REFERENCES evidence(evidence_id)
);
```

### 10.4 CIA Scores Table

```sql
CREATE TABLE cia_scores (
    score_id INTEGER PRIMARY KEY AUTOINCREMENT,
    case_id INTEGER NOT NULL,
    technique TEXT NOT NULL,
    confidentiality INTEGER,
    integrity INTEGER,
    availability INTEGER,
    justification TEXT,
    FOREIGN KEY (case_id) REFERENCES cases(case_id)
);
```

***

## 11. Dashboard Design

The dashboard can be implemented using Streamlit.

### 11.1 Dashboard Pages

#### Case Overview

- Case ID.
- Case name.
- Evidence count.
- Investigation status.
- Overall risk score.
- Number of critical findings.

#### Evidence Registry

- Evidence ID.
- File name.
- Type.
- SHA-256 hash.
- Collection time.
- Integrity status.

#### Log Analysis

- Failed login count.
- Successful logins after failures.
- Top source IPs.
- Suspicious usernames.
- Timeline of events.

#### Network Analysis

- Top source IPs.
- Top destination ports.
- Potential scans.
- Packet count.
- Protocol distribution.

#### Malware Analysis

- Hash matches.
- YARA matches.
- Suspicious file extensions.
- Scan status.

#### CIA Comparison

- CIA score table.
- Grouped bar chart.
- Radar chart.
- Overall technique ranking.

### 11.2 Suggested Visualizations

- Bar chart: number of findings per technique.
- Line chart: events over time.
- Pie chart: network protocols.
- Heatmap: technique versus CIA property.
- Radar chart: CIA scores.
- Table: evidence integrity status.

***

## 12. Sample Streamlit Dashboard

```python
import streamlit as st
import pandas as pd
import plotly.express as px

st.set_page_config(
    page_title="Cyber Forensic Analysis System",
    layout="wide"
)

st.title("Cyber Crime Investigation and Forensic Analysis")

cia_data = pd.DataFrame({
    "Technique": [
        "Log Forensics",
        "Network Forensics",
        "File Integrity",
        "Malware Analysis",
        "Metadata Forensics",
        "Deleted File Analysis"
    ],
    "Confidentiality": [8, 9, 5, 8, 6, 7],
    "Integrity": [8, 7, 10, 8, 7, 9],
    "Availability": [7, 9, 7, 8, 5, 6]
})

st.subheader("CIA Evaluation Matrix")
st.dataframe(cia_data, use_container_width=True)

long_data = cia_data.melt(
    id_vars="Technique",
    var_name="CIA Property",
    value_name="Score"
)

fig = px.bar(
    long_data,
    x="Technique",
    y="Score",
    color="CIA Property",
    barmode="group",
    range_y=[0, 10],
    title="Forensic Technique Comparison"
)

st.plotly_chart(fig, use_container_width=True)
```

***

## 13. Investigation Workflow

The proposed workflow is:

1. Create a new investigation case.
2. Upload or register evidence.
3. Calculate and store the original SHA-256 hash.
4. Create a working copy of the evidence.
5. Select the required forensic modules.
6. Run log, network, file, malware, metadata, and deletion analyses.
7. Store the findings in the database.
8. Correlate related findings.
9. Calculate severity, confidence, and risk.
10. Evaluate each technique using the CIA matrix.
11. Generate charts and an investigation report.
12. Export the final report as PDF or HTML.

This workflow follows the standard forensic structure of collecting evidence, examining it, analyzing the results, and reporting the findings. [nist](https://www.nist.gov/news-events/news/2006/09/nist-guide-details-forensic-practices-data-analysis)

***

## 14. Sample Test Dataset

The project should use a synthetic dataset instead of real private or malicious evidence.

### 14.1 Synthetic Authentication Logs

Include:

- Normal successful logins.
- Several failed logins.
- A successful login after repeated failures.
- Login at an unusual time.
- Login from an unknown IP.
- Account lockout events.

### 14.2 Synthetic Network Capture

Generate or obtain an authorized PCAP containing:

- Normal HTTP or DNS traffic.
- Multiple connections to different ports.
- Repeated requests from one source IP.
- A large outbound transfer.
- Connections to a test server.

### 14.3 Sample Files

Create:

- An unchanged text file.
- A modified text file.
- A suspicious script containing test YARA strings.
- A PDF with author metadata.
- An image containing test metadata.
- A deleted-file event record.
- A fake malware hash entry for demonstration.

### 14.4 Expected Findings

| Evidence | Expected Finding |
|---|---|
| Authentication log | Possible brute-force attack |
| PCAP | Possible port scan |
| Modified document | Hash mismatch |
| Suspicious script | YARA match |
| PDF | Author and modification metadata |
| Deletion log | Sensitive file deleted |
| Combined results | High-risk unauthorized access scenario |

***

## 15. Example Final Report Structure

### Cover Page

- Project title.
- Student names.
- Roll numbers.
- Subject name.
- Department.
- College.
- Academic year.

### Executive Summary

A short description of the case and the major findings.

### Case Information

- Case ID.
- Investigator.
- Evidence sources.
- Investigation date.

### Evidence Inventory

A table listing every evidence item and its SHA-256 hash.

### Methodology

Explain the six forensic techniques and the tools used.

### Findings

Present the output of each forensic module.

### Correlation Analysis

Explain how findings from different modules support one another.

### CIA Analysis

Present the scoring matrix, bar graph, and radar chart.

### Limitations

Describe the restrictions of simplified file recovery, hash matching, metadata reliability, and encrypted network traffic.

### Conclusion

State whether the evidence supports:

- Unauthorized access.
- Network reconnaissance.
- File tampering.
- Malware presence.
- Evidence deletion.
- Impact on confidentiality, integrity, or availability.

### References

Include NIST guidance, official Python documentation, Wireshark documentation, PyShark documentation, and YARA documentation.

***

## 16. Advantages of the Proposed System

- Combines six forensic techniques in one platform.
- Provides a structured evidence-management process.
- Preserves evidence integrity through hashing.
- Supports both file-based and network-based evidence.
- Detects multiple categories of suspicious activity.
- Correlates findings instead of showing isolated results.
- Provides objective CIA-based comparisons.
- Generates visual reports suitable for academic evaluation.
- Can be extended to machine learning-based anomaly detection.
- Uses synthetic data and controlled experiments safely.

***

## 17. Limitations

- The system is a prototype and not a replacement for certified forensic tools.
- Log detection depends on the quality and completeness of logs.
- Encrypted network traffic limits payload analysis.
- Hash matching cannot reliably identify unknown malware.
- Metadata can be altered or removed.
- The deleted-file module simulates recovery rather than recovering raw disk sectors.
- CIA scores contain an element of analyst judgment.
- Findings should not be treated as legal proof without proper forensic procedures.
- The system should not be tested on unauthorized systems or live production networks.

***

## 18. Future Enhancements

Future versions can include:

1. Memory forensics using Volatility.
2. Disk-image analysis using The Sleuth Kit.
3. Automatic timeline generation.
4. Machine-learning-based anomaly detection.
5. Threat-intelligence enrichment for IP addresses and hashes.
6. Sigma-rule support for log analysis.
7. Real-time file-integrity monitoring.
8. Role-based authentication for investigators.
9. Encrypted evidence storage.
10. Digital signatures for reports.
11. Support for Windows Event Logs and Linux journald.
12. Integration with Security Information and Event Management systems.
13. Natural-language querying of investigation results.
14. Automated incident-report generation using a local language model.
15. Multi-user case collaboration.

***

## 19. Expected Result

The completed system should produce an output similar to the following:

```text
Case ID: CASE-2026-001
Overall Risk: HIGH

Findings:
1. 12 failed login attempts from 192.168.1.20.
2. Successful login occurred after repeated failures.
3. Source IP contacted 28 destination ports.
4. Sensitive file users.csv failed integrity verification.
5. Suspicious script matched a YARA rule.
6. Audit log was deleted after the suspicious login.
7. Metadata indicates modification shortly after the login event.

CIA Impact:
Confidentiality: HIGH
Integrity: HIGH
Availability: MEDIUM

Conclusion:
The combined evidence is consistent with a possible unauthorized-access
and file-tampering incident. Further investigation should validate the
source system, preserve original evidence, and review related accounts.
```

***

## 20. Conclusion

The proposed **Cyber Crime Investigation and Forensic Analysis System** is a suitable advanced mini project for the CSDF subject because it combines practical forensic analysis, evidence preservation, data processing, visualization, and security evaluation.

The project goes beyond a basic file-hashing application by implementing six complementary techniques:

- Log forensics.
- Network forensics.
- File integrity analysis.
- Malware signature analysis.
- Metadata forensics.
- Deleted-file analysis.

Its main contribution is the correlation of forensic findings and comparison of each technique against confidentiality, integrity, and availability. The final dashboard and report make the results understandable while demonstrating the technical and investigative aspects of cybercrime analysis.

### Suggested Project Name

**CyberTrace: A Multi-Technique Cyber Crime Investigation and CIA Analysis System**

### Suggested Short Tagline

**“Collect. Analyze. Correlate. Preserve.”**