from rest_framework import permissions
class IsOwner(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        # Only allow access to the owner of the favorite list
        return obj.user == request.user