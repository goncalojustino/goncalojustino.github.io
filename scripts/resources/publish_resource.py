"""Validate an approved review issue and write one curated resource file."""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any

from catalogue import find_duplicate, update_index
from issue_review import parse_imported, parse_review, review_category
from resource_utils import compact, doi_url, normalize_doi, utc_now, write_json


def truthy_boolean(value: Any, field: str) -> bool:
    if isinstance(value, bool):
        return value
    raise ValueError(f"{field} must be true or false.")


def nonempty_override(review: dict[str, Any], field: str, fallback: Any) -> Any:
    value = review.get(field)
    return fallback if value in (None, "") else value


def merge_record(imported: dict[str, Any], review: dict[str, Any]) -> dict[str, Any]:
    doi = normalize_doi(imported["doi"]) if imported.get("doi") else None
    keywords = list(imported.get("keywords") or [])
    additions = review.get("keywords_add") or []
    if not isinstance(additions, list) or not all(isinstance(item, str) for item in additions):
        raise ValueError("keywords_add must be a JSON list of strings.")
    keywords.extend(item.strip() for item in additions if item.strip())
    record = dict(imported)
    record.update({
        "title": nonempty_override(review, "title_override", imported.get("title")),
        "year": nonempty_override(review, "year_override", imported.get("year")),
        "repository": nonempty_override(review, "repository_override", imported.get("repository")),
        "license": nonempty_override(review, "license_override", imported.get("license")),
        "resource_url": nonempty_override(review, "resource_url_override", imported.get("resource_url") or imported.get("landing_page_url")),
        "github_url": nonempty_override(review, "github_url", imported.get("github_url")),
        "citation": nonempty_override(review, "preferred_citation", imported.get("citation")),
        "short_description": nonempty_override(review, "short_description", imported.get("short_description")),
        "website_category": review_category(review),
        "public": truthy_boolean(review.get("public"), "public"),
        "featured": truthy_boolean(review.get("featured"), "featured"),
        "keywords": list(dict.fromkeys(keywords)),
        "reviewed_at": utc_now(),
    })
    if doi:
        record["doi"] = doi
        record["doi_url"] = doi_url(doi)
    if record.get("year") is not None:
        try:
            record["year"] = int(record["year"])
        except (TypeError, ValueError) as exc:
            raise ValueError("year_override must be a four-digit year or left blank.") from exc
    return compact(record)


def validate(record: dict[str, Any]) -> list[str]:
    failures = []
    if not record.get("title"):
        failures.append("title (supply title_override in the review block)")
    if not record.get("website_category"):
        failures.append("website_category")
    if not (record.get("doi") or record.get("resource_url")):
        failures.append("doi or resource_url")
    if record.get("year") is not None and not isinstance(record["year"], int):
        failures.append("year must be a number")
    if "public" not in record:
        failures.append("public")
    return failures


def write_result(path: Path, message: str) -> None:
    path.write_text(message.rstrip() + "\n", encoding="utf-8")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--issue-file", type=Path, required=True)
    parser.add_argument("--resources-dir", type=Path, required=True)
    parser.add_argument("--index", type=Path, required=True)
    parser.add_argument("--result", type=Path, required=True)
    args = parser.parse_args()
    try:
        body = args.issue_file.read_text(encoding="utf-8")
        imported, review = parse_imported(body), parse_review(body)
        record = merge_record(imported, review)
        failures = validate(record)
        if failures:
            write_result(args.result, "## Resource publication needs review\n\nNo file was created. Please correct the following review fields and remove/re-add `publish-resource`:\n\n" + "\n".join(f"- {item}" for item in failures))
            return 2
        filename = f"{record['id']}.json"
        destination = args.resources_dir / filename
        duplicate = find_duplicate(args.resources_dir, record.get("doi"), record.get("resource_url"), record.get("provider_record_id"), exclude=destination)
        if duplicate:
            write_result(args.result, f"## Resource publication stopped\n\nNo file was created because this DOI or provider record already exists at `{duplicate.as_posix()}`.")
            return 2
        write_json(destination, record)
        update_index(args.index, args.resources_dir, filename)
        write_result(args.result, f"## Resource published\n\nCreated `{destination.as_posix()}` and updated `{args.index.as_posix()}`. The public Resources page will include it when `public` is `true`.")
        return 0
    except (ValueError, KeyError, json.JSONDecodeError) as exc:
        write_result(args.result, f"## Resource publication needs review\n\nNo file was created: {exc}")
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
