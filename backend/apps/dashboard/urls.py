from django.urls import path

from apps.properties.views import (
    AdminApprovePropertyView,
    AdminPendingPropertiesView,
    AdminRejectPropertyView,
)

urlpatterns = [
    path("properties/pending/", AdminPendingPropertiesView.as_view(), name="admin-properties-pending"),
    path("properties/<int:pk>/approve/", AdminApprovePropertyView.as_view(), name="admin-property-approve"),
    path("properties/<int:pk>/reject/", AdminRejectPropertyView.as_view(), name="admin-property-reject"),
]
