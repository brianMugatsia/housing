from django.urls import path
from .views import BookingListCreateView, BookingDetailView, VacateTenantView, ShiftRoomView
    

urlpatterns = [
    path('', BookingListCreateView.as_view(), name='booking-list-create'),
    path('<int:pk>/', BookingDetailView.as_view(), name='booking-detail'),
    path('bookings/<int:pk>/vacate/', VacateTenantView.as_view(), name='booking-vacate'),
    path('bookings/<int:pk>/shift-room/', ShiftRoomView.as_view(), name='booking-shift-room'),
]