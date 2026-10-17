from django.contrib import admin
from .models import MaintenanceTicket


@admin.register(MaintenanceTicket)
class MaintenanceTicketAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "title",
        "student",
        "property",
        "category",
        "priority",
        "status",
        "created_at",
    )
    list_filter = ("status", "category", "priority")
    search_fields = ("title", "description", "student__full_name", "property__title")
