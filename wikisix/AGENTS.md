# AGENTS.md — Six Degrees of Wikipedia

## Project

Build a small web application called **Six Degrees of Wikipedia**.

The user enters two Wikipedia topics/articles. The application finds and visualizes a short hyperlink path connecting the first article to the second through Wikipedia article links.

Example:

```text
Mass spectrometry
→ Chemistry
→ France
→ French Revolution
→ Napoleon
```

The project should be fun, technically interesting, visually clean, and small enough to remain understandable.

The first version must run entirely in the browser and be deployable on **GitHub Pages**.

---

## Primary Goal

Create a working client-side application that:

1. Accepts a starting Wikipedia article.
2. Accepts a target Wikipedia article.
3. Resolves user-entered terms to real Wikipedia pages.
4. Searches Wikipedia's hyperlink graph for a connection.
5. Displays the resulting path clearly.
6. Allows the user to inspect or open each intermediate Wikipedia article.
7. Runs without a backend, database, API key, Node server, or server-side code.

---

## Technical Constraints

Use:

- HTML
- CSS
- modern vanilla JavaScript
- Wikipedia / MediaWiki public APIs
- GitHub Pages

Prefer no framework and no build step.

Do not introduce React, Vue, Svelte, Node, npm, Supabase, Firebase, or a custom backend unless a later requirement clearly justifies it.

The application should be deployable by pushing static files to GitHub.

Suggested structure:

```text
/
├── index.html
├── css/
│   └── style.css
├── js/
│   ├── app.js
│   ├── wikipedia.js
│   ├── search.js
│   ├── cache.js
│   └── graph.js
├── tests/
│   └── search-tests.html
├── README.md
└── AGENTS.md
```

Keep responsibilities separated.

---

# Core UI

The initial interface should be immediately understandable:

```text
SIX DEGREES OF WIKIPEDIA

FROM
[ Mass spectrometry                  ]

TO
[ Napoleon Bonaparte                ]

[ FIND THE CONNECTION ]
```

Provide autocomplete/search suggestions from Wikipedia while the user types.

The user should preferably select actual Wikipedia pages before starting the graph search.

Include a **Random Challenge** option later if easy, but do not prioritize it over the core search.

---

# Wikipedia API

Use the English Wikipedia initially.

Base API:

```text
https://en.wikipedia.org/w/api.php
```

Use MediaWiki API endpoints with:

```text
origin=*
format=json
```

to support browser requests.

Do not scrape Wikipedia HTML when a MediaWiki API endpoint provides the needed data.

---

## Page resolution

User input may be:

```text
Napoleon
Napoleon Bonaparte
mass spec
MS
```

Do not assume the entered text is the canonical page title.

Use Wikipedia search APIs to resolve text to likely articles.

The UI should show several suggestions.

For example:

```text
Napoleon
--------------------------------
Napoleon
Napoleon Bonaparte
Napoleon III
Napoleonic Wars
```

After the user selects one, store:

```text
pageid
canonical title
URL
```

Prefer page IDs internally where practical.

Handle redirects correctly.

---

# Retrieving outgoing article links

Create a reusable function conceptually like:

```javascript
getOutgoingLinks(pageId)
```

It should return links from the article to other main-namespace Wikipedia articles.

Use the MediaWiki `prop=links` API or another appropriate official MediaWiki endpoint.

Important:

- handle API continuation;
- exclude non-article namespaces;
- exclude obvious administrative/help/template/category pages;
- remove duplicate targets;
- normalize redirects where practical.

The function should return structured objects, not raw API data.

Example:

```javascript
[
  {
    pageid: 123,
    title: "Chemistry"
  },
  {
    pageid: 456,
    title: "Protein"
  }
]
```

---

# Search Problem

Wikipedia is a very large directed graph:

```text
article = node
hyperlink = directed edge
```

The objective is to find a reasonably short path:

```text
source → ... → target
```

A naive unrestricted breadth-first search can explode rapidly.

Do not simply recursively fetch every link without limits.

---

# Search Strategy

Implement the first reliable search algorithm in stages.

## Stage 1

Implement bounded breadth-first search with:

- visited set;
- queue;
- configurable maximum depth;
- configurable per-page link limit;
- request throttling/concurrency control;
- caching.

Default maximum depth can initially be around 4–6.

The search must terminate cleanly when limits are reached.

---

## Stage 2

If practical, improve toward **bidirectional search**.

Because Wikipedia links are directed, bidirectional traversal is not trivial if only outgoing links are known.

MediaWiki can also retrieve pages that link to a target article through backlinks.

Conceptually:

```text
forward frontier:
source → outgoing links

reverse frontier:
target ← backlinks
```

Search until the two explored sets intersect.

This is strongly preferred if it produces a substantial performance improvement.

Keep the implementation understandable.

Do not build an unnecessarily sophisticated search engine before the basic version works.

---

# Search Limits

Define explicit configurable limits in one place.

For example:

```javascript
const SEARCH_CONFIG = {
    maxDepth: 5,
    maxLinksPerPage: 200,
    maxConcurrentRequests: 6,
    maxVisitedPages: 10000
};
```

Exact defaults may be adjusted based on testing.

The application must never appear to hang indefinitely.

If limits are exceeded, return an explicit result such as:

```text
No connection found within the current search limits.
```

Do not claim no Wikipedia path exists.

---

# Link Prioritization

For v1, correctness and termination matter more than perfect shortest-path guarantees under aggressive pruning.

If limiting links per article, avoid blindly taking the first N links if possible.

Useful heuristics may include:

- prefer main article links;
- avoid date/year pages where possible;
- avoid list pages where possible;
- avoid disambiguation pages;
- avoid repetitive navigation links;
- prioritize links with meaningful article titles;
- optionally use title similarity to the target as a weak heuristic.

However:

Do not turn the first version into an AI/embedding project.

No external LLM or embedding API is required.

---

# Caching

Implement in-memory caching for Wikipedia requests.

Conceptually:

```javascript
pageCache
outgoingLinksCache
backlinksCache
searchResolutionCache
```

Do not request the same article's links repeatedly during one search.

Optionally use `localStorage` or IndexedDB for persistent caching later, but memory caching is sufficient for v1.

Caching behavior should be isolated in `cache.js`.

---

# Concurrency

Wikipedia API calls should not be fired without control.

Implement a small concurrency limiter.

For example:

```text
maximum 4–8 simultaneous requests
```

The exact value can be adjusted.

Avoid hammering Wikipedia.

Respect API failures and retry conservatively.

Do not create infinite retry loops.

---

# Errors

Handle at least:

- network failure;
- Wikipedia API error;
- page not found;
- ambiguous search term;
- redirect;
- API continuation;
- search limit reached;
- no path found within current limits.

User-facing errors should be clear and concise.

Example:

```text
Search stopped after exploring 5,000 articles.
Try increasing the search depth or choosing a more specific page.
```

Do not expose raw stack traces in the UI.

---

# Search Progress

While searching, provide visible progress.

Useful information:

```text
Searching...
Depth: 3
Articles explored: 1,284
Current frontier: 412
```

Do not fake progress percentages because the total search space is unknown.

Provide a **Cancel** button.

The search logic should support cancellation, preferably with `AbortController` or an equivalent explicit cancellation mechanism.

---

# Results

When a path is found, prominently show:

```text
FOUND IN 4 DEGREES
```

Then render the path:

```text
Mass spectrometry
        ↓
Chemistry
        ↓
France
        ↓
French Revolution
        ↓
Napoleon
```

Clarify the degree definition consistently.

If there are five article nodes and four hyperlinks, report:

```text
4 degrees
```

---

# Result Nodes

Each node should display:

- Wikipedia title;
- optional thumbnail;
- optional short description;
- external link to Wikipedia.

Clicking an article should open Wikipedia in a new tab.

Use Wikipedia API metadata rather than scraping.

Do not make thumbnails mandatory for the initial working version.

---

# Graph Visualization

The result should have a visually interesting representation.

Start with a simple path visualization.

Later, if practical, add a graph view showing explored branches near the successful path.

Do not render thousands of explored nodes into the DOM.

Only visualize:

- the successful path;
- optionally a small neighborhood around it.

Avoid adding a heavy visualization dependency unless necessary.

SVG is preferred for a simple custom path/graph.

---

# Search History

Optionally store recent successful searches using `localStorage`.

Example:

```text
Mass spectrometry → Napoleon
4 degrees

Proteomics → Black hole
5 degrees
```

This is secondary.

Do not implement accounts or cloud storage.

---

# Random Challenge

After the core functionality works, optionally add:

```text
[ RANDOM CHALLENGE ]
```

The app selects two reasonably well-known Wikipedia pages and asks the user to connect them.

Possible later game mode:

1. user predicts the number of degrees;
2. app computes the connection;
3. compare prediction with result.

Do not prioritize this over reliable graph search.

---

# Design

The app should look more like an experimental web toy than a SaaS dashboard.

Desired characteristics:

- strong typography;
- generous whitespace;
- minimal controls;
- clear search state;
- visually satisfying path result;
- good dark mode;
- responsive layout.

Avoid:

- excessive cards;
- gradients everywhere;
- glassmorphism;
- fake AI aesthetics;
- excessive animation;
- dashboard clutter.

The graph/path itself should be the visual focus.

---

# Responsive Behavior

Test at least:

```text
375 px
768 px
desktop
```

The input form and path must remain usable on phones.

Long Wikipedia titles must wrap correctly.

---

# Accessibility

Implement:

- semantic HTML;
- labels for inputs;
- keyboard navigation;
- visible focus states;
- sufficient contrast;
- accessible buttons;
- reduced-motion support;
- useful ARIA status for search progress where appropriate.

---

# Search Implementation Quality

Keep search logic independent from the DOM.

Prefer functions/classes conceptually like:

```javascript
resolveArticle(query)

getOutgoingLinks(pageId)

getBacklinks(pageId)

findPath(source, target, options)

reconstructPath(parentMap, endpoint)
```

Do not bury graph traversal inside click handlers.

The search engine should be testable independently.

---

# Determinism

Given the same:

- source;
- target;
- search configuration;
- Wikipedia graph state;

the search should behave predictably.

Avoid unnecessary randomness in path selection.

Random Challenge may of course use randomness.

---

# Development Order

Implement in this order:

```text
1. Basic static page.
2. Wikipedia article autocomplete/resolution.
3. Fetch outgoing links for a selected article.
4. Basic bounded BFS.
5. Path reconstruction.
6. Result rendering.
7. Search progress.
8. Cancellation.
9. API caching.
10. Concurrency limiting.
11. Better filtering/pruning.
12. Backlink retrieval.
13. Bidirectional search if worthwhile.
14. Improved graph visualization.
15. Search history.
16. Random Challenge.
```

Do not work on later features while the basic path search is unreliable.

---

# Tests

Create lightweight tests for the graph-search logic.

Do not make tests depend entirely on the live Wikipedia API.

Use small mock graphs such as:

```text
A → B
A → C
B → D
C → E
D → F
E → F
```

Verify:

```text
A → F
```

returns a valid short path.

Also test:

```text
source = target
```

Expected result:

```text
[source]
0 degrees
```

Test:

- cycles;
- unreachable nodes;
- max depth;
- visited-node handling;
- cancellation;
- duplicate links;
- path reconstruction.

Where practical, include a small manual integration test against the live Wikipedia API.

---

# GitHub Pages

The final application must work when hosted under a repository path such as:

```text
https://USERNAME.github.io/six-degrees/
```

Do not assume deployment at `/`.

Use relative asset paths.

Avoid routing that requires server rewrite rules.

A single `index.html` is sufficient.

Document GitHub Pages deployment in `README.md`.

---

# README

Document:

1. what the app does;
2. architecture;
3. Wikipedia APIs used;
4. graph-search approach;
5. search limits;
6. local development;
7. GitHub Pages deployment;
8. known limitations;
9. how to change search parameters;
10. likely future improvements.

---

# Important Limitations to State Honestly

The first version may not always find the globally shortest Wikipedia path because practical request and search limits may require pruning.

If that is the case, the UI and README must not falsely claim guaranteed shortest-path results.

Prefer wording such as:

```text
Found a connection in 4 degrees.
```

rather than:

```text
The shortest possible path is 4 degrees.
```

unless the implemented algorithm actually guarantees that result under the full explored graph.

---

# Avoid

Do not:

- scrape Wikipedia pages unnecessarily;
- download the whole Wikipedia graph;
- introduce an LLM;
- require an API key;
- require user accounts;
- add a backend for v1;
- perform unlimited BFS;
- make hundreds of uncontrolled parallel requests;
- render the entire explored graph;
- overengineer the architecture;
- claim a globally shortest path unless guaranteed.

---

# Definition of Done

Version 1 is complete when:

1. It can be deployed directly to GitHub Pages.
2. A user can search/select two Wikipedia articles.
3. The application resolves them to real Wikipedia pages.
4. The application searches Wikipedia links in the browser.
5. Search activity is visibly reported.
6. Search can be cancelled.
7. The app respects explicit search limits.
8. A successful path is reconstructed correctly.
9. The result shows the sequence of Wikipedia articles.
10. Each result node links to Wikipedia.
11. The number of degrees is reported correctly.
12. Failure states are handled clearly.
13. The graph-search logic is separated from the interface.
14. Basic tests pass.
15. The app works on both desktop and mobile.
16. No backend, database, API key, or server-side runtime is required.

The priority is:

```text
working graph search
→ understandable implementation
→ good result visualization
→ optional fun features
```

Do not sacrifice the first two for the last two.
