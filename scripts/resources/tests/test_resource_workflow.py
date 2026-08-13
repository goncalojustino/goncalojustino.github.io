"""Focused tests for the non-GitHub DOI resource workflow logic."""

from __future__ import annotations

import json
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from catalogue import find_duplicate
from issue_review import (IMPORTED_END, IMPORTED_START, REVIEW_END, REVIEW_START, extract_doi, parse_review)
from providers import merge_metadata
from resource_utils import canonical_category, normalize_doi, write_json


class ResourceWorkflowTests(unittest.TestCase):
    def test_normalizes_common_doi_forms(self) -> None:
        expected = "10.5281/zenodo.1234567"
        for value in (expected, f"doi:{expected}", f"https://doi.org/{expected}", f"http://dx.doi.org/{expected}"):
            self.assertEqual(normalize_doi(value), expected)

    def test_external_type_aliases_are_controlled(self) -> None:
        self.assertEqual(canonical_category("dataset"), "datasets")
        self.assertEqual(canonical_category("books-monographs"), "books-monographs")
        self.assertEqual(canonical_category("unexpected provider label"), "other")

    def test_higher_precedence_metadata_wins(self) -> None:
        merged = merge_metadata({"title": "Repository title", "keywords": ["repository"]}, {"title": "Generic title", "year": 2026})
        self.assertEqual(merged["title"], "Repository title")
        self.assertEqual(merged["year"], 2026)

    def test_review_json_is_parsed_without_touching_imported_content(self) -> None:
        body = f"{IMPORTED_START}\n```json\n{{\"doi\": \"10.1/example\"}}\n```\n{IMPORTED_END}\n{REVIEW_START}\n```json\n{{\"public\": true}}\n```\n{REVIEW_END}"
        self.assertTrue(parse_review(body)["public"])

    def test_extracts_doi_from_issue_form(self) -> None:
        self.assertEqual(extract_doi("### DOI\n\nhttps://doi.org/10.5281/zenodo.1234567"), "10.5281/zenodo.1234567")

    def test_duplicate_doi_is_found(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            directory = Path(temporary)
            path = directory / "existing.json"
            write_json(path, {"id": "existing", "doi": "10.5281/zenodo.1234567"})
            self.assertEqual(find_duplicate(directory, "10.5281/zenodo.1234567", None, None), path)
            self.assertIsNone(find_duplicate(directory, "10.5281/zenodo.7654321", None, None))


if __name__ == "__main__":
    unittest.main()
