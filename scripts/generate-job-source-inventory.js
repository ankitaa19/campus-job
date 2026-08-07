#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const primaryPath = path.join(root, 'apps/api/src/config/india-career-sources.json');
const attachedPath = path.join(root, 'apps/api/src/config/attached-career-sources.json');
const outputPath = 'apps/api/JOB_SOURCE_INVENTORY.md';
const primary = JSON.parse(fs.readFileSync(primaryPath, 'utf8'));
const attached = JSON.parse(fs.readFileSync(attachedPath, 'utf8'));

const canonicalUrl = value => {
  try {
    const url = new URL(value);
    return `${url.hostname.toLowerCase().replace(/^www\./, '')}${url.pathname.replace(/\/+$/, '').toLowerCase()}`;
  } catch {
    return String(value || '').trim().toLowerCase();
  }
};

const escapeCell = value => String(value ?? '').replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');
const link = source => /^https:\/\//i.test(source.url)
  ? `[${escapeCell(source.name)}](${source.url})`
  : `${escapeCell(source.name)} — \`${escapeCell(source.url)}\``;
const table = (sources, columns) => [
  `| ${columns.map(column => column.label).join(' | ')} |`,
  `| ${columns.map(() => '---').join(' | ')} |`,
  ...sources.map((source, index) => `| ${columns.map(column => escapeCell(column.value(source, index))).join(' | ')} |`)
].join('\n');

const categorized = kind => primary.sources.filter(source => source.sourceKind === kind);
const careerCandidates = [
  ...categorized('company_career').map(source => ({ ...source, catalog: 'India careers directory' })),
  ...attached.sources.filter(source => source.sourceKind === 'company_career').map(source => ({ ...source, catalog: 'Attached workbook' }))
];
const seenUrls = new Set();
const seenSlugs = new Set();
const careers = careerCandidates.filter(source => {
  const urlKey = canonicalUrl(source.url);
  const slugKey = String(source.slug || '').trim().toLowerCase();
  if (!urlKey || !slugKey || seenUrls.has(urlKey) || seenSlugs.has(slugKey)) return false;
  seenUrls.add(urlKey);
  seenSlugs.add(slugKey);
  return true;
});

const commonColumns = [
  { label: '#', value: (_source, index) => index + 1 },
  { label: 'Name and URL', value: link },
  { label: 'Slug', value: source => source.slug }
];

const lines = [
  '# CampusPe Job Source Inventory',
  '',
  `Generated from the source catalogs used by the CampusPe API. Last regenerated: ${new Date().toISOString().slice(0, 10)}.`,
  '',
  '> Important: “catalogued” does not mean “currently fetching.” CampusPe fetches only from active public feeds, configured ATS tenants, verified structured career pages, direct CampusPe employer postings, or sources with the required permission/licence. Portal and government entries remain inactive until a lawful supported connector is configured.',
  '',
  '## Status legend',
  '',
  '| Status | Meaning |',
  '| --- | --- |',
  '| Active by default | Used when starter sources are enabled and no replacement provider configuration is supplied. |',
  '| Configurable | Connector exists, but the deployed environment must provide company slugs or URLs. |',
  '| Discovery catalog | Stored inactive first; activated only after public structured job data and robots/host checks are verified. |',
  '| Permission required | Not fetched unless an official API/licence, written permission, or explicit public terms allow automation. |',
  '| Direct CampusPe | Created by employers in CampusPe rather than imported from another website. |',
  '',
  '## Sources CampusPe can actively fetch',
  '',
  '| Source | Website/API | Connector | Default status |',
  '| --- | --- | --- | --- |',
  '| Omnisend | [Lever postings API](https://api.lever.co/v0/postings/omnisend) | Lever | Active by default |',
  '| Stripe | [Greenhouse job board](https://boards.greenhouse.io/stripe) | Greenhouse | Active by default |',
  '| Figma | [Greenhouse job board](https://boards.greenhouse.io/figma) | Greenhouse | Active by default |',
  '| Discord | [Greenhouse job board](https://boards.greenhouse.io/discord) | Greenhouse | Active by default |',
  '| Ramp | [Ashby job board](https://jobs.ashbyhq.com/ramp) | Ashby | Active by default |',
  '| Notion | [Ashby job board](https://jobs.ashbyhq.com/notion) | Ashby | Active by default |',
  '| Himalayas | [Public jobs API](https://himalayas.app/jobs/api) | Public JSON feed | Active by default |',
  '| We Work Remotely | [Remote jobs RSS](https://weworkremotely.com/remote-jobs.rss) | Public RSS feed | Active by default |',
  '| Other Lever companies | [Lever](https://www.lever.co/) | Lever company slug | Configurable |',
  '| Other Greenhouse companies | [Greenhouse](https://www.greenhouse.com/) | Greenhouse board slug | Configurable |',
  '| Other Ashby companies | [Ashby](https://www.ashbyhq.com/) | Ashby board slug | Configurable |',
  '| Other SmartRecruiters companies | [SmartRecruiters](https://www.smartrecruiters.com/) | SmartRecruiters company slug | Configurable |',
  '| Workday career sites | [Workday](https://www.workday.com/) | Public myworkdayjobs CXS endpoint | Configurable |',
  '| Structured company career pages | Company-specific HTTPS career URL | Schema.org JobPosting / discovered ATS | Configurable and verified only |',
  '| Authorized JavaScript job pages | Source-specific HTTPS jobs URL | Permission-gated Selenium JSON-LD | Configurable and permission required |',
  '| CampusPe employer jobs | CampusPe recruiter portal | Direct database posting | Direct CampusPe |',
  '',
  'Environment variables may replace the default companies: `LEVER_COMPANIES`, `GREENHOUSE_COMPANIES`, `ASHBY_COMPANIES`, `SMARTRECRUITERS_COMPANIES`, `WORKDAY_COMPANIES`, `CAREER_PAGE_COMPANIES`, and permission-gated `SELENIUM_JOB_SOURCES`.',
  '',
  `## Job portals (${categorized('job_portal').length})`,
  '',
  'Status for every entry in this section: **Permission required / inactive catalog entry**.',
  '',
  table(categorized('job_portal'), [...commonColumns, { label: 'Ingestion policy', value: source => source.ingestionMode || 'licensed_connector_required' }]),
  '',
  `## Government recruitment sources (${categorized('government_jobs').length})`,
  '',
  'Status for every entry in this section: **Catalogued only** until a dedicated official structured-feed adapter is verified.',
  '',
  table(categorized('government_jobs'), commonColumns),
  '',
  `## Company career pages (${careers.length} unique effective sources)`,
  '',
  'Status for every entry in this section: **Discovery catalog**. These pages begin inactive and become fetchable only when CampusPe verifies a supported public ATS endpoint or Schema.org `JobPosting` data.',
  '',
  table(careers, [
    ...commonColumns,
    { label: 'Declared provider', value: source => source.declaredProvider || 'Not specified' },
    { label: 'Catalog', value: source => source.catalog }
  ]),
  '',
  `## Company directories (${categorized('company_directory').length})`,
  '',
  'These are discovery references, not direct job-ingestion feeds.',
  '',
  table(categorized('company_directory'), commonColumns),
  '',
  `## ATS patterns (${categorized('ats_pattern').length})`,
  '',
  'These patterns describe supported ATS URL families; they are not companies by themselves.',
  '',
  table(categorized('ats_pattern'), [...commonColumns, { label: 'Mode', value: source => source.ingestionMode || 'pattern' }]),
  '',
  '## Deduplication and application handling',
  '',
  '- Imported jobs are standardized and stored in MongoDB.',
  '- Exact duplicates are prevented by provider/source plus external job ID.',
  '- Cross-source duplicates are reduced using a normalized SHA-256 fingerprint and fuzzy comparison.',
  '- External URLs are retained for provenance; the student application remains inside CampusPe.',
  '- A failed source is isolated and does not stop synchronization of other providers or companies.',
  '',
  '## Source-of-truth files',
  '',
  '- `src/config/india-career-sources.json` — portals, government sources, original company careers, directories, and ATS patterns.',
  '- `src/config/attached-career-sources.json` — additional company career pages imported from the attached workbook.',
  '- `src/services/job-aggregation/provider-companies.service.ts` — activation, defaults, environment overrides, and permission gates.',
  '- `JOB_AGGREGATION.md` — connector behavior, synchronization, matching, and compliance notes.',
  ''
];

const content = lines.join('\n');
const patchLines = content.split('\n').map(line => `+${line}`).join('\n');
if (fs.existsSync(path.join(root, outputPath))) {
  const remove = spawnSync('apply_patch', [], {
    cwd: root,
    input: `*** Begin Patch\n*** Delete File: ${outputPath}\n*** End Patch\n`,
    encoding: 'utf8'
  });
  if (remove.status !== 0) {
    if (remove.stdout) process.stdout.write(remove.stdout);
    if (remove.stderr) process.stderr.write(remove.stderr);
    process.exit(remove.status ?? 1);
  }
}
const add = spawnSync('apply_patch', [], {
  cwd: root,
  input: `*** Begin Patch\n*** Add File: ${outputPath}\n${patchLines}\n*** End Patch\n`,
  encoding: 'utf8'
});
if (add.stdout) process.stdout.write(add.stdout);
if (add.stderr) process.stderr.write(add.stderr);
process.exit(add.status ?? 1);
