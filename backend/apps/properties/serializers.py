from django.db import transaction
from rest_framework import serializers

from apps.accounts.serializers import UniversitySerializer
from .models import Amenity, Property, PropertyImage


class AmenitySerializer(serializers.ModelSerializer):
    class Meta:
        model = Amenity
        fields = ["id", "name"]


class PropertyImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = PropertyImage
        fields = ["id", "image", "is_primary", "created_at"]
        read_only_fields = ["id", "created_at"]


class LandlordPublicSerializer(serializers.Serializer):
    """Safe, non-sensitive landlord info for public property views."""

    id = serializers.IntegerField()
    full_name = serializers.CharField()
    total_properties = serializers.SerializerMethodField()

    def get_total_properties(self, obj):
        return obj.properties.filter(
            verification_status=Property.VerificationStatus.APPROVED
        ).count()


class PropertySerializer(serializers.ModelSerializer):
    """Read serializer — used for list/retrieve."""

    images = PropertyImageSerializer(many=True, read_only=True)
    amenities = AmenitySerializer(many=True, read_only=True)
    university = UniversitySerializer(read_only=True)
    landlord = LandlordPublicSerializer(read_only=True)

    class Meta:
        model = Property
        fields = [
            "id",
            "landlord",
            "university",
            "title",
            "description",
            "property_type",
            "room_type",
            "county",
            "town",
            "area",
            "address",
            "latitude",
            "longitude",
            "distance_from_university",
            "monthly_rent",
            "deposit",
            "total_rooms",
            "available_rooms",
            "gender_restriction",
            "amenities",
            "images",
            "verification_status",
            "rejection_reason",
            "created_at",
            "updated_at",
        ]


class PropertyWriteSerializer(serializers.ModelSerializer):
    amenity_ids = serializers.PrimaryKeyRelatedField(
        queryset=Amenity.objects.all(),
        many=True,
        write_only=True,
        required=False,
        source="amenities",
    )

    class Meta:
        model = Property
        fields = [
            "id",
            "university",
            "title",
            "description",
            "property_type",
            "room_type",
            "county",
            "town",
            "area",
            "address",
            "latitude",
            "longitude",
            "distance_from_university",
            "monthly_rent",
            "deposit",
            "total_rooms",
            "available_rooms",
            "gender_restriction",
            "amenity_ids",
        ]

    def validate(self, data):
        total = data.get("total_rooms", getattr(self.instance, "total_rooms", None))
        available = data.get("available_rooms", getattr(self.instance, "available_rooms", None))
        if total is not None and available is not None and available > total:
            raise serializers.ValidationError(
                {"available_rooms": "Available rooms cannot exceed total rooms."}
            )
        return data

    @transaction.atomic
    def create(self, validated_data):
        # Extract amenities because M2M relationships cannot be created via objects.create()
        amenities = validated_data.pop("amenities", [])
        request = self.context["request"]

        # Ensure landlord is attached automatically
        property_obj = Property.objects.create(landlord=request.user, **validated_data)

        if amenities:
            property_obj.amenities.set(amenities)

        return property_obj

    @transaction.atomic
    def update(self, instance, validated_data):
        amenities = validated_data.pop("amenities", None)

        critical_fields = {
            "monthly_rent",
            "deposit",
            "total_rooms",
            "available_rooms",
            "county",
            "town",
            "area",
            "address",
            "property_type",
            "room_type",
        }
        changed_critical = any(
            field in validated_data and getattr(instance, field) != validated_data[field]
            for field in critical_fields
        )

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        if instance.verification_status == Property.VerificationStatus.APPROVED and changed_critical:
            instance.verification_status = Property.VerificationStatus.PENDING_VERIFICATION
            instance.rejection_reason = ""

        instance.save()

        if amenities is not None:
            instance.amenities.set(amenities)

        return instance


class PropertyRejectSerializer(serializers.Serializer):
    reason = serializers.CharField(allow_blank=False)