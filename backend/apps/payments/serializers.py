from rest_framework import serializers

from .models import Payment
from .utils import normalize_phone_number


class InitiatePaymentSerializer(serializers.Serializer):
    booking_id = serializers.IntegerField()
    phase = serializers.CharField(required=False, default="RENT")
    phone_number = serializers.CharField()

    def validate_phone_number(self, value):
        try:
            return normalize_phone_number(value)
        except ValueError as exc:
            raise serializers.ValidationError(str(exc))


class PaymentSerializer(serializers.ModelSerializer):
    student_name = serializers.SerializerMethodField()
    booking_house_number = serializers.CharField(source="booking.house_number", read_only=True)
    property_title = serializers.CharField(source="booking.property.title", read_only=True)
    property_id = serializers.IntegerField(source="booking.property.id", read_only=True)
    landlord_name = serializers.SerializerMethodField()
    landlord_id = serializers.IntegerField(source="booking.property.landlord.id", read_only=True)

    class Meta:
        model = Payment
        fields = [
            "id",
            "booking",
            "booking_house_number",
            "property_id",
            "property_title",
            "landlord_id",
            "landlord_name",
            "student_name",
            "phase",
            "amount",
            "phone_number",
            "status",
            "mpesa_receipt_number",
            "result_desc",
            "transaction_date",
            "created_at",
        ]
        read_only_fields = fields

    def get_student_name(self, obj):
        student = obj.student
        return (
            getattr(student, "get_full_name", lambda: None)()
            or getattr(student, "full_name", None)
            or student.username
        )

    def get_landlord_name(self, obj):
        landlord = obj.booking.property.landlord
        return (
            getattr(landlord, "get_full_name", lambda: None)()
            or getattr(landlord, "full_name", None)
            or landlord.username
        )