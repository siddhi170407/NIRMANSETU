# NirmanSetu

NirmanSetu is a cloud-based Public Infrastructure Project Monitoring System.
This repository contains a Django REST Framework backend foundation and the
Lovable-generated NirmanSetu React interface, integrated into `frontend/`.

The backend now includes the PostgreSQL ORM foundation. See
[database design](docs/database-design.md), the [ER diagram](docs/er-diagram.md),
the [schema snapshot](database/schema.sql), and [SQL examples](database/queries.sql).

The planned roles are Administrator, Project Manager, Inspector, Contractor, and
Auditor. The planned lifecycle is:

**Project → Contract → Milestones → Inspection → Payment → Completion**

The frontend demonstrates these workflows using the original Lovable sample
data. The backend has database models and Django authentication tables; frontend
authentication, authorization, and business API integration are still pending.
Azure hosting, Azure Blob Storage, and Power BI are reserved for
later phases. See [frontend/README.md](frontend/README.md) for source provenance
and integration details.

## Stack

- Backend: Python, Django 5.2 LTS, Django REST Framework
- Frontend: React, TypeScript, Vite, TanStack Router, Tailwind CSS, Radix UI, Recharts
- Database: PostgreSQL, configured through environment variables

## Repository layout

```text
NIRMANSETU/
├── backend/
│   ├── config/           # Django settings, root URLs, ASGI and WSGI entry points
│   ├── core/             # Public health endpoint and database-free tests
│   ├── infrastructure/   # Domain models, migrations, PostgreSQL guards, and tests
│   ├── .env.example      # Local Django and PostgreSQL settings; no real credentials
│   ├── manage.py         # Django command-line entry point
│   └── requirements.txt  # Python dependencies
├── frontend/
│   ├── src/              # Imported routes, components, styles, assets, and sample data
│   ├── .env.example      # Public API path and local development proxy target
│   ├── index.html        # HTML entry point
│   ├── package.json      # Dependencies and dev/build/lint scripts
│   ├── package-lock.json # Reproducible npm dependency versions
│   ├── eslint.config.js  # TypeScript/React lint rules from the source
│   └── vite.config.ts    # Router, React, Tailwind, and /api development proxy
├── database/             # PostgreSQL schema snapshot and executable SQL examples
├── docs/                 # Database design and Mermaid ER diagram
├── .gitattributes        # Consistent text line endings across platforms
└── .gitignore           # Excludes local secrets, environments, and generated files
```

## Prerequisites

- Python 3.12–3.14 (Python 3.14 was used for setup)
- Node.js 22.12+ or Node.js 24 LTS, with npm
- A running local PostgreSQL 14+ instance and its command-line tools

Commands below use PowerShell and start in the repository root. Use `npm.cmd`
on Windows if PowerShell blocks the `npm.ps1` wrapper. On macOS/Linux, use
`python3`, `.venv/bin/python`, `cp`, and `npm` in place of their Windows equivalents.

## Backend setup

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
Copy-Item .env.example .env
```

Skip the copy if you already have a configured `.env`. Environment variables
set in the shell take precedence over `.env`. Virtual environment activation is
optional because these commands call its Python executable directly.

Create a local PostgreSQL role and database using your local PostgreSQL
administrator account (substitute its name if it is not `postgres`):

```powershell
createuser -U postgres --pwprompt nirmansetu
createdb -U postgres --owner=nirmansetu nirmansetu
```

These commands prompt for passwords; none are stored in this repository. If the
tools are not on PATH, use their full paths from your PostgreSQL installation.
Set `POSTGRES_PASSWORD` in `backend/.env` to the password you chose, and adjust
the database name, user, host, or port to match your local server. The example
password is intentionally empty and PostgreSQL must be configured by you.

The example Django key is a public development placeholder, usable only with
`DJANGO_DEBUG=True`. A non-development key must be supplied before deployment;
settings reject the example key with debug disabled. These are local setup
settings, not a production deployment configuration.

Apply Django's built-in and infrastructure migrations and start the API:

```powershell
.\.venv\Scripts\python.exe manage.py check
.\.venv\Scripts\python.exe manage.py migrate
.\.venv\Scripts\python.exe manage.py runserver 127.0.0.1:8000
```

Health endpoint: <http://127.0.0.1:8000/api/health/>

```json
{"status": "ok", "service": "NirmanSetu API"}
```

This public, read-only endpoint checks API liveness only. It does not query
PostgreSQL or confirm that any external service is ready. Django's normal
`runserver` startup and `migrate` commands still need the configured database.
The `infrastructure` app provides project, contract, milestone, inspection,
payment, contractor, document, and activity-log models with three migrations.
The five roles use Django's existing auth groups; business APIs are still pending.

## Frontend setup

Open a second terminal in the repository root:

```powershell
cd frontend
npm.cmd ci
Copy-Item .env.example .env
npm.cmd run dev
```

Open <http://127.0.0.1:5173>. The frontend displays the imported Lovable dashboard
and pages using their existing sample data. Keep the terminal running while you
use the local URL. These demo pages run independently of Django and PostgreSQL.
Vite forwards `/api` requests to `http://127.0.0.1:8000` by default, so local API
requests use the same browser origin without a separate CORS package. The Django
health endpoint remains available at `/api/health/` when the backend is running.

`VITE_API_BASE_URL` is reserved for future API integration (default `/api`).
`API_PROXY_TARGET` configures only the Vite development proxy. Never put secrets
in `VITE_*` variables: they are included in browser assets. Restart Vite after
changing its environment variables. Production hosting will need an `/api`
reverse proxy or separately configured API origin and CORS; the development
proxy is not included in a production build or Vite preview.

## Setup checks

Backend checks, from `backend/` after copying `.env.example`:

```powershell
.\.venv\Scripts\python.exe -m pip check
.\.venv\Scripts\python.exe manage.py check
.\.venv\Scripts\python.exe manage.py test core --verbosity 2
```

The health tests use `SimpleTestCase`, forbid database access, and check the
public JSON response and rejection of write requests. They can run without a
PostgreSQL server. Once PostgreSQL is configured, also run:

```powershell
.\.venv\Scripts\python.exe manage.py migrate --check
.\.venv\Scripts\python.exe manage.py makemigrations --check --dry-run
.\.venv\Scripts\python.exe manage.py test --noinput
```

The full suite needs PostgreSQL and permission to create a separate test database.
Database foundation verification passed all 19 tests in an isolated PostgreSQL
18.6 cluster on 7 November 2026. Migrations, schema restoration, SQL examples,
and trigger checks also passed; see [verification details](docs/database-design.md).

Frontend checks, from `frontend/`:

```powershell
npm.cmd run lint
npm.cmd run build
npm.cmd test
npm.cmd run typecheck
```

The production build is generated in the ignored `frontend/dist/` directory.
To preview just those static assets locally, run `npm.cmd run preview`.

## Initial setup results (30 October 2026)

- Django system check: passed with no issues.
- Health API tests: 2 passed, with database access disabled.
- Python dependency check: passed.
- Frontend lint and production build: passed.
- npm installation audit: reported 0 vulnerabilities.
- Browser check: homepage rendered with Tailwind styling; the health link
  returned the expected JSON through the Vite proxy. This check used a temporary
  Python WSGI server to load Django without the database-dependent `runserver`
  migration check. It does not validate database connectivity.
- PostgreSQL migration check: could not complete because the connection to
  `127.0.0.1:5432` timed out. No database migrations were applied. Configure and
  start your local PostgreSQL instance before the normal backend startup steps.

The setup environment initially blocked temporary files and network access;
dependency installation succeeded after running with the required permissions.
On this Windows machine, npm also needed the system certificate store. If npm
reports `UNABLE_TO_VERIFY_LEAF_SIGNATURE`, use the following in the current
PowerShell session with Node.js 24, then retry the install:

```powershell
$env:NODE_USE_SYSTEM_CA = '1'
npm.cmd ci
```

This keeps certificate verification enabled and uses certificates trusted by
Windows. No global npm or system security settings were changed.

Configuration references: [Django 5.2](https://docs.djangoproject.com/en/5.2/),
[Django REST Framework](https://www.django-rest-framework.org/),
[Vite](https://vite.dev/guide/), and
[Tailwind with Vite](https://tailwindcss.com/docs/installation/using-vite).
