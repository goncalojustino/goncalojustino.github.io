import { searchArticles, getArticle, getOutgoingLinks, getBacklinks } from './wikipedia.js';
import { findPath, SEARCH_CONFIG } from './graph.js';

const fields = ['from', 'to'];
const selected = { from: null, to: null };
let activeSearch = null;
let suggestionController = null;
const randomPairs = [
  ['Mass spectrometry', 'Napoleon'],
  ['Proteomics', 'Black hole'],
  ['Antibiotic resistance', 'The Beatles'],
  ['Molecular biology', 'Lisbon'],
];

const $ = (selector) => document.querySelector(selector);
const form = $('#search-form');
const result = $('#result');
const statusBox = $('#search-status');
const statusTitle = $('#status-title');
const statusDetail = $('#status-detail');
const findButton = $('#find-button');

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;' })[char]);
}

function setStatus(title, detail) {
  statusBox.hidden = false;
  statusTitle.textContent = title;
  statusDetail.textContent = detail;
}

function stopStatus() { statusBox.hidden = true; }

function articleField(name) {
  return {
    input: $(`#${name}-input`),
    list: $(`#${name}-suggestions`),
    selection: $(`#${name}-selection`),
    clear: $(`[data-clear="${name}"]`),
  };
}

function closeSuggestions(name) {
  const field = articleField(name);
  field.list.hidden = true;
  field.input.setAttribute('aria-expanded', 'false');
}

function selectArticle(name, article) {
  selected[name] = article;
  const field = articleField(name);
  field.input.value = article.title;
  field.selection.textContent = `Selected: ${article.title}`;
  field.clear.hidden = false;
  closeSuggestions(name);
}

function clearArticle(name) {
  selected[name] = null;
  const field = articleField(name);
  field.input.value = '';
  field.selection.textContent = '';
  field.clear.hidden = true;
  closeSuggestions(name);
  field.input.focus();
}

function showSuggestions(name, suggestions) {
  const field = articleField(name);
  field.list.innerHTML = suggestions.map((article, index) => `<li role="option" id="${name}-option-${index}" aria-selected="false"><button type="button" data-pageid="${article.pageid}" data-title="${escapeHtml(article.title)}" data-description="${escapeHtml(article.description)}"><strong>${escapeHtml(article.title)}</strong><small>${escapeHtml(article.description || 'Wikipedia article')}</small></button></li>`).join('');
  field.list.hidden = suggestions.length === 0;
  field.input.setAttribute('aria-expanded', String(suggestions.length > 0));
  field.list.querySelectorAll('button').forEach((button) => button.addEventListener('click', () => selectArticle(name, {
    pageid: Number(button.dataset.pageid), title: button.dataset.title, description: button.dataset.description, url: `https://en.wikipedia.org/wiki/${encodeURIComponent(button.dataset.title.replaceAll(' ', '_'))}`,
  })));
}

async function updateSuggestions(name) {
  const field = articleField(name);
  const term = field.input.value.trim();
  selected[name] = null;
  field.selection.textContent = '';
  field.clear.hidden = true;
  if (term.length < 2) return closeSuggestions(name);
  suggestionController?.abort();
  suggestionController = new AbortController();
  try {
    const suggestions = await searchArticles(term, { signal: suggestionController.signal });
    if (field.input.value.trim() === term) showSuggestions(name, suggestions);
  } catch (error) {
    if (error.name !== 'AbortError') closeSuggestions(name);
  }
}

function debounce(fn, wait = 240) {
  let timeout;
  return (...args) => { clearTimeout(timeout); timeout = setTimeout(() => fn(...args), wait); };
}

function renderError(title, message) {
  result.hidden = false;
  result.className = 'result error';
  result.innerHTML = `<div class="result-header"><h2>${escapeHtml(title)}</h2></div><p class="result-message">${escapeHtml(message)}</p>`;
  result.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function renderPath(path, explored) {
  const degrees = Math.max(0, path.length - 1);
  result.hidden = false;
  result.className = 'result';
  result.innerHTML = `<div class="result-header"><h2>Found in <em>${degrees} ${degrees === 1 ? 'degree' : 'degrees'}</em></h2><p class="result-meta">${explored.toLocaleString()} articles explored</p></div><div class="path">${path.map((article, index) => `${index ? '<div class="path-arrow" aria-hidden="true"></div>' : ''}<a class="path-node" href="${escapeHtml(article.url)}" target="_blank" rel="noreferrer"><span class="path-index">${index + 1}</span><span><strong>${escapeHtml(article.title)}</strong><small>${escapeHtml(article.description || 'Open article on Wikipedia')}</small></span><span class="external-mark" aria-hidden="true">↗</span></a>`).join('')}</div><p class="result-note">Each step follows a hyperlink in the previous article. This is a bounded search, so it may not be the globally shortest possible path.</p>`;
  result.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function historyKey() { return 'wikisix-history-v1'; }
function readHistory() { try { return JSON.parse(localStorage.getItem(historyKey())) || []; } catch { return []; } }
function addHistory(source, target, path) {
  const entries = readHistory().filter((entry) => !(entry.source.pageid === source.pageid && entry.target.pageid === target.pageid));
  entries.unshift({ source, target, path, timestamp: Date.now() });
  localStorage.setItem(historyKey(), JSON.stringify(entries.slice(0, 5)));
  renderHistory();
}
function renderHistory() {
  const entries = readHistory();
  const box = $('#history');
  const list = $('#history-items');
  box.hidden = entries.length === 0;
  list.innerHTML = entries.map((entry, index) => `<button class="history-item" type="button" data-history="${index}">${escapeHtml(entry.source.title)} → ${escapeHtml(entry.target.title)} <span>(${Math.max(0, entry.path.length - 1)})</span></button>`).join('');
  list.querySelectorAll('[data-history]').forEach((button) => button.addEventListener('click', () => {
    const entry = entries[Number(button.dataset.history)];
    selectArticle('from', entry.source);
    selectArticle('to', entry.target);
    renderPath(entry.path, 0);
  }));
}

async function resolveTypedField(name) {
  if (selected[name]) return selected[name];
  const term = articleField(name).input.value.trim();
  if (!term) throw new Error(`Choose a ${name === 'from' ? 'starting' : 'target'} article.`);
  const suggestions = await searchArticles(term);
  if (!suggestions.length) throw new Error(`Wikipedia could not resolve “${term}”. Try a more specific title.`);
  selectArticle(name, suggestions[0]);
  return selected[name];
}

async function startSearch(event) {
  event.preventDefault();
  if (activeSearch) return;
  result.hidden = true;
  try {
    const [source, target] = await Promise.all([resolveTypedField('from'), resolveTypedField('to')]);
    activeSearch = new AbortController();
    findButton.disabled = true;
    setStatus('Searching Wikipedia', 'Resolving article metadata…');
    const response = await findPath(source, target, { getOutgoingLinks, getBacklinks }, {
      ...SEARCH_CONFIG,
      signal: activeSearch.signal,
      onProgress: ({ depth, explored, frontier }) => setStatus('Searching Wikipedia', `Depth: ${depth} · Articles explored: ${explored.toLocaleString()} · Current frontier: ${frontier.toLocaleString()}`),
    });
    if (response.status === 'found') {
      setStatus('Connection found', `Loading ${response.pathIds.length} articles…`);
      const path = await Promise.all(response.pathIds.map((pageid) => getArticle(pageid, { signal: activeSearch.signal })));
      renderPath(path, response.explored);
      addHistory(source, target, path);
    } else if (response.status === 'limit') {
      renderError('Search limit reached', `The search stopped after exploring ${response.explored.toLocaleString()} articles. Try more specific topics or try again later.`);
    } else {
      renderError('No connection found within the current limits', `The search explored ${response.explored.toLocaleString()} articles to a depth of ${response.depth}. This does not mean no Wikipedia path exists.`);
    }
  } catch (error) {
    if (error.name === 'AbortError') renderError('Search cancelled', 'No result was saved. Choose two articles to start another search.');
    else renderError('Could not complete the search', error.message || 'Please check your connection and try again.');
  } finally {
    activeSearch = null;
    findButton.disabled = false;
    stopStatus();
  }
}

fields.forEach((name) => {
  const field = articleField(name);
  field.input.addEventListener('input', debounce(() => updateSuggestions(name)));
  field.input.addEventListener('keydown', (event) => { if (event.key === 'Escape') closeSuggestions(name); });
  field.clear.addEventListener('click', () => clearArticle(name));
});
document.addEventListener('click', (event) => fields.forEach((name) => { if (!articleField(name).list.parentElement.contains(event.target)) closeSuggestions(name); }));
form.addEventListener('submit', startSearch);
$('#cancel-button').addEventListener('click', () => activeSearch?.abort());
$('#random-button').addEventListener('click', async () => {
  const pair = randomPairs[Math.floor(Math.random() * randomPairs.length)];
  $('#from-input').value = pair[0]; $('#to-input').value = pair[1];
  selected.from = null; selected.to = null;
  setStatus('Preparing a random challenge', 'Resolving two Wikipedia articles…');
  try {
    const [from, to] = await Promise.all(pair.map((term) => searchArticles(term)));
    if (from[0] && to[0]) { selectArticle('from', from[0]); selectArticle('to', to[0]); }
  } finally { stopStatus(); }
});
renderHistory();
