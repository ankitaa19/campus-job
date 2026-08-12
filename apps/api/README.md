# CampusPe API

## Bulk auto-apply worker

Bulk auto-apply uses BullMQ with one queue job per application task. Run the API and worker as separate processes:

```bash
npm run start
npm run worker
```

The API process creates runs, task rows, and queue jobs. The worker process connects to MongoDB and Redis, processes `bulk-auto-apply` jobs, and reconciles orphaned runs.

## Authorized ATS browser submission

Greenhouse and Lever use their official APIs when employer credentials are
configured. Browser adapters are available for authorized Greenhouse, Lever,
Ashby, SmartRecruiters, Workday, and generic employer forms.

Browser submission is disabled by default per employer. An administrator must
record either written permission (with an evidence URL) or provider terms that
allow automation:

```http
PATCH /api/jobs/sync/:provider/:companySlug/automation-permission
Authorization: Bearer <admin token>
Content-Type: application/json

{
  "permission": "written_permission",
  "evidenceUrl": "https://contracts.example.com/campuspe-employer-consent",
  "notes": "Employer approved candidate-authorized submissions"
}
```

Use `not_granted` to revoke permission. CAPTCHA, login/MFA, assessments, and
unanswered custom questions are never bypassed; those applications move to a
Needs You state.

Set `ATS_DEBUG_ARTIFACTS=true` only during controlled debugging. Failed browser
submissions then save a screenshot and a value-redacted HTML snapshot under
`ATS_DEBUG_ARTIFACT_DIR`. The application `atsResponseRaw.diagnostics` always
records final URL, title, visible buttons, visible required fields, page text
snippet, provider, and failed step. Artifact storage must be encrypted,
access-controlled, and subject to short retention.
