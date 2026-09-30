import os
import struct
import socket
from collections import Counter, defaultdict


def _parse_pcap_native(file_path: str, packet_limit: int = 5000):
    """
    Pure Python PCAP parser fallback.
    Reads standard libpcap format without requiring external Wireshark / TShark binaries.
    """
    source_ips = Counter()
    dest_ips = Counter()
    dest_ports = Counter()
    protocols = Counter()
    total_packets = 0
    ip_ports = defaultdict(set)
    large_packets = []
    dns_queries = []
    total_outbound = 0

    try:
        with open(file_path, "rb") as f:
            global_header = f.read(24)
            if len(global_header) < 24:
                return None

            magic = struct.unpack("<I", global_header[:4])[0]
            if magic == 0xa1b2c3d4:
                endian = "<"
            elif magic == 0xd4c3b2a1:
                endian = ">"
            else:
                # May be pcapng or non-standard
                return None

            while total_packets < packet_limit:
                hdr = f.read(16)
                if len(hdr) < 16:
                    break

                ts_sec, ts_usec, incl_len, orig_len = struct.unpack(f"{endian}IIII", hdr)
                packet_data = f.read(incl_len)
                if len(packet_data) < incl_len:
                    break

                total_packets += 1
                total_outbound += incl_len

                # Check for Ethernet frame (type 0x0800 for IPv4)
                if len(packet_data) >= 14:
                    eth_type = struct.unpack("!H", packet_data[12:14])[0]
                    if eth_type == 0x0800 and len(packet_data) >= 34:  # IPv4
                        ip_hdr = packet_data[14:34]
                        proto = ip_hdr[9]
                        src_ip = socket.inet_ntoa(ip_hdr[12:16])
                        dst_ip = socket.inet_ntoa(ip_hdr[16:20])

                        source_ips[src_ip] += 1
                        dest_ips[dst_ip] += 1

                        ihl = (ip_hdr[0] & 0x0F) * 4
                        trans_offset = 14 + ihl

                        if proto == 6:  # TCP
                            protocols["TCP"] += 1
                            if len(packet_data) >= trans_offset + 4:
                                dport = struct.unpack("!H", packet_data[trans_offset + 2:trans_offset + 4])[0]
                                dest_ports[dport] += 1
                                ip_ports[src_ip].add(dport)
                        elif proto == 17:  # UDP
                            protocols["UDP"] += 1
                            if len(packet_data) >= trans_offset + 4:
                                sport, dport = struct.unpack("!HH", packet_data[trans_offset:trans_offset + 4])
                                dest_ports[dport] += 1
                                if dport == 53 or sport == 53:
                                    protocols["DNS"] += 1
                                    # Simple DNS string search in payload
                                    payload = packet_data[trans_offset + 8:]
                                    for match in _extract_printable_strings(payload):
                                        if "." in match and len(match) > 4:
                                            dns_queries.append(match)
                        elif proto == 1:
                            protocols["ICMP"] += 1
                        else:
                            protocols[f"IP-Proto-{proto}"] += 1

                        if incl_len > 1000:
                            large_packets.append({
                                "src": src_ip,
                                "dst": dst_ip,
                                "length": incl_len,
                            })

        port_scan_ips = {
            ip: len(ports)
            for ip, ports in ip_ports.items()
            if len(ports) >= 15
        }

        return {
            "total_packets_analyzed": total_packets,
            "source_ip_distribution": source_ips.most_common(20),
            "dest_ip_distribution": dest_ips.most_common(20),
            "dest_port_distribution": dest_ports.most_common(20),
            "protocol_distribution": dict(protocols) if protocols else {"TCP": 0, "UDP": 0},
            "port_scan_detections": port_scan_ips,
            "total_outbound_bytes": total_outbound,
            "large_transfers": len(large_packets),
            "large_packet_details": large_packets[:10],
            "dns_queries": list(set(dns_queries))[:50],
        }

    except Exception:
        return None


def _extract_printable_strings(data: bytes, min_len: int = 4):
    """Extract ASCII domains/strings from packet payload."""
    result = []
    current = []
    for b in data:
        if 32 <= b <= 126:
            current.append(chr(b))
        else:
            if len(current) >= min_len:
                result.append("".join(current))
            current = []
    if len(current) >= min_len:
        result.append("".join(current))
    return result


def capture_pcap_analysis(file_path: str, packet_limit: int = 5000) -> dict:
    """Analyze PCAP file using PyShark with automatic native parser fallback."""
    if not os.path.exists(file_path):
        return {"error": f"PCAP file not found: {file_path}"}

    # Attempt native fast parser first
    native_res = _parse_pcap_native(file_path, packet_limit)
    if native_res and native_res["total_packets_analyzed"] > 0:
        return native_res

    # Try PyShark if available and tshark is present
    try:
        import pyshark
        capture = pyshark.FileCapture(file_path, keep_packets=False, packet_limit=packet_limit)

        source_ips = Counter()
        dest_ips = Counter()
        dest_ports = Counter()
        protocols = Counter()
        ip_ports = defaultdict(set)
        total_packets = 0

        for packet in capture:
            total_packets += 1
            try:
                if hasattr(packet, "ip"):
                    source_ips[packet.ip.src] += 1
                    dest_ips[packet.ip.dst] += 1

                if hasattr(packet, "tcp"):
                    dest_ports[int(packet.tcp.dstport)] += 1
                    protocols["TCP"] += 1
                    if hasattr(packet, "ip"):
                        ip_ports[packet.ip.src].add(int(packet.tcp.dstport))

                if hasattr(packet, "udp"):
                    protocols["UDP"] += 1
                    if hasattr(packet, "udp") and hasattr(packet.udp, "dstport"):
                        dest_ports[int(packet.udp.dstport)] += 1

                if hasattr(packet, "icmp"):
                    protocols["ICMP"] += 1

            except (AttributeError, ValueError):
                continue

        capture.close()

        port_scan_ips = {
            ip: len(ports)
            for ip, ports in ip_ports.items()
            if len(ports) >= 15
        }

        return {
            "total_packets_analyzed": total_packets,
            "source_ip_distribution": source_ips.most_common(20),
            "dest_ip_distribution": dest_ips.most_common(20),
            "dest_port_distribution": dest_ports.most_common(20),
            "protocol_distribution": dict(protocols),
            "port_scan_detections": port_scan_ips,
        }

    except Exception as e:
        if native_res is not None:
            return native_res
        return {
            "error": f"Could not analyze PCAP file: {str(e)}",
            "total_packets_analyzed": 0,
            "source_ip_distribution": [],
            "dest_ip_distribution": [],
            "dest_port_distribution": [],
            "protocol_distribution": {},
            "port_scan_detections": {},
        }


def detect_large_transfers(file_path: str, threshold_bytes: int = 1000000) -> dict:
    """Detect unusually large network data transfers."""
    if not os.path.exists(file_path):
        return {"error": f"File not found: {file_path}"}

    parsed = _parse_pcap_native(file_path)
    if parsed:
        return {
            "file_path": file_path,
            "total_outbound_bytes": parsed.get("total_outbound_bytes", 0),
            "large_transfers": parsed.get("large_transfers", 0),
            "large_packet_details": parsed.get("large_packet_details", []),
            "threshold_bytes": threshold_bytes,
        }

    file_size = os.path.getsize(file_path)
    return {
        "file_path": file_path,
        "total_outbound_bytes": file_size,
        "large_transfers": 1 if file_size > threshold_bytes else 0,
        "large_packet_details": [],
        "threshold_bytes": threshold_bytes,
    }


def detect_dns_queries(file_path: str, domain_keywords: list = None) -> dict:
    """Detect suspicious or command-and-control DNS queries."""
    if not os.path.exists(file_path):
        return {"error": f"File not found: {file_path}"}

    if domain_keywords is None:
        domain_keywords = ["malware", "c2", "command", "control", "exfil", "dark", "anon", "tunnel"]

    parsed = _parse_pcap_native(file_path)
    dns_queries = parsed.get("dns_queries", []) if parsed else []

    suspicious = [q for q in dns_queries if any(kw.lower() in q.lower() for kw in domain_keywords)]

    return {
        "file_path": file_path,
        "total_dns_queries": len(dns_queries),
        "unique_dns_queries": len(set(dns_queries)),
        "suspicious_queries": suspicious,
        "suspicious_count": len(suspicious),
        "all_queries_sample": dns_queries[:15],
    }