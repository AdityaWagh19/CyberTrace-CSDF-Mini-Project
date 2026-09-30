import hashlib
import os
from pathlib import Path


def calculate_sha256(file_path: str) -> str:
    """Calculate SHA-256 hash of a file."""
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"File not found: {file_path}")

    sha256 = hashlib.sha256()
    with open(file_path, "rb") as f:
        for block in iter(lambda: f.read(4096), b""):
            sha256.update(block)
    return sha256.hexdigest()


def calculate_md5(file_path: str) -> str:
    """Calculate MD5 hash of a file."""
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"File not found: {file_path}")

    md5 = hashlib.md5()
    with open(file_path, "rb") as f:
        for block in iter(lambda: f.read(4096), b""):
            md5.update(block)
    return md5.hexdigest()


def verify_file_integrity(file_path: str, baseline_hash: str) -> dict:
    """
    Verify current SHA-256/MD5 hash against recorded baseline hash.
    Crucial for chain of custody and tampering detection.
    """
    if not os.path.exists(file_path):
        return {
            "file_path": file_path,
            "baseline_hash": baseline_hash,
            "current_hash": None,
            "integrity_verified": False,
            "modified": "Unknown (File Missing)",
            "status": "FILE_NOT_FOUND",
        }

    try:
        current_sha256 = calculate_sha256(file_path).lower()
        current_md5 = calculate_md5(file_path).lower()
        clean_baseline = baseline_hash.strip().lower()

        match = (current_sha256 == clean_baseline) or (current_md5 == clean_baseline)

        return {
            "file_path": file_path,
            "baseline_hash": baseline_hash,
            "current_sha256": current_sha256,
            "current_md5": current_md5,
            "integrity_verified": match,
            "modified": "No" if match else "Yes",
            "status": "UNCHANGED" if match else "MODIFIED",
        }
    except Exception as e:
        return {
            "file_path": file_path,
            "baseline_hash": baseline_hash,
            "integrity_verified": False,
            "error": str(e),
            "status": "ERROR",
        }


def batch_hash_directory(directory: str, recursive: bool = True) -> dict:
    """Calculate cryptographic hashes for all files in a directory."""
    directory_path = Path(directory)
    if not directory_path.exists() or not directory_path.is_dir():
        return {"error": f"Directory not found: {directory}"}

    hashes = {}
    total_files = 0
    total_bytes = 0

    file_iterator = directory_path.rglob("*") if recursive else directory_path.iterdir()

    for file_path in file_iterator:
        if file_path.is_file():
            total_files += 1
            try:
                size = file_path.stat().st_size
                total_bytes += size
                file_hash_sha = calculate_sha256(str(file_path))
                file_hash_md5 = calculate_md5(str(file_path))

                hashes[file_path.name] = {
                    "full_path": str(file_path),
                    "relative_path": str(file_path.relative_to(directory_path)),
                    "sha256": file_hash_sha,
                    "md5": file_hash_md5,
                    "size_bytes": size,
                }
            except (OSError, PermissionError):
                continue

    return {
        "directory": str(directory_path),
        "total_files": total_files,
        "total_bytes": total_bytes,
        "files": hashes,
    }