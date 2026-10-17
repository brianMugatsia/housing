from rest_framework import serializers
from .models import MaintenanceTicket


class MaintenanceTicketSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source="student.full_name", read_only=True)
    property_title = serializers.CharField(source="property.title", read_only=True)

    class Meta:
        model = MaintenanceTicket
        fields = [
            "id",
            "student",
            "student_name",
            "property",
            "property_title",
            "title",
            "description",
            "category",
            "priority",
            "status",
            "image",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["student", "created_at", "updated_at"]
