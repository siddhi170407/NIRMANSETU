from django.db import migrations


FORWARD_SQL = """
CREATE FUNCTION ns_payment_inspection_guard() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE inspection_status varchar(16);
BEGIN
    IF NEW.status IN ('approved', 'paid') THEN
        -- Serialize approval with concurrent updates to this inspection.
        SELECT status INTO inspection_status
        FROM ns_inspection WHERE id = NEW.inspection_id FOR UPDATE;
        IF FOUND AND inspection_status <> 'passed' THEN
            RAISE EXCEPTION 'Payment approval requires a passed inspection'
                USING ERRCODE = '23514', CONSTRAINT = 'ns_payment_passed_inspection';
        END IF;
        -- A missing inspection is handled by the real FK constraint.
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER ns_payment_inspection_guard
BEFORE INSERT OR UPDATE ON ns_payment
FOR EACH ROW EXECUTE FUNCTION ns_payment_inspection_guard();

CREATE FUNCTION ns_inspection_payment_guard() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
    IF NEW.status <> 'passed' AND EXISTS (
        SELECT 1 FROM ns_payment
        WHERE inspection_id = OLD.id AND status IN ('approved', 'paid')
    ) THEN
        RAISE EXCEPTION 'Cannot invalidate an inspection backing an approved or paid payment'
            USING ERRCODE = '23514', CONSTRAINT = 'ns_inspection_has_approved_payment';
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER ns_inspection_payment_guard
BEFORE UPDATE OF status ON ns_inspection
FOR EACH ROW EXECUTE FUNCTION ns_inspection_payment_guard();

CREATE FUNCTION ns_activity_log_immutable() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
    RAISE EXCEPTION 'Activity logs are append-only; add a correcting event instead'
        USING ERRCODE = '23514', CONSTRAINT = 'ns_activity_log_append_only';
END;
$$;

CREATE TRIGGER ns_activity_log_immutable
BEFORE UPDATE OR DELETE ON ns_activity_log
FOR EACH ROW EXECUTE FUNCTION ns_activity_log_immutable();

-- Aggregate the independent branches before joining to avoid multiplying totals.
CREATE VIEW ns_project_financial_summary AS
WITH contract_totals AS (
    SELECT project_id, SUM(amount) AS contracted_amount
    FROM ns_contract WHERE status NOT IN ('draft', 'terminated') GROUP BY project_id
), payment_totals AS (
    SELECT c.project_id,
           SUM(p.amount) FILTER (WHERE p.status = 'paid') AS paid_amount,
           SUM(p.amount) FILTER (WHERE p.status = 'approved') AS approved_unpaid_amount
    FROM ns_payment p
    JOIN ns_inspection i ON i.id = p.inspection_id
    JOIN ns_milestone m ON m.id = i.milestone_id
    JOIN ns_contract c ON c.id = m.contract_id
    GROUP BY c.project_id
)
SELECT p.id AS project_id, p.code, p.name, p.sanctioned_budget,
       COALESCE(c.contracted_amount, 0) AS contracted_amount,
       COALESCE(t.paid_amount, 0) AS paid_amount,
       COALESCE(t.approved_unpaid_amount, 0) AS approved_unpaid_amount,
       p.sanctioned_budget - COALESCE(t.paid_amount, 0) AS remaining_budget
FROM ns_project p
LEFT JOIN contract_totals c ON c.project_id = p.id
LEFT JOIN payment_totals t ON t.project_id = p.id;
"""

REVERSE_SQL = """
DROP VIEW ns_project_financial_summary;
DROP TRIGGER ns_activity_log_immutable ON ns_activity_log;
DROP FUNCTION ns_activity_log_immutable();
DROP TRIGGER ns_inspection_payment_guard ON ns_inspection;
DROP FUNCTION ns_inspection_payment_guard();
DROP TRIGGER ns_payment_inspection_guard ON ns_payment;
DROP FUNCTION ns_payment_inspection_guard();
"""


class Migration(migrations.Migration):
    dependencies = [("infrastructure", "0002_seed_roles")]
    operations = [migrations.RunSQL(FORWARD_SQL, REVERSE_SQL)]
