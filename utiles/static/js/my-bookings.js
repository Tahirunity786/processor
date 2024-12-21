document.addEventListener('DOMContentLoaded', () => {
    function calculateRemainingTime(checkIn, checkOut) {
        const now = new Date();
        const checkInDate = new Date(checkIn);
        let checkOutDate = null;
        
        if (checkOut) {
            checkOutDate = new Date(checkOut);
            // Adjust the check-out date to midnight at the start of the next day
            checkOutDate.setHours(24, 0, 0, 0);
        }
    
        if (checkInDate > now) {
            // Case 1: Future booking start date
            const daysUntilCheckIn = Math.ceil((checkInDate - now) / (1000 * 60 * 60 * 24));
            return `Booking starts in ${daysUntilCheckIn} day(s)`;
        }
    
        if (checkInDate <= now && checkOutDate) {
            // Calculate the total time difference in milliseconds
            const timeDifference = checkOutDate - now;
    
            if (timeDifference > 0) {
                // Calculate total days remaining
                const totalDays = Math.floor(timeDifference / (1000 * 60 * 60 * 24));
    
                // Calculate remaining milliseconds for hours and minutes
                const remainingMilliseconds = timeDifference % (1000 * 60 * 60 * 24);
    
                // Calculate exact hours and minutes
                const remainingHours = Math.floor(remainingMilliseconds / (1000 * 60 * 60));
                const remainingMinutes = Math.floor((remainingMilliseconds % (1000 * 60 * 60)) / (1000 * 60));
    
                // Display the days, hours, and minutes correctly
                return `${totalDays} days, ${remainingHours} hrs, ${remainingMinutes} mins`;
            } else {
                return "Time expired";
            }
        }
    
        if (checkInDate <= now && (!checkOutDate || checkOutDate.toDateString() === checkInDate.toDateString())) {
            // Case 3: Remaining time until midnight of the check-in day
            const midnight = new Date(now);
            midnight.setHours(24, 0, 0, 0); // Set to midnight of the current day
            const timeUntilMidnight = midnight - now;
    
            if (timeUntilMidnight > 0) {
                const hours = Math.floor(timeUntilMidnight / (1000 * 60 * 60));
                const minutes = Math.floor((timeUntilMidnight % (1000 * 60 * 60)) / (1000 * 60));
                return `${hours} hrs, ${minutes} mins`;
            }
        }
    
        // Default case: Time expired
        return "Time expired";
    }
    

    function calculateTimeUntilMidnight(bookingTime) {
        const now = new Date(bookingTime);
        const midnight = new Date(bookingTime);
        midnight.setHours(24, 0, 0, 0); // Set to midnight of the current day
        const bookingDate = new Date(bookingTime);

        if (bookingDate <= now && now < midnight) {
            const timeDifference = midnight - now;
            const hours = Math.floor(timeDifference / (1000 * 60 * 60));
            const minutes = Math.floor((timeDifference % (1000 * 60 * 60)) / (1000 * 60));
            return `${hours}h ${minutes}m until midnight`;
        }
        return "Time expired";
    }

    // Fallback getter for nested values
    function getNestedValue(obj, path, fallback = "Not Available") {
        return path.split('.').reduce((value, key) => value?.[key], obj) || fallback;
    }

    // Main function to generate grid HTML
    function gridGenerator(data) {
        let gridHTML = '';

        // Iterate over the list of bookings
        data.forEach(booking => {
            if (booking.orders_items && Array.isArray(booking.orders_items)) {
                booking.orders_items.forEach(orderItem => {
                    const content = orderItem.content_object;
                    const order = orderItem.order;

                    const typeBooking = order.type_booking; // Bed or Table
                    const nights = order.nights || 0;
                    const pricePerNight = content.price || 0;
                    const totalPrice = nights > 0 ? pricePerNight * nights : 0;

                    // Common fields
                    const image = content.image || content.images || "/media/default-image.jpg";
                    const name = getNestedValue(content, typeBooking === "bed" ? "hotel.name" : "restaurant.name");
                    const country = getNestedValue(content, typeBooking === "bed" ? "hotel.country" : "restaurant.country");
                    const city = getNestedValue(content, typeBooking === "bed" ? "hotel.city.name" : "restaurant.city.name");
                    const address = getNestedValue(content, typeBooking === "bed" ? "hotel.address" : "restaurant.address");
                    const typeSpecificText = typeBooking === "bed" ? "per night" : "/per table";

                    // Remaining time calculation
                    let remainingTime = '';
                    if (typeBooking === "bed") {
                        remainingTime = calculateRemainingTime(order.check_in, order.check_out);
                    } else if (typeBooking === "table") {
                        remainingTime = calculateTimeUntilMidnight(order.check_in);
                    }

                    // Generate Card HTML
                    gridHTML += `
                    <div class="col p-2">
                        <div class="card shadow-sm" style="border: none; width: 100%;">
                            <img src="${image}" class="card-img-top" alt="${name}" height="200" style="object-fit: cover;">
                            <div class="card-body p-3">
                                <h6 class="mb-1">${name}</h6>
                                <p class="text-muted small mb-2">${country}, ${city}, ${address}</p>
                                <p class="mb-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" class="bi bi-alarm me-1" viewBox="0 0 16 16">
                                        <path d="M8.5 5.5a.5.5 0 0 0-1 0v3.362l-1.429 2.38a.5.5 0 1 0 .858.515l1.5-2.5A.5.5 0 0 0 8.5 9z" />
                                        <path d="M6.5 0a.5.5 0 0 0 0 1H7v1.07a7.001 7.001 0 0 0-3.273 12.474l-.602.602a.5.5 0 0 0 .707.708l.746-.746A6.97 6.97 0 0 0 8 16a6.97 6.97 0 0 0 3.422-.892l.746.746a.5.5 0 0 0 .707-.708l-.601-.602A7.001 7.001 0 0 0 9 2.07V1h.5a.5.5 0 0 0 0-1zm1.038 3.018a6 6 0 0 1 .924 0 6 6 0 1 1-.924 0" />
                                    </svg>
                                    ${remainingTime}
                                </p>
                                <h6 class="mb-2"><strong>${pricePerNight}$</strong> ${typeSpecificText}</h6>
                                ${nights > 0
                            ? `<p class="text-muted small">Total price for ${nights} night(s): <strong>${totalPrice}$</strong></p>`
                            : ''
                        }
                            </div>
                        </div>
                    </div>
                `;
                });
            }
        });

        return gridHTML;
    }

    async function bookingHandling() {
        let bookingGrid = document.getElementById('booking_grid');

        let response = await fetch('/posts/show-all-orders', {
            method: 'GET',
            credentials: 'include',
        });

        if (response.ok) {
            let data = await response.json();
            bookingGrid.innerHTML = gridGenerator(data); // Pass data to gridGenerator
        } else {
            console.error("Failed to fetch bookings");
        }
    }

    bookingHandling();
});
