import uuid

from django.db import models


def attachment_upload_path(instance: "Attachment", filename: str) -> str:
    owner_id = instance.ticket_id or instance.response_id
    return f"attachments/{owner_id}/{uuid.uuid4()}_{filename}"


class Client(models.Model):
    """A ticket submitter, deduped by email — see CLAUDE.md 3.2."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    # Not in the original CLAUDE.md 3.2 schema draft — added once the report
    # form (which always collects a name) and the admin ClientDetailsCard
    # (which displays one) made the gap concrete. A returning client's most
    # recent submitted name wins on subsequent tickets.
    name = models.CharField(max_length=150)
    email = models.EmailField(db_index=True)
    token = models.UUIDField(unique=True, default=uuid.uuid4, editable=False, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self) -> str:
        return self.email


class Ticket(models.Model):
    class Priority(models.TextChoices):
        LOW = "Low", "Low"
        MEDIUM = "Medium", "Medium"
        HIGH = "High", "High"

    class Status(models.TextChoices):
        OPEN = "Open", "Open"
        IN_PROGRESS = "In Progress", "In Progress"
        RESOLVED = "Resolved", "Resolved"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    client = models.ForeignKey(Client, on_delete=models.CASCADE, related_name="tickets")
    # Distinct from Client.token so one leaked link is scoped to one ticket,
    # not the client's entire history — see CLAUDE.md 3.3.
    token = models.UUIDField(unique=True, default=uuid.uuid4, editable=False, db_index=True)
    title = models.CharField(max_length=150)
    description = models.TextField()
    priority = models.CharField(
        max_length=10, choices=Priority.choices, default=Priority.MEDIUM, db_index=True
    )
    status = models.CharField(
        max_length=15, choices=Status.choices, default=Status.OPEN, db_index=True
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    # Set once, on first transition to Resolved; cleared if status moves away
    # from Resolved again. Deliberately distinct from updated_at — see
    # CLAUDE.md 3.2 for why a later edit must not corrupt resolution-time
    # analytics.
    resolved_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"{self.title} ({self.token})"


class Response(models.Model):
    class AuthorType(models.TextChoices):
        ADMIN = "Admin", "Admin"
        CLIENT = "Client", "Client"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    ticket = models.ForeignKey(Ticket, on_delete=models.CASCADE, related_name="responses")
    author_type = models.CharField(max_length=10, choices=AuthorType.choices)
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]

    def __str__(self) -> str:
        return f"{self.author_type} response on {self.ticket_id}"


class Attachment(models.Model):
    """A file attached either at ticket creation or to one reply — never
    both, see CLAUDE.md 3.2. Exactly one of `ticket`/`response` is set;
    enforced in the serializers that create these (whichever endpoint
    you're posting to determines which owner you get), not at the DB layer,
    since a CheckConstraint here would just duplicate that same rule for no
    real benefit at this scale.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    ticket = models.ForeignKey(
        Ticket, on_delete=models.CASCADE, related_name="ticket_attachments", null=True, blank=True
    )
    response = models.ForeignKey(
        Response, on_delete=models.CASCADE, related_name="attachments", null=True, blank=True
    )
    file = models.FileField(upload_to=attachment_upload_path)
    # Cached off the upload at write time — original_name/size/content_type
    # are what the UI displays; re-deriving them from `file` on every read
    # would mean hitting storage just to render a list.
    original_name = models.CharField(max_length=255)
    size = models.PositiveIntegerField()
    content_type = models.CharField(max_length=100, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]

    def __str__(self) -> str:
        return self.original_name
