"""Prepare a portable update directory for a static HTTP server."""
import argparse
import hashlib
import json
import os
import subprocess
from pathlib import Path
from tempfile import NamedTemporaryFile
from zipfile import ZipFile


def write_atomic(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    with NamedTemporaryFile(dir=path.parent, delete=False) as temp:
        temp.write(data)
    os.replace(temp.name, path)


def prepare(zip_path, output, signing_key):
    with ZipFile(zip_path) as archive:
        content = archive.read("portable-manifest.json")
        manifest = json.loads(content)
        signature = subprocess.run(
            ["node", str(Path(__file__).with_name("sign-manifest.cjs")), str(signing_key)],
            input=content, stdout=subprocess.PIPE, check=True,
        ).stdout.decode("ascii")
        for file in manifest["files"]:
            checksum = hashlib.sha256()
            with archive.open(file["path"]) as source:
                for expected in file.get("blocks", [file["sha256"]]):
                    data = source.read(1024 * 1024 if "blocks" in file else -1)
                    actual = hashlib.sha256(data).hexdigest()
                    if actual != expected:
                        raise ValueError(f"Checksum mismatch: {file['path']}")
                    checksum.update(data)
                    obj = output / "objects" / actual
                    if not obj.exists():
                        write_atomic(obj, data)
                if source.read(1) or checksum.hexdigest() != file["sha256"]:
                    raise ValueError(f"Incomplete manifest: {file['path']}")
        digest = hashlib.sha256(content).hexdigest()
        write_atomic(output / "manifests" / digest, content)
        write_atomic(output / "latest.json", json.dumps({
            "version": manifest["version"], "manifestSha256": digest, "signature": signature
        }).encode())


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("zip", type=Path)
    parser.add_argument("output", type=Path)
    parser.add_argument("--signing-key", type=Path, required=True)
    args = parser.parse_args()
    prepare(args.zip, args.output, args.signing_key)
