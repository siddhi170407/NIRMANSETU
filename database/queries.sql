-- PostgreSQL examples against a migrated schema. Run with psql -v ON_ERROR_STOP=1.
-- All synthetic writes below are rolled back. No existing business rows change.

-- 1. Normalized join: payment -> inspection -> milestone -> contract -> project.
SELECT p.reference, p.status, p.amount, pr.code AS project_code,
       c.number AS contract_number, co.legal_name AS contractor,
       m.code AS milestone_code, i.reference AS inspection_reference,
       u.username AS inspector
FROM ns_payment p
JOIN ns_inspection i ON i.id = p.inspection_id
JOIN ns_milestone m ON m.id = i.milestone_id
JOIN ns_contract c ON c.id = m.contract_id
JOIN ns_project pr ON pr.id = c.project_id
JOIN ns_contractor co ON co.id = c.contractor_id
JOIN auth_user u ON u.id = i.inspector_id
ORDER BY pr.code, p.due_date;

-- 2. View defined in migration 0003 and reproduced in schema.sql.
SELECT * FROM ns_project_financial_summary ORDER BY project_id;

-- 3. Index usage: leading equality + ordered range matches ns_payment_status_due.
-- A small table may use a sequential scan; inspect plans with realistic volumes.
EXPLAIN (COSTS ON)
SELECT id, reference, amount, due_date
FROM ns_payment
WHERE status = 'approved' AND due_date < CURRENT_DATE
ORDER BY due_date;

SELECT tablename, indexname, indexdef FROM pg_indexes
WHERE schemaname = 'public' AND tablename LIKE 'ns_%'
ORDER BY tablename, indexname;

-- 4. Inspect the real migration-installed triggers (functions in schema.sql).
SELECT event_object_table, trigger_name, event_manipulation
FROM information_schema.triggers
WHERE trigger_schema = 'public' AND trigger_name LIKE 'ns_%'
ORDER BY event_object_table, trigger_name;

-- 5. Transaction: seed disposable rows, approve/release payment and log together.
-- Explicit locks coordinate with the inspection eligibility trigger.
BEGIN;
DO $$
DECLARE
    uid integer;
    coid bigint;
    prid bigint;
    cid bigint;
    mid bigint;
    iid bigint;
    pid bigint;
    event_id bigint;
    suffix text := txid_current()::text;
    summary_paid numeric;
BEGIN
    -- An unusable password, not a real login credential.
    INSERT INTO auth_user (username, password, first_name, last_name, email,
                           is_superuser, is_staff, is_active, date_joined)
    VALUES ('sql-example-' || suffix, '!', '', '', '', false, false, false, CURRENT_TIMESTAMP)
    RETURNING id INTO uid;

    INSERT INTO ns_contractor (registration_number, legal_name, contact_email,
                               contact_phone, registered_address, is_active, created_at, updated_at)
    VALUES ('SQL-REG-' || suffix, 'Disposable SQL example', '', '', '', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    RETURNING id INTO coid;

    INSERT INTO ns_project (code, name, description, kind, site_address, manager_id,
                            sanctioned_budget, planned_start, planned_end, status, created_at, updated_at)
    VALUES ('SQL-P-' || suffix, 'Example bridge', '', 'bridge', 'Example site', uid,
            100000, CURRENT_DATE, CURRENT_DATE + 365, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    RETURNING id INTO prid;

    INSERT INTO ns_contract (number, project_id, contractor_id, title, amount,
                             signed_on, starts_on, ends_on, status, created_at, updated_at)
    VALUES ('SQL-C-' || suffix, prid, coid, 'Example package', 80000,
            CURRENT_DATE, CURRENT_DATE, CURRENT_DATE + 300, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    RETURNING id INTO cid;

    INSERT INTO ns_milestone (contract_id, code, sequence, title, description, due_date,
                              weight_percent, progress_percent, accepted_on, status, created_at, updated_at)
    VALUES (cid, 'M1', 1, 'Example deliverable', '', CURRENT_DATE, 100, 100,
            CURRENT_DATE, 'accepted', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    RETURNING id INTO mid;

    INSERT INTO ns_inspection (reference, milestone_id, inspector_id, inspection_type,
                               scheduled_for, inspected_at, score, findings, status, created_at, updated_at)
    VALUES ('SQL-I-' || suffix, mid, uid, 'Example quality check', CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP, 95, '', 'passed', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    RETURNING id INTO iid;

    INSERT INTO ns_payment (reference, inspection_id, description, amount, due_date,
                            requested_by_id, status, created_at, updated_at)
    VALUES ('SQL-PAY-' || suffix, iid, 'Example installment', 12500.25, CURRENT_DATE,
            uid, 'requested', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    RETURNING id INTO pid;

    PERFORM id FROM ns_inspection WHERE id = iid FOR UPDATE;
    UPDATE ns_payment SET status = 'approved', approved_by_id = uid,
           approved_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = pid;
    INSERT INTO ns_activity_log (payment_id, actor_id, action, message, occurred_at)
    VALUES (pid, uid, 'approved', 'SQL demonstration approval', CURRENT_TIMESTAMP);

    UPDATE ns_payment SET status = 'paid', paid_at = CURRENT_TIMESTAMP,
           transaction_reference = 'SQL-TX-' || suffix, updated_at = CURRENT_TIMESTAMP WHERE id = pid;
    INSERT INTO ns_activity_log (payment_id, actor_id, action, message, occurred_at)
    VALUES (pid, uid, 'paid', 'SQL demonstration release', CURRENT_TIMESTAMP)
    RETURNING id INTO event_id;

    SELECT paid_amount INTO summary_paid FROM ns_project_financial_summary WHERE project_id = prid;
    IF summary_paid <> 12500.25 THEN
        RAISE EXCEPTION 'Financial view returned an incorrect total';
    END IF;

    -- Demonstrate both triggers. Each nested block rolls back its rejected change.
    BEGIN
        UPDATE ns_inspection SET status = 'failed' WHERE id = iid;
        RAISE EXCEPTION 'Expected inspection guard to reject the change';
    EXCEPTION WHEN check_violation THEN
        RAISE NOTICE 'Inspection guard correctly preserved payment evidence';
    END;
    BEGIN
        UPDATE ns_activity_log SET message = 'Attempted rewrite' WHERE id = event_id;
        RAISE EXCEPTION 'Expected append-only trigger to reject the change';
    EXCEPTION WHEN check_violation THEN
        RAISE NOTICE 'Audit trigger correctly rejected mutation';
    END;
END;
$$;
ROLLBACK;
