# CampusPe Job Aggregation

CampusPe imports provider jobs into MongoDB and exposes only the stored, standardized records to public and student job portals. Provider URLs are retained privately for provenance; students always apply through CampusPe.

## Configuration

Set `LEVER_COMPANIES` as either a comma-separated list of Lever site slugs:

```env
LEVER_COMPANIES=omnisend,erg
```

or JSON when display names, regions, or source types are needed:

```env
LEVER_COMPANIES=[{"slug":"omnisend","name":"Omnisend","region":"global","sourceType":"company_careers","recruiterId":"CAMPUSPE_RECRUITER_OBJECT_ID"}]
GREENHOUSE_COMPANIES=[{"slug":"stripe","name":"Stripe"}]
ASHBY_COMPANIES=[{"slug":"ramp","name":"Ramp"}]
ADZUNA_APP_ID=your_adzuna_app_id
ADZUNA_APP_KEY=your_adzuna_app_key
ADZUNA_COUNTRIES=in
ADZUNA_RESULTS_PER_PAGE=50
ADZUNA_MAX_PAGES=20
ADZUNA_MAX_DAYS_OLD=30
SMARTRECRUITERS_COMPANIES=[{"slug":"BoschGroup","name":"Bosch Group"}]
SMARTRECRUITERS_COUNTRY=in
SMARTRECRUITERS_MAX_JOBS=500
WORKDAY_COMPANIES=[{"slug":"nvidia-nvidiaexternalcareersite","name":"NVIDIA","url":"https://nvidia.wd5.myworkdayjobs.com/NVIDIAExternalCareerSite"}]
WORKDAY_MAX_JOBS=500
PUBLIC_REMOTE_FEEDS_ENABLED=true
HIMALAYAS_MAX_JOBS=1000
JOB_MATCH_CONCURRENCY=3
JOB_ALERTS_ENABLED=true
JOB_SYNC_ENABLED=true
JOB_SYNC_HIGH_PRIORITY_HOURS=3
JOB_SYNC_STANDARD_HOURS=6
JOB_SYNC_DAILY_HOURS=24
INDIA_CAREER_DIRECTORY_CATALOG_ENABLED=true
CAREER_DIRECTORY_DISCOVERY_ENABLED=true
CAREER_DIRECTORY_DISCOVERY_BATCH=75
CAREER_DIRECTORY_DISCOVERY_CONCURRENCY=4
AI_JOB_ENRICHMENT_ENABLED=true
AI_JOB_ENRICHMENT_MAX_PER_SYNC=50
AI_JOB_NORMALIZATION_MODEL=claude-3-5-haiku-20241022
OPENAI_API_KEY=your_server_side_key
OPENAI_JOB_NORMALIZATION_MODEL=gpt-4o-mini
OPENAI_RESUME_MODEL=gpt-4o-mini
JOB_SOURCE_USER_AGENT=CampusPeJobDiscoveryBot/1.0 (+https://campuspe.com; contact: support@campuspe.com)
JOB_SOURCE_MIN_DELAY_MS=350
JOB_SOURCE_JITTER_MS=250
JOB_SOURCE_MAX_RETRIES=2
SELENIUM_JOB_ALLOWED_DOMAINS=jobs.example.com
SELENIUM_JOB_SOURCES=[{"slug":"example-board","name":"Example Board","url":"https://jobs.example.com/jobs","permission":"written_permission","jobLinkSelector":"a.job-link","maxJobsPerSync":30}]
SELENIUM_JOB_DELAY_MS=1200
# Optional Selenium Grid and local Chrome overrides:
SELENIUM_REMOTE_URL=http://selenium:4444/wd/hub
SELENIUM_CHROME_BINARY=/path/to/chrome
```

When neither provider variable is configured, CampusPe seeds the public
Omnisend (Lever), Stripe/Figma/Discord (Greenhouse), Ramp/Notion (Ashby),
Himalayas, and We Work Remotely as starter sources so a
new environment does not show an empty jobs portal. Set
`JOB_SYNC_SEED_DEFAULTS=false` to disable these defaults.

Himalayas is paginated at 20 records per request. CampusPe defaults to 1,000
records per daily synchronization and respects `429` retry guidance. Increase
`HIMALAYAS_MAX_JOBS` only after confirming an appropriate rate limit with the
provider. Himalayas and We Work Remotely records include visible source
attribution links as required by their public-feed terms; these links are
provenance links, while the CampusPe application button remains internal.

NCS is not enabled because no official public bulk jobs RSS/XML endpoint could
be verified. LoopCV and JSearch are not anonymous sources: both require API
credentials and their free tiers are rate-limited evaluation plans. Add them
only through a licensed, keyed connector. CampusPe does not promise a fixed
30,000-record volume when upstream permissions, freshness, or rate limits do
not support it.

Public company career pages that expose Schema.org `JobPosting` JSON-LD can
also be configured. CampusPe checks `robots.txt`, identifies itself, accepts
only HTTPS pages, and does not log in or bypass access controls. The generic
connector downloads raw HTML with the lightweight shared HTTP client.
JavaScript-rendered pages can use the separate Selenium connector only after
the deployment records written permission or public terms that explicitly
allow automated access:

```env
CAREER_PAGE_COMPANIES=[{"slug":"example","name":"Example Ltd","url":"https://example.com/careers","sourceType":"company_careers"}]
```

## India careers directory

`src/config/india-career-sources.json` is generated from
`India_Careers_Job_Portals_Directory.docx`. After URL deduplication it contains
475 catalog entries: 44 job portals, 62 government recruitment sources, 358
company career pages, six company directories, and five ATS patterns.

The primary and attached inventories contain 542 company-career rows and 532
unique sources after canonical URL and slug deduplication. Only these company
career pages enter automatic source discovery. They are
catalogued as inactive first, then a bounded nightly pass checks `robots.txt`
and looks for public Lever, Greenhouse, Ashby, SmartRecruiters, or Schema.org
`JobPosting` data. A verified source is activated for the normal synchronization
cycle. Unsupported and failed sources are recorded per company and cannot stop
other sources. The batch and concurrency settings keep discovery from delaying
normal public and personalized job reads.

The 44 portals (including LinkedIn, Naukri, Indeed, and HiringCafe) are retained
as an inactive source catalog. They require an official API, licence, written
permission, or public terms that explicitly permit automated collection. The
government sites similarly remain catalogued until a dedicated structured feed
adapter is verified for each site. This prevents login bypasses, brittle HTML
scraping, and data that CampusPe cannot legally or reliably keep current.

SmartRecruiters uses its public company postings endpoints, paginates results,
then fetches each public posting detail with bounded concurrency. The default
country filter is `in`; set `SMARTRECRUITERS_COUNTRY=all` only when a global feed
is wanted. The job cap prevents a single multinational tenant from monopolizing
one synchronization run.

Workday sources require the complete public `myworkdayjobs.com` career-site URL
because its tenant and site name are both part of the CXS request. Discovery
stores that URL when it finds one; manually configured Workday entries must
include it as shown above. CampusPe uses only the public career-site JSON calls
and applies the same per-company failure isolation and record cap.

Supported regions are `global` and `eu`. Supported source types are `company_careers` and `job_board`.
When `recruiterId` links the provider company to a CampusPe recruiter, applications appear in that recruiter's CampusPe workflow and trigger the existing recruiter notification flow. Without a link, applications are still stored and tracked internally without inventing an external recruiter identity.

## Manual synchronization

These endpoints require an authenticated CampusPe admin:

- `GET /api/jobs/sync`
- `GET /api/jobs/sync/status`
- `GET /api/jobs/sync/adzuna/in` (requires server-side Adzuna credentials)
- `GET /api/jobs/sync/lever`
- `GET /api/jobs/sync/lever/:companySlug`
- `GET /api/jobs/sync/greenhouse/:companySlug`
- `GET /api/jobs/sync/ashby/:companySlug`
- `GET /api/jobs/sync/smartrecruiters/:companySlug`
- `GET /api/jobs/sync/workday/:companySlug` (the company must already have a configured URL)
- `GET /api/jobs/sync/career_page/:companySlug`
- `GET /api/jobs/sync/selenium_page/:companySlug` (source must already be authorized and allowlisted)
- `GET /api/jobs/sync/himalayas/global`
- `GET /api/jobs/sync/weworkremotely/global`
- `POST /api/jobs/sync/discover-career-sources?limit=20`

High-priority structured sources (Adzuna, Greenhouse, Lever, Ashby and
SmartRecruiters) run every three hours by default. Other company sources run
every six hours, while Himalayas and We Work Remotely run daily. Missing jobs
are revalidated every 12 hours. A failed company sync is recorded and does not
change job lifecycle state or stop other companies.

Imported jobs carry an authoritative lifecycle separate from total stored-row
count: `active → missing_on_source → recheck → expired`. A job is removed from
public and personalized results on its first confirmed absence, rechecked on
subsequent successful snapshots, and expired only after a third confirmed
absence. If it reappears, the normal upsert restores it to verified active.
Incomplete/capped feeds such as bounded Adzuna searches, Himalayas pagination,
or Selenium page samples never drive deletion. `GET /api/jobs/sync/status`
reports stored rows and verified active rows separately.

The Ashby connector uses the documented public posting endpoint with
`includeCompensation=true`. Greenhouse uses the public board jobs endpoint with
`content=true`. Adzuna credentials remain server-side and its country search is
paginated with configurable caps.

Ingestion adds normalized titles, canonical skills and synonyms, industry,
certifications, a feature vector, and a fuzzy fingerprint. Exact provider IDs
and cross-source fuzzy similarity prevent duplicate records.
Fingerprint lookups are indexed and fuzzy comparison is limited to a small
same-title/company candidate set. Newly created jobs enter a bounded matching
queue instead of launching unbounded notification work for every imported row.

When `CLAUDE_API_KEY` or `ANTHROPIC_API_KEY` is configured, newly discovered
fresh jobs also receive bounded AI enrichment for skills, department,
experience, education, benefits, work mode, job type, and a concise summary.
The key remains server-side. Existing provider records are not sent repeatedly,
calls are capped per synchronization, and provider/rule-based normalization is
kept whenever the AI service is unavailable or returns invalid data.

## Public reads

- `GET /api/jobs`
- `GET /api/jobs/public`
- `GET /api/jobs/:jobId`

List endpoints accept `search`, `jobType`, `workMode`, `location`, `source`,
`provider`, `industry`, `company`, `skills`, `education`, `minSalary`,
`maxSalary`, `minExperience`, `maxExperience`, `postedWithinDays`, `page`,
`noticePeriodDays`, `limit`, and `sort` (`newest`, `oldest`, or `deadline`). Search expands skill
and title ontology terms while querying only CampusPe's internal database.

Authenticated recommendations are served by `GET /api/jobs/recommendations`.
The signed-in jobs portal and job-alert eligibility use a 70% relevance floor.
Visible scores show the actual weighted result and include an explainable breakdown. Interaction signals
can be recorded at `POST /api/jobs/:jobId/interactions` with `view`, `click`,
`save`, `dismiss`, `apply`, or `abandon`.

The Selenium connector enforces `robots.txt`, exact-domain allowlisting, HTTPS,
rate-limited page loads, same-host job links, bounded pages, and Schema.org
`JobPosting` extraction. It stops immediately on login redirects, CAPTCHA, bot
challenges, or access-denied pages. It never authenticates, reuses user cookies,
clicks challenge controls, or evades rate limits. `SELENIUM_JOB_SOURCES` is an
operator attestation; retain the applicable permission or terms review before
setting its `permission` field.

CampusPe does not crawl authenticated portals or bypass anti-bot controls.
LinkedIn, Naukri, Indeed and similar sources must only be enabled where their
terms and applicable law explicitly permit the configured collection method.
All public provider requests use the identifying user-agent, per-origin request
spacing with jitter, bounded redirects and payload sizes, and retry backoff for
rate limits and temporary upstream failures. The shared client caches and
enforces `robots.txt` rules before fetching provider or career-page data. HTTPS URLs containing credentials and
local/private-network targets are rejected.

## ATS match scoring

The final resume match percentage is calculated only from resume evidence:

`hard skills × 40% + experience/seniority × 30% + domain/context × 30%`

Location, salary preference, education, certifications, job title, and posting freshness
remain explainable supporting signals. AI analysis returns the three ATS component
scores, relevant years, qualification status, matched core
skills, missing critical skills, and a two-sentence justification. CampusPe
validates every component and recalculates the final total server-side, so an
incorrect model-supplied total is never stored or shown. When AI is unavailable,
the local matcher follows the same formula.
