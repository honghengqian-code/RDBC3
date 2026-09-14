from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path

from apps.tickets.urls import admin_auth_urlpatterns, admin_urlpatterns, public_urlpatterns

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/public/", include(public_urlpatterns)),
    path("api/admin/auth/", include(admin_auth_urlpatterns)),
    path("api/admin/", include(admin_urlpatterns)),
    path("api/admin/analytics/", include("apps.analytics.urls")),
]

if settings.DEBUG:
    # Local dev only — a real deployment serves MEDIA_ROOT from the web
    # server/object storage in front of Django, not from Django itself.
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
