# Auto Decla LMNP

Local, no-LLM French LMNP tax declaration guide.

This project runs a small FastAPI backend and a static web UI. It does not call an
AI model. The app uses:

- a local rules engine for LMNP eligibility, micro-BIC / reel guidance, CFE and
  social contribution reminders;
- a local official-source corpus for searchable citations;
- a local service database for foreigner-facing workflows such as French tax
  filing, health insurance, first residence-card applications and residence-card
  renewals;
- a form draft generator that tells you what to copy into the French tax
  declaration interface.

The form's income-year selector is generated from the computer's current year.
It keeps the historical years from 2024 and adds the current year plus one year,
so the selector does not need a yearly code change. For example, income in 2026
is generally declared in 2027, while income in 2027 is generally declared in
2028.

The current checked rules and source corpus are still maintained manually. A new
year appearing in the selector does not mean that the new year's tax thresholds,
forms, rates, or official guidance have already been verified.

## Run With Docker

```powershell
docker compose up --build
```

Then open:

```text
https://localhost:8443
```

The local HTTPS certificate is issued by Caddy's internal CA, so the browser may
show a certificate warning. Only HTTPS port `8443` is published to the host.
There is no host HTTP port and there is no HTTP-to-HTTPS redirect.

The internal application port `8080` is used only between Docker containers; it
is not directly accessible from the host.

`Caddyfile` is required even though there is no redirect. It enables local TLS
and reverse-proxies HTTPS requests to the internal FastAPI container.

## Offline Corpus

The app ships with a small official-source seed corpus in
`backend/data/official_corpus.seed.json`. You can add your own downloaded official
HTML/PDF text extracts to `backend/data/official_corpus.local.json` using the same
shape.

The backend reads both files at startup. No network access is required at runtime.

## Local Service Modules

The home screen also exposes local workflow modules for:

- foreigner tax filing;
- foreigner health insurance / CPAM setup;
- first residence-card applications;
- residence-card renewals.

These modules are stored in `backend/data/services.seed.json` and served through
`/api/services`. They are local checklists and field guides only. They do not
connect to impots.gouv.fr, ameli.fr, ANEF or prefecture systems, and they do not
submit any application.

To refresh a local copy from official websites, run this manually when you have
network access:

```powershell
cd backend
python scripts/fetch_official_corpus.py
```

The running app never calls these websites by itself.

## Updating For A New Year

The year selector is automatic, but tax law and official forms are not. Before
using a new tax year, update and manually verify the following:

1. Add the new official LMNP, 2042-C-PRO, 2031-SD, BOFiP, Service-Public and CFE
   sources to `backend/data/official_corpus.seed.json`, or put locally downloaded
   documents in `backend/data/official_corpus.local.json`. Keep the old sources
   because old returns may still need to be checked.
2. Update the source IDs in `backend/app/rules.py` under `SOURCE_IDS` so generated
   results cite the new official documents.
3. Review every year-dependent rule in `backend/app/rules.py`, including Micro-BIC
   thresholds, abattement rates, LMNP/LMP tests, exemptions, deficit handling and
   depreciation limits.
4. Review the 2031 and 2042-C-PRO field guide, the official PDF URL, and the
   year-specific explanations in `frontend/assets/app.js`.
5. Run the tests and rebuild the service:

```powershell
cd D:\code\auto_decla
docker compose exec -T lmnp python -m pytest
docker compose up -d --build lmnp
```

The backend accepts the current calendar year and the following year dynamically.
It rejects a tax year more than one year in the future, but this validation only
controls the date range; it does not verify that the corresponding tax rules have
been updated. Always check the new official documents before filing.

## Tests

```powershell
docker compose exec -T lmnp python -m pytest
```

## Important Boundary

This is a local guidance tool, not a tax adviser and not an automatic filing
system. It prepares a declaration checklist and draft based on official-source
rules. It does not submit anything to impots.gouv.fr.
