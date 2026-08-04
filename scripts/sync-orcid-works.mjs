import { writeFile } from 'node:fs/promises';

const orcidId = '0000-0003-4828-4738';
const clientId = process.env.ORCID_CLIENT_ID;
const clientSecret = process.env.ORCID_CLIENT_SECRET;

if (!clientId || !clientSecret) throw new Error('ORCID_CLIENT_ID and ORCID_CLIENT_SECRET must be configured as GitHub Actions secrets.');

const tokenResponse = await fetch('https://orcid.org/oauth/token', {
  method: 'POST',
  headers: { Accept: 'application/json', 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({ client_id: clientId, client_secret: clientSecret, grant_type: 'client_credentials', scope: '/read-public' })
});
if (!tokenResponse.ok) throw new Error(`ORCID token request failed (${tokenResponse.status}).`);
const { access_token: accessToken } = await tokenResponse.json();

const worksResponse = await fetch(`https://pub.orcid.org/v3.0/${orcidId}/works`, { headers: { Accept: 'application/vnd.orcid+json', Authorization: `Bearer ${accessToken}` } });
if (!worksResponse.ok) throw new Error(`ORCID Works request failed (${worksResponse.status}).`);
const worksPayload = await worksResponse.json();

const valueOf = (field) => field?.value || '';
const getWork = (summary) => {
  const identifiers = summary['external-ids']?.['external-id'] || [];
  const doi = identifiers.find((item) => item['external-id-type']?.toLowerCase() === 'doi')?.['external-id-value'];
  const externalUrl = valueOf(summary.url) || (doi ? `https://doi.org/${doi}` : '');
  return {
    sourceId: doi ? `doi:${doi.toLowerCase()}` : `orcid:${summary['put-code']}`,
    title: valueOf(summary.title?.title),
    year: Number(valueOf(summary['publication-date']?.year)) || null,
    journal: valueOf(summary['journal-title']),
    link: externalUrl,
    type: summary.type || ''
  };
};

// ORCID groups related records together. Keep every work-summary in each group so
// the manager shows all individual Works and lets the site owner choose a version.
const works = (worksPayload.group || [])
  .flatMap((group) => group['work-summary'] || [])
  .map(getWork)
  .filter((work) => work.title)
  .sort((a, b) => Number(b.year) - Number(a.year) || a.title.localeCompare(b.title));
await writeFile('data/orcid-works.json', `${JSON.stringify({ orcidId, updatedAt: new Date().toISOString(), works }, null, 2)}\n`);
console.log(`Synced ${works.length} public ORCID Works.`);
