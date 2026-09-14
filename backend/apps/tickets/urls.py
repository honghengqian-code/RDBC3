from django.urls import path

from apps.tickets import views

public_urlpatterns = [
    path("tickets/", views.PublicTicketCreateView.as_view(), name="public-ticket-create"),
    path("tickets/lookup/", views.PublicTicketLookupView.as_view(), name="public-ticket-lookup"),
    path(
        "tickets/track/<str:verify_token>/",
        views.PublicTrackedTicketsView.as_view(),
        name="public-tracked-tickets",
    ),
    path("tickets/<str:token>/", views.PublicTicketDetailView.as_view(), name="public-ticket-detail"),
    path(
        "tickets/<str:token>/responses/",
        views.PublicTicketResponseCreateView.as_view(),
        name="public-ticket-response-create",
    ),
]

admin_auth_urlpatterns = [
    path("login/", views.AdminLoginView.as_view(), name="admin-login"),
    path("logout/", views.AdminLogoutView.as_view(), name="admin-logout"),
    path("session/", views.AdminSessionView.as_view(), name="admin-session"),
]

admin_urlpatterns = [
    path("tickets/", views.AdminTicketListView.as_view(), name="admin-ticket-list"),
    path(
        "tickets/bulk-delete/",
        views.AdminTicketBulkDeleteView.as_view(),
        name="admin-ticket-bulk-delete",
    ),
    path("tickets/<uuid:id>/", views.AdminTicketDetailView.as_view(), name="admin-ticket-detail"),
    path(
        "tickets/<uuid:id>/responses/",
        views.AdminTicketResponseCreateView.as_view(),
        name="admin-ticket-response-create",
    ),
]
