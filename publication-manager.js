(async () => {
  const worksElement = document.querySelector('#works');
  const statusElement = document.querySelector('#status');
  const searchElement = document.querySelector('#search');
  const typeFilterElement = document.querySelector('#type-filter');
  const yearFilterElement = document.querySelector('#year-filter');
  const clearFiltersElement = document.querySelector('#clear-filters');
  const countElement = document.querySelector('#selection-count');
  const downloadElement = document.querySelector('#download');
  const storageKey = 'goncalo-publication-manager-v1';
  let works = [];
  let draft = {};
  let importedRecordCount = 0;

  const readJson = async (url) => {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Could not load ${url}.`);
    return response.json();
  };
  const input = (type, value = '') => Object.assign(document.createElement('input'), { type, value });
  const label = (text, control) => { const element = document.createElement('label'); element.className = 'field-label'; element.append(text, control); return element; };
  const activeWorks = () => works.filter((work) => draft[work.sourceId]?.selected);
  const saveDraft = () => localStorage.setItem(storageKey, JSON.stringify(draft));
  const updateCount = () => { countElement.textContent = `${activeWorks().length} selected`; };
  const canonicalWork = (candidates) => [...candidates].sort((left, right) => {
    const score = (work) => Number(Boolean(work.link)) * 4 + Number(Boolean(work.journal)) * 2 + Number(Boolean(work.year)) + Number(Boolean(work.type));
    return score(right) - score(left);
  })[0];
  const workTypeLabel = (type) => type.split('-').map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

  function populateFilters() {
    const types = [...new Set(works.map((work) => work.type).filter(Boolean))].sort();
    const years = [...new Set(works.map((work) => work.year).filter(Boolean))].sort((left, right) => right - left);
    typeFilterElement.replaceChildren(new Option('All types', ''));
    yearFilterElement.replaceChildren(new Option('All years', ''));
    for (const type of types) typeFilterElement.add(new Option(workTypeLabel(type), type));
    for (const year of years) yearFilterElement.add(new Option(String(year), String(year)));
  }

  function render() {
    const query = searchElement.value.trim().toLowerCase();
    const type = typeFilterElement.value;
    const year = yearFilterElement.value;
    const visible = works.filter((work) => [work.title, work.journal, work.year, work.type].join(' ').toLowerCase().includes(query) && (!type || work.type === type) && (!year || String(work.year) === year));
    worksElement.replaceChildren();
    for (const work of visible) {
      const record = draft[work.sourceId] ?? { selected: false, summary: '', image: '', imageAlt: '' };
      const card = document.createElement('article'); card.className = 'work';
      const top = document.createElement('div'); top.className = 'work-top';
      const checkbox = input('checkbox'); checkbox.className = 'select-work'; checkbox.checked = record.selected;
      checkbox.setAttribute('aria-label', `Select ${work.title}`);
      checkbox.addEventListener('change', () => { draft[work.sourceId] = { ...record, selected: checkbox.checked }; saveDraft(); updateCount(); render(); });
      const details = document.createElement('div');
      const title = document.createElement('h2'); const titleLink = document.createElement('a'); titleLink.href = work.link || '#'; titleLink.target = '_blank'; titleLink.rel = 'noreferrer'; titleLink.textContent = work.title; title.append(titleLink);
      const meta = document.createElement('p'); meta.className = 'meta'; meta.textContent = [work.year, work.journal, work.type].filter(Boolean).join(' · ');
      details.append(title, meta); top.append(checkbox, details); card.append(top);
      const fields = document.createElement('div'); fields.className = 'fields'; fields.hidden = !record.selected;
      const summary = document.createElement('textarea'); summary.value = record.summary; summary.placeholder = 'Short description for the website card';
      const image = input('text', record.image); image.placeholder = 'images/example.jpg';
      const imageAlt = input('text', record.imageAlt); imageAlt.placeholder = 'Brief image description';
      const update = (key, value) => { draft[work.sourceId] = { ...(draft[work.sourceId] ?? record), [key]: value }; saveDraft(); };
      summary.addEventListener('input', () => update('summary', summary.value)); image.addEventListener('input', () => update('image', image.value)); imageAlt.addEventListener('input', () => update('imageAlt', imageAlt.value));
      fields.append(label('Short description', summary), label('Image path', image), label('Image description', imageAlt)); card.append(fields); worksElement.append(card);
    }
    statusElement.textContent = visible.length ? `${visible.length} of ${works.length} unique Works available from ${importedRecordCount} ORCID records.` : 'No Works match your filters.';
  }

  downloadElement.addEventListener('click', () => {
    const publications = activeWorks().map((work) => ({ ...work, ...draft[work.sourceId] })).map(({ type, selected, ...publication }) => publication);
    const blob = new Blob([`${JSON.stringify({ updatedAt: new Date().toISOString(), publications }, null, 2)}\n`], { type: 'application/json' });
    const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = 'publications.json'; link.click(); URL.revokeObjectURL(link.href);
  });

  try {
    const [orcidData, publicationData] = await Promise.all([readJson('data/orcid-works.json'), readJson('data/publications.json')]);
    const saved = JSON.parse(localStorage.getItem(storageKey) || '{}');
    const existing = Object.fromEntries((publicationData.publications || []).map((publication) => [publication.sourceId, publication]));
    importedRecordCount = (orcidData.works || []).length;
    const grouped = (orcidData.works || []).reduce((bySourceId, work) => {
      (bySourceId[work.sourceId] ||= []).push(work);
      return bySourceId;
    }, {});
    works = Object.values(grouped).map(canonicalWork).sort((a, b) => Number(b.year) - Number(a.year) || a.title.localeCompare(b.title));
    draft = Object.fromEntries(works.map((work) => {
      const publication = existing[work.sourceId]; const local = saved[work.sourceId];
      return [work.sourceId, local || (publication ? { selected: true, summary: publication.summary || '', image: publication.image || '', imageAlt: publication.imageAlt || '' } : { selected: false, summary: '', image: '', imageAlt: '' })];
    }));
    populateFilters();
    searchElement.addEventListener('input', render);
    typeFilterElement.addEventListener('change', render);
    yearFilterElement.addEventListener('change', render);
    clearFiltersElement.addEventListener('click', () => { searchElement.value = ''; typeFilterElement.value = ''; yearFilterElement.value = ''; render(); });
    updateCount(); render();
  } catch (error) { statusElement.textContent = `Unable to load the manager data: ${error.message}`; }
})();
