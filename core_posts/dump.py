@shared_task
def expire_bookings() -> None:
    """
    Periodic task to efficiently expire bookings for rooms and tables, ignoring user time zones.
    All times are calculated in server time or UTC.
    """
    logger.info("Starting booking expiration task...")

    email_agent = EmailAgent()
    order_storage = OrderPlacementStorage.objects.prefetch_related(
        'orders_items__order', 'orders_items__content_object'
    )

    logger.debug(f"Found {order_storage.count()} order storage objects to process.")
    updates = []
    notifications = []

    for storage in order_storage:
        storage_time_zone = pytz.timezone('Africa/Kinshasa')
        current_time = datetime.datetime.now(storage_time_zone)
        print("Here is current time: ", current_time)

        logger.debug(f"Processing storage {storage.id} in time zone {storage_time_zone}. Current time: {current_time}")

        for order_item in storage.orders_items.all():
            
            order_booking = order_item.order
            content_object = order_item.content_object

            # Skip if the booking is less than 1 hour old
            time_since_created = (current_time - order_booking.created_at).total_seconds()
  
            # if time_since_created < 3600:
            #     continue

            # Calculate expiration time
            expiration_time = None
            if isinstance(content_object, BedRoom):
                expiration_time = datetime.datetime.combine(
                    order_booking.check_out + datetime.timedelta(days=1),
                    datetime.datetime.min.time()
                ).replace(tzinfo=pytz.timezone(content_object.hotel.hotel_time_zone))
            elif isinstance(content_object, Tables):
                expiration_time = datetime.combine(
                    order_booking.check_in + datetime.timedelta(days=1),
                    datetime.datetime.min.time()
                ).replace(tzinfo=pytz.timezone(content_object.restaurant.restaurant_time_zone))
            
            

            # Skip if expiration time is not determined
            # if expiration_time is None:
            #     logger.warning(f"Expiration time could not be determined for order {order_booking.pub_order_id}.")
            #     continue
            
            remaining_time = (expiration_time - current_time).total_seconds()
            days, remainder = divmod(remaining_time, 86400)  # 86400 seconds in a day
            hours, remainder = divmod(remainder, 3600)      # 3600 seconds in an hour
            minutes, seconds = divmod(remainder, 60)
            print(f"Here is the remaining time: Days: {days} Hours: {hours} Minutes: {minutes} Seconds: {seconds}")
            print(f"Here is the expiration time: {remaining_time}")
            if remaining_time > 0:
                continue

            # Mark as expired if still booked
            if content_object.is_booked:
                logger.info(f"Expiring booking for order {order_booking.pub_order_id}.")
                content_object.is_booked = False
                updates.append(content_object)

                notifications.append({
                    "order_id": order_booking.pub_order_id,
                    "email": getattr(storage, 'email', "Unknown"),
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
        logger.info(f"Sending expiration alert for order {notification['order_id']} to {notification['email']}.")
        email_agent.send_smtp_email(notification, "expiration_alert")

    logger.info(f"Booking expiration task completed. {len(updates)} bookings expired.")