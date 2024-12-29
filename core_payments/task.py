import logging
from celery import shared_task
from core_posts.models import BedRoom, Tables, Hotel
from core_payments.models import PaymentUserDetail, OrderPlacementStorage
from core_control.utiles import EmailAgent
from django.conf import settings
import base64



# Initialize logger
logger = logging.getLogger(__name__)
sender_email = EmailAgent()

@shared_task(bind=True)
def add_top_fav(self, credentials: str, storage_id: int) -> str:
    """
    A Celery task to send emails to the client and owner (hotel/restaurant) after a booking.

    Args:
        credentials (str): Booking credential.
        storage_id (int): ID of the OrderPlacementStorage.

    Returns:
        str: Status of the operation.
    """
    try:
        # Fetch the latest user details for the given credentials
        user_details = PaymentUserDetail.objects.filter(annoynmous_tracer=credentials).order_by('-order_date_time')
        user_detail = user_details.first()

        if not user_detail:
            return "PaymentUserDetail not found"

        # Fetch the related storage and its items
        storage_sanitizer = OrderPlacementStorage.objects.get(id=storage_id)
        order_items = storage_sanitizer.orders_items.all()

        email_agent = EmailAgent()

        # Prepare client data for email
        client_data = {
            "name": user_detail.name,
            "email": user_detail.email,
            "order_details": [],
        }

        for order_item in order_items:
            related_object = order_item.content_object
            order_booking = order_item.order

            if isinstance(related_object, BedRoom):
                order_data = {
                    "order_id": order_booking.pub_order_id,
                    "check_in": order_booking.check_in,
                    "check_out": order_booking.check_out,
                    "capacity": related_object.capacity,
                    "total_price": related_object.price*order_booking.nights,
                    "booking_type": "bed"

                }
                hotel_data = {
                    "name": related_object.hotel.name,
                    "email": related_object.hotel.email,
                    "city": related_object.hotel.city,
                    "country": related_object.hotel.country,
                    "street": related_object.hotel.address,
                    "order_details": order_data,
                    
                }

                # Send email to hotel owner
                email_agent.send_smtp_email(hotel_data, email_type="owner_alert")

            elif isinstance(related_object, Tables):
                order_data = {"check_in": order_booking.check_in, "order_id": order_booking.pub_order_id, "booking_type": "table"}
                restaurant_data = {

                    "name": related_object.restaurant.name,
                    "email": related_object.restaurant.email,
                    "city": related_object.restaurant.city,
                    "country": related_object.restaurant.country,
                    "street": related_object.restaurant.address,
                    "order_details": order_data,
                }

                # Send email to restaurant owner
                email_agent.send_smtp_email(restaurant_data, email_type="owner_alert")  

            else:
                logger.warning(f"Unknown object type: {type(related_object)}")
                continue

            # Add order data to client email

            client_data["order_details"].append(order_data)
        
        # Send email to the client
        email_status = email_agent.send_smtp_email(client_data, email_type="client_confirmation")
        return "Emails sent successfully" if email_status else "Failed to send client email"

    except Exception as e:
        logger.error(f"Task failed: {str(e)}")
        return f"Task failed: {str(e)}"