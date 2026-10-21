import random
from datetime import timedelta
from django.utils import timezone
from django.conf import settings
from django.core.mail import send_mail
from django.contrib.auth import get_user_model
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView

from .models import University, PasswordOTP
from .serializers import (
    RegisterSerializer,
    UserSerializer,
    CustomTokenObtainPairSerializer,
    UniversitySerializer,
)

User = get_user_model()


class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(UserSerializer(user).data, status=201)


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer
    permission_classes = [permissions.AllowAny]


class MeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)


class UniversityListView(generics.ListAPIView):
    queryset = University.objects.all().order_by("name")
    serializer_class = UniversitySerializer
    permission_classes = [permissions.AllowAny]


class ForgotPasswordView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get("email")
        if not email:
            return Response({"detail": "Email is required."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            user = User.objects.get(email__iexact=email)
        except User.DoesNotExist:
            return Response({"detail": "If an account with this email exists, an OTP has been sent."}, status=status.HTTP_200_OK)

        otp_code = f"{random.randint(100000, 999999)}"
        PasswordOTP.objects.create(user=user, otp_code=otp_code)

        try:
            send_mail(
                subject="Password Reset OTP - Student House Booking",
                message=f"Hello {user.full_name},\n\nYour OTP for password reset is: {otp_code}\n\nIt is valid for 15 minutes.",
                from_email=None,
                recipient_list=[user.email],
                fail_silently=True,
            )
        except Exception:
            pass

        response_data = {"detail": "OTP sent to email."}
        if settings.DEBUG:
            response_data["dev_otp"] = otp_code
        return Response(response_data, status=status.HTTP_200_OK)


class ResetPasswordWithOTPView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get("email")
        otp_code = request.data.get("otp_code")
        new_password = request.data.get("new_password")

        if not email or not otp_code or not new_password:
            return Response({"detail": "Email, OTP code, and new password are required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(email__iexact=email)
        except User.DoesNotExist:
            return Response({"detail": "Invalid email or OTP."}, status=status.HTTP_400_BAD_REQUEST)

        expiry_time = timezone.now() - timedelta(minutes=15)
        otp_obj = PasswordOTP.objects.filter(
            user=user, 
            otp_code=otp_code, 
            is_used=False,
            created_at__gte=expiry_time
        ).order_by("-created_at").first()

        if not otp_obj:
            return Response({"detail": "Invalid or expired OTP code."}, status=status.HTTP_400_BAD_REQUEST)

        otp_obj.is_used = True
        otp_obj.save()

        user.set_password(new_password)
        user.save()

        return Response({"detail": "Password reset successfully. You can now log in."}, status=status.HTTP_200_OK)
