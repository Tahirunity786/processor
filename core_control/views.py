from datetime import timedelta
import uuid
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.views import Response
from django.db import transaction
from django.core.cache import cache
from core_control.serializers import CreateUserSerializer, ProfileSerializer
from core_control.token import get_tokens_for_user
from rest_framework import status, generics
from django.contrib.auth import get_user_model
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from rest_framework.exceptions import ValidationError, AuthenticationFailed

from core_control.models import AnonymousBooking
from .serializers import PasswordResetSerializer
from django.utils.timezone import now

# Create your views here.

User = get_user_model()


class Register(APIView):
    permission_classes = [AllowAny]
    # renderer_classes = [UserRenderer]

    def error_format(self, errors):
        error_messages = []

        for field, field_errors in errors.items():
            if field == 'non_field_errors':
                for error in field_errors:
                    error_messages.append(str(error))  # Convert ErrorDetail to string
            else:
                for error in field_errors:
                    error_messages.append(str(error))  # Convert ErrorDetail to string

        return error_messages
    
    def post(self, request):
        
        user_serializer = CreateUserSerializer(data=request.data)
        
        if user_serializer.is_valid():
            try:
                with transaction.atomic():  # Ensure the transaction is handled properly
                    current_user = user_serializer.save()
                token = get_tokens_for_user(current_user)
                user ={
                    'token': token
                }

                return Response({"success": True,  "user":user}, status=status.HTTP_201_CREATED)
            except Exception as e:
                return Response({"success": False, "Error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        else:
            errors = user_serializer.errors
            error_messages = self.error_format(errors)
            return Response({"success": False, "errors": error_messages}, status=status.HTTP_400_BAD_REQUEST)

class EmailChecker(APIView):
    permission_classes = [AllowAny]


    def post(self, request):
        email = request.data.get('email', None)

        if not email:
            return Response({"success": False, "message": "Email is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        # Use cache to store and retrieve email checks to reduce database hits
        cache_key = f"email_exists_{email}"
        email_exists = cache.get(cache_key)
        
        if email_exists is None:
            email_exists = User.objects.filter(email=email).exists()
            # Cache the result for a certain period
            cache.set(cache_key, email_exists, timeout=60*5)  # Cache for 5 minutes

        if email_exists:
            
            return Response({"success": False, "message": "Account with this email already exists"}, status=status.HTTP_400_BAD_REQUEST)
        else:
            return Response({"success": True}, status=status.HTTP_202_ACCEPTED)

        
class UserLogin(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get("email")
        password = request.data.get("password")

        if not email or not password:
            return Response({"errors": ["Email and password are required"]}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({"errors": ["Email for this user not found"]}, status=status.HTTP_400_BAD_REQUEST)

        authenticated_user = authenticate(request, username=user.email, password=password)

        if authenticated_user is None:
            return Response({"errors": ["Invalid credentials"]}, status=status.HTTP_401_UNAUTHORIZED)

        if authenticated_user.is_blocked:
            return Response({"errors": ["Account banned"]}, status=status.HTTP_400_BAD_REQUEST)

        token = get_tokens_for_user(authenticated_user)

        

        user_data = {
          
            "token": token,
        }

        return Response({"message": "Logged in", "success": True, "user": user_data}, status=status.HTTP_202_ACCEPTED)
    
class ProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Serialize the user instance
        serializer = ProfileSerializer(request.user)
        return Response(serializer.data, status=status.HTTP_200_OK)

class UpdateProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        user = request.user
        serializer = ProfileSerializer(user)
        return Response(serializer.data)

    def put(self, request, *args, **kwargs):
        user = request.user
        serializer = ProfileSerializer(user, data=request.data, partial=True)  # partial=True allows updating some fields
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class PasswordResetView(generics.UpdateAPIView):
    """
    View for authenticated users to reset their password by providing the old password,
    new password, and confirmation of the new password.
    """
    serializer_class = PasswordResetSerializer
    permission_classes = [IsAuthenticated]

    def update(self, request, *args, **kwargs):
        user = request.user
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Check if the old password is correct
        if not user.check_password(serializer.validated_data['old_password']):
            raise AuthenticationFailed("The old password is incorrect.")
        
        # Set the new password
        user.set_password(serializer.validated_data['new_password'])
        user.save()

        return Response({"detail": "Password updated successfully."}, status=status.HTTP_200_OK)

class AccountDel(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user.id

        try:
            user = User.objects.get(id=user)
        except User.DoesNotExist:
            return Response({"error":"User has been deleted"}, status=status.HTTP_400_BAD_REQUEST)
        
        user.delete()

        return Response({"detail":"Account successfully deleted."}, status=status.HTTP_200_OK)


class AnnoynmousTrackIdGenerator(APIView):
    permission_classes = [AllowAny]

    def get(self, request, *args, **kwargs):
        # Check if the cookie already exists
        anonymous_booking_id = request.COOKIES.get('ann__nak')

        if not anonymous_booking_id:
            # Generate a unique identifier for tracking
            anonymous_booking_id = str(uuid.uuid4())
            AnonymousBooking.objects.create(
                booking_id=anonymous_booking_id,
                created_at=now(),
            )

        # Create the response
        response = Response(
            {"message": "Cookie set."},
            status=status.HTTP_200_OK
        )

        # Set the cookie with the unique identifier
        cookie_expiration_date = now() + timedelta(days=365)  # Set cookie for 1 year
        response.set_cookie(
            key='ann__nak',
            value=anonymous_booking_id,
            expires=cookie_expiration_date,
            httponly=False,  # Allow access via JavaScript
            secure=False,    # Set to True if using HTTPS
            samesite='Lax',  # Adjust as per the front-end requirement
        )

        return response