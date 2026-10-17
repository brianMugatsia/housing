from rest_framework import serializers
from .models import Message


class MessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.CharField(source="sender.full_name", read_only=True)
    recipient_name = serializers.CharField(source="recipient.full_name", read_only=True)
    property_title = serializers.CharField(source="property.title", read_only=True)

    class Meta:
        model = Message
        fields = [
            "id",
            "sender",
            "sender_name",
            "recipient",
            "recipient_name",
            "property",
            "property_title",
            "content",
            "is_read",
            "created_at",
        ]
        read_only_fields = ["sender", "created_at"]
