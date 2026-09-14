"""
Outbound email + verification-token logic, kept separate from signal
receivers so it's testable independent of Django's signal dispatch
machinery — see CLAUDE.md 3.5.
"""
import logging

from django.conf import settings
from django.core.mail import send_mail
from django.core.signing import BadSignature, SignatureExpired, TimestampSigner

logger = logging.getLogger(__name__)

TRACK_VERIFY_SALT = "apps.tickets.track-verification"
TRACK_VERIFY_MAX_AGE_SECONDS = 15 * 60  # 15 minutes, per CLAUDE.md 3.3

# django.core.signing's dumps()/loads() default to ":" as the field
# separator, which is a live bug once this token has to survive a real
# browser navigation: Chromium percent-encodes literal colons in a path
# segment on click-through, so `:` becomes `%3A` in the outgoing request —
# and since our own encodeURIComponent() call on the frontend then encodes
# that `%` again, the token arrives as `%253A`-mangled garbage and never
# round-trips. "." is in no base64url alphabet Django's signer emits, so
# it's a safe, URL-clean substitute — confirmed via an isolated Playwright
# navigation before this fix (not just unit-tested against dumps()/loads()
# directly, which never exercises a real click and would have missed this).
_track_signer = TimestampSigner(salt=TRACK_VERIFY_SALT, sep=".")


def _ticket_url(token) -> str:
    return f"{settings.FRONTEND_BASE_URL}/tickets/{token}/"


def _track_verify_url(verify_token: str) -> str:
    return f"{settings.FRONTEND_BASE_URL}/track/{verify_token}/"


def _send(subject: str, message: str, to: list[str], *, context: str) -> None:
    try:
        send_mail(
            subject,
            message,
            settings.DEFAULT_FROM_EMAIL,
            to,
            fail_silently=False,
        )
        logger.info("Email sent (%s) to %d recipient(s)", context, len(to))
    except Exception:
        logger.exception("Failed to send email (%s)", context)


def send_ticket_created_email(ticket) -> None:
    _send(
        subject=f"We've received your ticket: {ticket.title}",
        message=(
            f"Thanks for reporting this. You can track its status here:\n\n"
            f"{_ticket_url(ticket.token)}\n\n"
            "Keep this link — it's the only way to access your ticket."
        ),
        to=[ticket.client.email],
        context=f"ticket-created ticket={ticket.id}",
    )


def send_status_changed_email(ticket) -> None:
    _send(
        subject=f"Your ticket status changed to {ticket.status}",
        message=(
            f'Your ticket "{ticket.title}" is now {ticket.status}.\n\n'
            f"View it here: {_ticket_url(ticket.token)}"
        ),
        to=[ticket.client.email],
        context=f"status-changed ticket={ticket.id} status={ticket.status}",
    )


def send_new_admin_response_email(ticket) -> None:
    _send(
        subject=f"New reply on your ticket: {ticket.title}",
        message=(
            f'Support replied to "{ticket.title}".\n\n'
            f"View it here: {_ticket_url(ticket.token)}"
        ),
        to=[ticket.client.email],
        context=f"admin-response ticket={ticket.id}",
    )


def send_new_client_response_email(ticket) -> None:
    recipients = settings.ADMIN_NOTIFICATION_EMAILS
    _send(
        subject=f"Client replied: {ticket.title}",
        message=(
            f'The client replied on ticket "{ticket.title}" (id={ticket.id}).\n\n'
            f"{settings.FRONTEND_BASE_URL}/admin/tickets/{ticket.id}/"
        ),
        to=recipients,
        context=f"client-response ticket={ticket.id}",
    )


def create_track_verification(email: str) -> str:
    """Sign the (lowercased) email into a short-lived, opaque token."""
    normalized = email.strip().lower()
    return _track_signer.sign_object(normalized)


def resolve_track_verification(verify_token: str) -> str | None:
    """Return the email a verify token was issued for, or None if invalid/expired."""
    try:
        return _track_signer.unsign_object(verify_token, max_age=TRACK_VERIFY_MAX_AGE_SECONDS)
    except SignatureExpired:
        logger.info("Track verification token expired")
        return None
    except BadSignature:
        logger.warning("Track verification token failed signature check")
        return None


def send_track_verification_email(email: str) -> None:
    verify_token = create_track_verification(email)
    _send(
        subject="Your ticket tracking link",
        message=(
            "Use this link to view every ticket filed under this email "
            f"(expires in 15 minutes):\n\n{_track_verify_url(verify_token)}"
        ),
        to=[email],
        context="track-verification",
    )
