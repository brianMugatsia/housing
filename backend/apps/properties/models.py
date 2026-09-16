from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import models

from apps.accounts.models import University


class Amenity(models.Model):
    name = models.CharField(max_length=100, unique=True)

    class Meta:
        verbose_name_plural = "amenities"
        ordering = ["name"]

    def __str__(self):
        return self.name


class Property(models.Model):
    class PropertyType(models.TextChoices):
        BEDSITTER = "BEDSITTER", "Bedsitter"
        SINGLE_ROOM = "SINGLE_ROOM", "Single Room"
        ONE_BEDROOM = "ONE_BEDROOM", "One Bedroom"
        TWO_BEDROOM = "TWO_BEDROOM", "Two Bedroom"
        HOSTEL = "HOSTEL", "Hostel"
        SHARED_ROOM = "SHARED_ROOM", "Shared Room"

    class RoomType(models.TextChoices):
        SINGLE_OCCUPANCY = "SINGLE_OCCUPANCY", "Single Occupancy"
        SHARED_OCCUPANCY = "SHARED_OCCUPANCY", "Shared Occupancy"

    class VerificationStatus(models.TextChoices):
        DRAFT = "DRAFT", "Draft"
        PENDING_VERIFICATION = "PENDING_VERIFICATION", "Pending Verification"
        UNDER_REVIEW = "UNDER_REVIEW", "Under Review"
        APPROVED = "APPROVED", "Approved"
        REJECTED = "REJECTED", "Rejected"
        SUSPENDED = "SUSPENDED", "Suspended"

    class GenderRestriction(models.TextChoices):
        NONE = "NONE", "No restriction"
        MALE_ONLY = "MALE_ONLY", "Male only"
        FEMALE_ONLY = "FEMALE_ONLY", "Female only"

    landlord = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="properties",
        limit_choices_to={"role": "LANDLORD"},
    )
    university = models.ForeignKey(
        University, on_delete=models.SET_NULL, null=True, related_name="properties"
    )

    title = models.CharField(max_length=255)
    description = models.TextField()
    property_type = models.CharField(max_length=20, choices=PropertyType.choices)
    room_type = models.CharField(max_length=20, choices=RoomType.choices)

    county = models.CharField(max_length=100)
    town = models.CharField(max_length=100)
    area = models.CharField(max_length=150)
    address = models.CharField(max_length=255, blank=True)
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    distance_from_university = models.DecimalField(
        max_digits=5, decimal_places=2, null=True, blank=True,
        help_text="Distance in kilometers",
    )

    monthly_rent = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)])
    deposit = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)], default=0)
    total_rooms = models.PositiveIntegerField(validators=[MinValueValidator(1)])
    available_rooms = models.PositiveIntegerField(validators=[MinValueValidator(0)])
    gender_restriction = models.CharField(
        max_length=20, choices=GenderRestriction.choices, default=GenderRestriction.NONE
    )

    amenities = models.ManyToManyField(
        Amenity, through="PropertyAmenity", related_name="properties", blank=True
    )

    verification_status = models.CharField(
        max_length=25, choices=VerificationStatus.choices, default=VerificationStatus.DRAFT
    )
    rejection_reason = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "properties"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.title} ({self.verification_status})"


class PropertyAmenity(models.Model):
    property = models.ForeignKey(Property, on_delete=models.CASCADE)
    amenity = models.ForeignKey(Amenity, on_delete=models.CASCADE)

    class Meta:
        unique_together = ("property", "amenity")


class PropertyImage(models.Model):
    property = models.ForeignKey(Property, on_delete=models.CASCADE, related_name="images")
    image = models.ImageField(upload_to="properties/%Y/%m/")
    is_primary = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-is_primary", "created_at"]

    def __str__(self):
        return f"Image for {self.property.title}"
