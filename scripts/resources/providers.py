"""Generic DOI metadata retrieval and small provider enrichment adapters."""

from __future__ import annotations

import re
from typing import Any
from urllib.parse import quote

from resource_utils import (
    as_list,
    category_for_external_type,
    doi_url,
    plain_text,
    request_json,
    resolve_doi,
    stable_id_for_doi,
    utc_now,
    year_from_date,
)


def author_from_person(value: dict[str, Any]) -> dict[str, Any]:
    name = value.get("name")
    if not name:
        name = " ".join(part for part in (value.get("given"), value.get("family")) if part).strip()
    return {key: item for key, item in {
        "name": name or None,
        "given_name": value.get("given") or value.get("givenName"),
        "family_name": value.get("family") or value.get("familyName"),
        "orcid": (value.get("ORCID") or value.get("orcid") or "").replace("https://orcid.org/", "") or None,
        "affiliation": value.get("affiliation"),
    }.items() if item}


def datacite_metadata(doi: str) -> dict[str, Any] | None:
    try:
        response, _ = request_json(f"https://api.datacite.org/dois/{quote(doi, safe='/')}")
        return response.get("data", {}).get("attributes", {})
    except RuntimeError:
        return None


def crossref_metadata(doi: str) -> dict[str, Any] | None:
    try:
        response, _ = request_json(f"https://api.crossref.org/works/{quote(doi, safe='/')}")
        return response.get("message", {})
    except RuntimeError:
        return None


def csl_metadata(doi: str) -> dict[str, Any] | None:
    try:
        response, _ = request_json(doi_url(doi), accept="application/vnd.citationstyles.csl+json")
        return response if isinstance(response, dict) else None
    except RuntimeError:
        return None


def zenodo_record_id(doi: str, resolved_url: str | None) -> str | None:
    candidate = " ".join(part for part in (doi, resolved_url or "") if part)
    match = re.search(r"zenodo\.(\d+)|/(?:records?|deposit)/?(\d+)", candidate, re.IGNORECASE)
    return next((item for item in match.groups() if item), None) if match else None


def zenodo_metadata(doi: str, resolved_url: str | None) -> dict[str, Any] | None:
    record_id = zenodo_record_id(doi, resolved_url)
    if not record_id:
        return None
    try:
        record, _ = request_json(f"https://zenodo.org/api/records/{record_id}")
        return record if isinstance(record, dict) else None
    except RuntimeError:
        return None


def normalize_datacite(attributes: dict[str, Any], doi: str) -> dict[str, Any]:
    creators = []
    for creator in as_list(attributes.get("creators")):
        if isinstance(creator, dict):
            creators.append(author_from_person(creator))
    title = next((item.get("title") for item in as_list(attributes.get("titles")) if isinstance(item, dict) and item.get("title")), None)
    descriptions = [plain_text(item.get("description")) for item in as_list(attributes.get("descriptions")) if isinstance(item, dict)]
    dates = attributes.get("dates") or []
    publication_date = attributes.get("publicationYear")
    for item in dates:
        if isinstance(item, dict) and item.get("date") and item.get("dateType") in ("Issued", "Published", "Available"):
            publication_date = item["date"]
            break
    types = attributes.get("types") or {}
    subjects = [item.get("subject") if isinstance(item, dict) else item for item in as_list(attributes.get("subjects"))]
    rights = [item.get("rights") if isinstance(item, dict) else item for item in as_list(attributes.get("rightsList"))]
    return {
        "title": title,
        "authors": creators,
        "year": year_from_date(publication_date),
        "publication_date": str(publication_date) if publication_date else None,
        "description": next((item for item in descriptions if item), None),
        "version": attributes.get("version"),
        "doi": doi,
        "doi_url": doi_url(doi),
        "repository": attributes.get("publisher"),
        "resource_url": attributes.get("url"),
        "license": next((item for item in rights if item), None),
        "keywords": [item for item in subjects if item],
        "related_identifiers": as_list(attributes.get("relatedIdentifiers")),
        "external_type": types.get("resourceTypeGeneral") or types.get("bibtex") or types.get("citeproc"),
    }


def normalize_crossref(message: dict[str, Any], doi: str) -> dict[str, Any]:
    date_parts = ((message.get("published-print") or message.get("published-online") or message.get("issued") or {}).get("date-parts") or [[]])[0]
    year = date_parts[0] if date_parts else None
    authors = [author_from_person(author) for author in as_list(message.get("author")) if isinstance(author, dict)]
    licenses = [item.get("URL") for item in as_list(message.get("license")) if isinstance(item, dict) and item.get("URL")]
    return {
        "title": (as_list(message.get("title")) or [None])[0],
        "authors": authors,
        "year": year,
        "publication_date": "-".join(str(part) for part in date_parts) if date_parts else None,
        "version": None,
        "doi": doi,
        "doi_url": doi_url(doi),
        "repository": message.get("publisher") or (as_list(message.get("container-title")) or [None])[0],
        "resource_url": message.get("URL"),
        "license": licenses[0] if licenses else None,
        "keywords": as_list(message.get("subject")),
        "related_identifiers": as_list(message.get("relation")),
        "external_type": message.get("type"),
    }


def normalize_csl(metadata: dict[str, Any], doi: str) -> dict[str, Any]:
    issued = metadata.get("issued", {}).get("date-parts", [[]])[0] if isinstance(metadata.get("issued"), dict) else []
    authors = [author_from_person(author) for author in as_list(metadata.get("author")) if isinstance(author, dict)]
    return {
        "title": metadata.get("title"),
        "authors": authors,
        "year": issued[0] if issued else year_from_date(metadata.get("issued")),
        "publication_date": "-".join(str(part) for part in issued) if issued else None,
        "doi": doi,
        "doi_url": doi_url(doi),
        "repository": metadata.get("publisher") or metadata.get("container-title"),
        "resource_url": metadata.get("URL"),
        "external_type": metadata.get("type"),
    }


def normalize_zenodo(record: dict[str, Any], doi: str) -> dict[str, Any]:
    metadata = record.get("metadata", {})
    authors = [author_from_person(creator) for creator in as_list(metadata.get("creators")) if isinstance(creator, dict)]
    resource_type = metadata.get("resource_type", {})
    description = plain_text(metadata.get("description"))
    files = []
    for item in as_list(record.get("files")):
        if isinstance(item, dict):
            links = item.get("links") or {}
            files.append({
                "name": item.get("key") or item.get("name"),
                "size": item.get("size"),
                "checksum": item.get("checksum"),
                "url": links.get("content") or item.get("url"),
            })
    related = as_list(metadata.get("related_identifiers"))
    concept_doi = metadata.get("conceptdoi") or metadata.get("concept_doi")
    if concept_doi:
        related.append({"identifier": concept_doi, "relation": "IsVersionOf"})
    links = record.get("links") or {}
    return {
        "title": metadata.get("title"),
        "authors": authors,
        "year": year_from_date(metadata.get("publication_date") or record.get("created")),
        "publication_date": metadata.get("publication_date"),
        "description": description,
        "version": metadata.get("version"),
        "doi": metadata.get("doi") or doi,
        "doi_url": doi_url(metadata.get("doi") or doi),
        "repository": "Zenodo",
        "resource_url": links.get("self_html") or links.get("record_html") or f"https://zenodo.org/records/{record.get('id')}",
        "landing_page_url": links.get("self_html") or links.get("record_html"),
        "license": (metadata.get("license") or {}).get("id") if isinstance(metadata.get("license"), dict) else metadata.get("license"),
        "keywords": as_list(metadata.get("keywords")),
        "related_identifiers": related,
        "files": files,
        "external_type": resource_type.get("type") if isinstance(resource_type, dict) else resource_type,
        "provider": "Zenodo",
        "provider_record_id": str(record.get("id")) if record.get("id") else None,
    }


def merge_metadata(*records: dict[str, Any] | None) -> dict[str, Any]:
    """Earlier records have higher precedence; lists use the first non-empty value."""
    merged: dict[str, Any] = {}
    for record in reversed([record for record in records if record]):
        for key, value in record.items():
            if value not in (None, "", [], {}):
                merged[key] = value
    return merged


def import_doi(doi: str) -> tuple[dict[str, Any], list[str], list[str]]:
    """Return normalized metadata, provenance labels, and non-fatal enrichment warnings."""
    resolved_url = resolve_doi(doi)
    sources: list[str] = ["doi.org"] if resolved_url else []
    warnings: list[str] = []
    datacite = datacite_metadata(doi)
    crossref = None if datacite else crossref_metadata(doi)
    csl = csl_metadata(doi)
    zenodo = zenodo_metadata(doi, resolved_url)
    if datacite:
        sources.append("DataCite")
    if crossref:
        sources.append("Crossref")
    if csl:
        sources.append("CSL-JSON")
    if zenodo:
        sources.append("Zenodo")
    if not any((datacite, crossref, csl, zenodo)):
        warnings.append("No structured metadata endpoint responded; complete the review fields manually.")
    generic = normalize_datacite(datacite, doi) if datacite else normalize_crossref(crossref, doi) if crossref else normalize_csl(csl, doi) if csl else {}
    enriched = normalize_zenodo(zenodo, doi) if zenodo else {}
    record = merge_metadata(enriched, generic)
    record.update({
        "id": stable_id_for_doi(doi),
        "doi": doi,
        "doi_url": doi_url(doi),
        "website_category": category_for_external_type(record.get("external_type")),
        "public": False,
        "featured": False,
        "metadata_sources": sources or ["doi.org"],
        "imported_at": utc_now(),
    })
    if resolved_url and not record.get("landing_page_url"):
        record["landing_page_url"] = resolved_url
    return record, sources, warnings
