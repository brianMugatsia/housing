import logging
from decimal import Decimal
from django.utils import timezone
from django.db import transaction
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.bookings.models import Booking
from apps.properties.permissions import IsAdmin

from .mpesa_client import MpesaClient
from .models import Payment, LandlordPayout
from .serializers import InitiatePaymentSerializer, PaymentSerializer, LandlordPayoutSerializer
from .utils import calculate_rent_total, normalize_phone_number

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

        pct = property_obj.deposit_percentage or 100
        min_amount = (Decimal(str(property_obj.semester_rent)) * Decimal(str(pct)) / Decimal("100")).quantize(Decimal("0.01"))
        full_rent = Decimal(str(property_obj.semester_rent)) * Decimal(str(booking.duration_semesters))

        requested_amount = data.get("amount")
        if requested_amount is not None:
            amount = Decimal(str(requested_amount))
            if amount < min_amount:
                return Response(
                    {"detail": f"Amount cannot be less than the required minimum ({pct}% deposit: {min_amount}). You may pay more up to full rent ({full_rent})."}, 
                    status=status.HTTP_400_BAD_REQUEST,
                )
        else:
            amount = min_amount

        description = f"Rent/Deposit BK{booking.id}"

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
            return Response({"ResultCode": 0, "ResultDesc": "Accepted"})

        with transaction.atomic():
            payment.result_code = result_code
            payment.result_desc = result_desc

            if result_code == 0:
                metadata_items = (
                    stk_callback.get("CallbackMetadata", {}).get("Item", [])
                )
                metadata = {item["Name"]: item.get("Value") for item in metadata_items}

                payment.status = Payment.PaymentStatus.COMPLETED
                payment.mpesa_receipt_number = metadata.get("MpesaReceiptNumber", "")

                raw_date = metadata.get("TransactionDate")
                if raw_date:
                    from datetime import datetime
                    payment.transaction_date = datetime.strptime(str(raw_date), "%Y%m%d%H%M%S")

                payment.save()

                booking = payment.booking
                booking.status = "CONFIRMED"
                booking.save()

                prop = booking.property
                room_num = booking.house_number
                if room_num and hasattr(prop, 'available_room_numbers') and isinstance(prop.available_room_numbers, list):
                    if room_num in prop.available_room_numbers:
                        prop.available_room_numbers.remove(room_num)
                        prop.available_rooms = max(0, len(prop.available_room_numbers))
                        prop.save()

            else:
                payment.status = Payment.PaymentStatus.FAILED
                payment.save()

        return Response({"ResultCode": 0, "ResultDesc": "Accepted"})


class LandlordPaymentsView(generics.ListAPIView):
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


class LandlordPayoutsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        if getattr(user, "role", None) != "LANDLORD":
            return Response({"detail": "Only landlords can access payout records."}, status=status.HTTP_403_FORBIDDEN)

        payouts = LandlordPayout.objects.filter(landlord=user)
        payments = Payment.objects.filter(booking__property__landlord=user, status=Payment.PaymentStatus.COMPLETED)

        total_collected = sum([p.amount for p in payments], Decimal("0.00"))
        platform_commission = (total_collected * Decimal("0.07")).quantize(Decimal("0.01"))
        landlord_entitlement = (total_collected * Decimal("0.93")).quantize(Decimal("0.01"))

        total_paid_out = sum([p.amount for p in payouts if p.status == LandlordPayout.Status.COMPLETED], Decimal("0.00"))
        pending_payout = landlord_entitlement - total_paid_out

        return Response({
            "total_collected": str(total_collected),
            "platform_commission": str(platform_commission),
            "landlord_entitlement": str(landlord_entitlement),
            "total_paid_out": str(total_paid_out),
            "pending_payout": str(max(Decimal("0.00"), pending_payout)),
            "payouts": LandlordPayoutSerializer(payouts, many=True).data
        })


class AdminPaymentsView(generics.ListAPIView):
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


class AdminProcessRefundView(APIView):
    permission_classes = [IsAdmin]

    def post(self, request, pk):
        try:
            payment = Payment.objects.get(pk=pk)
        except Payment.DoesNotExist:
            return Response({"detail": "Payment record not found."}, status=status.HTTP_404_NOT_FOUND)

        if payment.status != Payment.PaymentStatus.COMPLETED:
            return Response(
                {"detail": f"Only completed payments can be refunded. Current status: {payment.status}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if payment.refund_approved:
            return Response(
                {"detail": "This payment has already been refunded."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        reason = request.data.get("reason", "Student housing booking cancellation refund.")

        amount = payment.amount
        retention_fee = (amount * Decimal("0.05")).quantize(Decimal("0.01"))
        refund_amount = (amount * Decimal("0.95")).quantize(Decimal("0.01"))

        client = MpesaClient()
        try:
            b2c_res = client.b2c_payment(
                phone_number=payment.phone_number,
                amount=refund_amount,
                remarks="95pct Refund",
                occasion=f"Booking#{payment.booking_id} Refund"
            )
        except Exception as exc:
            logger.exception("M-Pesa B2C refund payout failed")
            return Response(
                {"detail": f"Failed to execute M-Pesa B2C payout: {str(exc)}"},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        with transaction.atomic():
            payment.refund_approved = True
            payment.status = Payment.PaymentStatus.REFUNDED
            payment.refunded_amount = refund_amount
            payment.retention_fee_amount = retention_fee
            payment.refund_reason = reason
            payment.refunded_at = timezone.now()
            payment.save()

            booking = payment.booking
            booking.status = "CANCELLED"
            booking.save()

        return Response(
            {
                "detail": "Refund approved and 95% B2C payout initiated successfully.",
                "original_amount": str(amount),
                "refunded_amount": str(refund_amount),
                "retention_fee_5_percent": str(retention_fee),
                "b2c_response": b2c_res,
            },
            status=status.HTTP_200_OK,
        )


class AdminLandlordPayoutView(APIView):
    """
    Admin triggers an M-Pesa B2C payout to a landlord.
    """
    permission_classes = [IsAdmin]

    def post(self, request):
        landlord_id = request.data.get("landlord_id")
        amount = request.data.get("amount")
        phone_number = request.data.get("phone_number")
        property_id = request.data.get("property_id")
        remarks = request.data.get("remarks", "Landlord Rent Payout")

        if not landlord_id or not amount or not phone_number:
            return Response({"detail": "landlord_id, amount, and phone_number are required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            norm_phone = normalize_phone_number(phone_number)
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        try:
            from apps.accounts.models import User
            landlord = User.objects.get(pk=landlord_id, role="LANDLORD")
        except User.DoesNotExist:
            return Response({"detail": "Landlord user not found."}, status=status.HTTP_404_NOT_FOUND)

        payout_amount = Decimal(str(amount))
        if payout_amount <= 0:
            return Response({"detail": "Payout amount must be greater than zero."}, status=status.HTTP_400_BAD_REQUEST)

        client = MpesaClient()
        try:
            b2c_res = client.b2c_payment(
                phone_number=norm_phone,
                amount=payout_amount,
                remarks=remarks,
                occasion=f"Landlord#{landlord_id} Payout"
            )
        except Exception as exc:
            logger.exception("M-Pesa B2C landlord payout failed")
            return Response(
                {"detail": f"Failed to execute M-Pesa B2C payout: {str(exc)}"},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        conversation_id = b2c_res.get("ConversationID", "")
        originator_conversation_id = b2c_res.get("OriginatorConversationID", "")
        response_code = b2c_res.get("ResponseCode", "1")

        status_val = LandlordPayout.Status.COMPLETED if response_code == "0" else LandlordPayout.Status.PENDING

        payout = LandlordPayout.objects.create(
            landlord=landlord,
            property_id=property_id if property_id else None,
            amount=payout_amount,
            phone_number=norm_phone,
            status=status_val,
            conversation_id=conversation_id,
            originator_conversation_id=originator_conversation_id,
            result_desc=b2c_res.get("ResponseDescription", "Payout initiated")
        )

        return Response({
            "detail": "M-Pesa B2C landlord payout initiated successfully.",
            "payout": LandlordPayoutSerializer(payout).data,
            "b2c_response": b2c_res,
        }, status=status.HTTP_200_OK)


class AdminAccountBalanceView(APIView):
    """
    Queries M-Pesa Account Balance via B2C/AccountBalance API.
    """
    permission_classes = [IsAdmin]

    def get(self, request):
        client = MpesaClient()
        initiator = getattr(settings, "MPESA_INITIATOR_NAME", "testinitiator")
        security_credential = getattr(settings, "MPESA_SECURITY_CREDENTIAL", "")
        result_url = getattr(settings, "MPESA_CALLBACK_URL", "https://api.safaricom.co.ke/mpesa")
        queue_timeout_url = result_url

        try:
            res = client.account_balance(
                initiator=initiator,
                security_credential=security_credential,
                result_url=result_url,
                queue_timeout_url=queue_timeout_url,
            )
            return Response(res, status=status.HTTP_200_OK)
        except Exception as exc:
            logger.exception("Account balance query failed")
            return Response({"detail": f"Failed to query account balance: {str(exc)}"}, status=status.HTTP_502_BAD_GATEWAY)


class AdminTransactionStatusView(APIView):
    """
    Queries M-Pesa Transaction Status.
    """
    permission_classes = [IsAdmin]

    def post(self, request):
        transaction_id = request.data.get("transaction_id")
        if not transaction_id:
            return Response({"detail": "transaction_id is required."}, status=status.HTTP_400_BAD_REQUEST)

        client = MpesaClient()
        initiator = getattr(settings, "MPESA_INITIATOR_NAME", "testinitiator")
        security_credential = getattr(settings, "MPESA_SECURITY_CREDENTIAL", "")
        result_url = getattr(settings, "MPESA_CALLBACK_URL", "https://api.safaricom.co.ke/mpesa")
        queue_timeout_url = result_url

        try:
            res = client.transaction_status(
                transaction_id=transaction_id,
                initiator=initiator,
                security_credential=security_credential,
                result_url=result_url,
                queue_timeout_url=queue_timeout_url,
            )
            return Response(res, status=status.HTTP_200_OK)
        except Exception as exc:
            logger.exception("Transaction status query failed")
            return Response({"detail": f"Failed to query transaction status: {str(exc)}"}, status=status.HTTP_502_BAD_GATEWAY)
