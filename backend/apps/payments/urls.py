from django.urls import path

from .views import (
    AdminPaymentsView,
    InitiateSTKPushView,
    LandlordPaymentsView,
    MpesaCallbackView,
    PaymentStatusView,
)

urlpatterns = [
    path("stk-push/", InitiateSTKPushView.as_view(), name="payment-stk-push"),
    path("status/<str:checkout_request_id>/", PaymentStatusView.as_view(), name="payment-status"),
    path("confirm/", MpesaCallbackView.as_view(), name="payment-confirm"),
    path("mpesa/callback/", MpesaCallbackView.as_view(), name="mpesa-callback"),
    path("landlord/", LandlordPaymentsView.as_view(), name="landlord-payments"),
    path("admin/", AdminPaymentsView.as_view(), name="admin-payments"),
]
