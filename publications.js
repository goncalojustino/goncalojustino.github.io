(async () => {
  const grid = document.querySelector('#publication-grid');
  const escape = (value) => String(value ?? '').replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character]);

  try {
    const [response, worksResponse] = await Promise.all([fetch('data/publications.json'), fetch('data/orcid-works.json')]);
    if (!response.ok) throw new Error('Publication data could not be loaded.');
    const { publications = [] } = await response.json();
    const { works = [] } = worksResponse.ok ? await worksResponse.json() : { works: [] };
    const typeById = new Map(works.map((work) => [work.sourceId, work.type]));
    const categoryFor = (publication) => {
      if (publication.category) return publication.category;
      const type = typeById.get(publication.sourceId);
      if (type === 'journal-article' || type === 'review' || type === 'preprint') return 'articles';
      if (['book', 'book-chapter', 'edited-book'].includes(type)) return 'books';
      if (['software', 'data-set'].includes(type)) return 'software';
      return 'other';
    };
    const selectedCategory = new URLSearchParams(location.search).get('category');
    const sorted = publications.map((publication) => ({ ...publication, category: categoryFor(publication) })).filter((publication) => !selectedCategory || publication.category === selectedCategory).sort((a, b) => Number(b.year) - Number(a.year) || a.title.localeCompare(b.title));
    grid.innerHTML = sorted.map((publication) => {
      const image = publication.image || 'images/Borcelle.png';
      const imageAlt = publication.imageAlt || 'Publication illustration';
      const summary = publication.summary || 'View the original publication for full details.';
      return `
      <article class="publication-card${publication.featured ? ' featured' : ''}">
        <img src="${escape(image)}" alt="${escape(imageAlt)}" loading="lazy">
        <div class="card-content">
          <p class="card-meta">${escape(publication.year)} · ${escape(publication.journal || 'Publication')}</p>
          <h2>${escape(publication.title)}</h2>
          <p>${escape(summary)}</p>
          <a class="button" href="${escape(publication.link)}" target="_blank" rel="noreferrer">Learn more <span aria-hidden="true">↗</span></a>
        </div>
      </article>`;
    }).join('');
  } catch (error) {
    grid.innerHTML = '<p class="publication-message">The publication list is available when this page is served through the website.</p>';
  }
})();
