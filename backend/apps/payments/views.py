import logging

from django.db import transaction
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.bookings.models import Booking
from apps.properties.permissions import IsAdmin

from .mpesa_client import MpesaClient
from .models import Payment
from .serializers import InitiatePaymentSerializer, PaymentSerializer
from .utils import calculate_rent_total

logger = logging.getLogger(__name__)


class InitiateSTKPushView(APIView):
    """
    Starts an M-Pesa STK Push for the full payment amount of an approved booking.
    Students pay the full amount directly (no deposit requirement).
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = InitiatePaymentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        try:
            booking = Booking.objects.select_related("property").get(
                pk=data["booking_id"], student=request.user
            )
        except Booking.DoesNotExist:
            return Response(
                {"detail": "Booking not found."}, status=status.HTTP_404_NOT_FOUND
            )

        if booking.status not in ["APPROVED", "PENDING"]:
            if booking.status == "CONFIRMED":
                return Response(
                    {"detail": "This booking is already fully paid and confirmed."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            return Response(
                {"detail": f"Cannot pay for booking with status '{booking.status}'. Ensure it is approved."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        property_obj = booking.property
        phase = data.get("phase") or "RENT"

        # Calculate full rent amount for the student's stay
        amount = calculate_rent_total(property_obj.semester_rent, booking.duration_months)
        description = f"Full Rent BK{booking.id}"

        payment = Payment.objects.create(
            booking=booking,
            student=request.user,
            phase=phase,
            amount=amount,
            phone_number=data["phone_number"],
        )

        client = MpesaClient()
        try:
            mpesa_response = client.stk_push(
                phone_number=data["phone_number"],
                amount=amount,
                account_reference=f"BK{booking.id}",
                transaction_desc=description,
            )
        except Exception as exc:
            logger.exception("STK push request failed")
            payment.status = Payment.PaymentStatus.FAILED
            payment.result_desc = str(exc)
            payment.save()
            return Response(
                {"detail": "Failed to initiate M-Pesa payment. Please try again."},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        # ResponseCode "0" means Safaricom accepted the push request (not
        # that the customer has paid yet — that confirmation comes later
        # via the callback).
        if mpesa_response.get("ResponseCode") != "0":
            payment.status = Payment.PaymentStatus.FAILED
            payment.result_desc = mpesa_response.get("ResponseDescription", "")
            payment.save()
            return Response(mpesa_response, status=status.HTTP_400_BAD_REQUEST)

        payment.merchant_request_id = mpesa_response.get("MerchantRequestID", "")
        payment.checkout_request_id = mpesa_response.get("CheckoutRequestID", "")
        payment.save()

        return Response(
            {
                "detail": "STK push sent. Check your phone to enter your M-Pesa PIN.",
                "checkout_request_id": payment.checkout_request_id,
                "payment_id": payment.id,
            },
            status=status.HTTP_200_OK,
        )


class PaymentStatusView(APIView):
    """Polled by the frontend after an STK push while waiting for the
    async callback to arrive."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, checkout_request_id):
        try:
            payment = Payment.objects.get(
                checkout_request_id=checkout_request_id, student=request.user
            )
        except Payment.DoesNotExist:
            return Response({"detail": "Payment not found."}, status=status.HTTP_404_NOT_FOUND)

        return Response(PaymentSerializer(payment).data)


class MpesaCallbackView(APIView):
    """
    Safaricom calls this URL directly — it is NOT authenticated by our
    own auth system, since Safaricom's servers can't hold a user token.
    Do not add IsAuthenticated here.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        body = request.data
        logger.info("M-Pesa callback received: %s", body)

        try:
            stk_callback = body["Body"]["stkCallback"]
        except (KeyError, TypeError):
            logger.error("Malformed M-Pesa callback payload: %s", body)
            return Response({"ResultCode": 1, "ResultDesc": "Malformed payload"})

        checkout_request_id = stk_callback.get("CheckoutRequestID")
        result_code = stk_callback.get("ResultCode")
        result_desc = stk_callback.get("ResultDesc", "")

        try:
            payment = Payment.objects.select_related("booking").get(
                checkout_request_id=checkout_request_id
            )
        except Payment.DoesNotExist:
            logger.error("No matching Payment for CheckoutRequestID=%s", checkout_request_id)
            # Still return success to Safaricom — this isn't their problem,
            # and retrying won't fix a payment record that doesn't exist.
            return Response({"ResultCode": 0, "ResultDesc": "Accepted"})

        with transaction.atomic():
            payment.result_code = result_code
            payment.result_desc = result_desc

            if result_code == 0:
                # Successful payment — extract the receipt number and
                # transaction date from the metadata items Safaricom sends.
                metadata_items = (
                    stk_callback.get("CallbackMetadata", {}).get("Item", [])
                )
                metadata = {item["Name"]: item.get("Value") for item in metadata_items}

                payment.status = Payment.PaymentStatus.COMPLETED
                payment.mpesa_receipt_number = metadata.get("MpesaReceiptNumber", "")

                raw_date = metadata.get("TransactionDate")
                if raw_date:
                    # Safaricom sends this as YYYYMMDDHHMMSS (integer)
                    from datetime import datetime
                    payment.transaction_date = datetime.strptime(str(raw_date), "%Y%m%d%H%M%S")

                payment.save()

                booking = payment.booking
                booking.status = "CONFIRMED"
                booking.save()

            else:
                # User cancelled, insufficient funds, timeout, etc.
                payment.status = Payment.PaymentStatus.FAILED
                payment.save()

        # Safaricom expects this exact acknowledgement shape regardless
        # of the payment outcome — it just confirms we received the callback.
        return Response({"ResultCode": 0, "ResultDesc": "Accepted"})


class LandlordPaymentsView(generics.ListAPIView):
    """
    Lists all payments across the landlord's properties, so they can see
    which students have paid deposits/rent and which are still pending.
    """
    serializer_class = PaymentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if getattr(user, "role", None) != "LANDLORD":
            return Payment.objects.none()

        qs = Payment.objects.filter(
            booking__property__landlord=user
        ).select_related("booking", "booking__property", "student")

        booking_id = self.request.query_params.get("booking")
        if booking_id:
            qs = qs.filter(booking_id=booking_id)

        return qs


class AdminPaymentsView(generics.ListAPIView):
    """
    Lists every payment platform-wide, for admin oversight. Supports
    optional filtering by property, landlord, or payment status so an
    admin can drill into a specific property/landlord's collections.
    """
    serializer_class = PaymentSerializer
    permission_classes = [IsAdmin]

    def get_queryset(self):
        qs = Payment.objects.select_related(
            "booking", "booking__property", "booking__property__landlord", "student"
        )

        property_id = self.request.query_params.get("property")
        if property_id:
            qs = qs.filter(booking__property_id=property_id)

        landlord_id = self.request.query_params.get("landlord")
        if landlord_id:
            qs = qs.filter(booking__property__landlord_id=landlord_id)

        status_filter = self.request.query_params.get("status")
        if status_filter:
            qs = qs.filter(status=status_filter)

        phase_filter = self.request.query_params.get("phase")
        if phase_filter:
            qs = qs.filter(phase=phase_filter)

        return qs