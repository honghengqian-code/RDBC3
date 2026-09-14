from rest_framework import serializers

from apps.tickets.models import Client, Response, Ticket


class ResponseSerializer(serializers.ModelSerializer):
    author = serializers.SerializerMethodField()

    class Meta:
        model = Response
        fields = ["id", "author_type", "author", "message", "created_at"]

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
        # Attachment model is out of scope for MVP — see CLAUDE.md 3.2.
        return []


class TicketCreateSerializer(serializers.ModelSerializer):
    name = serializers.CharField(max_length=150, write_only=True)
    email = serializers.EmailField(write_only=True)

    class Meta:
        model = Ticket
        fields = ["name", "email", "title", "description"]

    def validate_title(self, value: str) -> str:
        if len(value.strip()) < 5:
            raise serializers.ValidationError("Title must be at least 5 characters.")
        return value

    def validate_description(self, value: str) -> str:
        if len(value.strip()) < 20:
            raise serializers.ValidationError("Description must be at least 20 characters.")
        return value

    def create(self, validated_data) -> Ticket:
        name = validated_data.pop("name")
        email = validated_data.pop("email")
        client, created = Client.objects.get_or_create(
            email=email.strip().lower(), defaults={"name": name}
        )
        if not created and client.name != name:
            client.name = name
            client.save(update_fields=["name"])
        return Ticket.objects.create(client=client, **validated_data)


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

    class Meta:
        model = Response
        fields = ["message", "notify_client"]

    def validate_message(self, value: str) -> str:
        if not value.strip():
            raise serializers.ValidationError("Message can't be empty.")
        return value


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
