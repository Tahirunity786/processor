from django.contrib import admin
from .models import Hotel,Review,ReviewType,Amenities, BedRoom, Restaurant, Tables, MenuItem, HotelImages, ResturantImages, Cities
# Register your models here.MenuItem

admin.site.register(Hotel)
admin.site.register(HotelImages)
admin.site.register(BedRoom)
admin.site.register(Restaurant)
admin.site.register(ResturantImages)
admin.site.register(Tables)
admin.site.register(MenuItem)
admin.site.register(Cities)
admin.site.register(ReviewType)
admin.site.register(Review)
admin.site.register(Amenities)