# MCF Astryx Full-Stack Pilot

Disposable, non-production qualification fixture for the MCF full-stack visual-development capability.

## What it proves

- React 19 application using Astryx Core components and the Neutral theme.
- Vite production build.
- API server with server-side bearer authorization and parameterized SQL.
- Isolated PostgreSQL schema created and dropped per run.
- Versioned SQL migration.
- End-to-end create/read flow.
- Desktop and mobile Playwright screenshots compared against committed pixel baselines.
- PostgreSQL transaction rollback and automatic per-run schema cleanup.
- Accessibility scan with axe-core and mobile horizontal-overflow check.
- No production credentials, deploy, or product database access.

## Run

Use Node 22+, PostgreSQL and the pinned dependencies:

    npm ci
    npm run build
    npx playwright install --with-deps chromium
    export DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/mcf_astryx_pilot
    export MCF_PILOT_TOKEN=local-test-token-with-at-least-24-chars
    npm run test:e2e

To intentionally regenerate visual baselines after a reviewed design change:

    UPDATE_VISUAL_BASELINES=1 npm run test:e2e

The baseline update is not an ordinary test mode; review and commit the generated visual-baselines.json explicitly.

## CI qualification

The MCF workflow installs only from the committed `package-lock.json` with `npm ci`, then compares desktop and mobile screenshots against the committed `visual-baselines.json`. CI never regenerates baselines automatically. It also verifies the PostgreSQL transaction rollback and per-run schema cleanup; the workflow has no deploy step and uses only an ephemeral test database.
