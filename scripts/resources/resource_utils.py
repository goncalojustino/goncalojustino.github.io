"""Shared, dependency-free helpers for the DOI resource workflow."""

from __future__ import annotations

import hashlib
import html
import json
import re
import time
from datetime import datetime, timezone
from html.parser import HTMLParser
from pathlib import Path
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.parse import quote
from urllib.request import Request, build_opener


WEBSITE_CATEGORIES = {
    "software": "Software",
    "datasets": "Datasets",
    "databases": "Databases",
    "books-monographs": "Books & Monographs",
    "teaching": "Teaching Materials",
    "protocols": "Protocols",
    "code": "Code",
    "other": "Other",
}

CATEGORY_ALIASES = {
    "dataset": "datasets",
    "data": "datasets",
    "database": "databases",
    "book": "books-monographs",
    "books": "books-monographs",
    "monograph": "books-monographs",
    "teaching-material": "teaching",
    "teaching-materials": "teaching",
    "protocol": "protocols",
}

DOI_PATTERN = re.compile(r"^10\.\d{4,9}/[-._;()/:a-z0-9]+$", re.IGNORECASE)


def utc_now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def normalize_doi(value: str | None) -> str:
    """Accept common DOI forms while retaining unusual valid suffix characters."""
    if not value:
        raise ValueError("A DOI is required.")
    doi = value.strip()
    doi = re.sub(r"^doi\s*:\s*", "", doi, flags=re.IGNORECASE)
    doi = re.sub(r"^https?://(?:dx\.)?doi\.org/", "", doi, flags=re.IGNORECASE)
    doi = doi.strip().rstrip(".,;)")
    if not DOI_PATTERN.fullmatch(doi):
        raise ValueError(f"Invalid DOI: {value!r}")
    return doi.lower()


def doi_url(doi: str) -> str:
    return f"https://doi.org/{doi}"


def canonical_category(value: str | None) -> str:
    key = (value or "other").strip().lower().replace("_", "-").replace(" ", "-")
    return CATEGORY_ALIASES.get(key, key if key in WEBSITE_CATEGORIES else "other")


def category_for_external_type(value: str | None) -> str:
    key = (value or "").lower()
    if "software" in key or "workflow" in key:
        return "software"
    if "dataset" in key or "collection" in key:
        return "datasets"
    if "database" in key:
        return "databases"
    if "book" in key or "monograph" in key:
        return "books-monographs"
    if "protocol" in key:
        return "protocols"
    if any(term in key for term in ("lesson", "text", "teaching", "educational")):
        return "teaching"
    if "code" in key:
        return "code"
    return "other"


class _TextExtractor(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.parts: list[str] = []

    def handle_data(self, data: str) -> None:
        self.parts.append(data)


def plain_text(value: Any) -> str | None:
    if not isinstance(value, str):
        return None
    parser = _TextExtractor()
    parser.feed(value)
    text = html.unescape(" ".join(parser.parts))
    text = re.sub(r"\s+", " ", text).strip()
    return text or None


def as_list(value: Any) -> list[Any]:
    return value if isinstance(value, list) else []


def compact(value: Any) -> Any:
    """Remove empty values before persisting a curated resource record."""
    if isinstance(value, dict):
        return {key: compact(item) for key, item in value.items() if item not in (None, "", [], {})}
    if isinstance(value, list):
        return [compact(item) for item in value if item not in (None, "", [], {})]
    return value


def stable_id_for_doi(doi: str) -> str:
    readable = re.sub(r"[^a-z0-9]+", "-", doi.lower()).strip("-")[:48]
    digest = hashlib.sha256(doi.encode("utf-8")).hexdigest()[:10]
    return f"{readable}-{digest}"


def year_from_date(value: Any) -> int | None:
    match = re.search(r"\b(19|20)\d{2}\b", str(value or ""))
    return int(match.group(0)) if match else None


def request_json(url: str, *, accept: str = "application/json", retries: int = 2) -> tuple[Any, str | None]:
    """Fetch JSON with modest retries and return the final response URL."""
    error: Exception | None = None
    for attempt in range(retries + 1):
        try:
            request = Request(url, headers={"Accept": accept, "User-Agent": "JustinoResearchGroup-DOIImporter/1.0"})
            with build_opener().open(request, timeout=25) as response:
                return json.loads(response.read().decode("utf-8")), response.geturl()
        except (HTTPError, URLError, TimeoutError, json.JSONDecodeError) as exc:
            error = exc
            if attempt < retries:
                time.sleep(attempt + 1)
    raise RuntimeError(f"Could not retrieve {url}: {error}")


def resolve_doi(doi: str) -> str | None:
    try:
        request = Request(doi_url(doi), headers={"User-Agent": "JustinoResearchGroup-DOIImporter/1.0"})
        with build_opener().open(request, timeout=25) as response:
            return response.geturl()
    except (HTTPError, URLError, TimeoutError):
        return None


def write_json(path: Path, payload: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def read_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def json_string(value: Any) -> str:
    return json.dumps(value, ensure_ascii=False, indent=2, sort_keys=True)
