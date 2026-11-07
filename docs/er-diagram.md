# NirmanSetu entity relationships

Names below are the actual database table names. Selected fields are shown;
timestamps and descriptive fields are omitted for readability. All domain PKs
are bigint identity columns. Django owns the authentication tables.

```mermaid
erDiagram
    auth_user ||--o{ auth_user_groups : has
    auth_group ||--o{ auth_user_groups : assigns
    auth_user ||--o{ ns_contractor_membership : represents
    ns_contractor ||--o{ ns_contractor_membership : has
    auth_user ||--o{ ns_project : manages
    ns_project ||--o{ ns_contract : packages
    ns_contractor ||--o{ ns_contract : undertakes
    ns_contract ||--o{ ns_milestone : defines
    ns_milestone ||--o{ ns_inspection : assessed_by
    auth_user ||--o{ ns_inspection : performs
    ns_inspection ||--o{ ns_payment : supports
    auth_user ||--o{ ns_payment : requests
    auth_user o|--o{ ns_payment : approves
    auth_user ||--o{ ns_document : uploads
    ns_project o|--o{ ns_document : owns
    ns_contract o|--o{ ns_document : owns
    ns_milestone o|--o{ ns_document : owns
    ns_inspection o|--o{ ns_document : owns
    ns_payment o|--o{ ns_document : owns
    auth_user o|--o{ ns_activity_log : acts
    ns_project o|--o{ ns_activity_log : target
    ns_contract o|--o{ ns_activity_log : target
    ns_milestone o|--o{ ns_activity_log : target
    ns_inspection o|--o{ ns_activity_log : target
    ns_payment o|--o{ ns_activity_log : target
    ns_document o|--o{ ns_activity_log : target

    auth_user {
        int id PK
        varchar username UK
    }
    auth_group {
        int id PK
        varchar name UK
    }
    auth_user_groups {
        bigint id PK
        int user_id FK
        int group_id FK
    }
    ns_contractor {
        bigint id PK
        varchar registration_number UK
        varchar legal_name
        boolean is_active
    }
    ns_contractor_membership {
        bigint id PK
        bigint contractor_id FK
        int user_id FK
        timestamptz joined_at
    }
    ns_project {
        bigint id PK
        varchar code UK
        int manager_id FK
        numeric sanctioned_budget
        varchar status
        date completed_on
    }
    ns_contract {
        bigint id PK
        varchar number UK
        bigint project_id FK
        bigint contractor_id FK
        numeric amount
        varchar status
    }
    ns_milestone {
        bigint id PK
        bigint contract_id FK
        varchar code
        int sequence
        numeric weight_percent
        numeric progress_percent
        varchar status
    }
    ns_inspection {
        bigint id PK
        varchar reference UK
        bigint milestone_id FK
        int inspector_id FK
        varchar status
        smallint score
    }
    ns_payment {
        bigint id PK
        varchar reference UK
        bigint inspection_id FK
        int requested_by_id FK
        int approved_by_id FK
        numeric amount
        varchar status
        varchar transaction_reference UK
    }
    ns_document {
        bigint id PK
        varchar storage_key UK
        int uploaded_by_id FK
        bigint project_id FK
        bigint contract_id FK
        bigint milestone_id FK
        bigint inspection_id FK
        bigint payment_id FK
    }
    ns_activity_log {
        bigint id PK
        int actor_id FK
        bigint project_id FK
        bigint contract_id FK
        bigint milestone_id FK
        bigint inspection_id FK
        bigint payment_id FK
        bigint document_id FK
        varchar action
        timestamptz occurred_at
    }
```

Each Document chooses **exactly one** of its five optional owner FKs; each
ActivityLog chooses **exactly one** of its six optional target FKs. These are
database CHECK constraints, not independent optional associations. A log actor
can be null for system events. Approval user is nullable until approval.

Composite uniqueness: `(contractor_id, user_id)` on contractor membership;
`(user_id, group_id)` on auth membership; `(contract_id, code)` and
`(contract_id, sequence)` on milestones. Completion is project status/date plus
optional certificate documents, not a duplicated ProjectCompletion table.
