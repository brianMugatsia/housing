import json
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
            "available_room_numbers",
            "gender_restriction",
            "amenities",
            "images",
            "verification_status",
            "rejection_reason",
            "created_at",
            "updated_at",
        ]


class PropertyWriteSerializer(serializers.ModelSerializer):
    amenities = serializers.CharField(write_only=True, required=False)
    available_room_numbers = serializers.CharField(required=False, allow_blank=True)

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
            "available_room_numbers",
            "gender_restriction",
            "amenities",
        ]

    def validate_available_room_numbers(self, value):
        if not value:
            return []
        if isinstance(value, str):
            try:
                parsed = json.loads(value)
                if isinstance(parsed, list):
                    return parsed
            except (json.JSONDecodeError, TypeError):
                pass
            return [item.strip() for item in value.split(",") if item.strip()]
        return value

    def validate_amenities(self, value):
        if not value:
            return []
        if isinstance(value, str):
            try:
                parsed = json.loads(value)
                if isinstance(parsed, list):
                    return parsed
            except (json.JSONDecodeError, TypeError):
                pass
            return [item.strip() for item in value.split(",") if item.strip()]
        return value

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
        amenity_names = validated_data.pop("amenities", [])
        request = self.context["request"]

        # 1. Create property object
        property_obj = Property.objects.create(landlord=request.user, **validated_data)

        # 2. Attach Amenities via M2M mapping
        if amenity_names:
            amenity_instances = []
            for name in amenity_names:
                amenity_obj, _ = Amenity.objects.get_or_create(name=name.strip())
                amenity_instances.append(amenity_obj)
            property_obj.amenities.set(amenity_instances)

        # 3. Handle multipart images passed during creation
        uploaded_images = request.FILES.getlist("uploaded_images") or request.FILES.getlist("images")
        for i, file_obj in enumerate(uploaded_images):
            PropertyImage.objects.create(
                property=property_obj,
                image=file_obj,
                is_primary=(i == 0)
            )

        return property_obj

    @transaction.atomic
    def update(self, instance, validated_data):
        amenity_names = validated_data.pop("amenities", None)

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

        if amenity_names is not None:
            amenity_instances = []
            for name in amenity_names:
                amenity_obj, _ = Amenity.objects.get_or_create(name=name.strip())
                amenity_instances.append(amenity_obj)
            instance.amenities.set(amenity_instances)

        return instance


class PropertyRejectSerializer(serializers.Serializer):
    reason = serializers.CharField(allow_blank=False)