from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import models

from apps.bookings.models import Booking


class Payment(models.Model):
    class PaymentPhase(models.TextChoices):
        DEPOSIT = "DEPOSIT", "Deposit"
        RENT = "RENT", "Rent"

    class PaymentStatus(models.TextChoices):
        PENDING = "PENDING", "Pending"
        COMPLETED = "COMPLETED", "Completed"
        FAILED = "FAILED", "Failed"
        CANCELLED = "CANCELLED", "Cancelled"

    booking = models.ForeignKey(
        Booking, on_delete=models.CASCADE, related_name="payments"
    )
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="payments"
    )
    phase = models.CharField(max_length=10, choices=PaymentPhase.choices)
    amount = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(1)])
    phone_number = models.CharField(max_length=15, help_text="Format: 2547XXXXXXXX")

    status = models.CharField(
        max_length=10, choices=PaymentStatus.choices, default=PaymentStatus.PENDING
    )

    merchant_request_id = models.CharField(max_length=100, blank=True)
    checkout_request_id = models.CharField(max_length=100, blank=True, unique=True, null=True)

    mpesa_receipt_number = models.CharField(max_length=50, blank=True)
    result_code = models.IntegerField(null=True, blank=True)
    result_desc = models.CharField(max_length=255, blank=True)
    transaction_date = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.phase} - Booking#{self.booking_id} - {self.status}"