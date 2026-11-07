# NirmanSetu database foundation

## Scope and migration safety

The inspected backend contained the `core` health endpoint, Django's built-in
authentication apps, and no business models or project migrations. The new
`infrastructure` app adds nine domain tables. No React files were changed.

The default PostgreSQL connection on port 5432 timed out and `backend/.env` was
absent. At the user's request, verification uses a newly initialized, isolated
PostgreSQL 18 cluster, not an existing application database. No existing user
data was migrated, replaced, or deleted. Django's standard initial migrations
initialize authentication in this empty verification database.

Our forward migrations are additive:

1. `0001_initial`: new tables, foreign keys, checks, unique constraints, indexes.
2. `0002_seed_roles`: `get_or_create` the five Django groups; existing groups and
   memberships are preserved. Reversal deliberately leaves these groups intact.
3. `0003_database_guards_and_view`: payment/inspection guards, an append-only log
   trigger, and the financial summary view. It does not update existing rows.

Reversing `0001` would drop the new domain tables and their data. Do not reverse
it on a populated database. Reversing `0003` removes its view and protections.
Neither reversal was used for verification. Future changes to populated tables
should use staged, data-preserving migrations and reviewed backups.

## Entities and workflow

All domain entities use Django's `BigAutoField` identity primary key. Business
references are separate unique identifiers; changing a display reference does
not change a foreign key. Timestamps are timezone-aware (`timestamptz`). Dates
are calendar dates. Monetary amounts use `numeric(18,2)` in **INR**, never floats
or crore; the UI's crore display must be converted at the future API boundary.

| Model / table | Meaning and relationships |
| --- | --- |
| Django User / `auth_user` | Existing authentication identity. Referenced through `settings.AUTH_USER_MODEL`; no duplicate account or password table. |
| Django Group / `auth_group` | Role records: Administrator, Project Manager, Inspector, Contractor, Auditor. `auth_user_groups` gives users zero or more roles. Existing Django permission tables remain available. |
| Contractor / `ns_contractor` | A legal contractor organization, with a unique registration number and contact information. One organization may hold contracts on many projects. |
| ContractorMembership / `ns_contractor_membership` | Many-to-many association of users with contractor organizations. `(contractor_id, user_id)` is unique. Membership is separate from a user's system role. |
| Project / `ns_project` | Sanctioned infrastructure work, site, kind, manager, approved budget, planned dates, lifecycle status, and actual completion date. One manager can manage many projects. |
| Contract / `ns_contract` | A numbered procurement/work package between one project and one contractor. Stores contractual amount, signing/term dates, and its own status. A project can have multiple packages or contractors. |
| Milestone / `ns_milestone` | Ordered, weighted deliverable under one contract, with due date, measured progress, acceptance date, and status. Codes and sequence numbers are unique within a contract. |
| Inspection / `ns_inspection` | One scheduled or completed assessment of one milestone by one user, including result, score, and findings. A milestone can have repeated inspections/reinspections. |
| Payment / `ns_payment` | One payment request/installment backed by an inspection. Records amount, due date, requester, approval, release, and a unique bank transfer reference when paid. Multiple installments may reference the same passed inspection. |
| Document / `ns_document` | Metadata for one private file, with exactly one project, contract, milestone, inspection, or payment owner. Records its uploader, MIME type, byte size, and globally unique storage key. No file bytes, credentials, public URLs, or expiring SAS tokens are stored. |
| ActivityLog / `ns_activity_log` | Immutable event with one target (the five domain owners or a document), actor, action, occurrence time, explanatory text, optional IP, and correlation UUID. A null actor denotes a system event. |

The authoritative chain is:

`Project → Contract → Milestone → Inspection → Payment`

Follow foreign keys in reverse to recover a payment's contractor and project.
They are not duplicated on payment or inspection rows. Project completion is
represented by `Project.status = completed` plus `completed_on`; a completion
certificate can be a project-owned Document and the sign-off an ActivityLog.
Contracts also have their own completion date, and accepted milestones have
an acceptance date plus 100% recorded progress.

This initial payment model deliberately covers inspection-backed work payments.
The frontend's sample mobilisation advance is not silently forced into this
chain. Advances, refunds, deductions, invoice allocations, and multi-milestone
invoices will need explicit accounting entities in a later migration.

## Third normal form (3NF)

1. **1NF:** rows have stable primary keys; attributes are atomic domain values.
   Memberships are rows rather than comma-separated role/user lists. Files and
   events are separate rows rather than repeating columns on projects.
2. **2NF:** each attribute describes the complete row key. On membership rows,
   the join time describes the complete contractor/user association. Milestone
   identifiers are scoped by contract, so the complete candidate key is used.
3. **3NF:** non-key attributes do not describe a different entity. Organization
   names/contact details reside only on Contractor; authentication attributes
   only on User. Contract stores its project/contractor relationship. Milestone
   does not repeat project or contractor; Inspection does not repeat contract;
   Payment does not repeat milestone, contract, contractor, or project.

Budget expenditure, outstanding approved amounts, contractor names, and project
progress aggregates are derived through joins/aggregates. They are not copied
into Project. `ns_project_financial_summary` computes current totals, aggregating
contracts and payments independently before joining to avoid row multiplication.
The sanctioned budget and contract amount are distinct approvals, not redundant
copies. Measured milestone progress and its allocated weight are independent facts.

Documents and activity logs use an **exclusive arc**: multiple nullable real
FK columns, with a check requiring exactly one non-null target. A payment-owned
document does not also store its project ID. This keeps referential integrity
without an unconstrained generic `object_type/object_id` pair. Free text such as
an event message is historical narrative, not the current source of entity names.

## Roles and authorization boundary

`Role` is a Python choices enum for group names, not another Django model.
The seed migration creates groups only. It does not make users superusers,
assign group membership, or grant permissions. Django continues to own accounts,
password hashing, group membership, and model permissions.

Foreign keys identify responsible users. They do not assert those users currently
hold a particular group: people can change roles without invalidating historical
records. Future DRF permissions and services must authorize assignments, reviews,
and payments. ContractorMembership alone grants no application permission. The
frontend's current role selector is still a demo, not security enforcement.

## Status domains

Every status has both Django choices and a database check. `choices` alone would
not protect bulk updates or raw SQL.

| Entity | Stored codes |
| --- | --- |
| Project | `planning`, `active`, `on_hold`, `completed`, `cancelled` |
| Contract | `draft`, `awarded`, `active`, `on_hold`, `completed`, `terminated` |
| Milestone | `planned`, `in_progress`, `submitted`, `accepted`, `rejected`, `cancelled` |
| Inspection | `scheduled`, `in_progress`, `passed`, `observations`, `failed`, `cancelled` |
| Payment | `requested`, `under_review`, `approved`, `paid`, `rejected`, `cancelled` |

Lifecycle status is distinct from schedule risk: UI labels such as “Delayed” and
“At Risk” should later be calculated or explicitly modeled as risk assessments.
The schema validates valid states and evidence; it is not a full transition engine.

## Integrity and deletion

- Unique keys: project code, contract number, contractor registration, inspection
  reference, payment reference, document storage key, non-null transfer reference.
- Contract-scoped unique milestone code and sequence; unique company membership.
- Nonnegative project budgets; positive contract/payment amounts; milestone
  weights in `(0,100]`, progress in `[0,100]`, positive sequence, scores in `[0,100]`.
- Planned end cannot precede start; signing cannot follow contract start.
  Non-draft contracts require a signing date. Completion status and date must agree.
- Accepted milestones require an acceptance date and 100% progress. Final
  inspection results require `inspected_at`; a score requires an inspection date.
- Approval user/time must be supplied together; approved/paid payments require
  both. Paid payments require release time and nonempty unique transaction
  reference. Release cannot precede approval. Non-paid rows have no release data.
- PostgreSQL triggers reject payment approval/release against a non-passed
  inspection and reject invalidating an inspection with approved/paid payments.
  Approval locks the inspection row to serialize it with inspection updates.
  `Payment.clean()` also provides a friendly validation error, but the database
  trigger remains authoritative for saves, bulk updates, and raw SQL.
- All domain and user-reference FKs use `PROTECT`. Business parents and referenced
  accounts cannot be deleted through Django while evidence depends on them.
  PostgreSQL's actual deferred FKs use `NO ACTION`, not cascading deletes, and
  also reject dangling references from raw SQL by transaction commit. Deactivate
  accounts/contractors or use cancelled/terminated statuses to retain history.
- Activity rows reject UPDATE and DELETE in PostgreSQL. Corrections are new
  events. This is not tamper-proof against database owners/superusers: production
  runtime accounts must not have DDL, trigger-disable, or TRUNCATE privileges.

Activity logs are **explicitly written by services/transactions**, not automatically
created for every ORM change. There is no reliable request actor inside a generic
database trigger. `queries.sql` demonstrates an atomic state change plus event.
`auto_now` updates timestamps on normal model saves; bulk/raw writes must set
`updated_at` explicitly, as the SQL examples do.

Aggregate rules (total milestone weight = 100 before activation, allocations
within sanctioned budgets, cumulative payments within contract value, approval
separation of duties, and all required works paid/accepted before completion)
are not falsely expressed as row-local CHECKs. Future services must enforce them
inside transactions with shared parent-row locks. Parent reassignment and final
state transitions also need service-level authorization and historical policy.

## Indexes

PostgreSQL automatically indexes primary/unique keys. Django adds FK indexes.
Additional B-tree indexes match list/timeline filters:

- Project `(manager_id, status)` and `(status, planned_end)`.
- Contract `(project_id, status)`.
- Milestone `(contract_id, status, due_date)`.
- Inspection `(inspector_id, status, scheduled_for)`.
- Payment `(status, due_date)`.
- Document `(category, uploaded_at)`.
- Activity `(actor_id, occurred_at)`, `(project_id, occurred_at)`, and `request_id`.

`queries.sql` includes EXPLAIN and index-catalog examples. An empty/small database
may correctly use a sequential scan; index availability does not force its use.

## PostgreSQL and future Azure hosting

The implementation uses standard PostgreSQL identity columns, numeric/date/time
types, foreign keys, B-tree indexes, views, and PL/pgSQL triggers. It requires no
third-party extension or superuser-only feature. `schema.sql` is a schema-only
snapshot of the migrated database, including Django's auth tables and our view
and triggers. It has no user rows, passwords, or environment secrets.

Use Django migrations as the authoritative deployment mechanism. The SQL snapshot
is for review or a **separate empty scratch database**, not a migration substitute;
it intentionally contains no `django_migrations` history or seeded role data.
Never execute it over an existing database. `queries.sql` wraps its demonstration
in a transaction ending in ROLLBACK, so its synthetic rows are not retained.
Identity sequence values can still advance when transactions roll back.

For Azure Database for PostgreSQL, choose a supported server version, configure
the existing `POSTGRES_*` variables, require encrypted certificate-verified
connections (`POSTGRES_SSLMODE=verify-full` plus the appropriate trusted root,
for example via libpq's `PGSSLROOTCERT`), and use separate migration/runtime roles.
Keep credentials outside Git. Blob keys in Document already allow storage in a
future private Azure container; access tokens should be generated on demand.
No Azure resources, storage uploads, or Power BI connections were created.

## Commands

From `backend/`, configure your intended local database in `.env` before running:

```powershell
.\.venv\Scripts\python.exe manage.py check
.\.venv\Scripts\python.exe manage.py makemigrations --check --dry-run
.\.venv\Scripts\python.exe manage.py migrate --plan
.\.venv\Scripts\python.exe manage.py migrate
.\.venv\Scripts\python.exe manage.py test --noinput
```

The test account needs permission to create a separate Django test database.
Do not point testing at production or use a production database as a test mirror.
PostgreSQL is required; SQLite cannot verify the PostgreSQL triggers/view behavior.

SQL examples, against a scratch database with the migrated schema:

```powershell
psql -v ON_ERROR_STOP=1 -d your_scratch_database -f ../database/queries.sql
```

## Verification results — 7 November 2026

- PostgreSQL 18.6, isolated temporary cluster; no existing database credentials
  or service configuration changed.
- `manage.py check`: passed, zero issues.
- `makemigrations --check --dry-run`: passed, no missing migrations.
- `migrate --plan` reviewed; all built-in and three new migrations applied.
- All **19 tests passed** (17 model/SQL tests with constraint subcases plus the
  two existing health endpoint tests), against a fresh PostgreSQL test database.
- `database/queries.sql` ran successfully with `ON_ERROR_STOP=1`; both trigger
  rejection demonstrations passed and the outer transaction rolled back.
- `database/schema.sql` restored successfully into a second empty database, and
  the SQL examples also passed against that restored schema.
- EXPLAIN selected `ns_payment_status_due` for the payment due-date example.
- Synthetic demonstration user/project rows were absent after ROLLBACK.

Initial connection attempts to the unconfigured default database failed (timeout;
the sandbox also denied a connection during the first migration-generation
attempt). Verification was subsequently completed against the explicitly chosen
isolated cluster. Applying migrations to your intended persistent database still
requires configuring `backend/.env`. The temporary verification cluster is stopped
after checks; its data is not the application's persistent database.
