"""Issue-form parsing and stable imported/review metadata blocks."""

from __future__ import annotations

import json
import re
from typing import Any

from resource_utils import WEBSITE_CATEGORIES, json_string, normalize_doi

IMPORTED_START = "<!-- RESOURCE-IMPORTED:START -->"
IMPORTED_END = "<!-- RESOURCE-IMPORTED:END -->"
REVIEW_START = "<!-- RESOURCE-REVIEW:START -->"
REVIEW_END = "<!-- RESOURCE-REVIEW:END -->"


def extract_doi(issue_body: str) -> str:
    match = re.search(r"^###\s*DOI\s*$\s*^\s*(.+?)\s*$", issue_body, flags=re.IGNORECASE | re.MULTILINE)
    if match:
        return normalize_doi(match.group(1))
    fallback = re.search(r"(?:https?://(?:dx\.)?doi\.org/|doi:\s*)?(10\.\d{4,9}/[-._;()/:a-z0-9]+)", issue_body, flags=re.IGNORECASE)
    if fallback:
        return normalize_doi(fallback.group(1))
    raise ValueError("No DOI was found in this issue. Use the Import Resource by DOI form.")


def _extract_block(body: str, start: str, end: str, label: str) -> dict[str, Any]:
    pattern = re.escape(start) + r"\s*(?:```json\s*)?(.*?)(?:\s*```)?\s*" + re.escape(end)
    match = re.search(pattern, body, flags=re.DOTALL)
    if not match:
        raise ValueError(f"The {label} block is missing from this issue.")
    try:
        value = json.loads(match.group(1).strip())
    except json.JSONDecodeError as exc:
        raise ValueError(f"The {label} block is not valid JSON: {exc.msg}.") from exc
    if not isinstance(value, dict):
        raise ValueError(f"The {label} block must contain one JSON object.")
    return value


def parse_imported(body: str) -> dict[str, Any]:
    return _extract_block(body, IMPORTED_START, IMPORTED_END, "imported metadata")


def parse_review(body: str) -> dict[str, Any]:
    return _extract_block(body, REVIEW_START, REVIEW_END, "review")


def default_review(imported: dict[str, Any]) -> dict[str, Any]:
    return {
        "website_category": imported.get("website_category", "other"),
        "public": False,
        "featured": False,
        "short_description": "",
        "github_url": "",
        "preferred_citation": "",
        "title_override": "",
        "year_override": None,
        "repository_override": "",
        "license_override": "",
        "resource_url_override": "",
        "keywords_add": [],
    }


def missing_fields(imported: dict[str, Any]) -> list[str]:
    fields = {
        "Title": imported.get("title"),
        "Publication year": imported.get("year"),
        "Description": imported.get("description"),
        "Repository/resource URL": imported.get("resource_url") or imported.get("landing_page_url"),
        "License": imported.get("license"),
        "Keywords": imported.get("keywords"),
    }
    return [name for name, value in fields.items() if value in (None, "", [], {})]


def build_review_issue(original_body: str, imported: dict[str, Any], warnings: list[str], duplicate_path: str | None = None) -> str:
    authors = imported.get("authors") or []
    author_names = [author.get("name", "Unnamed creator") if isinstance(author, dict) else str(author) for author in authors]
    missing = missing_fields(imported)
    repository = imported.get("repository") or "Unknown"
    external_type = imported.get("external_type") or "Unknown"
    duplicate_notice = f"\n> This DOI is already published as `{duplicate_path}`. It cannot be published a second time.\n" if duplicate_path else ""
    warnings_text = "\n".join(f"- {warning}" for warning in warnings) or "- None"
    missing_text = "\n".join(f"- {field}" for field in missing) or "- None detected"
    author_text = "\n".join(f"- {name}" for name in author_names) or "- No creators returned"
    return f"""# Resource import review

This issue is the editorial review record for one DOI. The resource is **not public** until you add the `publish-resource` label.
{duplicate_notice}
## Imported resource

**DOI:** {imported.get('doi', 'Unknown')}
**Title:** {imported.get('title') or 'Missing'}
**Detected repository:** {repository}
**Detected resource type:** {external_type}
**Publication date:** {imported.get('publication_date') or 'Missing'}
**Version:** {imported.get('version') or 'Not supplied'}
**License:** {imported.get('license') or 'Missing'}
**Resource URL:** {imported.get('resource_url') or imported.get('landing_page_url') or 'Missing'}

### Authors

{author_text}

### Import notes

{warnings_text}

### Fields requiring review

- Confirm the website category, public status, and featured status.
- Add a concise public-facing description if the imported description is unsuitable.
- Add optional GitHub URL, preferred citation, or title/year/repository/license overrides as needed.
- Blank override values mean “keep the imported value”.

### Missing imported fields

{missing_text}

### Metadata provenance

{chr(10).join(f'- {source}' for source in imported.get('metadata_sources', [])) or '- Not recorded'}

## Editable review block

Edit only the JSON values in this block. Keep its comment markers and field names unchanged.

{REVIEW_START}
```json
{json_string(default_review(imported))}
```
{REVIEW_END}

## Imported metadata (reference only)

Keep this block for provenance. Your review overrides above take precedence.

{IMPORTED_START}
```json
{json_string(imported)}
```
{IMPORTED_END}

## Publication state

`NOT PUBLISHED` — when ready, add the `publish-resource` label. The validation workflow will then create one curated file in `data/resources/`, commit it, update the public catalogue, and close this issue on success.
"""


def review_category(review: dict[str, Any]) -> str:
    category = str(review.get("website_category") or "").strip()
    if category not in WEBSITE_CATEGORIES:
        raise ValueError(f"website_category must be one of: {', '.join(WEBSITE_CATEGORIES)}.")
    return category
