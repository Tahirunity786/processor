from django.urls import path
from .views import  AccountsEmailNotificaationView, BookingOfUser, CityExplore, ConfirmationView,HotelSearchView, MainCart, ResturantSearchView, AboutUsView, BedDetailView, Cart, MyList, PaymentRenser,ResturantView, AccountsView,AccountsSecurityView,AccountsPaymentDetailsView, AccountsPersonalDetailView, AccountsPreferencesView, HotelView, SearchView, TableDetailView
urlpatterns = [
    path('<str:lang>/accounts/settings', AccountsView.as_view(), name="utiles"),
    path('<str:lang>/accounts/settings/email-notification', AccountsEmailNotificaationView.as_view(), name="notification"),
    path('<str:lang>/accounts/settings/persoanl-details', AccountsPersonalDetailView.as_view(), name="personal-detail"),
    path('<str:lang>/accounts/settings/preferences', AccountsPreferencesView.as_view(), name="preferences"),
    path('<str:lang>/accounts/settings/payment-handle', AccountsPaymentDetailsView.as_view(), name="payment-handle"),
    path('<str:lang>/accounts/settings/security', AccountsSecurityView.as_view(), name="security"),

    path('<str:lang>/about-us', AboutUsView.as_view(), name="aboutsus"),
    path('<str:lang>/hotels', HotelView.as_view(), name="hotels"),
    path('<str:lang>/hotel/bed-detail/<str:pro_id>', BedDetailView.as_view(), name="bed-detail"),
    path('<str:lang>/resturant/table/<str:pro_id>', TableDetailView.as_view(), name="table-detail"),
    path('<str:lang>/resturants', ResturantView.as_view(), name="resturant"),
    path('<str:lang>/cart', MainCart.as_view(), name="cart"),
    path('<str:lang>/Hébergements', SearchView.as_view(), name="search"),

    path('<str:lang>/booking-list', MyList.as_view(), name="list"),
    path('<str:lang>/payment', PaymentRenser.as_view(), name="payment"),
    path('<str:lang>/search-h', HotelSearchView.as_view(), name="hotel-search"),
    path('<str:lang>/search-res', ResturantSearchView.as_view(), name="res-search"),
    path('<str:lang>/city/explore', CityExplore.as_view(), name="exp-city"),
    path('<str:lang>/confirmation', ConfirmationView.as_view(), name="confirm"),
    path('<str:lang>/my-bookings', BookingOfUser.as_view(), name="bookingsof"),
]
