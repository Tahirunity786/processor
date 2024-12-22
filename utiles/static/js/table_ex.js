document.addEventListener('DOMContentLoaded', () => {
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
    // Function to format date as YYYY-MM-DD
    function formatDate(date) {
        let d = new Date(date),
            month = '' + (d.getMonth() + 1),
            day = '' + d.getDate(),
            year = d.getFullYear();

        if (month.length < 2) month = '0' + month;
        if (day.length < 2) day = '0' + day;

        return [year, month, day].join('-');
    }

    // Set the current date in the #date__now label and input field
    window.onload = function () {
        const today = new Date();
        const formattedToday = formatDate(today);

        // Display current date in the label
        document.getElementById('date__now').innerText = formattedToday;

        // Set min attribute to current date (so only future dates can be selected)
        document.getElementById('date__of').setAttribute('min', formattedToday);

        // Set the default value of the date input to the current date
        document.getElementById('date__of').value = formattedToday;
    };

    // Handle clicking on the #date__now label to toggle date input visibility
    document.getElementById('date__now').addEventListener('click', function (event) {
        const dateInput = document.getElementById('date__of');

        // Toggle the date input visibility when clicking on the label
        if (dateInput.style.display === 'block') {
            dateInput.style.display = 'none';  // Hide if already visible
        } else {
            dateInput.style.display = 'block';  // Show the input
            dateInput.focus();  // Focus to open the date picker
        }

        // Prevent click event from bubbling up to document
        event.stopPropagation();
    });

    // Update the #date__now label when a new date is selected
    document.getElementById('date__of').addEventListener('change', function () {
        const selectedDate = this.value;
        document.getElementById('date__now').innerText = selectedDate;
        this.style.display = 'none';  // Hide the date input after selecting
    });

    // Hide date input if clicking outside the date input or label
    document.addEventListener('click', function (event) {
        const dateInput = document.getElementById('date__of');
        const dateLabel = document.getElementById('date__now');

        if (event.target !== dateInput && event.target !== dateLabel) {
            dateInput.style.display = 'none';  // Hide if clicking outside
        }
    });

    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
    let addToCart = document.getElementById('add-to__chk');
    let dateOf = document.getElementById('date__of');
    let isFetchingPrice = false;

    // add to cart function
    addToCart.addEventListener('click', async (event) => {
        if (isFetchingPrice) return;
        isFetchingPrice = true;

        try {
            const tableID = event ? event.currentTarget.getAttribute('data-id') : null;
            if (tableID) {
                const response = await fetch(`/posts/table-price?ex_table_id=${tableID}`, {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json',
                    },
                });

                if (!response.ok) throw new Error('Failed to fetch table details');

                // Save data
                const savedData = {
                    key: tableID,
                    date: dateOf.value,
                    type: 'table',
                };

                // Encode the savedData to Base64
                const encodedData = encodeBase64(JSON.stringify(savedData));

                // Fetch existing cart data
                let existingCart = localStorage.getItem('nk-pmt-data');
                existingCart = existingCart ? decodeBase64(existingCart) : [];

                // Check if the table already exists in the cart
                const tableIndex = existingCart.findIndex(item => item.table_id === tableID);

                if (tableIndex !== -1) {
                    // Table exists, update its data
                    existingCart[tableIndex].date = savedData.date;
                    existingCart[tableIndex].price = savedData.price;

                    // Show toast message that the cart has been updated
                    butterup.toast({
                        title: 'Cart Updated Successfully',
                        message: 'The selected table in your cart has been updated.',
                        type: 'info',
                    });
                } else {
                    // Table doesn't exist, add it to the cart
                    existingCart.push(savedData);

                    // Show toast message that the item has been added to the cart
                    butterup.toast({
                        title: 'Added to Cart',
                        message: 'The selected table has been added to your cart.',
                        type: 'success',
                    });
                }

                // Save the updated cart data back to localStorage
                localStorage.setItem('nk-pmt-data', encodeBase64(JSON.stringify(existingCart)));
                // Secure redirect after 2 seconds
                setTimeout(() => {
                    window.location.href = `/nakiese/${LanguageManager.getLanguage()}/cart`;
                }, 2000); // 2000 milliseconds = 2 seconds
            }
        } catch (error) {
            console.error('Price calculation error:', error);
        } finally {
            isFetchingPrice = false;
        }
    });

    // Function to encode to Base64
    function encodeBase64(data) {
        return btoa(data); // Built-in function for Base64 encoding
    }

    // Function to decode from Base64
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
    let addTReserve = document.getElementById('add-to__reserve');
    addTReserve.addEventListener('click', (event) => {
        const tableId = event?.currentTarget.getAttribute('data-id');
        const dateInput = document.getElementById('date__of');
        if (tableId) {
            setTimeout(() => {
                window.location.href = `/nakiese/${LanguageManager.getLanguage()}/payment?key=${tableId}&date=${dateInput.value}&type=table`;
            }, 2000);
        }
    });
});
