# Local CV prototype

Open `cv/index.html` directly in a browser. It is intentionally not linked from the rest of the website.

## Updating content

All editable CV content is in `cv/data/cv-data.js`. Each main page area has a matching `sections` entry and each collapsible group contains an `entries` list.

`cv/data/orcid-journal-articles.js` is a generated, deduplicated local copy of the ORCID records classified as `journal-article`. It is loaded as a script so the page works when opened directly from `file://`; regenerate it from `data/orcid-works.json` when the ORCID source is refreshed.

To add a record, copy an existing object in the appropriate `entries` list, change its fields, and retain the separating comma between objects. The common fields are:

```js
{
  date: "2026",
  title: "Record title",
  meta: "Role · institution or venue",
  description: "Optional plain-language context.",
  url: "https://optional-link.example",
  linkLabel: "Open record",
  tags: ["optional", "keywords"],
  items: ["Optional supporting detail", "Another detail"]
}
```

Leave out a field when it does not apply. The page will omit it automatically. Do not use HTML inside text fields.

The source CV PDF is not copied, displayed, or linked by this prototype.
