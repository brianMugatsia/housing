from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    AdminApprovePropertyView,
    AdminPendingPropertiesView,
    AdminRejectPropertyView,
    AmenityListView,
    PropertyViewSet,
)

router = DefaultRouter()
router.register(r"", PropertyViewSet, basename="property")

urlpatterns = [
    # Static routes MUST come before router includes
    path("amenities/", AmenityListView.as_view(), name="amenity-list"),
    path("admin/pending/", AdminPendingPropertiesView.as_view(), name="admin-pending-properties"),
    path("admin/<int:pk>/approve/", AdminApprovePropertyView.as_view(), name="admin-approve-property"),
    path("admin/<int:pk>/reject/", AdminRejectPropertyView.as_view(), name="admin-reject-property"),
    # Property ViewSet Router
    path("", include(router.urls)),
]