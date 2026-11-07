from datetime import date, timedelta
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.core.exceptions import ValidationError
from django.db import IntegrityError, connection, transaction
from django.db.models.deletion import ProtectedError
from django.test import TestCase
from django.utils import timezone

from infrastructure.models import (
    ActivityLog, Contract, Contractor, ContractorMembership, Document,
    Inspection, Milestone, Payment, Project, Role,
)


class InfrastructureModelTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        user = get_user_model()
        cls.manager = user.objects.create_user(username="project-manager")
        cls.inspector = user.objects.create_user(username="inspector")
        cls.contractor = Contractor.objects.create(registration_number="REG-001", legal_name="Test Works")
        cls.project = Project.objects.create(
            code="NS-TEST-001", name="Test bridge", kind="bridge", site_address="Test site",
            manager=cls.manager, sanctioned_budget=Decimal("10000000.00"),
            planned_start=date(2026, 1, 1), planned_end=date(2027, 1, 1),
        )
        cls.contract = Contract.objects.create(
            number="CON-001", project=cls.project, contractor=cls.contractor,
            title="Bridge works", amount=Decimal("8000000.00"), status="active",
            signed_on=date(2025, 12, 1), starts_on=date(2026, 1, 1), ends_on=date(2027, 1, 1),
        )
        cls.milestone = Milestone.objects.create(
            contract=cls.contract, code="M1", sequence=1, title="Foundation",
            due_date=date(2026, 6, 1), weight_percent=50,
        )
        cls.inspection = Inspection.objects.create(
            reference="INS-001", milestone=cls.milestone, inspector=cls.inspector,
            inspection_type="Quality", scheduled_for=timezone.now(),
            inspected_at=timezone.now(), status="passed", score=95,
        )
        cls.payment = Payment.objects.create(
            reference="PAY-001", inspection=cls.inspection, description="First installment",
            amount=Decimal("1000000.25"), due_date=date(2026, 7, 1), requested_by=cls.manager,
        )

    def assert_db_rejects(self, callback):
        # A savepoint preserves the surrounding TestCase transaction after failure.
        with self.assertRaises(IntegrityError), transaction.atomic():
            callback()
            connection.check_constraints()

    def approve_payment(self):
        Payment.objects.filter(pk=self.payment.pk).update(
            status="approved", approved_by=self.manager, approved_at=timezone.now(),
        )

    def test_roles_reuse_builtin_auth(self):
        self.assertEqual(get_user_model()._meta.db_table, "auth_user")
        self.assertEqual(set(Group.objects.filter(name__in=Role.values).values_list("name", flat=True)), set(Role.values))
        self.manager.groups.add(Group.objects.get(name=Role.PROJECT_MANAGER))
        self.assertTrue(self.manager.groups.filter(name=Role.PROJECT_MANAGER).exists())

    def test_workflow_relationships_and_exact_money(self):
        p = Payment.objects.select_related("inspection__milestone__contract__project").get(pk=self.payment.pk)
        self.assertEqual(p.inspection.milestone.contract.project, self.project)
        self.assertEqual(p.inspection.milestone.contract.contractor, self.contractor)
        self.assertEqual(p.amount, Decimal("1000000.25"))
        self.assertEqual(self.project.contracts.get(), self.contract)

    def test_contractor_membership_is_unique(self):
        ContractorMembership.objects.create(contractor=self.contractor, user=self.manager)
        self.assert_db_rejects(lambda: ContractorMembership.objects.create(contractor=self.contractor, user=self.manager))
        self.assertEqual(self.contractor.users.get(), self.manager)

    def test_unique_business_references(self):
        for instance, field in [(self.project, "code"), (self.contract, "number"), (self.inspection, "reference"), (self.payment, "reference")]:
            with self.subTest(model=type(instance).__name__):
                values = {f.attname: getattr(instance, f.attname) for f in instance._meta.concrete_fields if not f.primary_key}
                self.assert_db_rejects(lambda: type(instance).objects.create(**values))

    def test_milestone_keys_are_contract_scoped(self):
        for code, sequence in [("M1", 2), ("M2", 1)]:
            with self.subTest(code=code, sequence=sequence):
                self.assert_db_rejects(lambda: Milestone.objects.create(
                    contract=self.contract, code=code, sequence=sequence, title="Duplicate",
                    due_date=date(2026, 8, 1), weight_percent=50,
                ))
        second = Contract.objects.create(number="CON-002", project=self.project, contractor=self.contractor,
                                         title="Second package", amount=100, starts_on=date(2026, 1, 1), ends_on=date(2027, 1, 1))
        Milestone.objects.create(contract=second, code="M1", sequence=1, title="Allowed",
                                 due_date=date(2026, 8, 1), weight_percent=100)

    def test_invalid_statuses_are_rejected_by_database(self):
        for instance in [self.project, self.contract, self.milestone, self.inspection, self.payment]:
            with self.subTest(model=type(instance).__name__):
                self.assert_db_rejects(lambda: type(instance).objects.filter(pk=instance.pk).update(status="invalid"))

    def test_invalid_values_and_dates_are_rejected(self):
        cases = [
            (self.project, {"sanctioned_budget": -1}),
            (self.project, {"planned_end": date(2025, 1, 1)}),
            (self.project, {"kind": "invalid"}),
            (self.contract, {"amount": 0}),
            (self.contract, {"ends_on": date(2025, 1, 1)}),
            (self.contract, {"signed_on": None}),
            (self.milestone, {"weight_percent": 0}),
            (self.milestone, {"weight_percent": 101}),
            (self.milestone, {"progress_percent": -1}),
            (self.milestone, {"progress_percent": 101}),
            (self.milestone, {"sequence": 0}),
            (self.inspection, {"score": 101}),
            (self.inspection, {"inspected_at": None}),
            (self.payment, {"amount": 0}),
        ]
        for instance, values in cases:
            with self.subTest(model=type(instance).__name__, values=values):
                self.assert_db_rejects(lambda: type(instance).objects.filter(pk=instance.pk).update(**values))

    def test_completion_and_acceptance_require_evidence_dates(self):
        for instance, status in [(self.project, "completed"), (self.contract, "completed"), (self.milestone, "accepted")]:
            with self.subTest(model=type(instance).__name__):
                self.assert_db_rejects(lambda: type(instance).objects.filter(pk=instance.pk).update(status=status))
        Project.objects.filter(pk=self.project.pk).update(status="completed", completed_on=date(2027, 1, 1))
        Contract.objects.filter(pk=self.contract.pk).update(status="completed", completed_on=date(2027, 1, 1))
        Milestone.objects.filter(pk=self.milestone.pk).update(status="accepted", accepted_on=date(2026, 6, 1), progress_percent=100)

    def test_foreign_keys_are_enforced(self):
        self.assert_db_rejects(lambda: Contract.objects.filter(pk=self.contract.pk).update(project_id=999999))

    def test_delete_protects_evidence_and_users(self):
        for instance in [self.project, self.contractor, self.contract, self.milestone, self.inspection, self.manager, self.inspector]:
            with self.subTest(model=type(instance).__name__), self.assertRaises(ProtectedError):
                instance.delete()

    def test_payment_approval_and_release_constraints(self):
        self.assert_db_rejects(lambda: Payment.objects.filter(pk=self.payment.pk).update(status="approved"))
        self.assert_db_rejects(lambda: Payment.objects.filter(pk=self.payment.pk).update(approved_by=self.manager))
        self.approve_payment()
        self.assert_db_rejects(lambda: Payment.objects.filter(pk=self.payment.pk).update(status="paid"))
        self.assert_db_rejects(lambda: Payment.objects.filter(pk=self.payment.pk).update(
            status="paid", paid_at=timezone.now() - timedelta(days=1), transaction_reference="TX-001"))
        Payment.objects.filter(pk=self.payment.pk).update(status="paid", paid_at=timezone.now(), transaction_reference="TX-001")
        self.payment.refresh_from_db()
        self.assertEqual(self.payment.status, "paid")

    def test_approval_rejects_failed_inspection_in_orm_and_database(self):
        Inspection.objects.filter(pk=self.inspection.pk).update(status="failed")
        self.payment.status = "approved"
        self.payment.approved_by = self.manager
        self.payment.approved_at = timezone.now()
        self.payment.inspection.refresh_from_db()
        with self.assertRaises(ValidationError):
            self.payment.full_clean()
        self.assert_db_rejects(self.approve_payment)

    def test_inspection_cannot_regress_with_approved_payment(self):
        self.approve_payment()
        self.assert_db_rejects(lambda: Inspection.objects.filter(pk=self.inspection.pk).update(status="failed"))

    def test_multiple_installments_and_unique_transfer_reference(self):
        self.approve_payment()
        Payment.objects.filter(pk=self.payment.pk).update(status="paid", paid_at=timezone.now(), transaction_reference="TX-001")
        second = Payment.objects.create(reference="PAY-002", inspection=self.inspection, description="Second installment",
                                        amount=5, due_date=date(2026, 8, 1), requested_by=self.manager)
        self.assert_db_rejects(lambda: Payment.objects.filter(pk=second.pk).update(
            status="paid", approved_by=self.manager, approved_at=timezone.now(), paid_at=timezone.now(), transaction_reference="TX-001"))
        self.assertEqual(self.inspection.payments.count(), 2)

    def test_documents_require_one_real_owner_and_unique_storage_key(self):
        values = dict(storage_key="projects/test/report.pdf", file_name="report.pdf", content_type="application/pdf",
                      size_bytes=123, category="inspection", uploaded_by=self.inspector)
        self.assert_db_rejects(lambda: Document.objects.create(**values))
        self.assert_db_rejects(lambda: Document.objects.create(project=self.project, inspection=self.inspection, **values))
        doc = Document.objects.create(inspection=self.inspection, **values)
        self.assert_db_rejects(lambda: Document.objects.create(project=self.project, **values))
        with self.assertRaises(ProtectedError):
            self.inspection.delete()
        self.assertEqual(doc.inspection.milestone.contract.project, self.project)

    def test_activity_target_and_append_only_trigger(self):
        self.assert_db_rejects(lambda: ActivityLog.objects.create(actor=self.manager, action="created"))
        self.assert_db_rejects(lambda: ActivityLog.objects.create(actor=self.manager, action="created", project=self.project, payment=self.payment))
        event = ActivityLog.objects.create(actor=self.manager, action="created", project=self.project)
        self.assert_db_rejects(lambda: ActivityLog.objects.filter(pk=event.pk).update(message="Rewritten"))
        self.assert_db_rejects(lambda: ActivityLog.objects.filter(pk=event.pk).delete())
        event.refresh_from_db()
        self.assertEqual(event.message, "")

    def test_financial_view_avoids_fanout_and_excludes_unpaid_amounts(self):
        self.approve_payment()
        Payment.objects.filter(pk=self.payment.pk).update(status="paid", paid_at=timezone.now(), transaction_reference="TX-001")
        Contract.objects.create(number="CON-002", project=self.project, contractor=self.contractor, title="Other package",
                                amount=200, starts_on=date(2026, 1, 1), ends_on=date(2027, 1, 1), signed_on=date(2025, 12, 1), status="active")
        Payment.objects.create(reference="PAY-002", inspection=self.inspection, description="Pending", amount=50,
                               due_date=date(2026, 8, 1), requested_by=self.manager)
        with connection.cursor() as cursor:
            cursor.execute("SELECT contracted_amount, paid_amount, approved_unpaid_amount, remaining_budget FROM ns_project_financial_summary WHERE project_id = %s", [self.project.pk])
            self.assertEqual(cursor.fetchone(), (Decimal("8000200"), Decimal("1000000.25"), Decimal("0"), Decimal("8999999.75")))
