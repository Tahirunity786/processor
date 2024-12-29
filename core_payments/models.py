from django.db import models
from django.utils.translation import gettext_lazy as _
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from core_control.models import AnonymousBooking

def generate_unique_id(prefix="nak"):
    """Generate a unique ID using random letters and digits."""
    import random, string
    unique_str = ''.join(random.choices(string.ascii_letters + string.digits, k=15))
    if prefix == 'nak':
        return f"{prefix}-{unique_str}"
    return f"{prefix}{unique_str})"

def generate_unique_order_id():
    """Generate a unique ID using random letters and digits."""
    import random
    
    
    return f"NAK{random.randint(10000000, 99999999)}"

class Order(models.Model):
    """Generic Order model."""
    _id = models.CharField(max_length=100, unique=True, db_index=True, null=True, blank=True, verbose_name=_("Order ID"))
    pub_order_id = models.CharField(max_length=100, unique=True, db_index=True, null=True, blank=True, verbose_name=_("Order ID"))
    check_in = models.DateField(null=True, blank=True, verbose_name=_("Check-in Date"))
    check_out = models.DateField(null=True, blank=True, verbose_name=_("Check-out Date"))
    nights = models.PositiveIntegerField(default=0, verbose_name=_("Nights"))
    created_at = models.DateTimeField(auto_now_add=True, verbose_name=_("Created At"))
    updated_at = models.DateTimeField(auto_now=True, verbose_name=_("Updated At"))
    type_booking = models.CharField(max_length=100, db_index=True, null=True, verbose_name=_("Booking Type"))
    

    class Meta:
        verbose_name = _("Order")
        verbose_name_plural = _("Orders")

    def save(self, *args, **kwargs):
        if not self._id:
            self._id = generate_unique_id()
            self.pub_order_id = generate_unique_order_id()
        super().save(*args, **kwargs)

class OrderItem(models.Model):
    """Order item linked to any model."""
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="items", verbose_name=_("Order"))
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE, verbose_name=_("Content Type"))
    object_id = models.PositiveIntegerField(verbose_name=_("Object ID"))
    content_object = GenericForeignKey("content_type", "object_id")
    quantity = models.PositiveIntegerField(default=1, verbose_name=_("Quantity"))

    class Meta:
        verbose_name = _("Order Item")
        verbose_name_plural = _("Order Items")

class OrderPlacementStorage(models.Model):
    """Stores multiple orders."""
    anonymous_track = models.ForeignKey(AnonymousBooking, null=True, on_delete=models.CASCADE, verbose_name=_("Anonymous Booking"))
    orders_items = models.ManyToManyField(OrderItem, related_name="storages", verbose_name=_("Orders"))
    created_at = models.DateTimeField(auto_now_add=True, verbose_name=_("Created At"))
    updated_at = models.DateTimeField(auto_now=True, verbose_name=_("Updated At"))
    time_zone = models.CharField(max_length=50, null=True, blank=True, default="UTC", db_index=True)


    class Meta:
        verbose_name = _("Order Placement Storage")
        verbose_name_plural = _("Order Placement Storages")

class PaymentUserDetail(models.Model):
    GENDER = (
        ('Male', "Male"),
        
        ('Female', "Female"),
        ('Not Confirmed', "Not Confirmed"),
    )
    annoynmous_tracer = models.ForeignKey(AnonymousBooking, on_delete=models.CASCADE, null=True, db_index=True)
    name = models.CharField(max_length=100, default="", db_index=True)
    email = models.EmailField(db_index=True)
    phone_no = models.CharField(max_length=100, default="", db_index=True)
    gender = models.CharField(max_length=100, default="", db_index=True, choices=GENDER)
    contury = models.CharField(max_length=100, default="", db_index=True)
    state = models.CharField(max_length=100, default="", db_index=True)  # Changed from DateField
    date = models.DateField(db_index=True, default='2000-01-01')
    city = models.CharField(max_length=100, default="", db_index=True)
    address = models.TextField(db_index=True)
    address_no_2 = models.TextField(db_index=True, default="", null=True)
    order_date_time = models.DateTimeField(auto_now_add=True)
    time_zone = models.CharField(max_length=50, null=True, blank=True, default="UTC", db_index=True)
