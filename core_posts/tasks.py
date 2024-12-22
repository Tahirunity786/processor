import datetime
import logging
from celery import shared_task
from django.utils.timezone import now
from core_posts.models import BedRoom, Tables, FavouriteList
from core_payments.models import OrderPlacementStorage, PaymentUserDetail
from core_control.models import AnonymousBooking
import pytz
from core_control.utiles import EmailAgent

# Set up a logger
logger = logging.getLogger(__name__)


@shared_task
def expire_bookings() -> None:
    """
    Periodic task to efficiently expire bookings for rooms and tables, considering user time zones.
    Optimized to handle thousands of orders.
    """
    email_agent = EmailAgent()

    # Prefetch related objects to minimize database queries
    order_storage = OrderPlacementStorage.objects.prefetch_related('orders_items__order', 'orders_items__content_object')
    user_details = PaymentUserDetail.objects.all()
    user_detail_map = {
        detail.annoynmous_tracer: detail for detail in user_details
    }

    for storage in order_storage:
        user_detail = user_detail_map.get(storage.anonymous_track)

        if not user_detail:
            logger.warning("No user detail found for storage ID %s", storage.id)
            continue

        try:
            user_tz = pytz.timezone(user_detail.time_zone)
        except Exception as e:
            logger.error("Invalid timezone for user %s: %s", user_detail.email, e)
            continue

        # Get the current time in the user's timezone
        current_time = now().astimezone(user_tz)

        # Collect updates for batch processing
        updates = []
        notifications = []

        for order_item in storage.orders_items.all():
            order_booking = order_item.order
            content_object = order_item.content_object

            # Calculate expiration time (midnight after check-out day)
            expiration_time_naive = datetime.datetime.combine(
                order_booking.check_out + datetime.timedelta(days=1),
                datetime.time.min
            )
            expiration_time = user_tz.localize(expiration_time_naive)
            print("Here is current time : ",current_time)
            print("Here is expiration time : ",expiration_time)

            if isinstance(content_object, BedRoom) and current_time >= expiration_time and content_object.is_booked:
                content_object.is_booked = False
                updates.append(content_object)

                logger.info("Expired BedRoom booking for order %s", order_booking.pub_order_id)

                notifications.append({
                    "order_id": order_booking.pub_order_id,
                    "email": user_detail.email,
                    "name": user_detail.name,
                    "address": f"{content_object.hotel.city}, {content_object.hotel.country}, {content_object.hotel.address}",
                    "check_in": order_booking.check_in,
                    "check_out": order_booking.check_out,
                    "nights": order_booking.nights,
                    "type": "bed",
                })

            elif isinstance(content_object, Tables) and current_time >= expiration_time and content_object.is_booked:
                content_object.is_booked = False
                updates.append(content_object)

                logger.info("Expired Table booking for order %s", order_booking.pub_order_id)

                notifications.append({
                    "order_id": order_booking.pub_order_id,
                    "email": user_detail.email,
                    "name": user_detail.name,
                    "address": f"{content_object.restaurant.city}, {content_object.restaurant.country}, {content_object.restaurant.address}",
                    "check_in": order_booking.check_in,
                    "type": "table",
                })

        # Bulk update all expired bookings
        if updates:
            BedRoom.objects.bulk_update(
                [obj for obj in updates if isinstance(obj, BedRoom)], ['is_booked']
            )
            Tables.objects.bulk_update(
                [obj for obj in updates if isinstance(obj, Tables)], ['is_booked']
            )

        # Send notifications in batch
        for notification in notifications:
            email_agent.send_smtp_email(notification, "expiration_alert")

    logger.info("Booking expiration task completed.")


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
