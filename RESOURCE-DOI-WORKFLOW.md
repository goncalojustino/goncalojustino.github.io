# DOI resource import and review

The public [Resources](Resources.html) page is a catalogue of reusable academic outputs, not a second publications list. Each published resource is a separate JSON file in `data/resources/`; `data/resources/index.json` is the static manifest read by GitHub Pages.

## Import and review

1. In this repository’s **Issues** tab, choose **Import Resource by DOI** and submit a DOI in any usual form (`10...`, `doi:10...`, or a `doi.org` link).
2. The **Import Resource DOI** workflow normalizes it, retrieves DOI metadata, then enriches Zenodo records when applicable. It replaces the initial form with a review issue and applies `resource-review`.
3. Edit the clearly marked JSON review block. `website_category`, `public`, and `featured` are editorial choices. Blank override fields retain imported values.
4. To approve publication, add the `publish-resource` label. This is the only publication trigger.
5. The **Publish Reviewed Resource** workflow validates the review, prevents duplicate DOI/provider records, creates one file in `data/resources/`, updates `data/resources/index.json`, commits the change, comments on the issue, adds `resource-published`, and closes the issue.

No resource appears on the website simply because it was imported. The public page only renders records where `public` is `true`.

## Metadata and providers

The importer uses DOI resolution, DataCite where available, Crossref as a fallback, and CSL-JSON. Zenodo records receive extra enrichment for creators, version, files, record links, resource type, keywords, related identifiers, and licenses. Metadata precedence is Zenodo/provider data, then DataCite/Crossref, then generic DOI data. The issue keeps the imported JSON block as provenance and the separately editable review block as the authoritative override.

Unknown providers still create a reviewable issue from generic DOI metadata. Missing fields are listed rather than invented.

## Labels

- `resource-import` — submitted DOI awaiting import.
- `resource-review` — imported metadata ready for editorial review.
- `publish-resource` — explicit approval gate; adding it starts publication.
- `resource-published` — successfully committed to the catalogue.
- `resource-import-error` — the DOI could not be imported; nothing was created.

The import workflow creates these labels if needed. GitHub Actions must be permitted to create and approve commits with the repository `GITHUB_TOKEN`; the workflow uses only `contents` and `issues` permissions.

## Adding providers and troubleshooting

Provider retrieval lives in `scripts/resources/providers.py`, with shared parsing and validation helpers alongside it. Add a small adapter/normalizer there rather than coupling provider assumptions to the browser code. Run the local checks with:

```sh
python3 -m unittest discover -s scripts/resources/tests -v
```

If an import fails, verify the DOI resolves publicly and retry with a new issue. If publication validation fails, correct the review JSON, remove and re-add `publish-resource`, and no resource file will have been written until the validation passes. A DOI already present in `data/resources/` is reported with its existing path and cannot be published twice.
