from rest_framework.permissions import BasePermission


class IsAdminUser(BasePermission):
    """Distinct from DRF's built-in IsAdminUser: this only checks the
    authenticated session's is_staff flag, never a Ticket.token."""

    def has_permission(self, request, view) -> bool:
        return bool(request.user and request.user.is_authenticated and request.user.is_staff)
