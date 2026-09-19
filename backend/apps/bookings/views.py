from django.db import transaction
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from .models import Booking
from .serializers import BookingSerializer
from apps.properties.models import Property


class BookingListCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user

        # Landlord receives bookings for their properties
        if getattr(user, 'role', None) == 'LANDLORD':
            bookings = Booking.objects.filter(property__landlord=user)
        else:
            # Student receives their own submitted bookings
            bookings = Booking.objects.filter(student=user)

        serializer = BookingSerializer(bookings, many=True, context={'request': request})
        return Response(serializer.data)

    def post(self, request):
        serializer = BookingSerializer(data=request.data, context={'request': request})
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        prop_id = serializer.validated_data['property'].id
        room_num = serializer.validated_data.get('house_number')

        with transaction.atomic():
            # Lock the property row so concurrent booking requests for the
            # same room can't both pass the "is it still available" check.
            prop = Property.objects.select_for_update().get(pk=prop_id)

            available_list = prop.available_room_numbers or []
            if room_num and isinstance(available_list, list) and available_list:
                if room_num not in available_list:
                    return Response(
                        {'house_number': f"Unit {room_num} is no longer available for booking."},
                        status=status.HTTP_400_BAD_REQUEST,
                    )
                available_list.remove(room_num)
                prop.available_room_numbers = available_list
                prop.available_rooms = max(0, len(available_list))
                prop.save()

            booking = serializer.save(student=request.user)

        return Response(BookingSerializer(booking, context={'request': request}).data, status=status.HTTP_201_CREATED)


class BookingDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self, pk, user):
        try:
            if getattr(user, 'role', None) == 'LANDLORD':
                return Booking.objects.get(pk=pk, property__landlord=user)
            return Booking.objects.get(pk=pk, student=user)
        except Booking.DoesNotExist:
            return None

    def get(self, request, pk):
        booking = self.get_object(pk, request.user)
        if not booking:
            return Response({'detail': 'Booking request not found.'}, status=status.HTTP_404_NOT_FOUND)
        serializer = BookingSerializer(booking, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)

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
        booking.status = 'VACATED'
        booking.save()

        # Re-add house number back to available_room_numbers on property
        property_obj = booking.property
        house_num = booking.house_number

        if hasattr(property_obj, 'available_room_numbers') and isinstance(property_obj.available_room_numbers, list):
            if house_num and house_num not in property_obj.available_room_numbers:
                property_obj.available_room_numbers.append(house_num)
            property_obj.available_rooms = len(property_obj.available_room_numbers)
        else:
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

        old_house_number = booking.house_number
        property_obj = booking.property

        # Update property room availability lists
        if hasattr(property_obj, 'available_room_numbers') and isinstance(property_obj.available_room_numbers, list):
            # 1. Release old room back to availability pool
            if old_house_number and old_house_number not in property_obj.available_room_numbers:
                property_obj.available_room_numbers.append(old_house_number)

            # 2. Consume new room from availability pool
            if new_house_number in property_obj.available_room_numbers:
                property_obj.available_room_numbers.remove(new_house_number)

            property_obj.available_rooms = len(property_obj.available_room_numbers)
            property_obj.save()

        # Update booking details
        booking.house_number = new_house_number
        booking.save()

        return Response({'detail': f'Room updated from {old_house_number} to {new_house_number}.'}, status=status.HTTP_200_OK)