import logging

import django.core.exceptions
from django.contrib.auth import authenticate, login as django_login, logout as django_logout
from django.contrib.auth.models import User
from django.http import Http404
from django.middleware.csrf import get_token
from django.shortcuts import get_object_or_404
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, generics, status
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response as DRFResponse
from rest_framework.views import APIView

from apps.tickets import services
from apps.tickets.models import Client, Response, Ticket
from apps.tickets.permissions import IsAdminUser
from apps.tickets.serializers import (
    AdminResponseCreateSerializer,
    ClientResponseCreateSerializer,
    ResponseSerializer,
    TicketAdminDetailSerializer,
    TicketAdminListSerializer,
    TicketAdminUpdateSerializer,
    TicketBulkDeleteSerializer,
    TicketCreateSerializer,
    TicketPublicSerializer,
    create_attachments,
    delete_ticket_attachments,
)
from apps.tickets.utils import extract_ticket_token, looks_like_email

logger = logging.getLogger(__name__)


# --- Public: ticket creation + retrieval ---


class PublicTicketCreateView(generics.CreateAPIView):
    """POST /api/public/tickets/"""

    queryset = Ticket.objects.all()
    serializer_class = TicketCreateSerializer
    permission_classes = [AllowAny]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        try:
            serializer.is_valid(raise_exception=True)
            ticket = serializer.save()
        except Exception:
            logger.exception("Ticket creation failed")
            raise
        logger.info("Ticket submitted id=%s token=%s", ticket.id, ticket.token)
        out = TicketPublicSerializer(ticket, context={"request": request})
        return DRFResponse(out.data, status=status.HTTP_201_CREATED)


class PublicTicketDetailView(generics.RetrieveAPIView):
    """GET /api/public/tickets/<token>/"""

    serializer_class = TicketPublicSerializer
    permission_classes = [AllowAny]
    lookup_field = "token"
    lookup_url_kwarg = "token"

    def get_queryset(self):
        return Ticket.objects.select_related("client").prefetch_related("responses")

    def get_object(self):
        token = self.kwargs["token"]
        try:
            return self.get_queryset().get(token=token)
        except (Ticket.DoesNotExist, ValueError, django.core.exceptions.ValidationError):
            logger.info("Ticket lookup miss token=%s", token)
            raise Http404("Ticket not found")


class PublicTicketResponseCreateView(APIView):
    """POST /api/public/tickets/<token>/responses/ — client reply, token-scoped."""

    permission_classes = [AllowAny]

    def post(self, request, token: str):
        ticket = get_object_or_404(Ticket, token=token)
        serializer = ClientResponseCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        response_obj = Response.objects.create(
            ticket=ticket,
            author_type=Response.AuthorType.CLIENT,
            message=serializer.validated_data["message"],
        )
        logger.info("Client response added ticket=%s response=%s", ticket.id, response_obj.id)
        out = ResponseSerializer(response_obj, context={"request": request})
        return DRFResponse(out.data, status=status.HTTP_201_CREATED)


# --- Public: /track lookup + verification ---


class PublicTicketLookupView(APIView):
    """POST /api/public/tickets/lookup/ — the /track entry point."""

    permission_classes = [AllowAny]

    def post(self, request):
        query = str(request.data.get("query", "")).strip()
        if not query:
            return DRFResponse({"detail": "query is required."}, status=status.HTTP_400_BAD_REQUEST)

        token = extract_ticket_token(query)
        if token:
            if Ticket.objects.filter(token=token).exists():
                logger.info("Track lookup resolved to ticket token=%s", token)
                return DRFResponse({"redirect": f"/tickets/{token}"})
            logger.info("Track lookup token-shaped but not found")
            return DRFResponse({"status": "ok"})

        if looks_like_email(query):
            # Always the same response whether or not the address has any
            # tickets — see CLAUDE.md 3.3, this can't be used to enumerate.
            try:
                services.send_track_verification_email(query)
            except Exception:
                logger.exception("Failed to dispatch track verification email")
            return DRFResponse({"status": "ok"})

        return DRFResponse({"detail": "Enter a valid email or ticket link."}, status=status.HTTP_400_BAD_REQUEST)


class PublicTrackedTicketsView(APIView):
    """GET /api/public/tickets/track/<verify_token>/"""

    permission_classes = [AllowAny]

    def get(self, request, verify_token: str):
        email = services.resolve_track_verification(verify_token)
        if email is None:
            return DRFResponse(
                {"detail": "This link is invalid or has expired."},
                status=status.HTTP_404_NOT_FOUND,
            )
        tickets = (
            Ticket.objects.select_related("client")
            .filter(client__email__iexact=email)
            .order_by("-created_at")
        )
        logger.info("Track verification resolved, %d ticket(s)", tickets.count())
        return DRFResponse(
            {
                "email": email,
                "tickets": TicketAdminListSerializer(tickets, many=True).data,
            }
        )


# --- Admin auth ---


class AdminLoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = str(request.data.get("email", "")).strip().lower()
        password = str(request.data.get("password", ""))

        user = None
        try:
            candidate = User.objects.get(email__iexact=email, is_staff=True)
            user = authenticate(request, username=candidate.username, password=password)
        except User.DoesNotExist:
            user = None
        except Exception:
            logger.exception("Admin login lookup failed")
            user = None

        if user is None:
            logger.info("Admin login failed")
            return DRFResponse(
                {"detail": "Incorrect email or password."}, status=status.HTTP_401_UNAUTHORIZED
            )

        django_login(request, user)
        # Force the csrftoken cookie to be set on the login response — DRF's
        # SessionAuthentication enforces CSRF on every unsafe method after
        # this, and a SPA has no server-rendered form to embed it in, so the
        # frontend must read this cookie and echo it back as X-CSRFToken.
        get_token(request)
        logger.info("Admin login succeeded user_id=%s", user.id)
        return DRFResponse({"email": user.email, "name": user.get_full_name() or user.username})


class AdminLogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user_id = request.user.id
        django_logout(request)
        logger.info("Admin logout user_id=%s", user_id)
        return DRFResponse(status=status.HTTP_204_NO_CONTENT)


class AdminSessionView(APIView):
    """GET /api/admin/auth/session/ — lets the frontend ask "am I logged in"
    on page load. The session cookie is httponly by design, so the SPA can't
    introspect it directly; it has to ask the server instead of trusting
    client-side state (the old localStorage mock could get away with that,
    a real session can't)."""

    permission_classes = [IsAdminUser]

    def get(self, request):
        get_token(request)
        user = request.user
        return DRFResponse({"email": user.email, "name": user.get_full_name() or user.username})


# --- Admin: tickets ---


class AdminTicketListView(generics.ListAPIView):
    serializer_class = TicketAdminListSerializer
    permission_classes = [IsAdminUser]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ["status", "priority"]
    search_fields = ["title", "client__name", "client__email"]

    def get_queryset(self):
        return Ticket.objects.select_related("client").all()


class AdminTicketDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Ticket.objects.select_related("client").prefetch_related("responses")
    permission_classes = [IsAdminUser]
    lookup_field = "id"
    lookup_url_kwarg = "id"

    def get_serializer_class(self):
        if self.request.method in ("PATCH", "PUT"):
            return TicketAdminUpdateSerializer
        return TicketAdminDetailSerializer

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", True)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        ticket = serializer.save()
        logger.info(
            "Ticket updated id=%s status=%s priority=%s", ticket.id, ticket.status, ticket.priority
        )
        return DRFResponse(TicketAdminDetailSerializer(ticket, context={"request": request}).data)

    def perform_destroy(self, instance):
        ticket_id = instance.id
        removed_files = delete_ticket_attachments(instance)
        instance.delete()
        logger.info("Ticket deleted id=%s attachments_removed=%d", ticket_id, removed_files)


class AdminTicketBulkDeleteView(APIView):
    permission_classes = [IsAdminUser]

    def post(self, request):
        serializer = TicketBulkDeleteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        ids = serializer.validated_data["ids"]

        tickets = list(Ticket.objects.filter(id__in=ids))
        removed_files = 0
        deleted_ids = []
        for ticket in tickets:
            removed_files += delete_ticket_attachments(ticket)
            deleted_ids.append(ticket.id)
            ticket.delete()

        logger.info(
            "Bulk ticket delete requested=%d deleted=%d attachments_removed=%d",
            len(ids),
            len(deleted_ids),
            removed_files,
        )
        return DRFResponse({"deleted": len(deleted_ids)})


class AdminTicketResponseCreateView(APIView):
    permission_classes = [IsAdminUser]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def post(self, request, id: str):
        ticket = get_object_or_404(Ticket, id=id)
        serializer = AdminResponseCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        notify_client = serializer.validated_data.get("notify_client", True)
        files = serializer.validated_data.get("attachments", [])

        response_obj = Response(
            ticket=ticket,
            author_type=Response.AuthorType.ADMIN,
            message=serializer.validated_data["message"],
        )
        response_obj._notify_client = notify_client
        response_obj.save()
        create_attachments(files, response=response_obj)

        logger.info(
            "Admin response added ticket=%s response=%s notify_client=%s attachments=%d",
            ticket.id,
            response_obj.id,
            notify_client,
            len(files),
        )
        out = ResponseSerializer(response_obj, context={"request": request})
        return DRFResponse(out.data, status=status.HTTP_201_CREATED)
