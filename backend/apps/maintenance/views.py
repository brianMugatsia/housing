from rest_framework import generics, permissions, status
from rest_framework.response import Response
from .models import MaintenanceTicket
from .serializers import MaintenanceTicketSerializer


class MaintenanceTicketListCreateView(generics.ListCreateAPIView):
    serializer_class = MaintenanceTicketSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        role = getattr(user, 'role', None)
        if role == "ADMIN" or user.is_staff or user.is_superuser:
            return MaintenanceTicket.objects.select_related("student", "property")
        elif role == "LANDLORD":
            return MaintenanceTicket.objects.filter(property__landlord=user).select_related(
                "student", "property"
            )
        else:
            return MaintenanceTicket.objects.filter(student=user).select_related(
                "student", "property"
            )

    def perform_create(self, serializer):
        serializer.save(student=self.request.user)


class MaintenanceTicketDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = MaintenanceTicketSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        role = getattr(user, 'role', None)
        if role == "ADMIN" or user.is_staff or user.is_superuser:
            return MaintenanceTicket.objects.all()
        elif role == "LANDLORD":
            return MaintenanceTicket.objects.filter(property__landlord=user)
        else:
            return MaintenanceTicket.objects.filter(student=user)
