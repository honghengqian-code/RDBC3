import logging

from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from django.utils import timezone

from apps.tickets import services
from apps.tickets.models import Response, Ticket

logger = logging.getLogger(__name__)


@receiver(pre_save, sender=Ticket)
def stamp_resolved_at(sender, instance: Ticket, **kwargs):
    """Set/clear resolved_at exactly on transition into/out of Resolved.

    Kept at the model layer (rather than only in the PATCH view) so it holds
    regardless of which code path changes status — see CLAUDE.md 3.2.
    """
    if instance._state.adding:
        instance._old_status = None
        # A ticket can be created already-Resolved (e.g. seed data, or a
        # future bulk-import path) — stamp resolved_at here too, since
        # there's no "previous" DB row to diff against in that case.
        if instance.status == Ticket.Status.RESOLVED and instance.resolved_at is None:
            instance.resolved_at = timezone.now()
        return
    try:
        previous = Ticket.objects.only("status").get(pk=instance.pk)
        instance._old_status = previous.status
    except Ticket.DoesNotExist:
        instance._old_status = None
        return
    except Exception:
        logger.exception("Failed to look up previous ticket status id=%s", instance.pk)
        raise

    if instance.status == Ticket.Status.RESOLVED and previous.status != Ticket.Status.RESOLVED:
        instance.resolved_at = timezone.now()
    elif instance.status != Ticket.Status.RESOLVED and previous.status == Ticket.Status.RESOLVED:
        instance.resolved_at = None


@receiver(post_save, sender=Ticket)
def on_ticket_saved(sender, instance: Ticket, created: bool, **kwargs):
    if created:
        logger.info("Ticket created id=%s token=%s", instance.id, instance.token)
        services.send_ticket_created_email(instance)
        return

    old_status = getattr(instance, "_old_status", None)
    if old_status is not None and old_status != instance.status:
        logger.info(
            "Ticket status changed id=%s %s -> %s", instance.id, old_status, instance.status
        )
        services.send_status_changed_email(instance)


@receiver(post_save, sender=Response)
def on_response_saved(sender, instance: Response, created: bool, **kwargs):
    if not created:
        return

    logger.info(
        "Response created ticket=%s author_type=%s", instance.ticket_id, instance.author_type
    )

    if instance.author_type == Response.AuthorType.CLIENT:
        services.send_new_client_response_email(instance.ticket)
    elif instance.author_type == Response.AuthorType.ADMIN:
        if getattr(instance, "_notify_client", True):
            services.send_new_admin_response_email(instance.ticket)
        else:
            logger.info(
                "Admin response ticket=%s notify_client=False, skipping email", instance.ticket_id
            )
