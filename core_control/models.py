import random
import string
from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, Group, Permission
from .manager import CustomUserManager
from django.utils.timezone import now



class User(AbstractBaseUser, PermissionsMixin):
    GENDER = (
        ("Male", "Male"),
        ("Female", "Female"),
    )
    _id = models.CharField(max_length=100, db_index=True, null=True, unique=True, default="")
    profile_url = models.ImageField(upload_to="profile/images", db_index=True, blank=True, null=True)
    first_name = models.CharField(max_length=100, db_index=True)
    last_name = models.CharField(max_length=100, db_index=True)
    username = models.CharField(max_length=300, null=True, db_index=True, blank=True)
    date_of_bith = models.DateField(db_index=True, null=True)
    email = models.EmailField(null=False, unique=True, db_index=True)
    phone_no = models.CharField(max_length=20, db_index=True, null=True)
    city = models.CharField(max_length=100, db_index=True, null=True)
    nationality = models.CharField(max_length=100, db_index=True, null=True)
    gender = models.CharField(max_length=100, choices=GENDER, db_index=True, null=True)
    address = models.TextField(db_index=True, null=True)
    # otp = models.PositiveIntegerField(null=True, db_index=True)
    # otp_limit = models.IntegerField(null=True, db_index=True)
    # otp_delay = models.TimeField(auto_now=True, db_index=True)
    date_joined = models.DateTimeField(auto_now_add=True, db_index=True)
    last_login = models.DateTimeField(default=None, null=True, db_index=True)
    is_blocked = models.BooleanField(default=False, null=True, db_index=True)
    is_verified = models.BooleanField(default=False, db_index=True)
    is_staff = models.BooleanField(default=False, db_index=True)
    is_active = models.BooleanField(default=True, db_index=True)
    password = models.CharField(max_length=200, db_index=True, default=None)
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    users_messaging_container = models.ManyToManyField('self', symmetrical=False)

    objects = CustomUserManager()

    groups = models.ManyToManyField(Group, related_name='user_groups', blank=True)
    user_permissions = models.ManyToManyField(Permission, related_name='user_permissions', blank=True)

    def __str__(self):
        return self.email

    def save(self, *args, **kwargs):
        if not self._id:
            unique_str = ''.join(random.choices(string.ascii_letters + string.digits, k=15))
            self._id = f'bud-{unique_str}'
        print(f"Saving user with _id: {self._id}")  # Log _id generation
        super(User, self).save(*args, **kwargs)


class ImaraInfo(models.Model):
    street_address = models.TextField(
        db_index=True,
        default="",
        verbose_name="Street Address",
        help_text="The physical address of the organization."
    )
    phone_number = models.CharField(
        max_length=30,
        db_index=True,
        default="",
        verbose_name="Phone Number",
        help_text="Contact phone number."
    )
    email = models.EmailField(
        db_index=True,
        default="",
        verbose_name="Email Address",
        help_text="Contact email address."
    )
    facebook_link = models.URLField(
        blank=True,
        null=True,
        verbose_name="Facebook Page Link",
        help_text="URL to the organization's Facebook page."
    )
    instagram_link = models.URLField(
        blank=True,
        null=True,
        verbose_name="Instagram Profile Link",
        help_text="URL to the organization's Instagram profile."
    )
    twitter_link = models.URLField(
        blank=True,
        null=True,
        verbose_name="Twitter Profile Link",
        help_text="URL to the organization's Twitter profile."
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Created At",
        help_text="The date and time when the record was created."
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name="Updated At",
        help_text="The date and time when the record was last updated."
    )

    class Meta:
        verbose_name = "Imara Information"
        verbose_name_plural = "Imara Information"
        ordering = ["-updated_at"]

    def __str__(self):
        return f"{self.street_address} | {self.phone_number}"

class AnonymousBooking(models.Model):
    booking_id = models.CharField(max_length=255, unique=True)  # The UUID value
    created_at = models.DateTimeField(default=now)  # Timestamp for when it was created

    def __str__(self):
        return self.booking_id

