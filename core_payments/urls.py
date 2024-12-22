from django.urls import path

from core_payments.views import CreatePaymentIntent,OrderPlacer, PaymentDetailView

urlpatterns = [
    path('payment-detail-user', PaymentDetailView.as_view()),
    path('create-intent', CreatePaymentIntent.as_view()),
    path('success', OrderPlacer.as_view()),
]
