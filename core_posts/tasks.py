import datetime
import logging
from celery import shared_task
from django.utils.timezone import now
from core_posts.models import BedRoom, Tables, FavouriteList
from core_payments.models import OrderPlacementStorage, PaymentUserDetail
from core_control.models import AnonymousBooking
import pytz
from django.db import transaction
from core_control.utiles import EmailAgent

# Set up a logger
logger = logging.getLogger(__name__)



@shared_task
def expire_bookings() -> None:
    """
    Periodic task to efficiently expire bookings for rooms and tables, ignoring user time zones.
    All times are calculated in server time or UTC.
    """

    email_agent = EmailAgent()
    order_storage = OrderPlacementStorage.objects.prefetch_related(
        'orders_items__order', 'orders_items__content_object'
    )
    updates = []
    notifications = []

    current_time = datetime.datetime.now(pytz.utc)  # Fetch current UTC time once

    for storage in order_storage:
        for order_item in storage.orders_items.all():
            order_booking = order_item.order
            content_object = order_item.content_object

            # Determine expiration time
            expiration_time = None
            if isinstance(content_object, BedRoom):
                expiration_time = datetime.datetime.combine(
                    order_booking.check_out + datetime.timedelta(days=1),
                    datetime.datetime.min.time()
                ).replace(tzinfo=pytz.utc)
            elif isinstance(content_object, Tables):
                expiration_time = datetime.datetime.combine(
                    order_booking.check_in + datetime.timedelta(days=1),
                    datetime.datetime.min.time()
                ).replace(tzinfo=pytz.utc)

            if expiration_time is None:
                logger.warning(f"Expiration time could not be determined for order {order_booking.pub_order_id}.")
                continue

            # Calculate remaining time
            remaining_time = (expiration_time - current_time).total_seconds()
            if remaining_time > 0:
                logger.info(f"Order {order_booking.pub_order_id} has {remaining_time} seconds remaining before expiration.")
                continue  # Skip if the booking is not yet expired

            # Mark as expired
            if content_object.is_booked:
                logger.info(f"Expiring booking for order {order_booking.pub_order_id}.")
                content_object.is_booked = False
                updates.append(content_object)

                notifications.append({
                    "order_id": order_booking.pub_order_id,
                    "email": getattr(storage, 'email', None),
                    "name": getattr(storage, 'name', "Guest"),
                    "address": (
                        getattr(content_object, "hotel", None) or 
                        getattr(content_object, "restaurant", None) or 
                        "Unknown Address"
                    ),
                    "check_in": order_booking.check_in,
                    "check_out": order_booking.check_out,
                    "type": "bed" if isinstance(content_object, BedRoom) else "table",
                })

    # Perform bulk updates
    with transaction.atomic():
        if updates:
            logger.info(f"Updating {len(updates)} expired bookings in bulk.")
            BedRoom.objects.bulk_update(
                [obj for obj in updates if isinstance(obj, BedRoom)], ['is_booked']
            )
            Tables.objects.bulk_update(
                [obj for obj in updates if isinstance(obj, Tables)], ['is_booked']
            )

    # Send notifications
    for notification in notifications:
        if notification["email"]:
            logger.info(f"Sending expiration alert for order {notification['order_id']} to {notification['email']}.")
            email_agent.send_smtp_email(notification, "expiration_alert")
        else:
            logger.warning(f"Email address missing for order {notification['order_id']}.")

    logger.info(f"Booking expiration task completed. {len(updates)} bookings expired.")

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
