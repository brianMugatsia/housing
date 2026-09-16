from django.shortcuts import get_object_or_404
from rest_framework import generics, parsers, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Amenity, Property, PropertyImage
from .permissions import IsAdmin, IsLandlordOwnerOrReadOnly
from .serializers import (
    AmenitySerializer,
    PropertyImageSerializer,
    PropertyRejectSerializer,
    PropertySerializer,
    PropertyWriteSerializer,
)


class AmenityListView(generics.ListAPIView):
    queryset = Amenity.objects.all()
    serializer_class = AmenitySerializer
    permission_classes = [permissions.AllowAny]


class PropertyViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsLandlordOwnerOrReadOnly]

    def get_serializer_context(self):
        """Pass the request context to serializers so DRF generates full absolute URLs for media files."""
        context = super().get_serializer_context()
        context.update({"request": self.request})
        return context

    def get_serializer_class(self):
        if self.action in ("create", "update", "partial_update"):
            return PropertyWriteSerializer
        return PropertySerializer

    def get_queryset(self):
        qs = Property.objects.select_related("landlord", "university").prefetch_related(
            "images", "amenities"
        )
        user = self.request.user
        params = self.request.query_params

        # Allow detail actions for the owner/admin (bypasses APPROVED filter)
        if self.action in ("submit", "images", "delete_image", "retrieve", "update", "partial_update", "destroy"):
            if user.is_authenticated and user.role == "LANDLORD":
                return qs.filter(landlord=user)
            if user.is_authenticated and user.role == "ADMIN":
                return qs

        # Landlord dashboard query
        if params.get("mine") == "true" and user.is_authenticated and user.role == "LANDLORD":
            return qs.filter(landlord=user)

        # Admin view all query
        if params.get("all") == "true" and user.is_authenticated and user.role == "ADMIN":
            pass
        else:
            # Public search/listing default: APPROVED only
            qs = qs.filter(verification_status=Property.VerificationStatus.APPROVED)

        # Query Filters
        if params.get("university"):
            qs = qs.filter(university__name__iexact=params["university"])
        if params.get("county"):
            qs = qs.filter(county__iexact=params["county"])
        if params.get("town"):
            qs = qs.filter(town__iexact=params["town"])
        if params.get("area"):
            qs = qs.filter(area__icontains=params["area"])
        if params.get("property_type"):
            qs = qs.filter(property_type=params["property_type"])
        if params.get("room_type"):
            qs = qs.filter(room_type=params["room_type"])
        if params.get("min_rent"):
            qs = qs.filter(monthly_rent__gte=params["min_rent"])
        if params.get("max_rent"):
            qs = qs.filter(monthly_rent__lte=params["max_rent"])
        if params.get("available_rooms"):
            qs = qs.filter(available_rooms__gte=params["available_rooms"])
        if params.get("max_distance"):
            qs = qs.filter(distance_from_university__lte=params["max_distance"])
        amenity_ids = params.getlist("amenities")
        if amenity_ids:
            qs = qs.filter(amenities__id__in=amenity_ids).distinct()

        return qs

    def perform_create(self, serializer):
        if self.request.user.role != "LANDLORD":
            raise permissions.PermissionDenied("Only landlords can create properties.")
        serializer.save(
            verification_status=Property.VerificationStatus.DRAFT,
        )

    @action(detail=True, methods=["post"])
    def submit(self, request, pk=None):
        property_obj = self.get_object()
        if property_obj.landlord_id != request.user.id:
            return Response({"detail": "Not your property."}, status=status.HTTP_403_FORBIDDEN)
        if property_obj.verification_status not in (
            Property.VerificationStatus.DRAFT,
            Property.VerificationStatus.REJECTED,
        ):
            return Response(
                {"detail": "Only draft or rejected properties can be submitted."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if not property_obj.images.exists():
            return Response(
                {"detail": "Upload at least one photo before submitting."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        property_obj.verification_status = Property.VerificationStatus.PENDING_VERIFICATION
        property_obj.rejection_reason = ""
        property_obj.save()
        return Response(PropertySerializer(property_obj, context={"request": request}).data)

    @action(
        detail=True,
        methods=["post"],
        parser_classes=[parsers.MultiPartParser, parsers.FormParser],
    )
    def images(self, request, pk=None):
        property_obj = self.get_object()
        if property_obj.landlord_id != request.user.id:
            return Response({"detail": "Not your property."}, status=status.HTTP_403_FORBIDDEN)

        files = request.FILES.getlist("images")
        if not files:
            return Response({"detail": "No images provided."}, status=status.HTTP_400_BAD_REQUEST)

        has_primary = property_obj.images.filter(is_primary=True).exists()
        created = []
        for i, f in enumerate(files):
            img = PropertyImage.objects.create(
                property=property_obj, image=f, is_primary=(not has_primary and i == 0)
            )
            created.append(img)

        return Response(
            PropertyImageSerializer(created, many=True, context={"request": request}).data,
            status=status.HTTP_201_CREATED,
        )

    @action(detail=True, methods=["delete"], url_path=r"images/(?P<image_id>[^/.]+)")
    def delete_image(self, request, pk=None, image_id=None):
        property_obj = self.get_object()
        if property_obj.landlord_id != request.user.id:
            return Response({"detail": "Not your property."}, status=status.HTTP_403_FORBIDDEN)
        deleted, _ = property_obj.images.filter(id=image_id).delete()
        if not deleted:
            return Response({"detail": "Image not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response(status=status.HTTP_204_NO_CONTENT)


class AdminPendingPropertiesView(generics.ListAPIView):
    serializer_class = PropertySerializer
    permission_classes = [IsAdmin]

    def get_queryset(self):
        return (
            Property.objects.filter(
                verification_status__in=[
                    Property.VerificationStatus.PENDING_VERIFICATION,
                    Property.VerificationStatus.UNDER_REVIEW,
                ]
            )
            .select_related("landlord", "university")
            .prefetch_related("images", "amenities")
            .order_by("created_at")
        )


class AdminApprovePropertyView(generics.GenericAPIView):
    permission_classes = [IsAdmin]

    def post(self, request, pk):
        property_obj = get_object_or_404(Property, pk=pk)
        property_obj.verification_status = Property.VerificationStatus.APPROVED
        property_obj.rejection_reason = ""
        property_obj.save()
        return Response(PropertySerializer(property_obj, context={"request": request}).data)


class AdminRejectPropertyView(generics.GenericAPIView):
    permission_classes = [IsAdmin]
    serializer_class = PropertyRejectSerializer

    def post(self, request, pk):
        property_obj = get_object_or_404(Property, pk=pk)
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        property_obj.verification_status = Property.VerificationStatus.REJECTED
        property_obj.rejection_reason = serializer.validated_data["reason"]
        property_obj.save()
        return Response(PropertySerializer(property_obj, context={"request": request}).data)