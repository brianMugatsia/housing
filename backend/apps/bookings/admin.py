from django.contrib import admin
from .models import Booking

@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = ('id', 'student', 'property', 'status', 'move_in_date', 'created_at')
    list_filter = ('status', 'created_at')
    search_fields = ('student__username', 'property__title')