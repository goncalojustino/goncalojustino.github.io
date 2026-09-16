# AGENTS.md — DOI-First Resource Import and Review Workflow

## Project Context

This repository hosts my academic/personal website on GitHub Pages.

The website already contains conventional publication content, but I now want a separate **Resources** catalogue for outputs such as:

- software;
- datasets;
- databases;
- monographs;
- textbooks;
- teaching materials;
- protocols;
- code;
- supplementary research resources;
- other reusable academic/scientific outputs.

The actual files/resources will normally be hosted elsewhere, for example:

- Zenodo;
- Figshare;
- Dryad;
- Mendeley Data / Elsevier Data;
- institutional repositories;
- GitHub;
- publisher platforms;
- DOI landing pages;
- other DOI-registering repositories.

The website should not host the files themselves unless explicitly desired later.

The website should maintain a curated, normalized metadata record for each resource and link users to the authoritative external location.

## Primary Objective

Implement a **DOI-first resource ingestion workflow using GitHub Issues and GitHub Actions**.

I want to be able to submit a DOI, have GitHub automatically retrieve and normalize as much metadata as possible, and then present that resource to me as an individual GitHub Issue for review.

I must be able to:

1. inspect the imported metadata;
2. fill missing fields manually;
3. override incorrect or undesirable imported fields;
4. assign my own website category;
5. decide whether the resource should be public;
6. decide whether it should be featured;
7. optionally add a custom short description;
8. approve publication explicitly.

The resource must **not** be added to the public website until I explicitly approve it.

The system should support one resource per review issue.

## Core Workflow

```text
DOI
 ↓
GitHub Issue: "Import Resource by DOI"
 ↓
GitHub Action
 ↓
resolve DOI
 ↓
retrieve generic DOI metadata
 ↓
detect provider/repository where possible
 ↓
query repository-specific API when supported
 ↓
normalize metadata
 ↓
create/update review issue containing imported fields
 ↓
I review/edit/complete the issue
 ↓
I add label: publish-resource
 ↓
GitHub Action validates reviewed metadata
 ↓
write normalized resource file
 ↓
commit to repository
 ↓
GitHub Pages updates
 ↓
comment success on issue
 ↓
close issue
```

No resource should be published merely because an import issue was opened.

## General Design Principles

Use GitHub itself as the editorial workflow.

Prefer:

- GitHub Issue Forms;
- GitHub Actions;
- repository files for the final curated resource records;
- deterministic normalization;
- explicit approval;
- visible provenance;
- auditable Git history.

Avoid:

- hidden databases;
- automatic publication without review;
- requiring Supabase/Firebase;
- requiring a custom server;
- requiring secrets when public APIs are sufficient;
- hard-coding repository-specific assumptions into the frontend.

The website should remain compatible with GitHub Pages.

## Resource Storage

Do not use one giant manually edited JSON file if avoidable.

Prefer one structured file per resource:

```text
data/resources/
    2026-example-software.json
    2026-example-dataset.json
    2025-example-monograph.json
```

or YAML if the existing repository architecture makes YAML substantially more natural.

JSON is preferred unless there is a strong reason otherwise.

Each file represents one curated resource.

The filename must be:

- stable;
- human-readable where practical;
- collision-safe;
- independent of superficial title punctuation changes.

A DOI-derived slug or stable internal ID may be used.

## Normalized Resource Schema

Each resource should support at least:

```json
{
  "id": "stable-resource-id",
  "title": "Resource title",
  "type": "dataset",
  "website_category": "datasets",
  "authors": [
    {
      "name": "Gonçalo C. Justino",
      "orcid": "0000-0000-0000-0000"
    }
  ],
  "year": 2026,
  "publication_date": "2026-08-13",
  "description": "Short description.",
  "version": "1.0",
  "doi": "10.xxxx/xxxxx",
  "doi_url": "https://doi.org/10.xxxx/xxxxx",
  "repository": "Zenodo",
  "resource_url": "https://...",
  "landing_page_url": "https://...",
  "github_url": "https://github.com/...",
  "license": "CC BY 4.0",
  "citation": "Optional preferred citation",
  "keywords": [
    "proteomics",
    "software"
  ],
  "related_identifiers": [],
  "files": [],
  "featured": false,
  "public": true,
  "custom_note": null,
  "metadata_sources": [
    "doi.org",
    "DataCite",
    "Zenodo"
  ],
  "imported_at": "2026-08-13T18:00:00Z",
  "reviewed_at": null
}
```

Fields may be omitted or set to `null` when genuinely unavailable.

Do not render empty fields on the public website.

## Website Categories

The imported repository resource type and the website category are not necessarily identical.

Use a controlled website category field.

Initial values:

```text
software
datasets
databases
books-monographs
teaching
protocols
code
other
```

Display labels may be:

```text
Software
Datasets
Databases
Books & Monographs
Teaching Materials
Protocols
Code
Other
```

I must be able to override the automatically suggested category during review.

## DOI Input Issue Form

Create a GitHub Issue Form under:

```text
.github/ISSUE_TEMPLATE/
```

for importing a resource.

Suggested file:

```text
import-resource.yml
```

Suggested visible title:

```text
Import Resource by DOI
```

The issue form should collect at minimum:

```text
DOI
```

Optional initial fields:

```text
Suggested website category
Featured?
Public?
Optional note
```

But keep the initial submission lightweight.

The normal workflow should be:

```text
paste DOI
→ submit
→ let automation retrieve metadata
→ review imported result
```

## DOI Normalization

The import workflow must accept variants such as:

```text
10.5281/zenodo.1234567
https://doi.org/10.5281/zenodo.1234567
http://dx.doi.org/10.5281/zenodo.1234567
doi:10.5281/zenodo.1234567
```

Normalize these to:

```text
10.5281/zenodo.1234567
```

Validate DOI syntax reasonably.

Do not reject uncommon but valid DOI suffix characters unnecessarily.

Store both:

```text
doi
doi_url
```

where:

```text
doi_url = https://doi.org/<doi>
```

## Generic Metadata Retrieval

The workflow should not assume the DOI is from Zenodo.

Use a generic DOI-first strategy.

Preferred order:

```text
DOI
 ↓
doi.org content negotiation
 ↓
CSL-JSON or another standardized machine-readable representation
```

Where appropriate, also query:

```text
DataCite API
Crossref API
```

depending on which registration agency/provider supplies the DOI metadata.

The importer should retrieve as much as available from standardized DOI metadata before applying provider-specific logic.

## Provider Detection

After generic DOI resolution, attempt to identify the hosting repository/provider.

Examples:

```text
Zenodo
Figshare
Dryad
Mendeley Data
DataCite-hosted repository
Crossref-registered publisher
GitHub-associated record
institutional repository
unknown
```

Detection may use:

- DOI prefix/metadata;
- resolver URL;
- publisher/container fields;
- resource URLs;
- provider metadata.

Do not rely solely on DOI prefix if better metadata is available.

## Repository-Specific Enrichment

After generic metadata retrieval, enrich the record using a provider-specific public API when practical.

Implement providers as modular adapters.

Suggested abstraction:

```text
supports(metadata, resolvedUrl)
fetchEnrichment(doi, metadata)
normalizeEnrichment(raw)
```

Do not bury all provider logic inside one giant conditional script.

## Zenodo Adapter

For Zenodo records, use the Zenodo API to retrieve richer metadata where available.

Capture useful fields such as:

```text
title
creators
ORCID
publication date
resource type
description
version
license
keywords
DOI
concept DOI where relevant
related identifiers
files
record URL
```

For versioned resources, preserve:

```text
version DOI
concept DOI
```

when both are available.

Do not automatically collapse versions unless explicitly designed later.

## DataCite Metadata

For DataCite DOIs, retrieve relevant metadata including where available:

```text
titles
creators
publisher
publicationYear
types
subjects
descriptions
rights
dates
relatedIdentifiers
sizes
formats
version
URL
```

Normalize DataCite-specific structures into the site's resource schema.

## Crossref Metadata

For Crossref DOIs, retrieve relevant metadata including where available:

```text
title
authors
publisher
published date
type
URL
ISBN
container title
relation
license
```

Crossref resources may include books/monographs as well as conventional articles.

Do not assume every Crossref DOI belongs in the Resources catalogue.

The workflow should import the metadata for review and let me decide whether to publish it.

## Other Providers

If a DOI resolves successfully but no provider-specific adapter exists:

```text
generic DOI metadata
→ review issue
```

This is acceptable.

Do not fail simply because a repository is unknown.

The import pipeline should degrade gracefully.

## Metadata Precedence

When multiple sources provide the same field, use a defined precedence strategy.

Example:

```text
provider-specific repository metadata
>
DataCite/Crossref structured metadata
>
generic DOI content negotiation
```

However, preserve source provenance.

For example:

```json
"metadata_sources": [
  "doi.org",
  "DataCite",
  "Zenodo"
]
```

Do not silently discard provenance.

## Imported Metadata Review

After import, update the GitHub issue with a structured review section.

The issue should clearly distinguish:

1. imported metadata;
2. fields requiring review;
3. fields missing from external metadata;
4. fields I can override;
5. publication status.

Example:

```markdown
## Imported resource

### Identity

**DOI**
10.5281/zenodo.1234567

**Title**
Example dataset

**Detected repository**
Zenodo

**Detected resource type**
Dataset

### Authors

- Gonçalo C. Justino
- ...

### Dates

**Publication year**
2026

**Publication date**
2026-08-13

### Description

Imported description here.

### Repository metadata

**Version**
1.0

**License**
CC BY 4.0

**Resource URL**
https://zenodo.org/records/1234567

### Suggested website classification

**Website category**
datasets

### Fields requiring review

- [ ] Confirm title
- [ ] Confirm website category
- [ ] Confirm public/private
- [ ] Confirm featured status
- [ ] Add/confirm short website description
- [ ] Add GitHub URL if applicable
- [ ] Add preferred citation if desired

### Missing fields

- GitHub URL
- Custom short description
- Preferred citation

### Metadata provenance

- doi.org
- DataCite
- Zenodo

### Publication state

`NOT PUBLISHED`

To publish after review, add the label:

`publish-resource`
```

The exact formatting may be improved, but it must be easy to review.

## How I Edit Missing or Incorrect Fields

I want to review resources individually.

The workflow must give me a practical way to override or add fields directly in the issue.

Use a clearly delimited editable block in the issue body, for example:

```yaml
review:
  website_category: datasets
  public: true
  featured: false
  short_description: ""
  github_url: ""
  preferred_citation: ""
  title_override: ""
  year_override:
  repository_override: ""
  license_override: ""
  keywords_add: []
```

or another robust structured format.

The automation must be able to parse the reviewed values reliably.

Important:

- imported metadata remains visible;
- my overrides are separate;
- blank override fields mean "use imported value";
- explicit values replace imported values;
- review data should not be destroyed if the issue is edited.

Choose a format that GitHub Actions can parse reliably.

## Review Philosophy

The import is a **metadata prepopulation step**, not an authoritative publication step.

I retain editorial control.

I must be able to:

- accept imported values;
- override them;
- supplement them;
- decline publication entirely.

Do not automatically overwrite my manual review fields if the metadata importer is re-run.

If metadata is refreshed, imported data may be updated, but reviewed overrides must remain intact unless I explicitly reset them.

## Labels

Use labels to represent workflow state.

Suggested labels:

```text
resource-import
resource-review
publish-resource
resource-published
resource-import-error
```

Workflow:

```text
new import issue
→ resource-import

metadata fetched
→ resource-review

I add
→ publish-resource

successful publication
→ resource-published
→ close issue
```

If import fails:

```text
resource-import-error
```

and leave the issue open.

## Explicit Publication Approval

Publication must only occur when I manually add:

```text
publish-resource
```

Do not publish based on:

- issue creation;
- checkbox completion;
- metadata completeness alone;
- comments;
- automatic timers.

The label is the explicit approval gate.

## Publication Validation

When `publish-resource` is added, validate the final normalized record.

Required fields should include at least:

```text
title
website_category
doi OR resource_url
year where available/meaningful
public
```

Do not require fields that are inherently optional.

If validation fails:

1. do not commit;
2. comment with the exact missing/invalid fields;
3. keep the issue open.

## Duplicate Detection

Before import and before publication, check for duplicates.

At minimum compare:

```text
normalized DOI
```

Also consider:

```text
concept DOI
resource URL
stable provider record ID
```

If the DOI already exists in:

```text
data/resources/
```

do not silently create a second resource.

Instead comment with the existing resource path.

## Final Merge Rules

When publishing, construct the final resource record from:

```text
normalized imported metadata
+
manual review overrides
+
site defaults
```

Rule:

```text
manual reviewed override
>
imported metadata
>
default/null
```

Do not mutate unrelated existing resource records.

## Commit Behavior

On successful publication:

1. write/update exactly the intended resource file;
2. run validation/tests;
3. commit to the repository;
4. use a clear commit message.

Example:

```text
Add resource: Example dataset
```

Prefer commits made through `GITHUB_TOKEN`.

Do not require a personal access token unless repository policy makes it unavoidable.

Use least-privilege GitHub Actions permissions.

## GitHub Actions Permissions

Configure workflow permissions explicitly.

The publication workflow will likely require:

```yaml
permissions:
  contents: write
  issues: write
```

Import-only metadata retrieval may need only:

```yaml
permissions:
  contents: read
  issues: write
```

Use no broader permissions than necessary.

## Workflow Separation

Prefer separate workflows or logically separated jobs for:

### Import

Triggered by issue creation for the `Import Resource by DOI` issue form.

Responsibilities:

```text
parse DOI
fetch metadata
normalize
detect/enrich provider
update issue
assign review label
```

### Publish

Triggered by issue labeling where:

```text
label == publish-resource
```

Responsibilities:

```text
parse imported metadata
parse manual overrides
validate
deduplicate
write resource file
commit
comment
close
```

This separation makes the approval boundary explicit.

## Re-Import / Refresh

Optionally support a later metadata refresh workflow.

If metadata is refreshed:

- update imported metadata;
- preserve manual review overrides;
- preserve publication state unless explicitly republishing;
- show what changed if practical.

This is optional for v1.

## Manual Non-DOI Resources

Not every resource will have a DOI.

Design the schema so future manual resources are possible.

Possible later issue form:

```text
Add Resource Manually
```

Do not block the architecture around DOI being mandatory forever.

For the DOI-import workflow, however, DOI is required.

## Website Integration

Create or update the Resources page so it reads the curated files in:

```text
data/resources/
```

The page should support:

```text
All
Software
Datasets
Databases
Books & Monographs
Teaching Materials
Protocols
Code
Other
```

and free-text search.

Render only:

```text
public == true
```

by default.

The website must not display editorial/import metadata that is only useful internally.

## Public Resource Card

Each public resource should be able to show:

```text
type/category
title
year
authors
short description
repository
version
license
DOI
keywords
```

and conditional actions such as:

```text
VIEW RESOURCE
DOI
GITHUB
DOWNLOAD
CITE
```

Do not show empty labels/buttons.

## DOI and Repository Links

Prefer canonical URLs.

Use:

```text
https://doi.org/<doi>
```

for DOI links.

Use provider landing-page URLs where available for:

```text
VIEW RESOURCE
```

Do not attempt to mirror external files into the repository automatically.

## Files Metadata

Repository APIs such as Zenodo may expose individual files.

Store file metadata if useful:

```json
"files": [
  {
    "name": "dataset.csv",
    "size": 123456,
    "checksum": "...",
    "url": "..."
  }
]
```

For v1, the public site does not need to expose every individual file.

A main repository/resource link is sufficient.

## Description Handling

External descriptions may contain:

- HTML;
- Markdown;
- long abstracts;
- formatting artifacts.

Normalize safely.

Do not inject arbitrary repository HTML directly into the website.

Strip/sanitize as needed.

The imported long description may be stored.

I should be able to provide a separate:

```text
short_description
```

for the public website.

Prefer `short_description` when present.

## Author Handling

Normalize creators into structured authors.

Support:

```text
name
given_name
family_name
orcid
affiliation
```

where available.

Do not require all components.

Preserve creator order.

Do not infer ORCID from name matching.

## Resource Type Mapping

External providers use different type vocabularies.

Create a normalization layer.

Examples:

```text
dataset → datasets
software → software
book → books-monographs
book-chapter → books-monographs or other
report → other
text → teaching/other depending on review
workflow → software/other
physical-object → other
```

Automatic mapping is only a suggestion.

My reviewed `website_category` is authoritative.

## Metadata Provenance

Preserve enough provenance to debug imports.

Suggested internal fields:

```json
"metadata_sources": [
  "doi.org",
  "DataCite",
  "Zenodo"
],
"provider_record_id": "1234567",
"provider": "Zenodo"
```

Do not necessarily show provenance publicly.

## Logging

GitHub Actions logs should make failures understandable.

Log:

```text
normalized DOI
metadata source queried
provider detected
provider enrichment attempted
resource type mapping
duplicate check
file written
commit result
issue update result
```

Do not log secrets.

## Error Handling

Handle at least:

- invalid DOI;
- DOI not found;
- DOI resolver failure;
- DataCite failure;
- Crossref failure;
- provider API failure;
- malformed metadata;
- duplicate DOI;
- issue parsing failure;
- invalid manual review block;
- repository write failure;
- GitHub permission failure.

If provider-specific enrichment fails but generic DOI metadata succeeded:

```text
continue with generic metadata
```

and mention the enrichment failure in the review issue.

Do not discard otherwise usable metadata.

## Retry Behavior

Use modest retries for temporary HTTP failures.

Do not retry indefinitely.

Respect rate limits.

Use appropriate user-agent identification where external APIs request/recommend it.

## Implementation Language

Either Python or Node/JavaScript is acceptable for GitHub Actions.

Choose whichever produces the cleanest maintainable implementation.

If using Python, prefer the standard library plus a very small number of justified dependencies.

If using Node, avoid a large dependency tree.

Do not introduce a framework.

## Suggested Repository Structure

Adapt to the existing site, but something like:

```text
.github/
├── ISSUE_TEMPLATE/
│   └── import-resource.yml
└── workflows/
    ├── import-resource.yml
    └── publish-resource.yml

scripts/
└── resources/
    ├── import_resource.py
    ├── normalize_doi.py
    ├── providers/
    │   ├── base.py
    │   ├── datacite.py
    │   ├── crossref.py
    │   └── zenodo.py
    ├── issue_review.py
    ├── publish_resource.py
    └── validate_resource.py

data/
└── resources/
    └── *.json

Resources.html
js/
└── resources.js
```

Exact layout may be adjusted to fit the existing repository.

## Tests

Provide tests for the non-GitHub-specific logic.

At minimum test:

- DOI normalization;
- metadata merging;
- resource type mapping;
- duplicate detection;
- review parsing;
- unknown provider fallback;
- missing optional values.

## First Acceptance Test — Zenodo

Use a real Zenodo DOI.

Expected workflow:

```text
1. Open GitHub Issues.
2. Choose "Import Resource by DOI".
3. Paste Zenodo DOI.
4. Submit.
5. Import Action runs.
6. Issue is updated with imported metadata.
7. Issue gets resource-review label.
8. Resource is NOT yet on the website.
9. I edit the review block.
10. I add publish-resource.
11. Publish Action validates it.
12. A resource JSON file is created.
13. Commit is pushed.
14. Resource appears on Resources page.
15. Issue receives success comment.
16. Issue closes with resource-published label.
```

## Second Acceptance Test — Non-Zenodo DOI

Use a DOI from another repository, ideally a DataCite-registered dataset.

Expected:

```text
generic DOI/DataCite metadata imported
provider identified if possible
provider-specific enrichment used only if supported
review workflow remains identical
publication works identically
```

The UX should not fundamentally depend on Zenodo.

## Third Acceptance Test — Missing Metadata

Use a DOI with incomplete metadata.

Expected:

```text
issue clearly lists missing fields
I can fill them manually
publish-resource validation uses my reviewed values
resource publishes successfully
```

## Fourth Acceptance Test — Override Imported Metadata

Import a DOI.

Change reviewed values such as:

```text
title_override
website_category
short_description
license_override
```

Publish.

Expected:

```text
final resource file uses reviewed overrides
original imported metadata remains visible in issue history
```

## Fifth Acceptance Test — Duplicate

Import an already-published DOI again.

Expected:

```text
workflow detects existing DOI
does not create a duplicate file
comments with existing resource path
```

Choose and document a clear consistent behavior.

## Security

Use public metadata APIs only.

Do not store:

- GitHub PATs in source;
- repository credentials;
- service-role keys;
- unrelated secrets.

Use GitHub-provided `GITHUB_TOKEN` with least privilege.

If an external API later requires authentication, use GitHub Actions Secrets.

Do not expose secrets in logs.

## GitHub Pages Constraint

The public site remains static.

All metadata import and publication automation happens through GitHub Actions.

The browser does not need to call privileged APIs.

GitHub Pages should simply read/render the curated resource data committed to the repository.

## Documentation

Update `README.md` or create dedicated documentation explaining:

1. resource architecture;
2. DOI import workflow;
3. review workflow;
4. labels;
5. metadata precedence;
6. supported providers;
7. how to add a new provider adapter;
8. how to review/edit imported fields;
9. how to publish;
10. how duplicates are handled;
11. GitHub Actions permissions required;
12. troubleshooting.

Include an example end-to-end issue.

## Do Not Over-Automate Editorial Decisions

Do not infer final website placement with certainty.

Automation may suggest `website_category`, but I choose the final value.

Do not automatically mark resources as `featured` unless explicitly supplied by me.

Do not rewrite imported titles for style unless I override them.

Do not invent missing metadata.

Use null/missing values where appropriate.

## Future Extensions

Design so these can be added later without rewriting the system:

```text
manual non-DOI resource issue form
bulk Zenodo discovery
bulk DataCite search
ORCID-based discovery
scheduled "new resources found" workflow
update metadata for existing resource
multiple versions of software
concept DOI grouping
citation export
BibTeX export
download statistics
resource thumbnails
GitHub repository metadata enrichment
```

Do not implement all of them now.

## Definition of Done

Version 1 is complete when:

1. I can create an "Import Resource by DOI" GitHub Issue.
2. The DOI is normalized and resolved.
3. Generic metadata is retrieved.
4. DataCite or Crossref metadata is used where appropriate.
5. Zenodo metadata is additionally used for Zenodo resources.
6. Unknown providers still produce a reviewable import.
7. Imported metadata is presented clearly in the issue.
8. Missing fields are explicitly identified.
9. I can edit a structured review block.
10. My manual overrides are preserved.
11. Nothing publishes before I add `publish-resource`.
12. Publication validates the reviewed record.
13. Duplicate DOIs are prevented.
14. One normalized resource file is created/updated.
15. GitHub Actions commits the change.
16. The Resources page renders the published resource.
17. Private/unpublished resources do not appear publicly.
18. The issue records the publication result and closes cleanly.
19. The workflow works for both Zenodo and at least one non-Zenodo DOI.
20. The implementation is documented and maintainable.

The intended user experience is:

```text
PASTE DOI
   ↓
AUTOMATIC METADATA IMPORT
   ↓
REVIEW ONE RESOURCE
   ↓
FILL / OVERRIDE WHAT I WANT
   ↓
ADD publish-resource
   ↓
RESOURCE APPEARS ON MY WEBSITE
```

Keep this workflow simple, explicit, reviewable, and provider-independent.
