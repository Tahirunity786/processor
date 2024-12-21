from django.views.generic import TemplateView

class LanguageTemplateView(TemplateView):
    lang = 'en'  # Default language

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['lang'] = self.lang  # Pass the language to the template context
        return context

    def get_template_names(self):
        
        # Determine the language from the URL parameter or fallback to default
        lang = self.kwargs.get('lang', 'en')
        self.lang = lang  # Set the lang attribute for context
        return [f'utiles/{lang}/{self.template_file}']

# Keep the original class names but inherit from LanguageTemplateView
class AccountsView(LanguageTemplateView):
    template_file = 'Account.html'

class AccountsEmailNotificaationView(LanguageTemplateView):
    template_file = 'Email-notification.html'

class AccountsPersonalDetailView(LanguageTemplateView):
    template_file = 'personal-details.html'

class AccountsPreferencesView(LanguageTemplateView):
    template_file = 'preferences.html'

class AccountsPaymentDetailsView(LanguageTemplateView):
    template_file = 'Payment-detail.html'

class AccountsSecurityView(LanguageTemplateView):
    template_file = 'Security.html'

class AboutUsView(LanguageTemplateView):
    template_file = 'about.html'

class HotelView(LanguageTemplateView):
    template_file = 'hotels.html'

class BedDetailView(LanguageTemplateView):
    template_file = 'hotels-overview.html'

class TableDetailView(LanguageTemplateView):
    template_file = 'table-overview.html'

class ResturantView(LanguageTemplateView):
    template_file = 'restaurants.html'

class Cart(LanguageTemplateView):
    template_file = 'cart.html'

class SearchView(LanguageTemplateView):
    template_file = 'search.html'

class HotelSearchView(LanguageTemplateView):
    template_file = 'hotel-search.html'

class ResturantSearchView(LanguageTemplateView):
    template_file = 'restaurant-search.html'

class MyList(LanguageTemplateView):
    template_file = 'FavList.html'

class PaymentRenser(LanguageTemplateView):
    template_file = 'Payment.html'

class MainCart(LanguageTemplateView):
    template_file = 'cart-container.html'

class CityExplore(LanguageTemplateView):
    template_file = 'city-explore.html'

class ConfirmationView(LanguageTemplateView):
    template_file = 'confirmation-page.html'
class BookingOfUser(LanguageTemplateView):
    template_file = 'bookings.html'
