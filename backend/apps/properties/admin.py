from django.contrib import admin
from django.utils.html import format_html
from .models import Property, PropertyImage, Amenity

# Register Amenity once
admin.site.register(Amenity)


class PropertyImageInline(admin.TabularInline):
    model = PropertyImage
    extra = 0
    readonly_fields = ("image_preview",)

    def image_preview(self, obj):
        if obj.image:
            return format_html(
                '<img src="{}" style="max-height: 100px; max-width: 150px; border-radius: 4px;" />',
                obj.image.url,
            )
        return "No Image"

    image_preview.short_description = "Preview"


@admin.register(Property)
class PropertyAdmin(admin.ModelAdmin):
    list_display = (
        "title",
        "landlord",
        "university",
        "monthly_rent",
        "verification_status",
        "created_at",
    )
    list_filter = ("verification_status", "property_type", "room_type", "university")
    search_fields = ("title", "landlord__email", "landlord__username", "town", "area")
    readonly_fields = ("created_at", "updated_at")
    inlines = [PropertyImageInline]
    actions = ["approve_properties", "reject_properties"]

    @admin.action(description="Approve selected properties")
    def approve_properties(self, request, queryset):
        updated_count = queryset.update(
            verification_status=Property.VerificationStatus.APPROVED,
            rejection_reason="",
        )
        self.message_user(
            request, f"{updated_count} property/properties successfully approved."
        )

    @admin.action(description="Reject selected properties")
    def reject_properties(self, request, queryset):
        updated_count = queryset.update(
            verification_status=Property.VerificationStatus.REJECTED
        )
        self.message_user(
            request, f"{updated_count} property/properties set to rejected."
        )