# CyberTrace: Multi-Technique Digital Forensic Investigation and Threat Correlation Framework

[![pytest](https://img.shields.io/badge/pytest-9%20passed-brightgreen.svg)]()
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100%2B-009688.svg?logo=fastapi&logoColor=white)]()
[![React](https://img.shields.io/badge/React-19.x-61DAFB.svg?logo=react&logoColor=black)]()
[![TypeScript](https://img.shields.io/badge/TypeScript-4.9%2B-blue.svg?logo=typescript&logoColor=white)]()
[![License](https://img.shields.io/badge/License-MIT-blue.svg)]()

## Abstract

Digital forensics and incident response (DFIR) in modern enterprise environments require cross-domain verification across heterogeneous evidentiary artifacts. CyberTrace is an academic and investigative framework developed to systematically collect, verify, and correlate multi-source digital evidence. The framework implements six distinct forensic pipelines, an automated cross-source correlation engine, and a formal Confidentiality, Integrity, and Availability (CIA) Triad impact matrix to quantify threat severity and provide legally defensible, mathematically validated forensic findings.

---

## Forensic Methodologies and Analysis Pipelines

### 1. Authentication and Access Log Forensics
- **Temporal and Frequency Thresholding**: Identifies brute-force attack vectors by computing failed authentication frequencies within rolling time windows ($T = 300\text{s}$, threshold $> 5$ attempts).
- **Off-Hours Heuristic Auditing**: Evaluates login timestamps against enterprise baseline operating hours (20:00 to 06:00 and weekends) to detect unauthorized privileged access.
- **Subnet and Geographic Discrepancy Parsing**: Classifies source IP addresses against known internal subnets and untrusted CIDR blocks.

### 2. Network Packet Capture (PCAP) Forensics
- **Deep Frame Dissection**: Native parsing of libpcap header structures and protocol distribution analysis across Ethernet, IPv4, TCP, UDP, and ICMP layers.
- **Port Sweep Identification**: Detection of horizontal and vertical TCP SYN scanning behavior via unique destination port tracking per origin IP.
- **Data Exfiltration Detection**: Volumetric flow monitoring identifying single-session outbound transfers exceeding standard baseline thresholds ($> 1\text{MB}$).
- **DNS Tunneling and Query Analysis**: Inspection of DNS queries for long-label subdomains, high entropy, and anomalous TXT record requests.

### 3. Cryptographic File Integrity Verification
- **Dual-Hash Hashing**: Generates SHA-256 and MD5 cryptographic digests across evidence items to establish baseline integrity.
- **Cryptographic Tamper Verification**: Compares real-time artifact hashes against an immutable Chain of Custody ledger to identify bit-level tampering.
- **Web Crypto Acceleration**: Supports client-side in-memory hashing using `crypto.subtle.digest('SHA-256')`.

### 4. Malware Signature and Static Analysis
- **Cryptographic Signature Matching**: Verifies file digests against known malicious threat registries (e.g., LockBit, Emotet, Mimikatz).
- **Shannon Entropy Measurement**: Evaluates byte randomness across file streams to identify encrypted, packed, or obfuscated payloads:
  $$H(X) = -\sum_{i=1}^{n} P(x_i) \log_2 P(x_i)$$
  Files exhibiting $H(X) \ge 7.0$ are flagged as packed or encrypted.
- **Syntactic and Heuristic Rule Matching**: Rule matching targeting executable header signatures, dual extensions, and suspicious scripting patterns.

### 5. Document and Metadata Provenance
- **Embedded Document Parsing**: Extraction of PDF and document metadata fields (Author, Creator, Producer, CreationDate, ModDate).
- **Timestomping Detection**: Cross-references internal document creation timestamps against filesystem modified/accessed/created (MAC) timestamps to identify anti-forensic timestamp alteration.

### 6. Anti-Forensics and Deletion Reconstruction
- **Log Purging and Deletion Auditing**: Analyzes system deletion event logs to identify mass purge attempts designed to impede investigation.
- **Secure Wiper Artifact Detection**: Identifies signature file naming patterns and zeroing patterns associated with secure deletion utilities (e.g., Sysinternals `sdelete`, Unix `shred`).

---

## Threat Correlation and Risk Scoring Model

The cross-technique correlation engine aggregates individual evidentiary findings into a normalized risk score ($R \in [0, 100]$) and maps observations directly to the CIA Triad:

$$R = \min\left(100, \sum_{i=1}^{k} w_i \cdot S_i\right)$$

Where:
- $w_i$ denotes the severity weight assigned to technique finding $i$ ($w_{\text{CRITICAL}} = 25$, $w_{\text{HIGH}} = 15$, $w_{\text{MEDIUM}} = 8$, $w_{\text{LOW}} = 3$).
- $S_i$ denotes the normalized confidence factor ($0.0 \le S_i \le 1.0$).

---

## Empirical CIA Triad Evaluation Matrix

Each forensic pipeline is quantitatively evaluated on a standardized 1–10 scale across the three dimensions of information security:

| Forensic Technique | Confidentiality | Integrity | Availability | Composite Score | Primary Evidentiary Capability |
|---|:---:|:---:|:---:|:---:|---|
| **Log Forensics** | 8/10 | 8/10 | 7/10 | **23/30** | Unauthorized access reconstruction and credential abuse mapping |
| **Network Forensics** | 9/10 | 7/10 | 9/10 | **25/30** | Data exfiltration tracking, scan detection, and DoS analysis |
| **File Integrity** | 5/10 | 10/10 | 7/10 | **22/30** | Mathematical proof of unauthorized file modification |
| **Malware Analysis** | 8/10 | 8/10 | 8/10 | **24/30** | Payload classification, unpacker detection, and persistence auditing |
| **Metadata Forensics** | 6/10 | 7/10 | 5/10 | **18/30** | Document provenance, author attribution, and timestomp detection |
| **Anti-Forensics** | 7/10 | 9/10 | 6/10 | **22/30** | Evidence destruction identification and wiper artifact detection |

---

## System Architecture

```
+-------------------------------------------------------------------------+
|                  Presentation Layer (React 19 / TypeScript)             |
|  - Shards Dashboard Layout         - Interactive Live Demo Simulation   |
|  - Dynamic Plotly Radar Visuals    - Client-side Web Crypto SHA-256     |
|  - Zero Emojis / SVG System        - Automated PDF Report Generation    |
+-------------------------------------------------------------------------+
                                    |
                            REST API / In-Memory
                                    v
+-------------------------------------------------------------------------+
|                     Application & Correlation Layer                     |
|  - Fast-API Serverless Endpoints   - Cross-Source Correlation Engine    |
|  - Risk Aggregator & Scorer        - CIA Triad Benchmark Evaluator      |
+-------------------------------------------------------------------------+
                                    |
          +-------------------------+-------------------------+
          |                         |                         |
          v                         v                         v
+-------------------+     +-------------------+     +-------------------+
|  Forensic Engines |     | Cryptographic Sub |     | Evidence Storage  |
|  - Log Analyzer   |     | - SHA-256 Engine  |     | - SQLite Ledger   |
|  - PCAP Inspector |     | - MD5 Engine      |     | - Custody Vault   |
|  - Entropy Gauge  |     | - Shannon Entropy |     | - In-Memory Cases |
|  - Metadata Audit |     | - Wiper Detection |     | - Virtual /tmp    |
+-------------------+     +-------------------+     +-------------------+
```

---

## Academic References

1. Casey, E. (2011). *Digital Evidence and Computer Crime: Forensic Science, Computers, and the Internet*. Academic Press.
2. Carrier, B. (2005). *File System Forensic Analysis*. Addison-Wesley Professional.
3. Shannon, C. E. (1948). A Mathematical Theory of Communication. *Bell System Technical Journal*, 27(3), 379–423.
4. Kent, K., Chevalier, S., Grance, T., & Dang, H. (2006). *Guide to Computer Security Log Management*. NIST Special Publication 800-92.
5. Lyda, R., & Hamrock, J. (2007). Using Entropy Analysis to Find Encrypted and Packed Malware. *IEEE Security & Privacy*, 5(2), 40–45.
