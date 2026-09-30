import sys
import os
from pathlib import Path

# Add project root and src/api to sys.path
root_dir = Path(__file__).resolve().parent.parent
api_dir = root_dir / "src" / "api"

if str(api_dir) not in sys.path:
    sys.path.insert(0, str(api_dir))
if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))

from app import app
