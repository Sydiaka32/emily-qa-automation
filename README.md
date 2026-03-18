# Emily QA Automation Framework (FinTech API)

Automation framework for a FinTech web-service platform, built around **API-first testing** with reusable utilities for **authentication**, **request context management**, **domain-specific helpers**, and optional **database-level verification**.

## What this project covers

- **API regression testing** across multiple bounded contexts (e.g. core, clearing, exchange, credit-transfer)
- **Auth flows** (OIDC-style token acquisition via an identity provider)
- **Reusable API client helpers** (GET/POST/PUT/DELETE wrappers with safe JSON parsing)
- **Environment-driven configuration** via `dotenv`
- **Data generation** utilities (Faker + date helpers)
- **Optional DB assertions** using Postgres (`pg`) to cross-check ledger results
- **Performance testing artifacts**: a JMeter test plan in `performanceTestPlans/`

## Tech stack

- **TypeScript**
- **Playwright Test** (`@playwright/test`) — used as a test runner + API client (`request.newContext`)
- **dotenv** — configuration via environment variables
- **Allure** (dependency included) — optional richer reporting if enabled
- **PostgreSQL** (`pg`) — optional backend verification layer

## Repository structure

- **`tests/`**: API test suites (`*.spec.ts`) grouped by domain
- **`utils/`**: reusable building blocks
  - **`utils/apiUtils/`**: request context + HTTP helpers + domain API wrappers
  - **`utils/auth/`**: access token helpers
  - **`utils/*Service/`**: higher-level domain workflows and verifications (compose multiple API calls)
  - **`utils/general/`**: shared assertions + JWT helpers + optional DB client
- **`data/`**: generators and date utilities used by tests
- **`playwright.config.ts`**: runner configuration and suite selection
- **`test.config.ts`**: single place to read env vars into a typed config object
- **`performanceTestPlans/`**: JMeter plans for load/perf scenarios

## Getting started

### Prerequisites

- Node.js \(LTS recommended\)
- npm

### Install

```bash
npm ci
```

### Configure environment variables

This project reads configuration from environment variables in `test.config.ts` via `dotenv`. Create a local `.env` file (not committed) with values matching your environment.

Minimum common variables used by tests include:

```bash
# Base URLs
API_BASE_URL=
BACKOFFICE_BASE_URL=
PUBLIC_BASE_URL=

# Auth / Identity provider (Keycloak-like)
KEYCLOAK_MP_URL=
KEYCLOACK_MP_LOGIN=
KEYCLOACK_MP_PWD=

# Test principals
MEMBERNAME=
PASSWORD=
MAKER_NAME=
TAKERNAME=
OPERATOR_NAME=

# Identifiers
MEMBER_XMI=
MAKER_XMI=
CL_MEMBER_XMI=
CL_MEMBER_NAME=
INDIRECT_MEMBER_XMI=
INDIRECT_MEMBER_NAME=
SET_MEMBER_XMI=
RECEIVER_NAME=
RECEIVER_XMI=

# Public API
PUBLIC_API_KEY=

# Messaging (if applicable to your environment)
SENDER_MEMBER_ISO=
RECEIVER_CLEARING_ISO=
RECEIVER_MEMBER_ISO=

# Optional: DB verification (ledger)
DB_HOST_LEDGER=
DB_PORT=
DB_NAME_LEDGER=
DB_USERNAME_LEDGER=
DB_PASSWORD_LEDGER=
```

If your environment uses different naming conventions, align them in `test.config.ts` once, and the rest of the framework stays clean.

## Running tests

### Run the full suite

```bash
npx playwright test
```

### Run a subset by path

```bash
npx playwright test tests/api/core
```

### Use configured “projects” (suite selection)

`playwright.config.ts` defines projects so you can target a suite via `--project`:

```bash
npx playwright test --project=default
```

## Reports

- **HTML report**: Playwright is configured with `reporter: "html"`.

After a run:

```bash
npx playwright show-report
```

If you want Allure reporting, enable a Playwright reporter configuration and generate results (dependency `allure-playwright` is already included).

## How tests are written (design highlights)

- **API context as a first-class primitive**: `utils/apiUtils/requestContext.ts` creates a Playwright request context with optional bearer token.
- **Stable request helpers**: `utils/apiUtils/httpMethods/` wraps calls and handles JSON vs text responses predictably (useful when APIs return empty bodies on PUT/DELETE).
- **Workflow-level utilities**: `utils/*Service/` composes multiple API calls to represent real business processes (more maintainable than duplicating steps in each spec).
- **Stateful tests handled safely**: when an endpoint mutates shared state, tests use serial execution + restore logic (example: connectivity callback URL update).

## Performance testing

A JMeter plan is included in `performanceTestPlans/`. It’s meant as a reference artifact showing how load testing can complement functional API coverage.

## Notes on security & portability

- **Secrets must come from environment variables**. Do not commit credentials or tokens.
- If you plan to publish this repository, **audit test data and configs** (including any JMeter plans) and redact sensitive values.

## License

Add a license that matches how you intend to share this project (e.g., MIT for portfolio use).
