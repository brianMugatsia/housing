from django.contrib import admin

from .models import Payment


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = (
        "id", "booking", "phase", "amount", "status",
        "phone_number", "mpesa_receipt_number", "created_at",
    )
    list_filter = ("phase", "status")
    search_fields = ("phone_number", "mpesa_receipt_number", "checkout_request_id")
    readonly_fields = [f.name for f in Payment._meta.fields]