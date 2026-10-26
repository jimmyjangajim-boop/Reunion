"""Read-only verification before extracting an RNAS portable backup."""
import hashlib
import json
import sys
import zipfile
from pathlib import PurePosixPath

with zipfile.ZipFile(sys.argv[1]) as archive:
    names = archive.namelist()
    if len(names) != len(set(names)):
        raise ValueError("Duplicate archive entries")
    manifest = json.loads(archive.read("MANIFEST.json"))
    if manifest.get("format") != "rnas-portable-v1":
        raise ValueError("Unsupported portable format")
    files = manifest["files"]
    if set(names) != set(files) | {"MANIFEST.json", "RESTORE.txt"}:
        raise ValueError("Archive files differ from manifest")
    if "data/reunion.sqlite" not in files:
        raise ValueError("Database is missing")
    for name, item in files.items():
        parts = PurePosixPath(name).parts
        if not parts or parts[0] not in ("data", "evidence") or ".." in parts or "\\" in name or ":" in name:
            raise ValueError("Unsafe backup path: " + name)
        content = archive.read(name)
        if len(content) != item["bytes"] or hashlib.sha256(content).hexdigest() != item["sha256"]:
            raise ValueError("Checksum or size mismatch: " + name)
    if archive.testzip() is not None:
        raise ValueError("ZIP integrity check failed")
    print(json.dumps({"format": manifest["format"], "verified_files": len(files), "migrations": manifest["migrations"]}))
