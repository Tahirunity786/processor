document.addEventListener("DOMContentLoaded", () => {
    const LanguageManager = (function () {
        const DEFAULT_LANGUAGE = 'en';
        function getLanguage() {
            return localStorage.getItem('lang') || DEFAULT_LANGUAGE;
        }
        function setLanguage(lang) {
            localStorage.setItem('lang', lang);
        }
        return {
            getLanguage,
            setLanguage
        };
    })();
    // Base64 encoding function
    function encodeBase64(data) {
        return btoa(JSON.stringify(data));
    }

    // Base64 decoding function
    function decodeBase64(encodedData) {
        try {
            // Check if encodedData looks like a base64 string
            if (!/^[A-Za-z0-9+/=]+$/.test(encodedData)) {
                throw new Error("Data is not in valid base64 format.");
            }
            return JSON.parse(atob(encodedData)); // Decode and parse JSON
        } catch (error) {
            console.error("Error decoding base64 data:", error);
            return []; // Return empty array on failure
        }
    }



    const shareButton = document.getElementById('nak-share');
    shareButton.addEventListener('click', async (event) => {
        event.preventDefault();

        // Extract the data-id (room ID) from the button
        const roomId = event.currentTarget.getAttribute('data-id');

        try {
            // Fetch the shareable link from the Django API
            const response = await fetch(`/posts/shareable-link/${LanguageManager.getLanguage()}/${roomId}/`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',

                }
            });

            if (response.ok) {
                const data = await response.json();
                const shareableLink = data.shareable_link;

                // Use Clipboard API to copy the link to clipboard
                await navigator.clipboard.writeText(shareableLink);

                // Show success notification
                butterup.toast({
                    title: 'Link Copied!',
                    message: "The link has been copied to your clipboard.",
                    type: 'success',
                });
            } else {
                throw new Error('Failed to generate the link');
            }
        } catch (err) {
            // Handle errors gracefully and notify the user
            butterup.toast({
                title: 'Error',
                message: "There was an error generating the shareable link. Please try again.",
                type: 'error',
            });
        }
    });
    const favbtn = document.getElementById('favbtn');
    favbtn.addEventListener('click', async (event) => {
        event.preventDefault();

        // Extract the data-id (room ID) from the button
        const roomId = event.currentTarget.getAttribute('data-id');
        
        try {
            // API call for favorite
            const response = await fetch('/posts/favourites/bed', {
                method: 'POST', // Correct HTTP method
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json', // JSON content type
                },
                credentials: 'include', // Include cookies
                body: JSON.stringify({ id: roomId }), // Ensure ex.room_id is defined
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    butterup.toast({
                        title: 'Added Successfully',
                        message: "Room added to favourite.",
                        type: 'success',
                    });
                }
               
            } else {
                const error = await response.json();
                butterup.toast({
                    title: 'Something went wrong',
                    message: error.error,
                    type: 'error',
                });
            }
        } catch (error) {
            butterup.toast({
                title: 'Something went wrong',
                message: error,
                type: 'error',
            });
        }
    });

    

    const perNightQuantity = document.getElementById('per_night__quan');
    const subTotal = document.getElementById('subtotal');
    const grandTotal = document.getElementById('g__total');
    const addToCartButton = document.getElementById('add-to__chk');
    let addTReserve = document.getElementById('add-to__reserve');

    let selection = 1;
    let pricePerNight = 0;
    let isFetchingPrice = false;


    const formatDateForDisplay = (date) =>
        `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;

    const formatDateForInput = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const currentDate = new Date();
    const formattedDisplayDate = formatDateForDisplay(currentDate);
    const formattedInputDate = formatDateForInput(currentDate);

    // Common setup function for date inputs
    const setupDateInput = (inputId, displayId, labelId) => {
        const dateInput = document.getElementById(inputId);
        const dateDisplay = document.getElementById(displayId);
        const dateLabel = document.getElementById(labelId);

        // Set initial values
        dateDisplay.textContent = formattedDisplayDate;
        dateInput.value = formattedInputDate;
        dateInput.min = formattedInputDate;

        // Toggle input visibility on label click
        dateLabel.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent bubbling
            dateInput.style.display =
                dateInput.style.display === 'none' ? 'inline-block' : 'none';
        });

        // Update display and hide input on date selection
        dateInput.addEventListener('change', () => {
            const selectedDate = new Date(dateInput.value);
            dateDisplay.textContent = formatDateForDisplay(selectedDate);
            dateInput.style.display = 'none';
        });

        return dateInput;
    };

    // Initialize date inputs
    const dateFromInput = setupDateInput('date_from', 'date_display', 'date_label');
    const dateTillInput = setupDateInput('date_till', 'date_display_till', 'date_label_till');

    // Logic to synchronize DATE TILL with DATE FROM
    dateFromInput.addEventListener('change', () => {
        const dateFromValue = new Date(dateFromInput.value);
        const dateTillValue = new Date(dateTillInput.value);

        // Update DATE TILL only if it's empty or earlier than DATE FROM
        if (!dateTillInput.value || dateTillValue < dateFromValue) {
            dateTillInput.value = dateFromInput.value;
            document.getElementById('date_display_till').textContent = formatDateForDisplay(dateFromValue);
        }

        // Ensure DATE TILL has a valid min date
        dateTillInput.min = dateFromInput.value;

        // Call handleDate to update nights
        handleDate(dateFromValue, new Date(dateTillInput.value));
    });

    dateTillInput.addEventListener('change', () => {
        const dateFromValue = new Date(dateFromInput.value);
        const dateTillValue = new Date(dateTillInput.value);

        // Call handleDate to update nights
        handleDate(dateFromValue, dateTillValue);
    });

    // Hide date inputs when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('#date_updater')) {
            dateFromInput.style.display = 'none';
            dateTillInput.style.display = 'none';
        }
    });

    // Function to calculate nights
    const calculateNights = (startDate, endDate) => {
        const timeDifference = endDate - startDate;
        return Math.ceil(timeDifference / (1000 * 60 * 60 * 24) + 1); // Convert milliseconds to days
    };

    // Function to handle changes in dates and update nights
    async function handleDate(dateFromValue, dateTillValue) {
        if (dateFromValue && dateTillValue && dateTillValue >= dateFromValue) {
            // Calculate nights
            const nights = calculateNights(dateFromValue, dateTillValue);

            // Update UI for nights

            perNightQuantity.textContent = nights === 1 ? 'Today' : nights;

            // Calculate price or perform other actions
            await priceCal(nights, dateFromValue, dateTillValue);
        } else {
            // Handle invalid date ranges
            console.error('Invalid date range selected.');
        }
    };

    // Function for price calculation logic
    async function priceCal(selection, dateFromValue, dateTillValue) {
        if (isFetchingPrice) return;
        isFetchingPrice = true;
        const dateFrom = document.getElementById('date_from').value;
        const dateTill = document.getElementById('date_till').value;

        try {
            // Extract roomId from the current URL
            const currentUrl = window.location.href; // Get the full URL
            const urlParts = currentUrl.split('/'); // Split by '/'
            const roomId = urlParts[urlParts.length - 1]; // Get the last segment as roomId

            if (roomId) {
                const response = await fetch(`/posts/price?ex_room_id=${roomId}`, {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json',
                    },
                });

                if (!response.ok) throw new Error('Failed to fetch hotel details');

                const data = await response.json();
                pricePerNight = data.price || 0;
                const subtotalValue = pricePerNight * selection;
                const nights = calculateNights(dateFromValue, dateTillValue);
                

                subTotal.textContent = `${subtotalValue}$`;
                grandTotal.textContent = `${subtotalValue}$`;
                
                const savedData = {
                    key: roomId,
                    nights: nights,
                    dateFrom: dateFrom,
                    dateTill: dateTill,
                    'type': 'bed',
                };
                const encodedData = encodeBase64(savedData);
                sessionStorage.setItem('nk-cache-save', encodedData);
            }
        } catch (error) {
            console.error('Price calculation error:', error);
        } finally {
            isFetchingPrice = false;
        }
    }
    async function singleCartCal() {
        const dateFrom = document.getElementById('date_from').value;
        const dateTill = document.getElementById('date_till').value;
        const dateFromValue = new Date(dateFrom);
        const dateTillValue = new Date(dateTill);
        

        if (isFetchingPrice) return;  // Prevent multiple requests at once
        isFetchingPrice = true;

        try {
            const currentUrl = window.location.href; // Get the full URL
            const urlParts = currentUrl.split('/'); // Split by '/'
            const roomId = urlParts[urlParts.length - 1]; // Get the last segment as roomId

            if (roomId) {
                // Fetching existing cart from localStorage
                let existingCart = localStorage.getItem('nk-pmt-data');
                existingCart = existingCart ? decodeBase64(existingCart) : [];
                
                const roomExists = existingCart.some(item => item.key === roomId);

                if (!roomExists) {
                    // Fetch price if room doesn't exist in the cart
                    const response = await fetch(`/posts/price?ex_room_id=${roomId}`, {
                        method: 'GET',
                        headers: { 'Accept': 'application/json' },
                    });

                    if (!response.ok) throw new Error('Failed to fetch hotel details');
                    const nights = calculateNights(dateFromValue, dateTillValue);

                    // Add room to cart
                    const savedData = {
                        key: roomId,
                        nights: nights,
                        dateFrom: dateFrom,
                        dateTill: dateTill,
                        'type': 'bed',
                    };

                    existingCart.push(savedData);

                    // Save updated cart to localStorage
                    localStorage.setItem('nk-pmt-data', encodeBase64(existingCart));
                    return true
                }
            }
        } catch (error) {
            return false
        } finally {
            isFetchingPrice = false;
        }
    }


    // Add to cart
    addToCartButton.addEventListener('click', (event) => {
        const tempDataGet = sessionStorage.getItem('nk-cache-save');
        if (tempDataGet) {
            const roomData = decodeBase64(tempDataGet); // Decoding sessionStorage data


            // Retrieve existing cart data from localStorage, decode it if it exists
            let existingCart = localStorage.getItem('nk-pmt-data');
            existingCart = existingCart ? decodeBase64(existingCart) : [];

            // Find the room in the cart by room_id
            const roomIndex = existingCart.findIndex(item => item.room_id === roomData.room_id);

            if (roomIndex !== -1) {
                // Room exists, update its data (nights and price)
                existingCart[roomIndex].nights = roomData.nights;

                // Show a toast message that the cart has been updated
                butterup.toast({
                    title: 'Cart Updated Successfully',
                    message: 'The selected room in your cart has been updated with new nights and price.',
                    type: 'info',
                });

            } else {
                // Room does not exist, add it to the cart
                existingCart.push(roomData);

                // Show a toast message that the room has been added
                butterup.toast({
                    title: 'Room Added to Cart',
                    message: 'The selected room has been successfully added to your cart.',
                    type: 'success',
                });
            }

            // Encode the updated cart data before saving to localStorage
            const encodedCartData = encodeBase64(existingCart);
            localStorage.setItem('nk-pmt-data', encodedCartData);

            // Secure redirect after 2 seconds
            setTimeout(() => {
                window.location.href = `/nakiese/${LanguageManager.getLanguage()}/cart`;
            }, 2000);

        } else {
            let added = singleCartCal(selection, event);
            if (added) {
                butterup.toast({
                    title: 'Room Added to Cart',
                    message: 'The selected room has been successfully added to your cart.',
                    type: 'success',
                });
                // Secure redirect after 2 seconds
                setTimeout(() => {
                    window.location.href = `/nakiese/${LanguageManager.getLanguage()}/cart`;
                }, 2000); // 2000 milliseconds = 2 seconds
            } else {
                butterup.toast({
                    title: 'Something went wrong!',
                    message: 'Please try again later.',
                    type: 'error',
                });
            }
        }
    });

    addTReserve.addEventListener('click', (event) => {
        const currentUrl = window.location.href; // Get the full URL
        const urlParts = currentUrl.split('/'); // Split by '/'
        const roomId = urlParts[urlParts.length - 1];
        const dateFrom = document.getElementById('date_from').value;
        const dateTill = document.getElementById('date_till').value;

        // Convert date strings to Date objects
        const startDate = new Date(dateFrom);
        const endDate = new Date(dateTill);

        // Calculate total nights
        const totalNights = calculateNights(startDate, endDate);

        if (roomId) {
            setTimeout(() => {
                window.location.href = `/nakiese/${LanguageManager.getLanguage()}/payment?key=${roomId}&type=bed&dateFrom=${dateFrom}&dateTill=${dateTill}&nights=${totalNights}`;
            }, 1000);
        }
    });

});