from rest_framework import serializers
from .models import Booking
from apps.properties.models import Property
from apps.properties.serializers import PropertySerializer


class BookingSerializer(serializers.ModelSerializer):
    property_details = PropertySerializer(source='property', read_only=True)
    student_name = serializers.CharField(source='student.get_full_name', read_only=True)
    student_phone = serializers.CharField(source='student.phone_number', read_only=True)

    class Meta:
        model = Booking
        fields = [
            'id',
            'student',
            'student_name',
            'student_phone',
            'property',
            'property_details',
            'house_number',
            'move_in_date',
            'duration_months',
            'notes',
            'status',
            'tenant_signature',
            'landlord_signature',
            'lease_signed_at',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['student', 'created_at', 'updated_at']

    def validate(self, attrs):
        prop = attrs.get('property')
        house_number = attrs.get('house_number')

        if prop and house_number:
            # Check if selected unit is still present in available units list
            available_list = getattr(prop, 'available_room_numbers', []) or []
            if available_list and house_number not in available_list:
                raise serializers.ValidationError({
                    'house_number': f"Unit {house_number} is no longer available for booking."
                })
        return attrs
