"""Fetch DOI metadata and produce a GitHub Issue review body."""

from __future__ import annotations

import argparse
from pathlib import Path

from catalogue import find_duplicate
from issue_review import build_review_issue, extract_doi
from providers import import_doi


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--issue-file", type=Path, required=True)
    parser.add_argument("--resources-dir", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    body = args.issue_file.read_text(encoding="utf-8")
    doi = extract_doi(body)
    imported, _, warnings = import_doi(doi)
    duplicate = find_duplicate(args.resources_dir, imported.get("doi"), imported.get("resource_url"), imported.get("provider_record_id"))
    duplicate_path = str(duplicate.as_posix()) if duplicate else None
    args.output.write_text(build_review_issue(body, imported, warnings, duplicate_path), encoding="utf-8")
    print(f"DOI: {doi}")
    print(f"Sources: {', '.join(imported.get('metadata_sources', []))}")
    print(f"Duplicate: {duplicate_path or 'none'}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
