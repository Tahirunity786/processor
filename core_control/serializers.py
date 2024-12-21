import uuid
from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.utils.translation import gettext_lazy as _
from django.db import transaction
from django.contrib.auth.password_validation import validate_password
User = get_user_model()

class CreateUserSerializer(serializers.ModelSerializer):
    confirm_password = serializers.CharField(style={'input_type': 'password'}, write_only=True)

    class Meta:
        model = User
        fields = ['first_name', 'last_name', 'email', 'password', 'confirm_password']
        extra_kwargs = {'password': {'write_only': True}}

    def validate(self, data):
        password = data.get('password')
        confirm_password = data.pop('confirm_password', None)

        validate_password(password)

        if password != confirm_password:
            raise serializers.ValidationError({'password': 'Passwords do not match'})

        return data

    @transaction.atomic
    def create(self, validated_data):
        email = validated_data.pop('email', None)
        if email is None:
            raise serializers.ValidationError({'email': 'Email field is required'})

        username = str(uuid.uuid4())

        print(f"Creating user with data: {validated_data}")  # Log validated data
        user = User.objects.create_user(username=username, email=email, **validated_data)
        print(f"User created: {user}")  # Log user creation
        return user

class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("_id","profile_url","first_name","last_name", "date_of_bith", "email", "phone_no", "city", "nationality","gender", "address")



class PasswordResetSerializer(serializers.Serializer):
    """
    Serializer for password reset functionality.
    Fields:
    - old_password: User's current password.
    - new_password: The new password to be set.
    - confirm_password: Confirmation of the new password.
    """
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True)
    confirm_password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        # Ensure new password and confirm password match
        if attrs['new_password'] != attrs['confirm_password']:
            raise serializers.ValidationError("New passwords do not match.")
        
        # Validate the new password using Django's built-in password validators
        validate_password(attrs['new_password'])
        
        return attrs