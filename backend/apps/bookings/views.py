from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from .models import Booking
from .serializers import BookingSerializer

class BookingListCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user

        # Landlord receives bookings for their properties
        if user.role == 'LANDLORD':
            bookings = Booking.objects.filter(property__landlord=user)
        else:
            # Student receives their own submitted bookings
            bookings = Booking.objects.filter(student=user)

        serializer = BookingSerializer(bookings, many=True, context={'request': request})
        return Response(serializer.data)

    def post(self, request):
        serializer = BookingSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save(student=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class BookingDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self, pk, user):
        try:
            if user.role == 'LANDLORD':
                return Booking.objects.get(pk=pk, property__landlord=user)
            return Booking.objects.get(pk=pk, student=user)
        except Booking.DoesNotExist:
            return None

    def patch(self, request, pk):
        booking = self.get_object(pk, request.user)
        if not booking:
            return Response({'detail': 'Booking request not found.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = BookingSerializer(booking, data=request.data, partial=True, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class VacateTenantView(APIView):
    """Handles Case 1: Tenant vacating / moving out completely."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        user = request.user
        try:
            booking = Booking.objects.get(pk=pk, property__landlord=user)
        except Booking.DoesNotExist:
            return Response({'detail': 'Booking not found.'}, status=status.HTTP_404_NOT_FOUND)

        if booking.status not in ['APPROVED', 'CONFIRMED']:
            return Response({'detail': 'Only active tenants can vacate.'}, status=status.HTTP_400_BAD_REQUEST)

        # Update status
        booking.status = 'RELOCATED'
        booking.save()

        # Increment available rooms on property
        property_obj = booking.property
        property_obj.available_rooms += 1
        property_obj.save()

        return Response({'detail': 'Tenant checked out successfully.'}, status=status.HTTP_200_OK)


class ShiftRoomView(APIView):
    """Handles Case 2: Tenant shifting to another house/room number."""
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, pk):
        user = request.user
        try:
            booking = Booking.objects.get(pk=pk, property__landlord=user)
        except Booking.DoesNotExist:
            return Response({'detail': 'Booking not found.'}, status=status.HTTP_404_NOT_FOUND)

        new_house_number = request.data.get('house_number') or request.data.get('new_house_number')
        if not new_house_number:
            return Response({'detail': 'New house/room number is required.'}, status=status.HTTP_400_BAD_REQUEST)

        booking.house_number = new_house_number
        booking.save()

        return Response({'detail': f'Room updated to {new_house_number}.'}, status=status.HTTP_200_OK)