from rest_framework import serializers
from .models import Booking
from apps.properties.models import Property
from apps.properties.serializers import PropertySerializer  # Adjust import path if needed

class BookingSerializer(serializers.ModelSerializer):
    # Retrieve details for display
    property_details = PropertySerializer(source='property', read_only=True)
    student_name = serializers.CharField(source='student.full_name', read_only=True)

    class Meta:
        model = Booking
        fields = [
            'id',
            'student',
            'student_name',
            'property',
            'property_details',
            'house_number',
            'move_in_date',
            'duration_months',
            'notes',
            'status',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['student', 'created_at', 'updated_at']