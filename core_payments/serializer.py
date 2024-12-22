from datetime import datetime
from rest_framework import serializers
from core_payments.models import PaymentUserDetail



class DataSerialize(serializers.Serializer):
    data_token = serializers.CharField()


class UserDataSerializer(serializers.ModelSerializer):
    date = serializers.DateField(format='%Y-%m-%d', input_formats=['%Y-%m-%d'], required=True)
    address_no_2 = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = PaymentUserDetail
        fields = ('name', 'email', 'phone_no', 'gender', 'date', 'contury', 'state', 'city', 'address', 'address_no_2','time_zone')

    def validate_dob(self, value):
        if value > datetime.now().date():
            raise serializers.ValidationError("Date of birth cannot be in the future.")
        return value