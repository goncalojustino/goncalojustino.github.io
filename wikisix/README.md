# Six Degrees of Wikipedia

An in-browser experiment that finds a short chain of English Wikipedia hyperlinks between two articles. It is a static site: there is no server, account, API key, database, or build step.

## Use it

Open `index.html` locally through a static web server, or visit the GitHub Pages deployment. Choose a suggestion in each article field, then select **Find the connection**. The result shows article nodes; each opens the relevant Wikipedia article in a new tab.

## How it works

- `js/wikipedia.js` resolves article names and retrieves main-namespace outgoing links and backlinks through the public MediaWiki API.
- `js/graph.js` runs a bounded bidirectional search: outgoing article links are explored from the source, while backlinks are explored from the target. An intersection produces a valid directed hyperlink path.
- `js/cache.js` contains the in-memory request cache and concurrency limiter.
- `js/app.js` handles autocomplete, progress, cancellation, result rendering, a small local history, and random challenges.

The API base is `https://en.wikipedia.org/w/api.php`, with `origin=*` for browser requests. The app uses `list=search`, `generator=links`, `generator=backlinks`, and article metadata queries. It does not scrape Wikipedia HTML.

## Search limits

The default limits are declared once in `js/graph.js`:

```js
maxDepth: 5,
maxLinksPerPage: 80,
maxConcurrentRequests: 4,
maxVisitedPages: 3500,
```

They deliberately keep the browser search responsive and respectful of Wikipedia. A connection found here is not claimed to be the globally shortest possible Wikipedia path; pruning and bounded depth may omit shorter routes.

## Local development

Any static server is enough. For example, from the repository root:

```text
python3 -m http.server 8000
```

Then open `http://localhost:8000/wikisix/`. Opening `index.html` directly from the filesystem may prevent browser API requests in some browsers.

## Tests

Open `tests/search-tests.html` from a static server. The tests use a small mock graph and cover path discovery, source equals target, depth limits, cycles/unreachable graphs, and cancellation without depending on the live Wikipedia API.

## GitHub Pages

All asset paths are relative, so this folder works under a repository path. Once pushed to a GitHub Pages repository, visit:

```text
https://USERNAME.github.io/REPOSITORY/wikisix/
```

For this repository, the expected URL is `https://goncalojustino.github.io/wikisix/`.

## Known limitations and next ideas

Wikipedia is a large, changing directed graph. Results depend on current links, API availability, search limits, and the heuristic filters. Future improvements could add persistent cache controls, configurable limits, richer article metadata, and a small graph neighbourhood around a found path.
