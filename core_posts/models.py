import random
import string
from django.db import models
from django.contrib.auth import get_user_model
from django.db.models import Avg
from django.core.exceptions import ValidationError
from django.utils.timezone import now
from django.contrib.contenttypes.fields import GenericRelation
from core_control.models import AnonymousBooking
from django.utils.translation import gettext_lazy as _
from zoneinfo import available_timezones
User = get_user_model()

def generate_unique_id(prefix="nak"):
    """Generate a unique ID using random choices of letters and digits."""
    unique_str = ''.join(random.choices(string.ascii_letters + string.digits, k=15))
    return f"{prefix}-{unique_str}"

# Cities Model Section
class Cities(models.Model):
    """
    Represents a city with its name and an optional image.
    """
    city_id = models.CharField(max_length=100, unique=True, db_index=True, null=True, blank=True)
    name = models.CharField(max_length=100, db_index=True)
    image = models.ImageField(upload_to="cities/images", db_index=True, default="cities/images/default.jpg", null=True, blank=True)

    def __str__(self):
        return self.name
    
    def save(self, *args, **kwargs):
        if not self.city_id:
            self.city_id = generate_unique_id()
        super().save(*args, **kwargs)


# Hotel Model Section
class HotelImages(models.Model):
    """
    Represents an image for a hotel.
    """
    hotel_image_id = models.CharField(max_length=100, unique=True, db_index=True, null=True, blank=True)
    image = models.ImageField(upload_to="hotels/images", db_index=True)

    def __str__(self):
        return self.hotel_image_id or "Hotel Image"
    
    def save(self, *args, **kwargs):
        if not self.hotel_image_id:
            self.hotel_image_id = generate_unique_id()
        super().save(*args, **kwargs)


class Hotel(models.Model):
    TIMEZONE_CHOICES = [(tz, tz) for tz in sorted(available_timezones())]

    
    """
    Represents a hotel with basic information, images, and its associated city.
    """
    hotel_id = models.CharField(max_length=100, unique=True, db_index=True, null=True, blank=True)
    city = models.ForeignKey(Cities, on_delete=models.CASCADE, db_index=True, null=True)
    images = models.ManyToManyField(HotelImages, db_index=True, blank=True)
    name = models.CharField(max_length=100, db_index=True)
    description = models.TextField()
    visitors = models.PositiveBigIntegerField(db_index=True, default=0)
    country = models.CharField(max_length=100, db_index=True)
    address = models.TextField()
    phone_number = models.CharField(max_length=30, db_index=True)
    email = models.EmailField(null=True, db_index=True)
    website = models.URLField(max_length=200, blank=True)
    company_registration_number = models.PositiveBigIntegerField(db_index=True)
    hotel_time_zone = models.CharField(max_length=100, db_index=True, default='UTC',choices=TIMEZONE_CHOICES)

    def __str__(self):
        return self.name
    
    def save(self, *args, **kwargs):
        if not self.hotel_id:
            self.hotel_id = generate_unique_id()
        super().save(*args, **kwargs)


class Amenities(models.Model):
    amenities_id = models.CharField(max_length=100, unique=True, db_index=True, null=True, blank=True)
    name = models.CharField(max_length=100, db_index=True)
    def __str__(self):
        return self.name
    
    def save(self, *args, **kwargs):
        if not self.amenities_id:
            self.amenities_id = generate_unique_id()
        super().save(*args, **kwargs)


class BedRoom(models.Model):
    """Represents a hotel room with its type, description, and amenities."""
    ROOM_TYPES = (
        ('single', 'Single'),
        ('double', 'Double'),
        ('suite', 'Suite'),
    )

    room_id = models.CharField(max_length=100, unique=True, db_index=True, null=True, blank=True, verbose_name=_("Room ID"))
    image = models.ImageField(upload_to="beds/images", db_index=True, null=True, verbose_name=_("Image"))
    hotel = models.ForeignKey('core_posts.Hotel', on_delete=models.CASCADE, db_index=True, verbose_name=_("Hotel"))
    reviews = models.ManyToManyField('core_posts.Review', db_index=True, blank=True, verbose_name=_("Reviews"))
    room_type = models.CharField(max_length=100, choices=ROOM_TYPES, db_index=True, verbose_name=_("Room Type"))
    description = models.TextField(db_index=True, verbose_name=_("Description"))
    price = models.PositiveIntegerField(default=0, verbose_name=_("Price"))
    capacity = models.PositiveIntegerField(default=0, verbose_name=_("Capacity"))
    room_amenities = models.ManyToManyField('core_posts.Amenities', db_index=True, related_name='bed_rooms', verbose_name=_("Room Amenities"))
    availability_from = models.DateField(null=True, default=None, verbose_name=_("Availability From"))
    availability_till = models.DateField(null=True, default=None, verbose_name=_("Availability Till"))
    available_days = models.PositiveIntegerField(default=0, editable=False, verbose_name=_("Available Days"))
    is_booked = models.BooleanField(default=False, verbose_name=_("Is Booked"))
    orders = GenericRelation('core_payments.OrderItem', verbose_name=_("Orders"), related_query_name='beds')

    def save(self, *args, **kwargs):
        if self.availability_from and self.availability_till:
            if self.availability_till < self.availability_from:
                raise ValidationError("availability_till must be greater than or equal to availability_from.")
            self.available_days = (self.availability_till - self.availability_from).days
        else:
            self.available_days = 0

        if not self.room_id:
            self.room_id = generate_unique_id()
        super().save(*args, **kwargs)

    def average_rating(self):
        avg_rating = self.reviews.aggregate(average=Avg('rating__rate'))['average']
        return round(avg_rating, 1) if avg_rating is not None else 0

    def __str__(self):
        return f"{self.room_type.capitalize()} - {self.hotel.name}"



# Restaurant Model Section
class ResturantImages(models.Model):
    """
    Represents an image for a restaurant.
    """
    restaurant_image_id = models.CharField(max_length=100, unique=True, db_index=True, null=True, blank=True)
    image = models.ImageField(upload_to="restaurants/images", db_index=True)

    def save(self, *args, **kwargs):
        if not self.restaurant_image_id:
            self.restaurant_image_id = generate_unique_id()
        super().save(*args, **kwargs)


class Restaurant(models.Model):
    TIMEZONE_CHOICES = [(tz, tz) for tz in sorted(available_timezones())]
    """
    Represents a restaurant with basic details and related images.
    """
    restaurant_id = models.CharField(max_length=100, unique=True, db_index=True, null=True, blank=True)
    city = models.ForeignKey(Cities, on_delete=models.CASCADE, db_index=True, null=True)
    images = models.ManyToManyField(ResturantImages, db_index=True, blank=True)
    name = models.CharField(max_length=100, db_index=True)
    description = models.TextField()
    country = models.CharField(max_length=100, db_index=True)
    address = models.TextField()
    phone_number = models.CharField(max_length=30, db_index=True)
    email = models.EmailField(unique=True, db_index=True)
    website = models.URLField(max_length=200, blank=True)
    company_registration_number = models.PositiveBigIntegerField(db_index=True)
    hotel_time_zone = models.CharField(max_length=100, db_index=True, default='UTC',choices=TIMEZONE_CHOICES)

    def __str__(self):
        return self.name
    
    def save(self, *args, **kwargs):
        if not self.restaurant_id:
            self.restaurant_id = generate_unique_id()
        super().save(*args, **kwargs)

class Tables(models.Model):
    """Represents a table in a restaurant with its availability and capacity."""
    table_id = models.CharField(max_length=100, unique=True, db_index=True, null=True, blank=True, verbose_name=_("Table ID"))
    images = models.ImageField(upload_to='table/images', db_index=True, null=True, verbose_name=_("Images"))
    restaurant = models.ForeignKey('core_posts.Restaurant', on_delete=models.CASCADE, db_index=True, verbose_name=_("Restaurant"))
    review = models.ManyToManyField('core_posts.Review', db_index=True, blank=True, verbose_name=_("Reviews"))
    capacity = models.PositiveIntegerField(default=0, verbose_name=_("Capacity"))
    price = models.PositiveIntegerField(default=0, verbose_name=_("Price"))
    availability_from = models.DateField(null=True, default=None, verbose_name=_("Availability From"))
    availability_till = models.DateField(null=True, default=None, verbose_name=_("Availability Till"))
    available_days = models.PositiveIntegerField(default=0, editable=False, verbose_name=_("Available Days"))
    is_booked = models.BooleanField(default=False, verbose_name=_("Is Booked"))
    orders = GenericRelation('core_payments.OrderItem', verbose_name=_("Orders"), related_query_name='tables')

    def save(self, *args, **kwargs):
        if self.availability_from and self.availability_till:
            if self.availability_till < self.availability_from:
                raise ValidationError("availability_till must be greater than or equal to availability_from.")
            self.available_days = (self.availability_till - self.availability_from).days
        else:
            self.available_days = 0

        if not self.table_id:
            self.table_id = generate_unique_id()
        super().save(*args, **kwargs)

    def average_rating(self):
        avg_rating = self.review.aggregate(average=Avg('rating__rate'))['average']
        return round(avg_rating, 1) if avg_rating is not None else 0

    def __str__(self):
        return f"Table {self.table_id} at {self.restaurant.name}"


class MenuItem(models.Model):
    """
    Represents a menu item in a restaurant with its category and pricing.
    """
    dish_id = models.CharField(max_length=100, unique=True, db_index=True, null=True, blank=True)
    restaurant = models.ForeignKey(Restaurant, on_delete=models.CASCADE, db_index=True, default=None) #Defualt for dummy
    image = models.ImageField(upload_to='menu/images', db_index=True, default=None, null=True)
    table = models.ForeignKey(Tables, on_delete=models.CASCADE, db_index=True, default=None) #Defualt for dummy
    name = models.CharField(max_length=100, db_index=True)
    description = models.TextField(blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    CATEGORY_CHOICES = [
        ('starter', 'Starter'),
        ('main_course', 'Main Course'),
        ('dessert', 'Dessert'),
        ('drink', 'Drink'),
    ]
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, db_index=True)

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.dish_id:
            self.dish_id = generate_unique_id()
        super().save(*args, **kwargs)


# Review Model Section
class ReviewType(models.Model):
    """
    Represents the type and rating of a review for a hotel or restaurant.
    """
    TYPES = [
        ('Cleanliness', 'Cleanliness'),
        ('Accuracy of information', 'Accuracy of information'),
        ('Communication', 'Communication'),
        ('Reception team', 'Reception team'),
        ('Experience de check-in', 'Experience de check-in'),
        ('Value', 'Value'),
    ]
    review_type_id = models.CharField(max_length=100, unique=True, db_index=True, null=True, blank=True)
    name = models.CharField(max_length=100, choices=TYPES, db_index=True)
    rate = models.DecimalField(max_digits=5, decimal_places=2)

    def __str__(self):
        return f'{self.name} - {self.rate}'

    def save(self, *args, **kwargs):
        if not self.review_type_id:
            self.review_type_id = generate_unique_id()
        super().save(*args, **kwargs)


class Review(models.Model):
    """
    Represents a review submitted by a user for a hotel room or restaurant.
    """
    review_id = models.CharField(max_length=100, unique=True, db_index=True, null=True, blank=True)
    tables_of_resturant = models.ForeignKey(Tables, on_delete=models.CASCADE, null=True, blank=True, related_name="tables")
    room = models.ForeignKey(BedRoom, on_delete=models.CASCADE, null=True, blank=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    rating = models.ManyToManyField(ReviewType, db_index=True)
    comment = models.TextField(db_index=True)
    date_of_notice = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'Review {self.review_id} by {self.user.username}'

    def save(self, *args, **kwargs):
        if not self.review_id:
            self.review_id = generate_unique_id()
        super().save(*args, **kwargs)

    def average_rating(self):
        """
        Calculate the average rating for all reviews related to this bedroom,
        rounded to one decimal place.
        """
        avg_rating = self.reviews.aggregate(average=Avg('rating__rate'))['average']
        # Round to one decimal place and return
        return round(avg_rating, 1) if avg_rating is not None else 0

class FavouriteList(models.Model):
    favourite_list_id = models.CharField(max_length=100, unique=True, db_index=True, null=True, blank=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, db_index=True,blank=True, null=True,  default='')
    unknown_track = models.ForeignKey(AnonymousBooking, on_delete=models.CASCADE, db_index=True,null=True,  default='')
    fav_table = models.ManyToManyField(Tables, db_index=True,  default='')
    fav_bed = models.ManyToManyField(BedRoom, db_index=True, default='')
    created_at = models.DateField(auto_created=True)

    def __str__(self):
        return f'Favourite added by {self.user.first_name}'

    def save(self, *args, **kwargs):
        if not self.favourite_list_id:
            self.favourite_list_id = generate_unique_id()
        super().save(*args, **kwargs)



