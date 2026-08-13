(() => {
  const list = document.querySelector('#resource-list');
  const filters = document.querySelector('#resource-filters');
  const searchInput = document.querySelector('#resource-search');
  const yearSelect = document.querySelector('#resource-year');
  const summary = document.querySelector('#resource-summary');
  const params = new URLSearchParams(location.search);
  const escape = (value) => String(value ?? '').replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character]);
  const doiUrl = (doi) => doi?.startsWith('http') ? doi : `https://doi.org/${doi}`;
  const categoryAliases = { dataset: 'datasets', database: 'databases', book: 'books-monographs', protocol: 'protocols' };
  const categoryFor = (resource) => categoryAliases[resource.website_category || resource.type] || resource.website_category || resource.type || 'other';
  const authorName = (author) => typeof author === 'string' ? author : author?.name || [author?.given_name, author?.family_name].filter(Boolean).join(' ');
  let catalogue = { resources: [], resourceTypes: [] };
  let activeType = categoryAliases[params.get('type')] || params.get('type') || 'all';

  const normalizedText = (resource) => [resource.title, resource.short_description || resource.description, ...(resource.authors || []).map(authorName), ...(resource.keywords || [])].join(' ').toLowerCase();
  const typeLabel = (type) => catalogue.resourceTypes.find((entry) => entry.id === type)?.label || type;

  function updateQuery() {
    const next = new URLSearchParams(location.search);
    if (activeType === 'all') next.delete('type'); else next.set('type', activeType);
    const search = searchInput.value.trim();
    if (search) next.set('q', search); else next.delete('q');
    if (yearSelect.value) next.set('year', yearSelect.value); else next.delete('year');
    const query = next.toString();
    history.replaceState(null, '', `${location.pathname}${query ? `?${query}` : ''}`);
  }

  function resourceActions(resource) {
    const actions = [];
    const resourceUrl = resource.resource_url || resource.landing_page_url || resource.url;
    const githubUrl = resource.github_url || resource.github;
    const downloadUrl = resource.download_url || resource.download;
    if (resourceUrl) actions.push(`<a href="${escape(resourceUrl)}" target="_blank" rel="noreferrer">View resource <span aria-hidden="true">↗</span></a>`);
    if (resource.doi || resource.doi_url) actions.push(`<a href="${escape(resource.doi_url || doiUrl(resource.doi))}" target="_blank" rel="noreferrer">DOI <span aria-hidden="true">↗</span></a>`);
    if (githubUrl) actions.push(`<a href="${escape(githubUrl)}" target="_blank" rel="noreferrer">GitHub <span aria-hidden="true">↗</span></a>`);
    if (downloadUrl) actions.push(`<a href="${escape(downloadUrl)}" target="_blank" rel="noreferrer">Download <span aria-hidden="true">↓</span></a>`);
    if (resource.citation) actions.push(`<button type="button" class="cite-resource" data-citation="${escape(resource.citation)}">Cite</button>`);
    return actions.join('');
  }

  function renderFilters() {
    const options = [{ id: 'all', label: 'All' }, ...catalogue.resourceTypes];
    if (!options.some((option) => option.id === activeType)) activeType = 'all';
    filters.innerHTML = options.map((option) => `<button type="button" data-type="${escape(option.id)}" aria-pressed="${option.id === activeType}">${escape(option.label)}</button>`).join('');
    filters.querySelectorAll('button').forEach((button) => button.addEventListener('click', () => {
      activeType = button.dataset.type;
      renderFilters(); renderResources(); updateQuery();
    }));
  }

  function renderYearOptions() {
    const years = [...new Set(catalogue.resources.map((resource) => resource.year).filter(Boolean))].sort((a, b) => b - a);
    yearSelect.innerHTML = `<option value="">All years</option>${years.map((year) => `<option value="${year}">${year}</option>`).join('')}`;
    const queryYear = params.get('year');
    if (years.includes(Number(queryYear))) yearSelect.value = queryYear;
  }

  function filteredResources() {
    const query = searchInput.value.trim().toLowerCase();
    return catalogue.resources
      .filter((resource) => resource.public === true)
      .filter((resource) => activeType === 'all' || categoryFor(resource) === activeType)
      .filter((resource) => !yearSelect.value || String(resource.year) === yearSelect.value)
      .filter((resource) => !query || normalizedText(resource).includes(query))
      .sort((a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)) || Number(b.year || 0) - Number(a.year || 0) || a.title.localeCompare(b.title));
  }

  function renderResources() {
    const resources = filteredResources();
    summary.textContent = `${resources.length} ${resources.length === 1 ? 'resource' : 'resources'}${activeType === 'all' ? '' : ` in ${typeLabel(activeType)}`}.`;
    list.innerHTML = resources.length ? resources.map((resource) => {
      const authors = (resource.authors || []).map(authorName).filter(Boolean).join('; ');
      const meta = [resource.year, authors, resource.version ? `v${resource.version}` : null, resource.license ? `${resource.license} licence` : null].filter(Boolean).join(' · ');
      const keywords = (resource.keywords || []).map((keyword) => `<span>${escape(keyword)}</span>`).join('');
      const image = resource.image ? `<img class="resource-image" src="${escape(resource.image)}" alt="" loading="lazy">` : '';
      return `<article class="resource-entry${resource.featured ? ' featured' : ''}"><div class="resource-entry-main">${image}<p class="resource-kind">${escape(typeLabel(categoryFor(resource)))}</p><h2>${escape(resource.title)}</h2>${meta ? `<p class="resource-meta">${escape(meta)}</p>` : ''}<p class="resource-description">${escape(resource.short_description || resource.description || '')}</p>${keywords ? `<div class="resource-keywords" aria-label="Keywords">${keywords}</div>` : ''}</div><aside class="resource-side"><p class="resource-repository"><strong>${escape(resource.repository || 'External resource')}</strong>${resource.repository ? 'Hosted resource' : ''}</p>${resource.doi ? `<a class="resource-doi" href="${escape(resource.doi_url || doiUrl(resource.doi))}" target="_blank" rel="noreferrer">doi:${escape(resource.doi.replace(/^https?:\/\/doi\.org\//, ''))}</a>` : ''}<div class="resource-actions">${resourceActions(resource)}</div></aside></article>`;
    }).join('') : `<div class="resource-empty"><strong>No matching resources yet.</strong>${catalogue.resources.length ? 'Try a different search or filter.' : 'This catalogue is ready for resources to be added in data/resources.json.'}</div>`;
    list.querySelectorAll('.cite-resource').forEach((button) => button.addEventListener('click', async () => {
      try { await navigator.clipboard.writeText(button.dataset.citation); button.textContent = 'Citation copied'; setTimeout(() => { button.textContent = 'Cite'; }, 1800); }
      catch { button.textContent = 'Copy unavailable'; }
    }));
  }

  function debounce(callback, delay = 180) { let timer; return () => { clearTimeout(timer); timer = setTimeout(callback, delay); }; }

  fetch('data/resources/index.json')
    .then((response) => { if (!response.ok) throw new Error(); return response.json(); })
    .then(async (index) => {
      const files = Array.isArray(index.resource_files) ? index.resource_files : [];
      const resources = await Promise.all(files.map((file) => fetch(`data/resources/${encodeURIComponent(file)}`).then((response) => {
        if (!response.ok) throw new Error();
        return response.json();
      })));
      catalogue = { resources, resourceTypes: Array.isArray(index.resource_types) ? index.resource_types : [] };
      searchInput.value = params.get('q') || '';
      renderYearOptions(); renderFilters(); renderResources();
      searchInput.addEventListener('input', debounce(() => { renderResources(); updateQuery(); }));
      yearSelect.addEventListener('change', () => { renderResources(); updateQuery(); });
    })
    .catch(() => { list.innerHTML = '<p class="resource-empty"><strong>Resources could not be loaded.</strong>Please refresh the page or try again later.</p>'; });
})();
