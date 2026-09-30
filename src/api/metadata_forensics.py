import os
from pathlib import Path
from datetime import datetime


def get_file_metadata(file_path: str) -> dict:
    """Extract OS-level file system metadata and timestamps."""
    file_path_obj = Path(file_path)

    if not file_path_obj.exists():
        return {"error": f"File not found: {file_path}"}

    try:
        stat = file_path_obj.stat()

        created_ts = datetime.fromtimestamp(stat.st_ctime)
        modified_ts = datetime.fromtimestamp(stat.st_mtime)
        accessed_ts = datetime.fromtimestamp(stat.st_atime)

        # Detect potential timestamp tampering (e.g., modified earlier than created)
        time_anomaly = modified_ts < created_ts

        metadata = {
            "name": file_path_obj.name,
            "size": stat.st_size,
            "size_kb": round(stat.st_size / 1024, 2),
            "created": created_ts.isoformat(),
            "modified": modified_ts.isoformat(),
            "accessed": accessed_ts.isoformat(),
            "extension": file_path_obj.suffix.lower(),
            "is_absolute": file_path_obj.is_absolute(),
            "timestamp_anomaly": time_anomaly,
            "anomaly_description": "File modified timestamp precedes creation timestamp (possible timestomping)" if time_anomaly else "Timestamps appear chronologically consistent",
        }

        return metadata
    except Exception as e:
        return {"error": f"Error extracting metadata: {str(e)}"}


def get_pdf_metadata(file_path: str) -> dict:
    """Extract embedded document metadata from PDF files."""
    file_path_obj = Path(file_path)

    if not file_path_obj.exists():
        return {"error": f"File not found: {file_path}"}

    if file_path_obj.suffix.lower() != ".pdf":
        return {"error": f"File is not a PDF: {file_path}"}

    try:
        try:
            from pypdf import PdfReader
        except ImportError:
            import warnings
            with warnings.catch_warnings():
                warnings.simplefilter("ignore", category=DeprecationWarning)
                from PyPDF2 import PdfReader
        reader = PdfReader(str(file_path_obj))
        pdf_metadata = reader.metadata

        info = {}
        if pdf_metadata:
            for key, value in pdf_metadata.items():
                clean_key = str(key).lstrip('/')
                info[clean_key] = str(value) if value is not None else ""

        return {
            "name": file_path_obj.name,
            "size": file_path_obj.stat().st_size,
            "format": "PDF",
            "page_count": len(reader.pages),
            "is_encrypted": reader.is_encrypted,
            "pdf_metadata": info,
            "author": info.get("Author", "Unknown"),
            "creator": info.get("Creator", "Unknown"),
            "producer": info.get("Producer", "Unknown"),
            "creation_date": info.get("CreationDate", "Unknown"),
            "mod_date": info.get("ModDate", "Unknown"),
        }
    except Exception as e:
        return {"error": f"Could not read PDF metadata: {str(e)}"}


def get_image_metadata(file_path: str) -> dict:
    """Extract image format, dimensions, color mode, and EXIF tags."""
    file_path_obj = Path(file_path)

    if not file_path_obj.exists():
        return {"error": f"File not found: {file_path}"}

    try:
        from PIL import Image, ExifTags
        with Image.open(file_path_obj) as img:
            metadata = {
                "name": file_path_obj.name,
                "format": img.format,
                "mode": img.mode,
                "width": img.width,
                "height": img.height,
                "size": file_path_obj.stat().st_size,
                "exif": {},
            }

            # Extract EXIF tags and resolve to human-readable names
            exif_raw = img.getexif() if hasattr(img, "getexif") else None
            if exif_raw:
                resolved_exif = {}
                for tag_id, value in exif_raw.items():
                    tag_name = ExifTags.TAGS.get(tag_id, str(tag_id))
                    # Ensure JSON serializable
                    if isinstance(value, bytes):
                        try:
                            value = value.decode("utf-8", errors="ignore")
                        except Exception:
                            value = str(value)
                    elif not isinstance(value, (int, float, str, bool)):
                        value = str(value)
                    resolved_exif[tag_name] = value

                metadata["exif"] = resolved_exif
                metadata["has_exif"] = len(resolved_exif) > 0

            return metadata
    except Exception as e:
        return {"error": f"Could not read image: {str(e)}"}


def compare_metadata(original_path: str, working_copy_path: str) -> dict:
    """Compare metadata between original evidence and working copy."""
    orig = get_file_metadata(original_path)
    working = get_file_metadata(working_copy_path)

    if "error" in orig:
        return {"error": f"Original file error: {orig['error']}"}
    if "error" in working:
        return {"error": f"Working copy error: {working['error']}"}

    changes = {}
    key_fields = ["size", "modified", "accessed", "extension"]
    for field in key_fields:
        orig_val = orig.get(field)
        working_val = working.get(field)
        is_changed = (orig_val != working_val)
        changes[field] = {
            "original": orig_val,
            "working_copy": working_val,
            "changed": is_changed,
        }

    has_any_change = any(c["changed"] for c in changes.values())

    return {
        "original_file": orig.get("name"),
        "working_file": working.get("name"),
        "has_changes": has_any_change,
        "tampering_suspected": changes.get("size", {}).get("changed", False) or changes.get("modified", {}).get("changed", False),
        "changes": changes,
        "original_metadata": orig,
        "working_copy_metadata": working,
    }