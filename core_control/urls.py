from django.urls import path
from .views import AccountDel, AnnoynmousTrackIdGenerator, Register, UserLogin,ProfileView, EmailChecker, UpdateProfileView, PasswordResetView
urlpatterns = [
    path('user/create', Register.as_view(), name='user-create'), 
    path('user/login', UserLogin.as_view(), name='user-login'),   
    path('user/email-checker', EmailChecker.as_view(), name='email-checker'), 
    path('user/profile', ProfileView.as_view(), name='email-checker'),  
    path('user/profile/update', UpdateProfileView.as_view(), name='Update'), 
    path('user/change-password', PasswordResetView.as_view(), name='chng-pass'), 
    path('user/del', AccountDel.as_view(), name='delAccount'), 
    path('user/track', AnnoynmousTrackIdGenerator.as_view(), name='track'), 

]