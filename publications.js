(async () => {
  const grid = document.querySelector('#publication-grid');
  const escape = (value) => String(value ?? '').replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character]);

  try {
    const response = await fetch('data/publications.json');
    if (!response.ok) throw new Error('Publication data could not be loaded.');
    const { publications = [] } = await response.json();
    const sorted = [...publications].sort((a, b) => Number(b.year) - Number(a.year) || a.title.localeCompare(b.title));
    grid.innerHTML = sorted.map((publication) => `
      <article class="publication-card${publication.featured ? ' featured' : ''}">
        <img src="${escape(publication.image)}" alt="${escape(publication.imageAlt || '')}" loading="lazy">
        <div class="card-content">
          <p class="card-meta">${escape(publication.year)} · ${escape(publication.journal || 'Publication')}</p>
          <h2>${escape(publication.title)}</h2>
          <p>${escape(publication.summary)}</p>
          <a class="button" href="${escape(publication.link)}" target="_blank" rel="noreferrer">Learn more <span aria-hidden="true">↗</span></a>
        </div>
      </article>`).join('');
  } catch (error) {
    grid.innerHTML = '<p class="publication-message">The publication list is available when this page is served through the website.</p>';
  }
})();
