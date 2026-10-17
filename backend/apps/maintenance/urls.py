from django.urls import path
from .views import MaintenanceTicketListCreateView, MaintenanceTicketDetailView

urlpatterns = [
    path("", MaintenanceTicketListCreateView.as_view(), name="maintenance-list-create"),
    path("<int:pk>/", MaintenanceTicketDetailView.as_view(), name="maintenance-detail"),
]
