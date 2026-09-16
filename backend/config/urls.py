from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/auth/", include("apps.accounts.urls")),
    path("api/properties/", include("apps.properties.urls")),
    path("api/bookings/", include("apps.bookings.urls")),
    path("api/notifications/", include("apps.notifications.urls")),
    path("api/admin/", include("apps.dashboard.urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)