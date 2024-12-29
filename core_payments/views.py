import base64
from datetime import datetime
import json
import stripe
from rest_framework.views import APIView, Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from django.conf import settings
from core_payments.serializer import DataSerialize, UserDataSerializer
from core_posts.models import BedRoom, Tables
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from rest_framework.parsers import JSONParser
from core_control.models import AnonymousBooking
from core_posts.models import BedRoom, Tables
from core_payments.models import Order, OrderItem, OrderPlacementStorage
from django.db import transaction
import stripe
import base64
import json
import logging
from core_payments.task import add_top_fav
# from django.contrib.contenttypes.models import ContentType
from django.forms.models import model_to_dict

from core_control.utiles import EmailAgent


client = EmailAgent()
logger = logging.getLogger(__name__)


stripe.api_key = settings.STRIPE_API_KEY


class CreatePaymentIntent(APIView):
    permission_classes = [AllowAny]

    def order_placer_checker(self, identifier, booking_type):
        """
        Checks if a room or table is booked based on the provided identifier and booking type.
    
        Args:
            identifier (str): The unique ID of the room or table.
            booking_type (str): The type of booking, either 'bed' or 'table'.
    
        Returns:
            dict: A dictionary containing the booking status and additional details.
                - "status": True if booked, False if not booked.
                - "message": A string message about the booking status.
        """
        # Mapping booking types to models and their respective ID fields
        model_mapping = {
            "bed": (BedRoom, "room_id"),
            "table": (Tables, "table_id"),
        }
    
        # Retrieve model and ID field based on booking type
        model_data = model_mapping.get(booking_type)
        if not model_data:
            return {"status": False, "message": "Invalid booking type"}
    
        model, id_field = model_data
    
        try:
            # Dynamically filter using the identifier
            instance = model.objects.get(**{id_field: identifier})
        except model.DoesNotExist:
            return {"status": False, "message": f"{booking_type.capitalize()} not found"}
    
        if instance.is_booked:
            return {"status": True, "message": f"Sorry! {booking_type.capitalize()} is already booked"}
    
        return {"status": False, "message": f"{booking_type.capitalize()} is available"}

    def item_based_cal(self, key, type_ex):
        """
        Fetches the item from the appropriate model based on the type.
        Returns the item's price if found, otherwise raises a ValueError.
        """
        try:
            if type_ex == "bed":
                data = BedRoom.objects.get(room_id=key)
                return data.price  # Assuming BedRoom has a `price` field
            elif type_ex == "table":
                data = Tables.objects.get(table_id=key)
                return data.price  # Assuming Tables has a `price` field
            else:
                raise ValueError("Invalid item type provided.")
        except BedRoom.DoesNotExist:
            raise ValueError("Invalid BedRoom key provided.")
        except Tables.DoesNotExist:
            raise ValueError("Invalid Table key provided.")

    def price_calculations(self, items):
        """
        Calculates the total price for multiple items.
        Raises ValueError for invalid or missing item data or if a room/table is already booked.
        """
        if not isinstance(items, list):
            raise ValueError("Expected a list of items for price calculation.")
    
        total_price = 0
        for item in items:
            try:
                key = item.get('key')
                item_type = item.get('type')
                nights = int(item.get('nights', 0))
    
                if not key or not item_type:
                    raise ValueError("Missing required fields in item.")
    
                # Check booking status
                booking_status = self.order_placer_checker(key, item_type)
                if booking_status["status"]:
                    raise ValueError(booking_status["message"])
    
                # Calculate price per unit
                price_per_unit = self.item_based_cal(key, item_type)
                if item_type == "bed":
                    total_price += price_per_unit * nights
                elif item_type == "table":
                    total_price += price_per_unit
                else:
                    raise ValueError(f"Unsupported item type: {item_type}")
    
            except (ValueError, TypeError) as e:
                raise ValueError(e)
    
        return total_price

    def per_price_calculations(self, item):
        """
        Handles price calculation for a single item.
        Returns the calculated price or raises a ValueError if the item is invalid or already booked.
    
        Args:
            item (dict): A dictionary containing the item's details with keys:
                         - 'key': Unique identifier for the item.
                         - 'type': Type of the item ('bed' or 'table').
                         - 'nights': Number of nights (optional, default is 0).
    
        Returns:
            float: The calculated price for the item.
        """
        try:
            # Extract details from the item dictionary
            key = item.get('key')
            item_type = item.get('type')
            nights = int(item.get('nights', 0))
    
            if not key or not item_type:
                raise ValueError("Missing required fields in single item.")
    
            # Check the booking status
            booking_status = self.order_placer_checker(key, item_type)
            if booking_status["status"]:
                raise ValueError(booking_status["message"])  # Raise an error if the item is already booked
    
            # Calculate the price based on item type
            price_per_unit = self.item_based_cal(key, item_type)
            if item_type == "bed":
                return price_per_unit * nights
            elif item_type == "table":
                return price_per_unit
            else:
                raise ValueError(f"Unsupported item type: {item_type}")
    
        except (ValueError, TypeError) as e:

            raise ValueError("Invalid item structure or missing fields.")


    def decode_data_token(self, data_token):
        """
        Decodes the base64-encoded token and returns the parsed JSON data.
        """
        try:
            decoded_bytes = base64.b64decode(data_token)
            decoded_str = decoded_bytes.decode('utf-8')
            return json.loads(decoded_str)
        except (base64.binascii.Error, UnicodeDecodeError, json.JSONDecodeError) as e:
            raise ValueError("Invalid data token.")

    def post(self, request):
        """
        Handles the POST request to create a Stripe payment intent.
        """
        serializer = DataSerialize(data=request.data)
    
        if not serializer.is_valid():
            return Response({
                "error": "Invalid data",
                "details": serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
    
        # Extract and decode the token
        data_token = serializer.validated_data.get('data_token')
    
        try:
            items = self.decode_data_token(data_token)
    
            # Determine whether the input is single-item or multi-item
            if isinstance(items, dict):
                # Single item
                grand_price = self.per_price_calculations(items)
            elif isinstance(items, list):
                # Multiple items
                grand_price = self.price_calculations(items)
            else:
                print("Error here")
                raise ValueError("Invalid items format. Expected a dictionary or a list.")
    
        except ValueError as e:
            print("Error 1", e)
            return Response({
                "error": str(e)
            }, status=status.HTTP_400_BAD_REQUEST)
    
        # Create Stripe payment intent
        try:
            customer = stripe.Customer.create(
                name="",  # Replace with actual customer name from request
                email=""  # Replace with actual email from request
            )
            amount = int(grand_price * 100)  # Stripe requires amount in cents
            payment_intent = stripe.PaymentIntent.create(
                amount=amount,
                currency="usd",
                customer=customer['id'],
                automatic_payment_methods={"enabled": True},
            )
            return Response({'client_secret': payment_intent.client_secret}, status=status.HTTP_200_OK)
    
        except stripe.error.StripeError as e:
            print("Error 2: ", e)
            return Response({
                "error": "Failed to create payment intent",
                "details": str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
        except Exception as e:
            print("Error no 3: ", e)
            return Response({
                "error": "Internal server error"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            


class OrderPlacer(APIView):
    permission_classes = [AllowAny]
    parser_classes = [JSONParser]

    @staticmethod
    def parse_date(date_str):
        try:
            return datetime.strptime(date_str, "%Y-%m-%d")
        except ValueError:
            raise ValueError(f"Invalid date format: {date_str}")

    def multiple_order_relations(self, data, cookie, time_zone):
        """
        Process multiple order relations and create corresponding database records.
        
        Args:
            data (list): List of order items, each represented as a dictionary.
        
        Raises:
            ValueError: If the data format is invalid or required fields are missing.
        """
        if not isinstance(data, list):
            raise ValueError("Expected a list of items for price calculation.")
    
        try:
            # Use a transaction to ensure atomicity
            with transaction.atomic():
                storage = OrderPlacementStorage.objects.create()  # Create a new order storage instance
    
                for item in data:
                    key = item.get('key')
                    item_type = item.get('type')
    
                    if not key or not item_type:
                        raise ValueError(f"Missing required fields in item: {item}")
    
                    if item_type == "bed":
                        # Extract and validate fields for "bed" orders
                        date_from = self.parse_date(item.get('dateFrom'))
                        date_till = self.parse_date(item.get('dateTill'))
                        nights = item.get('nights', 0)
    
                        if not isinstance(nights, int):
                            raise ValueError(f"Invalid 'nights' value: {nights}")
    
                        # Create the order and related items
                        hotel_order = Order.objects.create(
                            check_in=date_from, 
                            check_out=date_till, 
                            nights=nights,
                            type_booking="bed",
                        )
                        bedroom = BedRoom.objects.get(room_id=key)  # Replace with a query for the specific bedroom
                        if not bedroom:
                            raise ValueError("No available bedrooms found.")
                        
                        hotel_order_item = OrderItem.objects.create(
                            order=hotel_order, 
                            content_object=bedroom, 
                            quantity=1
                        )
                        storage.orders_items.add(hotel_order_item)  # Link order to storage
                        bedroom.is_booked = True
                        bedroom.save()
    
                    elif item_type == "table":
                        # Extract and validate fields for "table" orders
                        date = self.parse_date(item.get('date'))
                        
                        # Create the order and related items
                        table_order = Order.objects.create(check_in=date, type_booking="table",)
                        table = Tables.objects.get(table_id=key)  # Replace with a query for the specific table
                        if not table:
                            raise ValueError("No available tables found.")
                        
                        table_order_item = OrderItem.objects.create(
                            order=table_order, 
                            content_object=table, 
                            quantity=1
                        )
                        storage.orders_items.add(table_order_item)  # Link order to storage
                        table.is_booked = True
                        table.save()
    
                    else:
                        raise ValueError(f"Unsupported item type: {item_type}")
    
                # Save the storage instance after all orders are added
                storage.anonymous_track = cookie
                storage.time_zone = time_zone
                storage.save()
                return storage
    
        except (ValueError, TypeError, Exception) as e:
            logger.error(f"Error processing multiple order relations: {e}")
            raise ValueError(f"An error occurred while processing orders: {e}")

    def single_order_relations(self, data, cookie, time_zone):
        
        try:

            with transaction.atomic():

                storage = OrderPlacementStorage.objects.create()
                
                key = data.get('key')
                item_type = data.get('type')
                
    
                if not key or not item_type:
                    raise ValueError("Missing required fields in single item.")

                # Calculate price based on item type
                if item_type == "bed":
                    # Extract and validate fields for "bed" orders
                    date_from = self.parse_date(data.get('dateFrom'))
                    date_till = self.parse_date(data.get('dateTill'))
                    nights = int(data.get('nights', 0))

                    # Create the order and related items
                    hotel_order = Order.objects.create(
                        check_in=date_from, 
                        check_out=date_till, 
                        nights=nights,
                        type_booking="bed"
                    )
                    bedroom = BedRoom.objects.get(room_id=key)  # Replace with a query for the specific bedroom
                    if not bedroom:
                        raise ValueError("No available bedrooms found.")
                    hotel_order_item = OrderItem.objects.create(
                        order=hotel_order, 
                        content_object=bedroom, 
                        quantity=1
                    )
                    storage.orders_items.add(hotel_order_item)
                    bedroom.is_booked = True
                    bedroom.save()
                    

                elif item_type == "table":
                    date = self.parse_date(data.get('date'))

                    # Create the order and related items
                    table_order = Order.objects.create(check_in=date, type_booking="table")
                    table = Tables.objects.get(table_id=key) 
                    if not table:
                        raise ValueError("No available tables found.")
                    
                    table_order_item = OrderItem.objects.create(
                        order=table_order, 
                        content_object=table, 
                        quantity=1
                    )
                    storage.orders_items.add(table_order_item)
                    table.is_booked = True
                    table.save()
                else:
                    raise ValueError(f"Unsupported item type: {item_type}")
                
                storage.anonymous_track = cookie
                storage.time_zone = time_zone
                storage.save()
    
                return storage
    
        except (ValueError, TypeError) as e:
            logger.error(f"Error in single item price calculation: {e}")
            raise ValueError("Invalid item structure or missing fields.")




    def decode_data_token(self, data_token):
        try:
            decoded_bytes = base64.b64decode(data_token)
            decoded_str = decoded_bytes.decode('utf-8')
            return json.loads(decoded_str)
        except (base64.binascii.Error, UnicodeDecodeError, json.JSONDecodeError) as e:
            raise ValueError("Invalid data token.")

    def post(self, request):
        data_token = request.data.get('data_token')
        time_zone = request.data.get('time_zone')
        storage = ""
        if not data_token:
            return Response({"error": "data_token missing"}, status=status.HTTP_400_BAD_REQUEST)
        if not time_zone:
            return Response({"error": "Enable to find location"}, status=status.HTTP_400_BAD_REQUEST)
    
        anonymous_id = request.COOKIES.get('ann__nak')
        try:
            _id_obj = AnonymousBooking.objects.get(booking_id=anonymous_id)
        except AnonymousBooking.DoesNotExist:
            return Response({"error": "Track ID does not exist"}, status=status.HTTP_400_BAD_REQUEST)
    
        try:
            items = self.decode_data_token(data_token)
            if isinstance(items, dict):
                storage = self.single_order_relations(items, _id_obj, time_zone)
            elif isinstance(items, list):
                storage = self.multiple_order_relations(items, _id_obj, time_zone)
            else:
                raise ValueError("Invalid items format. Expected a dictionary or a list.")
        except ValueError as e:
            print("Error no 1: ", e)
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
        # Pass the booking ID instead of the entire object


        add_top_fav.delay(_id_obj.id, storage.id)
    
        return Response({"success": True}, status=status.HTTP_200_OK)


class PaymentDetailView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        anonymous_booking_id = request.COOKIES.get('ann__nak')
        try:
            traces = AnonymousBooking.objects.get(booking_id=anonymous_booking_id)
            data_serialized = UserDataSerializer(data=request.data)
            if data_serialized.is_valid():
                instance = data_serialized.save()
                instance.annoynmous_tracer = traces
                instance.save()

                return Response({'success': "Data has been saved"}, status=status.HTTP_200_OK)
            return Response(data_serialized.errors, status=status.HTTP_400_BAD_REQUEST)
        except AnonymousBooking.DoesNotExist:
            return Response({"error": "User not exist."}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"error": f"Error encountered while processing request: {e}"}, status=status.HTTP_400_BAD_REQUEST)
