from django.conf import settings
from django.db import models
from apps.properties.models import Property


class Booking(models.Model):
    STATUS_CHOICES = (
        ('PENDING', 'Pending'),
        ('APPROVED', 'Approved'),
        ('DEPOSIT_PAID', 'Deposit Paid'),
        ('CONFIRMED', 'Confirmed'),
        ('CANCELLED', 'Cancelled'),
        ('REJECTED', 'Rejected'),
        ('VACATED', 'Vacated'),
        ('RELOCATED', 'Relocated'),
    )

    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='bookings'
    )
    property = models.ForeignKey(
        Property,
        on_delete=models.CASCADE,
        related_name='bookings'
    )
    house_number = models.CharField(max_length=50, blank=True, default="")  
    move_in_date = models.DateField()
    duration_semesters = models.IntegerField(default=1)
    notes = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    
    # E-signing fields
    tenant_signature = models.TextField(blank=True, default="")
    landlord_signature = models.TextField(blank=True, default="")
    lease_signed_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        unit_info = f" (Unit: {self.house_number})" if self.house_number else ""
        return f"{self.student} - {self.property.title}{unit_info} ({self.status})"
