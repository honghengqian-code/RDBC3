import logging

from django.db.models import Avg, Count, DurationField, ExpressionWrapper, F
from rest_framework.response import Response as DRFResponse
from rest_framework.views import APIView

from apps.tickets.models import Ticket
from apps.tickets.permissions import IsAdminUser

logger = logging.getLogger(__name__)


class AnalyticsSummaryView(APIView):
    """GET /api/admin/analytics/summary/ — no new tables, ORM aggregation
    over apps.tickets models only, per CLAUDE.md 3.1."""

    permission_classes = [IsAdminUser]

    def get(self, request):
        try:
            tickets = Ticket.objects.all()
            total = tickets.count()
            closed = tickets.filter(status=Ticket.Status.RESOLVED).count()
            open_count = total - closed

            resolved = tickets.filter(status=Ticket.Status.RESOLVED, resolved_at__isnull=False)
            resolution_seconds = resolved.aggregate(
                avg=Avg(
                    ExpressionWrapper(F("resolved_at") - F("created_at"), output_field=DurationField())
                )
            )["avg"]
            avg_resolution_hours = (
                round(resolution_seconds.total_seconds() / 3600, 1) if resolution_seconds else None
            )

            by_status = [
                {"status": row["status"], "count": row["count"]}
                for row in tickets.values("status").annotate(count=Count("id")).order_by("status")
            ]
            by_priority = [
                {"priority": row["priority"], "count": row["count"]}
                for row in tickets.values("priority").annotate(count=Count("id")).order_by("priority")
            ]

            velocity = []
            for t in resolved.order_by("resolved_at"):
                days = round((t.resolved_at - t.created_at).total_seconds() / 86400, 2)
                velocity.append({"label": t.title[:24], "days": days})
        except Exception:
            logger.exception("Analytics summary computation failed")
            raise

        logger.info("Analytics summary computed total=%s closed=%s open=%s", total, closed, open_count)

        return DRFResponse(
            {
                "totalTickets": total,
                "openCount": open_count,
                "closedCount": closed,
                "avgResolutionHours": avg_resolution_hours,
                "byStatus": by_status,
                "byPriority": by_priority,
                "resolutionVelocity": velocity,
            }
        )
