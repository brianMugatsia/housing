from django.contrib import admin
from .models import Message


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ("id", "sender", "recipient", "property", "is_read", "created_at")
    list_filter = ("is_read",)
    search_fields = ("content", "sender__full_name", "recipient__full_name")
