from django.conf import settings
from django.db.models import Q
from rest_framework import serializers

from apps.tickets.models import Attachment, Client, Response, Ticket


def validate_attachment_files(files: list) -> list:
    """Shared server-side validation for both attach points (ticket
    creation, admin reply) — the frontend's AttachmentUploader enforces the
    same limits, but that's UX only; file uploads must never trust the
    client alone (unrestricted size/type is a real disk-exhaustion /
    arbitrary-upload risk)."""
    if len(files) > settings.ATTACHMENT_MAX_COUNT:
        raise serializers.ValidationError(
            f"You can attach up to {settings.ATTACHMENT_MAX_COUNT} files."
        )
    for f in files:
        if f.size > settings.ATTACHMENT_MAX_BYTES:
            raise serializers.ValidationError(f'"{f.name}" is over the 5MB limit.')
        if f.content_type not in settings.ATTACHMENT_ALLOWED_CONTENT_TYPES:
            raise serializers.ValidationError(f'"{f.name}" isn\'t a supported file type.')
    return files


def create_attachments(files: list, *, ticket=None, response=None) -> None:
    for f in files:
        Attachment.objects.create(
            ticket=ticket,
            response=response,
            file=f,
            original_name=f.name,
            size=f.size,
            content_type=f.content_type or "",
        )


def delete_ticket_attachments(ticket) -> int:
    """Removes attachment files from storage before a ticket is deleted.

    CASCADE clears the Attachment/Response DB rows automatically once the
    Ticket is deleted, but Django never touches the underlying files on a
    cascade delete — those have to be removed explicitly, or they're
    orphaned on disk forever.
    """
    attachments = Attachment.objects.filter(Q(ticket=ticket) | Q(response__ticket=ticket))
    count = 0
    for attachment in attachments:
        attachment.file.delete(save=False)
        count += 1
    return count


class TicketBulkDeleteSerializer(serializers.Serializer):
    ids = serializers.ListField(
        child=serializers.UUIDField(), allow_empty=False, max_length=500
    )


class AttachmentSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source="original_name", read_only=True)
    kind = serializers.SerializerMethodField()
    url = serializers.SerializerMethodField()

    class Meta:
        model = Attachment
        fields = ["id", "name", "size", "kind", "url"]

    def get_kind(self, obj: Attachment) -> str:
        return "image" if obj.content_type.startswith("image/") else "file"

    def get_url(self, obj: Attachment) -> str:
        request = self.context.get("request")
        return request.build_absolute_uri(obj.file.url) if request else obj.file.url


class ResponseSerializer(serializers.ModelSerializer):
    author = serializers.SerializerMethodField()
    attachments = AttachmentSerializer(many=True, read_only=True)

    class Meta:
        model = Response
        fields = ["id", "author_type", "author", "message", "created_at", "attachments"]

    def get_author(self, obj: Response) -> str:
        return "Support" if obj.author_type == Response.AuthorType.ADMIN else obj.ticket.client.name


class TicketPublicSerializer(serializers.ModelSerializer):
    """The client-facing view of a ticket — never exposes internal `id`."""

    client_name = serializers.CharField(source="client.name", read_only=True)
    client_email = serializers.EmailField(source="client.email", read_only=True)
    status_history = serializers.SerializerMethodField()
    responses = ResponseSerializer(many=True, read_only=True)
    attachments = serializers.SerializerMethodField()

    class Meta:
        model = Ticket
        fields = [
            "token",
            "title",
            "description",
            "status",
            "priority",
            "client_name",
            "client_email",
            "created_at",
            "updated_at",
            "resolved_at",
            "status_history",
            "attachments",
            "responses",
        ]

    def get_status_history(self, obj: Ticket) -> dict:
        # Only Open (created_at) and Resolved (resolved_at) are tracked at
        # the model layer for MVP — see CLAUDE.md 3.2. "In Progress" has no
        # dedicated timestamp column, so it's simply absent here; the
        # frontend timeline already tolerates a partial history.
        history = {"Open": obj.created_at}
        if obj.resolved_at:
            history["Resolved"] = obj.resolved_at
        return history

    def get_attachments(self, obj: Ticket) -> list:
        return AttachmentSerializer(
            obj.ticket_attachments.all(), many=True, context=self.context
        ).data


class TicketCreateSerializer(serializers.ModelSerializer):
    name = serializers.CharField(max_length=150, write_only=True)
    email = serializers.EmailField(write_only=True)
    attachments = serializers.ListField(
        child=serializers.FileField(), required=False, write_only=True
    )

    class Meta:
        model = Ticket
        fields = ["name", "email", "title", "description", "attachments"]

    def validate_title(self, value: str) -> str:
        if len(value.strip()) < 5:
            raise serializers.ValidationError("Title must be at least 5 characters.")
        return value

    def validate_description(self, value: str) -> str:
        if len(value.strip()) < 20:
            raise serializers.ValidationError("Description must be at least 20 characters.")
        return value

    def validate_attachments(self, value: list) -> list:
        return validate_attachment_files(value)

    def create(self, validated_data) -> Ticket:
        name = validated_data.pop("name")
        email = validated_data.pop("email")
        files = validated_data.pop("attachments", [])
        client, created = Client.objects.get_or_create(
            email=email.strip().lower(), defaults={"name": name}
        )
        if not created and client.name != name:
            client.name = name
            client.save(update_fields=["name"])
        ticket = Ticket.objects.create(client=client, **validated_data)
        create_attachments(files, ticket=ticket)
        return ticket


class ClientResponseCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Response
        fields = ["message"]

    def validate_message(self, value: str) -> str:
        if not value.strip():
            raise serializers.ValidationError("Message can't be empty.")
        return value


class AdminResponseCreateSerializer(serializers.ModelSerializer):
    notify_client = serializers.BooleanField(write_only=True, default=True)
    attachments = serializers.ListField(
        child=serializers.FileField(), required=False, write_only=True
    )

    class Meta:
        model = Response
        fields = ["message", "notify_client", "attachments"]

    def validate_message(self, value: str) -> str:
        if not value.strip():
            raise serializers.ValidationError("Message can't be empty.")
        return value

    def validate_attachments(self, value: list) -> list:
        return validate_attachment_files(value)


class TicketAdminListSerializer(serializers.ModelSerializer):
    client_name = serializers.CharField(source="client.name", read_only=True)
    client_email = serializers.EmailField(source="client.email", read_only=True)

    class Meta:
        model = Ticket
        fields = [
            "id",
            "token",
            "title",
            "status",
            "priority",
            "client_name",
            "client_email",
            "created_at",
            "resolved_at",
        ]


class TicketAdminDetailSerializer(TicketPublicSerializer):
    class Meta(TicketPublicSerializer.Meta):
        fields = ["id"] + TicketPublicSerializer.Meta.fields


class TicketAdminUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ticket
        fields = ["status", "priority"]
