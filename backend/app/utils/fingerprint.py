import hashlib
import os
from typing import Iterable


def compute_dataset_fingerprint(file_paths: Iterable[str]) -> str:
    sha = hashlib.sha256()
    for path in sorted(file_paths):
        stat = os.stat(path)
        sha.update(path.encode("utf-8"))
        sha.update(str(stat.st_size).encode("utf-8"))
        sha.update(str(int(stat.st_mtime)).encode("utf-8"))
    return sha.hexdigest()
