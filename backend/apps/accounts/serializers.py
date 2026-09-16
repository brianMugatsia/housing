from django.contrib.auth import get_user_model
from django.db import transaction
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import StudentProfile, LandlordProfile, University

User = get_user_model()


class RegisterSerializer(serializers.Serializer):
    full_name = serializers.CharField(max_length=255)
    email = serializers.EmailField()
    phone = serializers.CharField(max_length=20)
    password = serializers.CharField(write_only=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True)
    role = serializers.ChoiceField(choices=[User.Role.STUDENT, User.Role.LANDLORD])

    university = serializers.PrimaryKeyRelatedField(
        queryset=University.objects.all(), required=False, allow_null=True
    )
    registration_number = serializers.CharField(required=False, allow_blank=True)
    id_number = serializers.CharField(required=False, allow_blank=True)

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("An account with this email already exists.")
        return value.lower()

    def validate(self, data):
        if data["password"] != data["confirm_password"]:
            raise serializers.ValidationError({"confirm_password": "Passwords do not match."})

        # Role-based validation checks
        if data["role"] == User.Role.STUDENT:
            if not data.get("university") or not data.get("registration_number"):
                raise serializers.ValidationError(
                    {"non_field_errors": ["University and registration number are required for students."]}
                )
            if StudentProfile.objects.filter(
                registration_number=data["registration_number"]
            ).exists():
                raise serializers.ValidationError(
                    {"registration_number": "This registration number is already registered."}
                )
        elif data["role"] == User.Role.LANDLORD:
            if not data.get("id_number"):
                raise serializers.ValidationError(
                    {"id_number": "National ID number is required for landlords."}
                )

        return data

    @transaction.atomic
    def create(self, validated_data):
        validated_data.pop("confirm_password")
        role = validated_data["role"]
        
        university = validated_data.pop("university", None)
        registration_number = validated_data.pop("registration_number", "")
        id_number = validated_data.pop("id_number", "")

        user = User.objects.create_user(
            email=validated_data["email"],
            full_name=validated_data["full_name"],
            phone=validated_data.get("phone", ""),
            password=validated_data["password"],
            role=role,
        )

        if role == User.Role.STUDENT:
            StudentProfile.objects.create(
                user=user,
                university=university,
                registration_number=registration_number,
            )
        else:
            LandlordProfile.objects.create(
                user=user,
                id_number=id_number,
            )
        return user


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "full_name", "email", "phone", "role", "is_verified", "created_at"]


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    username_field = User.USERNAME_FIELD

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token["role"] = user.role
        token["full_name"] = user.full_name
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        data["user"] = UserSerializer(self.user).data
        return data


class UniversitySerializer(serializers.ModelSerializer):
    class Meta:
        model = University
        fields = ["id", "name", "location", "county"]