import { MemoryCache, RequestLimiter } from './cache.js';

const API = 'https://en.wikipedia.org/w/api.php';
const cache = new MemoryCache();
const limiter = new RequestLimiter(4);

function articleUrl(title) {
  return `https://en.wikipedia.org/wiki/${encodeURIComponent(title.replaceAll(' ', '_'))}`;
}

async function query(params, { signal } = {}) {
  const search = new URLSearchParams({ action: 'query', format: 'json', origin: '*', ...params });
  return limiter.run(async () => {
    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        const response = await fetch(`${API}?${search}`, { signal });
        if (!response.ok) {
          if (attempt === 0 && (response.status === 429 || response.status >= 500)) {
            await new Promise((resolve) => setTimeout(resolve, 350));
            continue;
          }
          throw new Error(`Wikipedia returned ${response.status}.`);
        }
        const json = await response.json();
        if (json.error) throw new Error(json.error.info || 'Wikipedia could not complete this request.');
        return json;
      } catch (error) {
        if (error.name === 'AbortError' || attempt > 0) throw error;
        await new Promise((resolve) => setTimeout(resolve, 350));
      }
    }
    throw new Error('Wikipedia could not complete this request.');
  });
}

function cleanTitle(title) { return title.replace(/\s+\([^)]*\)$/, '').trim(); }
function unsuitable(title) {
  const lower = title.toLowerCase();
  return /^(list of|index of|outline of|timeline of|year \d|\d{3,4} in |\d{3,4}$)/.test(lower) || lower.includes('(disambiguation)');
}

export async function searchArticles(term, { signal } = {}) {
  const key = `search:${term.trim().toLowerCase()}`;
  if (cache.has(key)) return cache.get(key);
  const json = await query({ list: 'search', srsearch: term, srnamespace: '0', srlimit: '6', srprop: 'snippet' }, { signal });
  const pages = (json.query?.search || []).map((item) => ({
    pageid: item.pageid,
    title: item.title,
    description: item.snippet.replace(/<[^>]+>/g, ''),
    url: articleUrl(item.title),
  }));
  return cache.set(key, pages);
}

export async function getArticle(pageid, { signal } = {}) {
  const key = `article:${pageid}`;
  if (cache.has(key)) return cache.get(key);
  const json = await query({ pageids: pageid, prop: 'description|pageimages', piprop: 'thumbnail', pithumbsize: '180' }, { signal });
  const page = Object.values(json.query?.pages || {})[0];
  if (!page || page.missing !== undefined) throw new Error('This Wikipedia article could not be found.');
  return cache.set(key, {
    pageid: Number(page.pageid),
    title: page.title,
    description: page.description || 'Wikipedia article',
    thumbnail: page.thumbnail?.source || null,
    url: articleUrl(page.title),
  });
}

async function getGeneratedLinks(pageid, direction, { limit = 80, signal } = {}) {
  const key = `${direction}:${pageid}:${limit}`;
  if (cache.has(key)) return cache.get(key);
  const links = new Map();
  let continuation = {};
  do {
    const remaining = limit - links.size;
    const params = direction === 'outgoing'
      ? { generator: 'links', pageids: pageid, gplnamespace: '0', gpllimit: String(Math.min(50, remaining)), prop: 'info', inprop: 'url', ...continuation }
      : { generator: 'backlinks', gblpageid: pageid, gblnamespace: '0', gbllimit: String(Math.min(50, remaining)), gblfilterredir: 'nonredirects', prop: 'info', inprop: 'url', ...continuation };
    const json = await query(params, { signal });
    Object.values(json.query?.pages || {}).forEach((page) => {
      if (page.pageid && page.ns === 0 && !unsuitable(page.title)) links.set(Number(page.pageid), { pageid: Number(page.pageid), title: page.title, url: page.fullurl || articleUrl(page.title) });
    });
    continuation = json.continue || null;
  } while (continuation && links.size < limit);
  const result = [...links.values()].sort((a, b) => a.title.localeCompare(b.title));
  return cache.set(key, result);
}

export function getOutgoingLinks(pageid, options) { return getGeneratedLinks(pageid, 'outgoing', options); }
export function getBacklinks(pageid, options) { return getGeneratedLinks(pageid, 'backlinks', options); }
export function clearWikipediaCache() { cache.clear(); }
export { articleUrl, cleanTitle };
