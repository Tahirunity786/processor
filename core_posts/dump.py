@shared_task
def expire_bookings():
    """
    Periodic task to expire bookings for rooms and tables.
    """
    current_date = now().date()
    logger.info(f"Expire Bookings Task Started at {current_date}")

    try:
        expired_counts = {"rooms": 0, "tables": 0}

        # Expire bookings for BedRoom (check_out < current_date)
        expired_rooms = BedRoom.objects.filter(
            orders__order__type_booking="bed",
            orders__order__check_out__lt=current_date,
            is_booked=True,
        )
        room_count = expired_rooms.count()
        expired_rooms.update(is_booked=False)
        expired_counts["rooms"] = room_count
        logger.info(f"{room_count} room(s) expired successfully.")

        # Expire bookings for Tables (check_in < current_date)
        expired_tables = Tables.objects.filter(
            orders__order__type_booking="table",
            orders__order__check_in__lt=current_date,
            is_booked=True,
        )
        table_count = expired_tables.count()
        expired_tables.update(is_booked=False)
        expired_counts["tables"] = table_count
        logger.info(f"{table_count} table(s) expired successfully.")

        # Log a summary of the task
        if all(count == 0 for count in expired_counts.values()):
            logger.info("No expired bookings found.")
        else:
            logger.info(f"Expired {expired_counts['rooms']} rooms and {expired_counts['tables']} tables.")

        return f"Expired {expired_counts['rooms']} rooms and {expired_counts['tables']} tables."

    except Exception as e:
        logger.error(f"Error in expire_bookings task: {str(e)}")
        return f"Task failed: {str(e)}"
    
    server_time = now()  # Get current server time
    logger.info(f"Expire Bookings Task Started at {server_time}")

    expired_counts = {"rooms": 0, "tables": 0}

    try:
        # Fetch all OrderItems and related user details
        expired_order_items = OrderItem.objects.filter(
            Q(content_type__model="bedroom", order__check_out__lt=server_time) |
            Q(content_type__model="tables", order__check_in__lt=server_time)
        ).select_related("order", "content_type")

        for order_item in expired_order_items:
            # Locate the OrderPlacementStorage associated with the OrderItem
            order_storage = OrderPlacementStorage.objects.filter(orders_items=order_item).first()
            if not order_storage:
                logger.warning(f"No associated OrderPlacementStorage found for OrderItem ID {order_item.id}")
                continue

            # Adjust for user's timezone using anonymous_track
            user_timezone = (
                order_storage.anonymous_track.timezone if order_storage.anonymous_track and order_storage.anonymous_track.timezone
                else "UTC"
            )
            user_local_time = server_time.astimezone(pytz.timezone(user_timezone)).date()

            # Expire only if user's local time matches expiration condition
            if (
                (order_item.content_type.model == "bedroom" and order_item.order.check_out < user_local_time) or
                (order_item.content_type.model == "tables" and order_item.order.check_in < user_local_time)
            ):
                content_object = order_item.content_object
                if hasattr(content_object, "is_booked") and content_object.is_booked:
                    content_object.is_booked = False
                    content_object.save()

                    if order_item.content_type.model == "bedroom":
                        expired_counts["rooms"] += 1
                    elif order_item.content_type.model == "tables":
                        expired_counts["tables"] += 1

        logger.info(f"Expired {expired_counts['rooms']} rooms and {expired_counts['tables']} tables.")
        return f"Expired {expired_counts['rooms']} rooms and {expired_counts['tables']} tables."

    except Exception as e:
        logger.error(f"Error in expire_bookings task: {str(e)}")
        return f"Task failed: {str(e)}"