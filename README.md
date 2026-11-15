# Scheme Saathi

Scheme Saathi helps Indian citizens explore government schemes and check which
ones may fit their circumstances. It is an informational tool; the concerned
government department makes final eligibility decisions.

## Requirements

- Node.js 20 or later and npm
- MongoDB connection string

## Run locally

1. Install dependencies:

   ```sh
   cd server && npm install
   cd ../client && npm install
   ```

2. Copy `server/.env.example` to `server/.env` and `client/.env.example` to
   `client/.env`. Replace the `MONGO_URI` placeholder in `server/.env` with
   your MongoDB connection string. Keep `.env` files private; they are ignored
   by Git.
3. In one terminal, start the API:

   ```sh
   cd server && npm run dev
   ```

4. In another terminal, start the web app:

   ```sh
   cd client && npm run dev
   ```

The Vite development server prints the local client URL. The API health check is
available at `http://localhost:5000/api/health`.

## Phase 1 checks

- API: `curl http://localhost:5000/api/health`
- Client production build: `cd client && npm run build`

The API connects to MongoDB before it starts accepting requests. Check the
database connection and scheme document count with:

```sh
cd server && npm run db:check
```

## Data ingestion

The seed adapter loads 20 centrally administered schemes from
`server/data/seed.json`. Set `ENABLED_SOURCES` in `server/.env` to a
comma-separated list of `seed`, `datagov`, and/or `huggingface`.

- Load only the curated seed data: `cd server && npm run seed`
- Sync the configured sources: `cd server && npm run sync`
- Run the parser and ingestion unit tests: `cd server && npm test`

For `datagov`, configure `DATA_GOV_API_KEY` and comma-separated
`DATA_GOV_RESOURCE_IDS`. For a local Hugging Face dataset, set `HF_DATASET_PATH`
to a CSV or JSON file; relative paths are resolved from the `server` directory.
Network fetch errors are retried with exponential backoff. Set
`ENABLE_CRON=true` to schedule daily sync at 2:00 AM and weekly link checks at
3:00 AM Sunday (India time); cron is disabled by default.

## Scheme API

- `GET /api/schemes?q=farmer&category=Agriculture&state=Maharashtra&level=Central&page=1&limit=12`
  returns matching schemes with pagination metadata. State-filtered results
  include both state-specific schemes and schemes available across India.
- `GET /api/schemes/:slug` returns one scheme or a JSON 404 error.
- `POST /api/match` accepts eligibility answers as JSON and returns
  `{ "eligible": [], "partial": [] }`. Answers are validated in memory only
  and are not written to the database or logged.

All API validation and server errors use a JSON `error` object. The API limits
requests to 100 per 15 minutes per IP and restricts browser CORS to
`CLIENT_ORIGIN` plus Scheme Saathi's Vercel deployment URLs. Set
`CLIENT_ORIGIN` to a comma-separated list of exact allowed origins, for example
`http://localhost:5173,https://your-site.example`; spaces and trailing slashes
are ignored. Outside production, any `http://localhost:<port>` or
`http://127.0.0.1:<port>` origin is also allowed, so Vite's changing dev port
does not block API requests. In production, exact configured origins and
origins matching
`^https://scheeme-saathi[a-z0-9-]*\.vercel\.app$` are allowed; unrelated
`*.vercel.app` projects are not. Requests without an `Origin` header (such as
curl and health checks) are allowed.

Vite uses port 5173 with strict port checking. If that port is occupied, stop
the other process rather than relying on Vite to silently select another port.

## Phase 4 checks

Run the API and ingestion unit tests with `cd server && npm test`. For manual
checks, keep the API running with `cd server && npm run dev`, then use:

```sh
curl "http://localhost:5000/api/schemes?page=1&limit=12"
curl "http://localhost:5000/api/schemes/pm-kisan"
curl -X POST "http://localhost:5000/api/match" -H "Content-Type: application/json" -d "{\"age\":30,\"gender\":\"female\",\"state\":\"Maharashtra\",\"area\":\"Rural\",\"income\":100000,\"category\":\"OBC\",\"occupation\":\"farmer\",\"education\":\"graduate\",\"disability\":false,\"maritalStatus\":\"married\",\"ownsLand\":true,\"bpl\":false}"
```

## Frontend

Start the client with `cd client && npm run dev`. The home page links to the
eligibility wizard and scheme directory. Wizard answers are held in React state
and `sessionStorage` only; use **Start over** to clear them. Run the wizard tests
with `cd client && npm test`, and create a production build with
`cd client && npm run build`.

Run all server and client tests from the project root with `npm run test:all`.
There is no lint configuration in this repository; CI runs the test suites and
client production build on pushes and pull requests.

## Phase 6 extras

The server checks official links with `cd server && npm run check-links`.
Checks are also scheduled weekly for Sunday at 3:00 AM India time. HTTP 403
and 429 responses are treated as unknown; broken links are marked for review.
The client has English and Hindi translations, remembers the language in
`localStorage`, and keeps scheme names and descriptions in the source language
returned by the API. Replace `YOUR_DOMAIN` in `client/public/robots.txt` and
`client/public/sitemap.xml` with the deployed site host before publishing.

## Phase 7: tests and production deployment

### Verify locally

From the project root, run:

```sh
npm run test:all
npm run build
npm run audit
```

The test command runs the server suite (matching, parsing, link checks, and
Supertest API coverage) followed by the client suite (wizard, language toggle,
and page metadata). The audit gate fails on high or critical findings; review
the reported moderate findings as well. `VITE_API_URL` is embedded during the
client build; set it in the hosting provider before building. Set the value to
the API server host, with or without a trailing `/api` (for example,
`https://your-api.example` or `https://your-api.example/api`); the client trims
the value and normalizes it to exactly one `/api` suffix. In development, an
empty value defaults to `http://127.0.0.1:5000`.

### MongoDB Atlas

1. Create a MongoDB Atlas cluster and a dedicated database user for Scheme
   Saathi. Grant `readWrite` only on the dedicated application database (or
   use a narrower custom role); do not use an Atlas administrator account.
2. In **Network Access**, allow the hosted server's outbound IP addresses (or
   the provider's documented egress range). Avoid a worldwide `0.0.0.0/0`
   rule when the host can provide stable outbound addresses.
3. Copy the Atlas connection string into the server host's `MONGO_URI`
   environment setting. Replace its username/password placeholders in the
   hosting dashboard only; never commit them to a file.

### Deploy the API to Render

Create a Web Service connected to this repository and configure:

- **Root directory:** `server`
- **Runtime:** Node
- **Build command:** `npm ci --omit=dev`
- **Start command:** `npm start`
- **Health check path:** `/api/health`

Set these environment variables in Render's dashboard; use your own values,
not the placeholders below:

```text
MONGO_URI=<Atlas connection string>
PORT=<provided by Render>
CLIENT_ORIGIN=<deployed client origin, for example https://your-site.example>
DATA_GOV_API_KEY=<optional data.gov.in API key>
DATA_GOV_RESOURCE_IDS=<optional comma-separated resource IDs>
ENABLED_SOURCES=seed
ENABLE_CRON=false
NODE_ENV=production
```

Set `ENABLE_CRON=true` only if the service will remain available to execute
scheduled jobs. A sleeping free-tier service may miss cron schedules.
`HF_DATASET_PATH` is optional and only needed when a dataset file is available
on the server's filesystem. CORS allows exact origins listed in `CLIENT_ORIGIN`
and Scheme Saathi Vercel preview URLs matching
`https://scheeme-saathi[a-z0-9-]*.vercel.app`; it does not allow every Vercel
site.

### Deploy the client to Vercel

Import the same repository as a separate Vercel project:

- **Root directory:** `client`
- **Build command:** `npm run build`
- **Output directory:** `dist`
- **Environment variable:** `VITE_API_URL=<deployed API server host, with or without /api>`

Set `VITE_API_URL` to the Render API host, either with or without `/api`, for
the production environment before triggering the build. The client adds one
`/api` suffix, so it will call `/api/schemes`, `/api/schemes/:slug`, and
`/api/match` without duplicating the prefix.
The `client/vercel.json` rewrite supports direct refreshes on React Router
routes. For Netlify, deploy `client/dist`; `client/public/_redirects` supplies
the equivalent single-page-app fallback.

### Seed and sync production data

Use the Render Shell for the service (working directory `server`) to run:

```sh
npm run seed
npm run sync
```

`seed` loads curated seed records only. `sync` uses `ENABLED_SOURCES`; verify
the configured sources and environment before running it. These commands need
the production `MONGO_URI` available to the service.

### Add a data source adapter

1. Add an adapter module under `server/services/adapters/` exporting
   `fetchSchemes()` and `normalize(record)`.
2. Normalize each source record to the Scheme model shape. Use `null` when a
   value is unknown; skip records without a valid HTTPS official link.
3. Register the source name in `server/services/syncService.js` and add it to
   `ENABLED_SOURCES` only where configured.
4. Add focused adapter/normalization tests, then run `npm run test:all`.

### Security and privacy checklist

- Keep `.env` files, API keys, and database credentials out of Git and images;
  use the hosting providers' secret environment settings.
- Use a least-privilege database user and restrict Atlas network access.
- Set `CLIENT_ORIGIN` to exact production client origins; the API additionally
  permits only Scheme Saathi Vercel URLs matching the project-specific pattern.
  Do not use a wildcard CORS origin.
- Keep Helmet and API rate limiting enabled. Avoid logging `/api/match`
  requests or their answers.
- Eligibility answers stay in the user's browser session and are not stored
  by the server.
- Review `npm audit` output and update dependencies regularly; re-run tests
  after dependency changes.
- Keep `NODE_ENV=production` on the hosted API and do not expose stack traces
  to production clients.

### Post-deployment checks

- Open `https://<your-api-host>/api/health` and confirm the API reports
  `"status":"ok"`.
- Complete the full eligibility wizard and verify the results page and scheme
  detail pages load.
- Switch to Hindi and refresh; verify translations and language persistence.
- Open official scheme links and check any link-under-review notices.
- Test the site at mobile widths and refresh a direct `/scheme/:slug` URL.

## Phase 8: live data and manual review

### Configure and sync live sources

The adapters map common column names through
`server/config/columnMaps.js`. Hugging Face accepts a local CSV or JSON file
from `HF_DATASET_PATH`; data.gov.in needs `DATA_GOV_API_KEY` and one or more
`DATA_GOV_RESOURCE_IDS` in `server/.env`. No credentials or answer data belong
in source files. Dataset fields not covered by the aliases should be added to
the corresponding map after checking the dataset header row.

On PowerShell, run a one-time sync of all sources from the `server` directory:

```powershell
$env:ENABLED_SOURCES = "seed,datagov,huggingface"
npm run sync
Remove-Item Env:\ENABLED_SOURCES
```

The sync reports fetched, inserted, updated, skipped, failed, and same-slug
duplicate-merge counts per source. Source priority is seed, then data.gov.in,
then Hugging Face; non-empty higher-priority fields are retained. The adapter
skips data.gov.in or Hugging Face cleanly when its configuration is absent.
Possible similar-name pairs are reported for manual review and are never
automatically merged.

### Command-line review and data quality

These workflows are command-line only; there are no public admin routes:

```sh
cd server
npm run review:list
npm run review:approve -- pm-kisan
npm run data:report
```

Review each official source manually before approving a slug. Approval marks
the scheme verified and clears `needsReview`. Seed records are verified by
default; other sources are unverified. Unverified schemes appear only in the
results page's check-these section. The data report includes source and
verification counts, missing official links, empty eligibility fields, and
possible similar-name pairs for manual review.

### Accessibility checks

Run Lighthouse in Chrome DevTools on the home, wizard, results, browse, and
scheme-detail pages at both desktop and mobile viewport sizes. Review the
Accessibility, Performance, Best Practices, and SEO categories. Also verify
keyboard-only navigation and visible focus, screen-reader announcements for
wizard progress/errors, form labels and required states, and contrast for
verification/link-status badges. No user answers are stored by these checks.
