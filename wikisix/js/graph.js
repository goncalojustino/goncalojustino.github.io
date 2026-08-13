export const SEARCH_CONFIG = Object.freeze({
  maxDepth: 5,
  maxLinksPerPage: 80,
  maxConcurrentRequests: 4,
  maxVisitedPages: 3500,
});

function aborted(signal) {
  if (signal?.aborted) throw new DOMException('Search cancelled.', 'AbortError');
}

function reconstruct(forwardParent, reverseNext, meetingId) {
  const left = [];
  let current = meetingId;
  while (current !== null) { left.unshift(current); current = forwardParent.get(current) ?? null; }
  const right = [];
  current = reverseNext.get(meetingId) ?? null;
  while (current !== null) { right.push(current); current = reverseNext.get(current) ?? null; }
  return [...left, ...right];
}

async function expandLayer({ frontier, direction, ownParents, otherParents, getLinks, config, signal, onProgress }) {
  const next = [];
  for (let index = 0; index < frontier.length; index += config.maxConcurrentRequests) {
    aborted(signal);
    const batch = frontier.slice(index, index + config.maxConcurrentRequests);
    const results = await Promise.all(batch.map(async (id) => ({ id, links: await getLinks(id, { limit: config.maxLinksPerPage, signal }) })));
    for (const { id, links } of results) {
      for (const link of links) {
        if (ownParents.has(link.pageid)) continue;
        ownParents.set(link.pageid, id);
        next.push(link.pageid);
        if (otherParents.has(link.pageid)) return { next, meeting: link.pageid };
        if (ownParents.size + otherParents.size >= config.maxVisitedPages) return { next, limit: true };
      }
      onProgress?.({ direction, explored: ownParents.size + otherParents.size, frontier: next.length });
    }
  }
  return { next };
}

/**
 * Bounded bidirectional search. Forward steps follow article links; reverse
 * steps follow backlinks, so an intersection represents a real directed path.
 */
export async function findPath(source, target, api, options = {}) {
  const config = { ...SEARCH_CONFIG, ...options };
  const { signal, onProgress } = options;
  if (source.pageid === target.pageid) return { status: 'found', pathIds: [source.pageid], explored: 1, depth: 0 };

  const forwardParent = new Map([[source.pageid, null]]);
  const reverseNext = new Map([[target.pageid, null]]);
  let forward = [source.pageid];
  let reverse = [target.pageid];
  let forwardDepth = 0;
  let reverseDepth = 0;

  while (forward.length && reverse.length && forwardDepth + reverseDepth < config.maxDepth) {
    aborted(signal);
    const expandForward = forward.length <= reverse.length;
    const result = await expandLayer({
      frontier: expandForward ? forward : reverse,
      direction: expandForward ? 'forward' : 'reverse',
      ownParents: expandForward ? forwardParent : reverseNext,
      otherParents: expandForward ? reverseNext : forwardParent,
      getLinks: expandForward ? api.getOutgoingLinks : api.getBacklinks,
      config,
      signal,
      onProgress: (progress) => onProgress?.({ ...progress, depth: forwardDepth + reverseDepth + 1 }),
    });
    if (result.meeting !== undefined) return {
      status: 'found',
      pathIds: reconstruct(forwardParent, reverseNext, result.meeting),
      explored: forwardParent.size + reverseNext.size,
      depth: forwardDepth + reverseDepth + 1,
    };
    if (result.limit) return { status: 'limit', explored: forwardParent.size + reverseNext.size, depth: forwardDepth + reverseDepth + 1 };
    if (expandForward) { forward = result.next; forwardDepth += 1; } else { reverse = result.next; reverseDepth += 1; }
  }
  return { status: 'not-found', explored: forwardParent.size + reverseNext.size, depth: forwardDepth + reverseDepth };
}
