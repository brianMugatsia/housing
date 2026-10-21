from django.urls import path

from .views import (
    AdminPaymentsView,
    AdminProcessRefundView,
    AdminLandlordPayoutView,
    AdminAccountBalanceView,
    AdminTransactionStatusView,
    InitiateSTKPushView,
    LandlordPaymentsView,
    LandlordPayoutsView,
    MpesaCallbackView,
    PaymentStatusView,
)

urlpatterns = [
    path("stk-push/", InitiateSTKPushView.as_view(), name="payment-stk-push"),
    path("status/<str:checkout_request_id>/", PaymentStatusView.as_view(), name="payment-status"),
    path("confirm/", MpesaCallbackView.as_view(), name="payment-confirm"),
    path("mpesa/callback/", MpesaCallbackView.as_view(), name="mpesa-callback"),
    path("landlord/", LandlordPaymentsView.as_view(), name="landlord-payments"),
    path("landlord/payouts/", LandlordPayoutsView.as_view(), name="landlord-payouts"),
    path("admin/", AdminPaymentsView.as_view(), name="admin-payments"),
    path("admin/<int:pk>/refund/", AdminProcessRefundView.as_view(), name="admin-process-refund"),
    path("admin/landlord-payout/", AdminLandlordPayoutView.as_view(), name="admin-landlord-payout"),
    path("admin/account-balance/", AdminAccountBalanceView.as_view(), name="admin-account-balance"),
    path("admin/transaction-status/", AdminTransactionStatusView.as_view(), name="admin-transaction-status"),
]
