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
        role = getattr(user, 'role', None)

        # Admin receives all system bookings, Landlord receives bookings for their properties
        if role == 'ADMIN' or user.is_staff or user.is_superuser:
            bookings = Booking.objects.all()
        elif role == 'LANDLORD':
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
            prop = Property.objects.select_for_update().get(pk=prop_id)     

            available_list = prop.available_room_numbers or []
            if room_num and isinstance(available_list, list) and available_list:
                if room_num not in available_list:
                    return Response(
                        {'house_number': f"Unit {room_num} is no longer available."},
                        status=status.HTTP_400_BAD_REQUEST,
                    )
                # Note: We do NOT remove the room from available_room_numbers here on PENDING.
                # It remains visible in public listings until approved/confirmed by the landlord.

            booking = serializer.save(student=request.user, status='PENDING')

        return Response(BookingSerializer(booking, context={'request': request}).data, status=status.HTTP_201_CREATED)


class BookingDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self, pk, user):
        try:
            role = getattr(user, 'role', None)
            if role == 'ADMIN' or user.is_staff or user.is_superuser:
                return Booking.objects.get(pk=pk)
            if role == 'LANDLORD':
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

        user = request.user
        role = getattr(user, 'role', None)
        is_admin = role == 'ADMIN' or user.is_staff or user.is_superuser
        is_landlord = role == 'LANDLORD' and booking.property.landlord == user

        old_status = booking.status
        new_status = request.data.get('status')

        # Permission checks for status transitions
        if new_status:
            if new_status in ['APPROVED', 'REJECTED', 'CONFIRMED']:
                if not (is_admin or is_landlord):
                    return Response(
                        {'detail': 'Only landlords and administrators can approve, reject, or confirm bookings.'},
                        status=status.HTTP_403_FORBIDDEN
                    )
            elif new_status == 'CANCELLED':
                if not (is_admin or is_landlord or booking.student == user):
                    return Response({'detail': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)

        serializer = BookingSerializer(booking, data=request.data, partial=True, context={'request': request})
        if serializer.is_valid():
            with transaction.atomic():
                # Re-fetch with lock to be safe
                booking = Booking.objects.select_for_update().get(pk=pk)
                
                # Consuming and releasing sets
                consuming_statuses = ['PENDING', 'APPROVED', 'DEPOSIT_PAID', 'CONFIRMED']
                releasing_statuses = ['REJECTED', 'CANCELLED', 'VACATED']

                # Case A: Transition from consuming -> releasing (free room)
                if old_status in consuming_statuses and new_status in releasing_statuses:
                    prop = booking.property
                    room_num = booking.house_number
                    
                    if room_num:
                        available_list = prop.available_room_numbers or []
                        if room_num not in available_list:
                            available_list.append(room_num)
                            prop.available_room_numbers = available_list
                            prop.available_rooms = len(available_list)
                            prop.save()
                    elif hasattr(prop, 'available_rooms'):
                        prop.available_rooms = prop.available_rooms + 1
                        prop.save()

                # Case B: Transition from releasing -> consuming (re-reserve room)
                elif old_status in releasing_statuses and new_status in consuming_statuses:
                    prop = booking.property
                    room_num = booking.house_number

                    if room_num:
                        available_list = prop.available_room_numbers or []
                        if room_num in available_list:
                            available_list.remove(room_num)
                            prop.available_room_numbers = available_list
                            prop.available_rooms = max(0, len(available_list))
                            prop.save()
                    elif hasattr(prop, 'available_rooms') and prop.available_rooms > 0:
                        prop.available_rooms = max(0, prop.available_rooms - 1)
                        prop.save()

                serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ApproveBookingView(APIView):
    """Direct approval endpoint for Landlords & Admins."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        user = request.user
        role = getattr(user, 'role', None)
        try:
            if role == 'ADMIN' or user.is_staff or user.is_superuser:
                booking = Booking.objects.get(pk=pk)
            else:
                booking = Booking.objects.get(pk=pk, property__landlord=user)
        except Booking.DoesNotExist:
            return Response({'detail': 'Booking not found.'}, status=status.HTTP_404_NOT_FOUND)

        with transaction.atomic():
            booking = Booking.objects.select_for_update().get(pk=pk)
            old_status = booking.status
            releasing_statuses = ['REJECTED', 'CANCELLED', 'VACATED']

            if old_status in releasing_statuses:
                prop = booking.property
                room_num = booking.house_number
                if room_num:
                    available_list = prop.available_room_numbers or []
                    if room_num in available_list:
                        available_list.remove(room_num)
                        prop.available_room_numbers = available_list
                        prop.available_rooms = max(0, len(available_list))
                        prop.save()
                elif hasattr(prop, 'available_rooms') and prop.available_rooms > 0:
                    prop.available_rooms = max(0, prop.available_rooms - 1)
                    prop.save()

            booking.status = 'APPROVED'
            booking.save()

        return Response(BookingSerializer(booking, context={'request': request}).data, status=status.HTTP_200_OK)


class RejectBookingView(APIView):
    """Direct rejection endpoint for Landlords & Admins."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        user = request.user
        role = getattr(user, 'role', None)
        try:
            if role == 'ADMIN' or user.is_staff or user.is_superuser:
                booking = Booking.objects.get(pk=pk)
            else:
                booking = Booking.objects.get(pk=pk, property__landlord=user)
        except Booking.DoesNotExist:
            return Response({'detail': 'Booking not found.'}, status=status.HTTP_404_NOT_FOUND)

        with transaction.atomic():
            booking = Booking.objects.select_for_update().get(pk=pk)
            old_status = booking.status
            consuming_statuses = ['PENDING', 'APPROVED', 'DEPOSIT_PAID', 'CONFIRMED']

            if old_status in consuming_statuses:
                prop = booking.property
                room_num = booking.house_number
                if room_num:
                    available_list = prop.available_room_numbers or []
                    if room_num not in available_list:
                        available_list.append(room_num)
                        prop.available_room_numbers = available_list
                        prop.available_rooms = len(available_list)
                        prop.save()
                elif hasattr(prop, 'available_rooms'):
                    prop.available_rooms = prop.available_rooms + 1
                    prop.save()

            reason = request.data.get('reason')
            if reason:
                booking.notes = f"{booking.notes or ''}\nRejection Note: {reason}".strip()

            booking.status = 'REJECTED'
            booking.save()

        return Response(BookingSerializer(booking, context={'request': request}).data, status=status.HTTP_200_OK)


class VacateTenantView(APIView):
    """Handles Case 1: Tenant vacating / moving out completely."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        user = request.user
        role = getattr(user, 'role', None)
        try:
            if role == 'ADMIN' or user.is_staff or user.is_superuser:
                booking = Booking.objects.get(pk=pk)
            else:
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
        role = getattr(user, 'role', None)
        try:
            if role == 'ADMIN' or user.is_staff or user.is_superuser:
                booking = Booking.objects.get(pk=pk)
            else:
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
