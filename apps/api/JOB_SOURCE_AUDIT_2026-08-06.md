# CampusPe Job Source Audit — 2026-08-06

This report records the live MongoDB and UI audit performed against the CampusPe staging environment. It distinguishes authentic fetched jobs from catalog entries that are inactive, unsupported, blocked, obsolete, or require permission.

## Result summary

| Check | Result |
| --- | ---: |
| Active public jobs after synchronization | 2,275 |
| Sources with a successful synchronization | 33 |
| Active jobs with a location record | 2,275 |
| Jobs with no recognized structured/canonical skill | 97 |
| Suspicious minimum experience above 15 years | 3 |
| Descriptions still containing an HTML entity | 10 |
| Jobs whose industry is intentionally `Not specified` | 1,250 |

`Not specified` is retained when the source does not provide reliable industry evidence. CampusPe does not invent an industry merely because a description contains words such as “financial,” “learning,” “security,” or “AI.” Jobs with no recognized skills remain empty rather than receiving dummy skills.

## Successfully represented job types

All public API filter checks returned HTTP 200 with authentic database records:

- Full-Time
- Part-Time
- Internship
- Freelance
- Gig/Flexible (`contract` internally)
- Remote work-mode filter
- Keyword search

## Provider state

| Provider | Active source records | Notes |
| --- | ---: | --- |
| Ashby | 9 | Public ATS connector |
| Greenhouse | 10 | Includes corrected Inflection AI tenant |
| Lever | 3 | Includes current Mistral tenant; it currently returns zero open records |
| Workday | 10 | Public CXS career-site endpoints |
| Himalayas | 1 | Public JSON job feed |
| We Work Remotely | 1 | Public RSS feed |
| SmartRecruiters | 0 | Disabled because the API robots policy disallows this automated connector |
| Selenium pages | 0 | No source has the required permission and exact-domain configuration |

## Inactive or not fetched

| Category | Count | Reason |
| --- | ---: | --- |
| Job portal catalog | 44 | Official API/licence, written permission, or explicit automation terms required |
| Career pages whose lightweight discovery failed | 273 | Includes obsolete URLs, DNS failures, 403/406 responses, timeouts, certificate failures, and robots exclusions |
| Career pages without a supported structured source | 229 | No verified public ATS endpoint or Schema.org `JobPosting` data |
| Verified catalog pages represented by ATS records | 30 | Catalog row remains inactive to avoid duplicate ingestion |
| Government source catalog | 62 | Dedicated official structured-feed adapters are not yet verified |

CampusPe does not use Selenium to bypass login walls, CAPTCHA, access-denied pages, robots exclusions, or provider terms.

## Stale or blocked connector records disabled

| Source | Old connector | Resolution |
| --- | --- | --- |
| Mistral AI | Ashby `mistral` | Disabled; replaced with the public Lever tenant `mistral` |
| Inflection AI | Greenhouse `embed` | Disabled; replaced with verified Greenhouse tenant `inflectionai` and fetched successfully |
| Dream Sports | Lever `dreamsports` | Disabled because the public tenant returns 404 |
| Bosch Group | SmartRecruiters | Disabled because automated API collection is disallowed by robots policy |
| Western Digital | SmartRecruiters | Disabled because automated API collection is disallowed by robots policy |
| Bank of America | Obsolete Workday URL | Disabled because the endpoint returns 404 and the official site uses another platform |

## Data-quality corrections applied

- Minimum-age statements such as “must be at least 18 years of age” are no longer interpreted as experience.
- Structured employment types take precedence over incidental words in descriptions.
- A manager responsible for an internship program is no longer classified as an intern.
- Workday placeholder rows without a real title or path are skipped.
- Numeric and named HTML entities are decoded before storage and display.
- Industry is stored as `Not specified` unless supported by explicit evidence.
- Existing authentic jobs were migrated through normalization version 5.

## UI verification

- Personalized job cards load from `/api/jobs/recommendations` and show actual company, title, match score, location, salary, date, type, and extracted skills.
- Location filters are built from returned jobs instead of a hard-coded city list.
- `Not specified` location fragments are removed.
- Salary filtering uses numeric minimum salary rather than parsing the formatted display string.
- Search returned the correct Vercel record during the live browser test.
- Work-type filtering and all five job-type controls were exercised.
- No horizontal page overflow was detected in the tested desktop layout.

For the complete name-and-URL catalog, see `JOB_SOURCE_INVENTORY.md`.
