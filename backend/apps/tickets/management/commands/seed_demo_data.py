from django.contrib.auth.models import User
from django.core.management.base import BaseCommand
from django.db import transaction

from apps.tickets.models import Client, Response, Ticket


class Command(BaseCommand):
    help = "Seeds a demo admin user and a handful of tickets for local dev/testing."

    @transaction.atomic
    def handle(self, *args, **options):
        admin, created = User.objects.get_or_create(
            username="admin",
            defaults={"email": "admin@example.com", "is_staff": True, "is_superuser": True},
        )
        if created:
            admin.set_password("admin12345")
            admin.save()
            self.stdout.write(self.style.SUCCESS("Created admin user admin@example.com / admin12345"))
        else:
            self.stdout.write("Admin user already exists")

        if Ticket.objects.exists():
            self.stdout.write("Tickets already seeded, skipping")
            return

        ada, _ = Client.objects.get_or_create(email="ada@example.com", defaults={"name": "Ada Lovelace"})
        grace, _ = Client.objects.get_or_create(
            email="grace@example.com", defaults={"name": "Grace Hopper"}
        )

        t1 = Ticket.objects.create(
            client=ada,
            title="Dashboard fails to load after login",
            description=(
                "After signing in, the dashboard spins indefinitely and never renders "
                "the ticket list. Happens consistently on Chrome and Firefox."
            ),
            status=Ticket.Status.IN_PROGRESS,
            priority=Ticket.Priority.HIGH,
        )
        Response.objects.create(
            ticket=t1, author_type=Response.AuthorType.CLIENT, message="Any update on this?"
        )
        Response.objects.create(
            ticket=t1,
            author_type=Response.AuthorType.ADMIN,
            message="Looking into it now — will follow up shortly.",
        )

        t2 = Ticket.objects.create(
            client=ada,
            title="Refund not showing up in account balance",
            description="Refund was approved last week but the balance hasn't updated.",
            status=Ticket.Status.RESOLVED,
            priority=Ticket.Priority.LOW,
        )

        Ticket.objects.create(
            client=grace,
            title="Unable to reset password",
            description="The password reset email never arrives, checked spam folder too.",
            status=Ticket.Status.OPEN,
            priority=Ticket.Priority.MEDIUM,
        )

        self.stdout.write(self.style.SUCCESS(f"Seeded {Ticket.objects.count()} tickets"))
