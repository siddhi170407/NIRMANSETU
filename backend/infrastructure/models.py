"""Normalized infrastructure records. All monetary values are INR, not crore."""

from decimal import Decimal
from functools import reduce
from operator import or_

from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models
from django.db.models import F, Q
from django.utils import timezone


class Role(models.TextChoices):
    """Names of Django auth.Group records; this is not a second role table."""

    ADMINISTRATOR = "Administrator"
    PROJECT_MANAGER = "Project Manager"
    INSPECTOR = "Inspector"
    CONTRACTOR = "Contractor"
    AUDITOR = "Auditor"


class ProjectStatus(models.TextChoices):
    PLANNING = "planning", "Planning"
    ACTIVE = "active", "Active"
    ON_HOLD = "on_hold", "On hold"
    COMPLETED = "completed", "Completed"
    CANCELLED = "cancelled", "Cancelled"


class ContractStatus(models.TextChoices):
    DRAFT = "draft", "Draft"
    AWARDED = "awarded", "Awarded"
    ACTIVE = "active", "Active"
    ON_HOLD = "on_hold", "On hold"
    COMPLETED = "completed", "Completed"
    TERMINATED = "terminated", "Terminated"


class MilestoneStatus(models.TextChoices):
    PLANNED = "planned", "Planned"
    IN_PROGRESS = "in_progress", "In progress"
    SUBMITTED = "submitted", "Submitted for inspection"
    ACCEPTED = "accepted", "Accepted"
    REJECTED = "rejected", "Rejected"
    CANCELLED = "cancelled", "Cancelled"


class InspectionStatus(models.TextChoices):
    SCHEDULED = "scheduled", "Scheduled"
    IN_PROGRESS = "in_progress", "In progress"
    PASSED = "passed", "Passed"
    OBSERVATIONS = "observations", "Observations"
    FAILED = "failed", "Failed"
    CANCELLED = "cancelled", "Cancelled"


class PaymentStatus(models.TextChoices):
    REQUESTED = "requested", "Requested"
    UNDER_REVIEW = "under_review", "Under review"
    APPROVED = "approved", "Approved"
    PAID = "paid", "Paid"
    REJECTED = "rejected", "Rejected"
    CANCELLED = "cancelled", "Cancelled"


class ProjectKind(models.TextChoices):
    ROAD = "road", "Road"
    BRIDGE = "bridge", "Bridge"
    WATER_SUPPLY = "water_supply", "Water supply"
    PUBLIC_BUILDING = "public_building", "Public building"
    DRAINAGE = "drainage", "Drainage"
    OTHER = "other", "Other"


class DocumentCategory(models.TextChoices):
    CONTRACT = "contract", "Contract"
    DRAWING = "drawing", "Drawing"
    INSPECTION = "inspection", "Inspection"
    FINANCE = "finance", "Finance"
    CLEARANCE = "clearance", "Clearance"
    SITE_MEDIA = "site_media", "Site media"
    COMPLETION = "completion", "Completion certificate"
    OTHER = "other", "Other"


class ActivityAction(models.TextChoices):
    CREATED = "created", "Created"
    UPDATED = "updated", "Updated"
    STATUS_CHANGED = "status_changed", "Status changed"
    ASSIGNED = "assigned", "Assigned"
    UPLOADED = "uploaded", "Uploaded"
    APPROVED = "approved", "Approved"
    REJECTED = "rejected", "Rejected"
    PAID = "paid", "Paid"
    COMPLETED = "completed", "Completed"
    ARCHIVED = "archived", "Archived"


def exactly_one_target(*fields):
    """An exclusive arc: one real FK, with all other target FKs null."""
    return reduce(or_, [
        Q(**{f"{field}__isnull": field != selected for field in fields})
        for selected in fields
    ])


class Timestamped(models.Model):
    created_at = models.DateTimeField(default=timezone.now, editable=False)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class Contractor(Timestamped):
    registration_number = models.CharField(max_length=80, unique=True)
    legal_name = models.CharField(max_length=200)
    contact_email = models.EmailField(blank=True)
    contact_phone = models.CharField(max_length=32, blank=True)
    registered_address = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    users = models.ManyToManyField(
        settings.AUTH_USER_MODEL, through="ContractorMembership",
        related_name="contractor_organizations",
    )

    class Meta:
        db_table = "ns_contractor"
        constraints = [models.CheckConstraint(
            condition=~Q(registration_number=""), name="ns_contractor_reg_not_empty",
        )]

    def __str__(self):
        return self.legal_name


class ContractorMembership(models.Model):
    contractor = models.ForeignKey(Contractor, on_delete=models.PROTECT, related_name="memberships")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="contractor_memberships")
    joined_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = "ns_contractor_membership"
        constraints = [models.UniqueConstraint(
            fields=["contractor", "user"], name="ns_contractor_user_unique",
        )]


class Project(Timestamped):
    Status = ProjectStatus
    code = models.CharField(max_length=40, unique=True)
    name = models.CharField(max_length=240)
    description = models.TextField(blank=True)
    kind = models.CharField(max_length=20, choices=ProjectKind.choices)
    site_address = models.TextField()
    manager = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="managed_projects")
    sanctioned_budget = models.DecimalField(max_digits=18, decimal_places=2)
    planned_start = models.DateField()
    planned_end = models.DateField()
    completed_on = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=16, choices=ProjectStatus.choices, default=ProjectStatus.PLANNING)

    class Meta:
        db_table = "ns_project"
        constraints = [
            models.CheckConstraint(condition=~Q(code=""), name="ns_project_code_not_empty"),
            models.CheckConstraint(condition=Q(kind__in=ProjectKind.values), name="ns_project_kind_valid"),
            models.CheckConstraint(condition=Q(status__in=ProjectStatus.values), name="ns_project_status_valid"),
            models.CheckConstraint(condition=Q(sanctioned_budget__gte=0), name="ns_project_budget_nonnegative"),
            models.CheckConstraint(condition=Q(planned_end__gte=F("planned_start")), name="ns_project_dates_ordered"),
            models.CheckConstraint(
                condition=(Q(status="completed", completed_on__isnull=False) | (~Q(status="completed") & Q(completed_on__isnull=True))),
                name="ns_project_completion_state",
            ),
            models.CheckConstraint(condition=Q(completed_on__isnull=True) | Q(completed_on__gte=F("planned_start")), name="ns_project_completion_date"),
        ]
        indexes = [
            models.Index(fields=["manager", "status"], name="ns_project_manager_status"),
            models.Index(fields=["status", "planned_end"], name="ns_project_status_end"),
        ]

    def __str__(self):
        return f"{self.code}: {self.name}"


class Contract(Timestamped):
    Status = ContractStatus
    number = models.CharField(max_length=80, unique=True)
    project = models.ForeignKey(Project, on_delete=models.PROTECT, related_name="contracts")
    contractor = models.ForeignKey(Contractor, on_delete=models.PROTECT, related_name="contracts")
    title = models.CharField(max_length=240)
    amount = models.DecimalField(max_digits=18, decimal_places=2)
    signed_on = models.DateField(null=True, blank=True)
    starts_on = models.DateField()
    ends_on = models.DateField()
    completed_on = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=16, choices=ContractStatus.choices, default=ContractStatus.DRAFT)

    class Meta:
        db_table = "ns_contract"
        constraints = [
            models.CheckConstraint(condition=~Q(number=""), name="ns_contract_number_not_empty"),
            models.CheckConstraint(condition=Q(status__in=ContractStatus.values), name="ns_contract_status_valid"),
            models.CheckConstraint(condition=Q(amount__gt=0), name="ns_contract_amount_positive"),
            models.CheckConstraint(condition=Q(ends_on__gte=F("starts_on")), name="ns_contract_dates_ordered"),
            models.CheckConstraint(condition=Q(signed_on__isnull=True) | Q(signed_on__lte=F("starts_on")), name="ns_contract_sign_date"),
            models.CheckConstraint(condition=Q(status="draft") | Q(signed_on__isnull=False), name="ns_contract_signed_state"),
            models.CheckConstraint(condition=Q(status="completed", completed_on__isnull=False) | (~Q(status="completed") & Q(completed_on__isnull=True)), name="ns_contract_completion_state"),
            models.CheckConstraint(condition=Q(completed_on__isnull=True) | Q(completed_on__gte=F("starts_on")), name="ns_contract_completion_date"),
        ]
        indexes = [models.Index(fields=["project", "status"], name="ns_contract_project_status")]

    def __str__(self):
        return self.number


class Milestone(Timestamped):
    Status = MilestoneStatus
    contract = models.ForeignKey(Contract, on_delete=models.PROTECT, related_name="milestones")
    code = models.CharField(max_length=40)
    sequence = models.PositiveIntegerField()
    title = models.CharField(max_length=240)
    description = models.TextField(blank=True)
    due_date = models.DateField()
    weight_percent = models.DecimalField(max_digits=5, decimal_places=2)
    progress_percent = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal("0"))
    accepted_on = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=16, choices=MilestoneStatus.choices, default=MilestoneStatus.PLANNED)

    class Meta:
        db_table = "ns_milestone"
        constraints = [
            models.UniqueConstraint(fields=["contract", "code"], name="ns_milestone_contract_code"),
            models.UniqueConstraint(fields=["contract", "sequence"], name="ns_milestone_contract_seq"),
            models.CheckConstraint(condition=~Q(code=""), name="ns_milestone_code_not_empty"),
            models.CheckConstraint(condition=Q(sequence__gt=0), name="ns_milestone_sequence_positive"),
            models.CheckConstraint(condition=Q(status__in=MilestoneStatus.values), name="ns_milestone_status_valid"),
            models.CheckConstraint(condition=Q(weight_percent__gt=0, weight_percent__lte=100), name="ns_milestone_weight_range"),
            models.CheckConstraint(condition=Q(progress_percent__gte=0, progress_percent__lte=100), name="ns_milestone_progress_range"),
            models.CheckConstraint(condition=Q(status="accepted", accepted_on__isnull=False, progress_percent=100) | (~Q(status="accepted") & Q(accepted_on__isnull=True)), name="ns_milestone_acceptance_state"),
        ]
        indexes = [models.Index(fields=["contract", "status", "due_date"], name="ns_milestone_contract_due")]

    def __str__(self):
        return self.code


class Inspection(Timestamped):
    Status = InspectionStatus
    reference = models.CharField(max_length=60, unique=True)
    milestone = models.ForeignKey(Milestone, on_delete=models.PROTECT, related_name="inspections")
    inspector = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="inspections")
    inspection_type = models.CharField(max_length=120)
    scheduled_for = models.DateTimeField()
    inspected_at = models.DateTimeField(null=True, blank=True)
    score = models.PositiveSmallIntegerField(null=True, blank=True)
    findings = models.TextField(blank=True)
    status = models.CharField(max_length=16, choices=InspectionStatus.choices, default=InspectionStatus.SCHEDULED)

    class Meta:
        db_table = "ns_inspection"
        constraints = [
            models.CheckConstraint(condition=~Q(reference=""), name="ns_inspection_ref_not_empty"),
            models.CheckConstraint(condition=Q(status__in=InspectionStatus.values), name="ns_inspection_status_valid"),
            models.CheckConstraint(condition=Q(score__isnull=True) | Q(score__gte=0, score__lte=100), name="ns_inspection_score_range"),
            models.CheckConstraint(condition=~Q(status__in=["passed", "failed", "observations"]) | Q(inspected_at__isnull=False), name="ns_inspection_result_date"),
            models.CheckConstraint(condition=Q(inspected_at__isnull=False) | Q(score__isnull=True), name="ns_inspection_score_date"),
        ]
        indexes = [models.Index(fields=["inspector", "status", "scheduled_for"], name="ns_inspection_inspector_due")]

    def __str__(self):
        return self.reference


class Payment(Timestamped):
    Status = PaymentStatus
    reference = models.CharField(max_length=80, unique=True)
    inspection = models.ForeignKey(Inspection, on_delete=models.PROTECT, related_name="payments")
    description = models.CharField(max_length=240)
    amount = models.DecimalField(max_digits=18, decimal_places=2)
    due_date = models.DateField()
    requested_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="requested_payments")
    approved_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="approved_payments", null=True, blank=True)
    approved_at = models.DateTimeField(null=True, blank=True)
    paid_at = models.DateTimeField(null=True, blank=True)
    transaction_reference = models.CharField(max_length=120, unique=True, null=True, blank=True)
    status = models.CharField(max_length=16, choices=PaymentStatus.choices, default=PaymentStatus.REQUESTED)

    class Meta:
        db_table = "ns_payment"
        constraints = [
            models.CheckConstraint(condition=~Q(reference=""), name="ns_payment_ref_not_empty"),
            models.CheckConstraint(condition=Q(status__in=PaymentStatus.values), name="ns_payment_status_valid"),
            models.CheckConstraint(condition=Q(amount__gt=0), name="ns_payment_amount_positive"),
            models.CheckConstraint(condition=Q(approved_at__isnull=True, approved_by__isnull=True) | Q(approved_at__isnull=False, approved_by__isnull=False), name="ns_payment_approval_pair"),
            models.CheckConstraint(condition=~Q(status__in=["approved", "paid"]) | Q(approved_at__isnull=False, approved_by__isnull=False), name="ns_payment_approval_required"),
            models.CheckConstraint(condition=Q(status="paid", paid_at__isnull=False, transaction_reference__isnull=False) | (~Q(status="paid") & Q(paid_at__isnull=True, transaction_reference__isnull=True)), name="ns_payment_paid_state"),
            models.CheckConstraint(condition=Q(transaction_reference__isnull=True) | ~Q(transaction_reference=""), name="ns_payment_transaction_not_blank"),
            models.CheckConstraint(condition=Q(paid_at__isnull=True) | Q(paid_at__gte=F("approved_at")), name="ns_payment_dates_ordered"),
        ]
        indexes = [models.Index(fields=["status", "due_date"], name="ns_payment_status_due")]

    def clean(self):
        super().clean()
        if self.inspection_id and self.status in {PaymentStatus.APPROVED, PaymentStatus.PAID}:
            if self.inspection.status != InspectionStatus.PASSED:
                raise ValidationError({"inspection": "Approval requires a passed inspection."})

    def __str__(self):
        return self.reference


class Document(models.Model):
    """Exactly one owner; storage_key is a private object key, never a SAS URL."""

    project = models.ForeignKey(Project, on_delete=models.PROTECT, related_name="documents", null=True, blank=True)
    contract = models.ForeignKey(Contract, on_delete=models.PROTECT, related_name="documents", null=True, blank=True)
    milestone = models.ForeignKey(Milestone, on_delete=models.PROTECT, related_name="documents", null=True, blank=True)
    inspection = models.ForeignKey(Inspection, on_delete=models.PROTECT, related_name="documents", null=True, blank=True)
    payment = models.ForeignKey(Payment, on_delete=models.PROTECT, related_name="documents", null=True, blank=True)
    storage_key = models.CharField(max_length=500, unique=True)
    file_name = models.CharField(max_length=255)
    content_type = models.CharField(max_length=120)
    size_bytes = models.PositiveBigIntegerField()
    category = models.CharField(max_length=16, choices=DocumentCategory.choices)
    uploaded_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="uploaded_documents")
    uploaded_at = models.DateTimeField(default=timezone.now, editable=False)

    class Meta:
        db_table = "ns_document"
        constraints = [
            models.CheckConstraint(condition=exactly_one_target("project", "contract", "milestone", "inspection", "payment"), name="ns_document_one_owner"),
            models.CheckConstraint(condition=~Q(storage_key=""), name="ns_document_key_not_empty"),
            models.CheckConstraint(condition=Q(category__in=DocumentCategory.values), name="ns_document_category_valid"),
        ]
        indexes = [models.Index(fields=["category", "uploaded_at"], name="ns_document_category_date")]

    def __str__(self):
        return self.file_name


class ActivityLog(models.Model):
    """Append-only audit events, protected by a PostgreSQL migration trigger."""

    project = models.ForeignKey(Project, on_delete=models.PROTECT, related_name="activity_logs", null=True, blank=True)
    contract = models.ForeignKey(Contract, on_delete=models.PROTECT, related_name="activity_logs", null=True, blank=True)
    milestone = models.ForeignKey(Milestone, on_delete=models.PROTECT, related_name="activity_logs", null=True, blank=True)
    inspection = models.ForeignKey(Inspection, on_delete=models.PROTECT, related_name="activity_logs", null=True, blank=True)
    payment = models.ForeignKey(Payment, on_delete=models.PROTECT, related_name="activity_logs", null=True, blank=True)
    document = models.ForeignKey(Document, on_delete=models.PROTECT, related_name="activity_logs", null=True, blank=True)
    actor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="infrastructure_activity", null=True, blank=True)
    action = models.CharField(max_length=20, choices=ActivityAction.choices)
    message = models.TextField(blank=True)
    occurred_at = models.DateTimeField(default=timezone.now, editable=False)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    request_id = models.UUIDField(null=True, blank=True, db_index=True)

    class Meta:
        db_table = "ns_activity_log"
        constraints = [
            models.CheckConstraint(condition=exactly_one_target("project", "contract", "milestone", "inspection", "payment", "document"), name="ns_activity_one_target"),
            models.CheckConstraint(condition=Q(action__in=ActivityAction.values), name="ns_activity_action_valid"),
        ]
        indexes = [
            models.Index(fields=["actor", "occurred_at"], name="ns_activity_actor_time"),
            models.Index(fields=["project", "occurred_at"], name="ns_activity_project_time"),
        ]
