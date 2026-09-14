import uuid

from django.db import models


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
