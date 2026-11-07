(() => {
  const data = window.CV_DATA;
  if (!data) return;

  const escape = (value) => String(value ?? '').replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character]);
  const identifiers = document.querySelector('#cv-identifiers');
  const navigation = document.querySelector('#cv-section-nav');
  const sections = document.querySelector('#cv-sections');
  const newestFirst = (left, right) => {
    const year = (item) => Number(String(item.date || '').match(/\d{4}/)?.[0] || 0);
    return year(right) - year(left) || String(left.title || '').localeCompare(String(right.title || ''));
  };
  const entriesFor = (group) => group.source === 'orcid-journal-articles'
    ? (window.CV_ORCID_JOURNAL_ARTICLES || []).map(([date, title, meta, url]) => ({ date, title, meta, url, linkLabel: 'View publication' }))
    : group.entries || [];

  const entry = (item) => {
    const link = item.url ? ` <a href="${escape(item.url)}" target="_blank" rel="noreferrer">${escape(item.linkLabel || 'Open link')} ↗</a>` : '';
    const description = item.description ? `<p class="cv-entry-description">${escape(item.description)}${link}</p>` : link;
    const notes = Array.isArray(item.items) && item.items.length ? `<ul>${item.items.map((note) => `<li>${escape(note)}</li>`).join('')}</ul>` : '';
    const tags = Array.isArray(item.tags) && item.tags.length ? `<ul class="cv-tags">${item.tags.map((tag) => `<li>${escape(tag)}</li>`).join('')}</ul>` : '';
    return `<article class="cv-entry"><p class="cv-entry-date">${escape(item.date || '')}</p><div><h3 class="cv-entry-title">${escape(item.title || '')}</h3>${item.meta ? `<p class="cv-entry-meta">${escape(item.meta)}</p>` : ''}${description}${notes}${tags}</div></article>`;
  };

  identifiers.innerHTML = data.identifiers.map((item) => `<a href="${escape(item.url)}" target="_blank" rel="noreferrer">${escape(item.label)} ↗</a>`).join('');
  navigation.innerHTML = data.sections.map((section) => `<a href="#${escape(section.id)}">${escape(section.label)}</a>`).join('');
  sections.innerHTML = data.sections.map((section) => {
    const open = section.id === 'teaching' ? ' open' : '';
    return `<details id="${escape(section.id)}" class="cv-section"${open}><summary><span class="cv-section-title">${escape(section.label)}</span></summary><p class="cv-section-intro">${escape(section.intro || '')}</p>${section.groups.map((group) => { const entries = entriesFor(group).sort(newestFirst); return `<details class="cv-group"><summary>${escape(group.label)}</summary><div class="cv-entry-list">${entries.map(entry).join('') || '<p class="cv-empty">No entries at present.</p>'}</div></details>`; }).join('')}</details>`;
  }).join('');
  document.querySelector('#cv-expand').addEventListener('click', () => document.querySelectorAll('details').forEach((detail) => { detail.open = true; }));
  document.querySelector('#cv-collapse').addEventListener('click', () => document.querySelectorAll('details').forEach((detail) => { detail.open = false; }));
})();
