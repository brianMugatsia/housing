from rest_framework import permissions


class IsLandlordOwnerOrReadOnly(permissions.BasePermission):
    """Anyone can read. Only the owning landlord or an admin can write."""

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        user = request.user
        return user.is_authenticated and (user.role == "ADMIN" or obj.landlord_id == user.id)


class IsAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == "ADMIN"


class IsLandlord(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == "LANDLORD"
