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
