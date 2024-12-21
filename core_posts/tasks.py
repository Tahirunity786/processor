import logging
from celery import shared_task
from django.utils.timezone import now
from core_posts.models import BedRoom, Tables, FavouriteList
from core_payments.models import OrderPlacementStorage, PaymentUserDetail
from core_control.models import AnonymousBooking
import pytz

# Set up a logger
logger = logging.getLogger(__name__)

@shared_task
def expire_bookings()-> None:
    """
    Periodic task to expire bookings for rooms and tables, considering user time zones.
    """
    order_storage = OrderPlacementStorage.objects.all()
    for storage in order_storage:
        user_via_personal_tz = PaymentUserDetail.objects.filter(annoynmous_tracer=storage.anonymous_track).order_by('-order_date_time').first()
        # Get the user time zone
        user_tz = pytz.timezone(user_via_personal_tz.time_zone)

        # Get the current time in the user's time zone
        current_time = now().astimezone(user_tz)
        # Get the current date in the user's time zone
        current_date = current_time.date()
        
        # Get the current time in the user's time zone
        current_time = current_time.time()

        # Get the order items
        order_items = storage.orders_items.all()
        for order_item in order_items:
            # Get the order item  & content object
            order_booking = order_item.order
            content_object = order_item.content_object
            # Check if the content object is a bed room
            if isinstance(content_object, BedRoom):
                if order_booking.check_out < current_date and content_object.is_booked == True:
                    # Expire the booking
                    content_object.is_booked = False
                    content_object.save()
            # Check if the content object is a table
            elif isinstance(content_object, Tables):
                # Check if the check-out date is less than the current date
                if order_booking.check_in < current_date and content_object.is_booked == True:
                    # Expire the booking
                    content_object.is_booked = False
                    content_object.save()
            else:
                logger.error("Invalid content object type provided.")

    
    
@shared_task
def fav_add_task(post_id: str, booking_id: str, type_of: str) -> str:
    """
    Add post to the favorite list asynchronously.
    """
    try:
        # Retrieve the AnonymousBooking instance
        track = AnonymousBooking.objects.get(booking_id=booking_id)

        # Create or retrieve the FavouriteList instance
        fav_creation, created = FavouriteList.objects.get_or_create(
            unknown_track=track, 
            created_at=now().date()
        )

        # Add favorite based on type
        if type_of == "bed":
            post = BedRoom.objects.get(room_id=post_id)
            # Check if the bed room is already in the list
            if not fav_creation.fav_bed.filter(id=post.id).exists():
                fav_creation.fav_bed.add(post)
            else:
                logger.info(f"BedRoom with ID {post_id} is already in the favorite list.")
                return f"BedRoom with ID {post_id} is already in the favorite list."

        elif type_of == "table":
            post = Tables.objects.get(table_id=post_id)
            # Check if the table is already in the list
            if not fav_creation.fav_table.filter(id=post.id).exists():
                fav_creation.fav_table.add(post)
            else:
                logger.info(f"Table with ID {post_id} is already in the favorite list.")
                return f"Table with ID {post_id} is already in the favorite list."

        else:
            raise ValueError(f"Invalid type_of value provided: {type_of}")

        # Save the updated favorite list
        fav_creation.save()
        return "Favorite added successfully"

    except AnonymousBooking.DoesNotExist:
        error_message = f"Anonymous booking with ID {booking_id} does not exist."
        logger.error(error_message)
        return error_message

    except BedRoom.DoesNotExist:
        error_message = f"BedRoom with ID {post_id} does not exist."
        logger.error(error_message)
        return error_message

    except Tables.DoesNotExist:
        error_message = f"Table with ID {post_id} does not exist."
        logger.error(error_message)
        return error_message

    except ValueError as ve:
        logger.error(str(ve))
        return str(ve)

    except Exception as e:
        # General exception handling with logging
        logger.exception("An unexpected error occurred in fav_add_task.")
        return f"An unexpected error occurred: {str(e)}"
