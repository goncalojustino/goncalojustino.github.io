"""Read, validate, and update the static resource-file catalogue."""

from __future__ import annotations

from pathlib import Path
from typing import Any

from resource_utils import WEBSITE_CATEGORIES, read_json, utc_now, write_json


def catalogue_template() -> dict[str, Any]:
    return {
        "updated_at": utc_now(),
        "resource_types": [{"id": key, "label": label} for key, label in WEBSITE_CATEGORIES.items()],
        "resource_files": [],
    }


def load_index(path: Path) -> dict[str, Any]:
    return read_json(path) if path.exists() else catalogue_template()


def resource_paths(resources_dir: Path, index: dict[str, Any] | None = None) -> list[Path]:
    if index and isinstance(index.get("resource_files"), list):
        return [resources_dir / name for name in index["resource_files"] if isinstance(name, str)]
    return sorted(resources_dir.glob("*.json"))


def find_duplicate(resources_dir: Path, doi: str | None, resource_url: str | None, provider_record_id: str | None, exclude: Path | None = None) -> Path | None:
    for path in sorted(resources_dir.glob("*.json")):
        if exclude and path.resolve() == exclude.resolve():
            continue
        try:
            existing = read_json(path)
        except Exception:
            continue
        if doi and existing.get("doi", "").lower() == doi.lower():
            return path
        if resource_url and resource_url in {existing.get("resource_url"), existing.get("landing_page_url")}:
            return path
        if provider_record_id and str(existing.get("provider_record_id", "")) == str(provider_record_id):
            return path
    return None


def update_index(path: Path, resources_dir: Path, filename: str) -> None:
    index = load_index(path)
    filenames = {name for name in index.get("resource_files", []) if isinstance(name, str)}
    filenames.add(filename)
    records: list[tuple[int, str, str]] = []
    for name in filenames:
        record_path = resources_dir / name
        if record_path.exists():
            record = read_json(record_path)
            records.append((int(record.get("year") or 0), str(record.get("id") or name), name))
    index["updated_at"] = utc_now()
    index["resource_types"] = [{"id": key, "label": label} for key, label in WEBSITE_CATEGORIES.items()]
    index["resource_files"] = [name for _, _, name in sorted(records, key=lambda item: (-item[0], item[1]))]
    write_json(path, index)
