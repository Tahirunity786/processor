from django.contrib import admin
from django.urls import path, include
from .views import RegisterView, RegisterProcessView, LoginView, IndexView, PrivacyPolicyView, TermsAndConditionView
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    # Worker Apis
    # path('accounts/', include('core_control.urls')),  # Note: corrected 'acounts' to 'accounts'
    path('posts/', include('core_posts.urls')),  # Note: corrected 'acounts' to 'accounts'

    # Templates Rendering
    
    # Main Rendering
    path('', IndexView.as_view(), name='Home'),
    path('login', LoginView.as_view(), name='login'),
    path('register', RegisterView.as_view(), name='register'),
    path('register-process', RegisterProcessView.as_view(), name='register-processor'),
    path('terms-and-conditions/', TermsAndConditionView.as_view(), name='register-processor'),
    path('privacy-policy/', PrivacyPolicyView.as_view(), name='register-processor'),
    # Apps Template rendering
    path('nakiese/', include('utiles.urls')),

    # App rendering
    path('account-control/', include('core_control.urls')),  # Changed the URL prefix to avoid conflict
    path('payment/', include('core_payments.urls')),  # Changed the URL prefix to avoid conflict
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
