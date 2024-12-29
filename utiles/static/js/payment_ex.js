document.addEventListener("DOMContentLoaded", () => {


    const tableSpread = document.getElementById('table__spreader');
    const localData = localStorage.getItem('nk-pmt-data');

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
    // Function to generate table HTML for rooms and tables
    function generateTableContent(data) {
        // Clear previous content
        tableSpread.innerHTML = "";

        // Check if room data is present and generate the room table
        if (data.rooms && data.rooms.details.length > 0) {
            const roomTable = document.createElement('table');
            roomTable.classList.add('table', 'table-bordered');
            roomTable.innerHTML = `
            <tbody>
                <tr>
                    <td colspan="2">No of Rooms</td>
                    <td>${data.rooms.details.length}</td>
                </tr>
                <tr>
                    <td colspan="2">Price</td>
                    <td>${data.rooms.total_price || 0}$</td>
                </tr>
            </tbody>
        `;
            tableSpread.appendChild(roomTable);
        }

        // Check if table data is present and generate the table table
        if (data.tables && data.tables.details.length > 0) {
            const tablesTable = document.createElement('table');
            tablesTable.classList.add('table', 'table-bordered');
            tablesTable.innerHTML = `
            <tbody>
                <tr>
                    <td colspan="2">No of Tables</td>
                    <td>${data.tables.details.length}</td>
                </tr>
                <tr>
                    <td colspan="2">Price</td>
                    <td>${data.tables.total_price || 0}$</td>
                </tr>
            </tbody>
        `;
            tableSpread.appendChild(tablesTable);
        }

        // Always show the total price table
        const totalPriceTable = document.createElement('table');
        totalPriceTable.classList.add('table', 'table-bordered');
        totalPriceTable.innerHTML = `
        <tbody>
            <tr>
                <td colspan="2">Tax & Fee</td>
                <td>-</td>
            </tr>
            <tr>
                <td colspan="2">Booking Fee</td>
                <td>-</td>
            </tr>
            <tr>
                <td colspan="2" style="background-color: #4B75A5; color: white;">Amount</td>
                <td style="background-color: #4B75A5; color: white;">${data.grand_total_price || 0}$</td>
            </tr>
        </tbody>
    `;
        tableSpread.appendChild(totalPriceTable);
    }
    function createCarousel(data) {
        const carouselContainer = document.getElementById('for__booking');
        carouselContainer.innerHTML = ''; // Clear any previous carousel items

        // Check if there's room or table data to display
        if (data.rooms && data.rooms.length > 0) {
            data.rooms.forEach((room, index) => {
                const isActive = index === 0 ? 'active' : ''; // Set first item as active
                const avgRating = room.avg_rating || 0;
                const fullStars = Math.floor(avgRating);  // Number of full stars
                const hasHalfStar = avgRating % 1 >= 0.5; // Check if there’s a half star

                // Generate stars based on avg_rating
                let starsHtml = '';
                for (let i = 0; i < fullStars; i++) {
                    starsHtml += `<img src="/static/images/Star 1.svg" style="height: 20px;" alt="">`;
                }
                if (hasHalfStar) {
                    starsHtml += `<img src="/static/images/Star_half.svg" style="height: 20px;" alt="">`;
                }

                const roomItem = `
                    <div class="carousel-item ${isActive} pe-2">
                        <div class="d-flex justify-content-between mb-3">
                            <div class="p-x13">
                                <img class="rounded-4" src="${room.image || './assets/images/default-room.jpg'}" style="height: 100%; width:100%" alt="Room Image">
                            </div>
                            <div class="p-x14">
                                <div class="d-flex w-100">
                                    <div class="d-flex justify-content-between align-items-center p-x15" style="font-size: 1rem !important;">
                                        ${starsHtml} <span class="ms-3">(${avgRating})</span> 
                                    </div>
                                </div>
                                <h3 class="p-x17">${room.hotel.name || 'Room Name'}</h3>
                                <h3 class="p-x17">${room.price || 'Price'}$</h3>
                                <h3 class="p-x17">Room</h3>
                            </div>
                        </div>
                        <div class="mb-4">
                            <div class="row">
                                <div class="col-lg-6">
                                    <div class="bg-p p-3">
                                        <h6 class="mb-3">Check In</h6>
                                        <h6> ${room.dateFrom || 'Not Available'}</h6>
                                       
                                    </div>
                                </div>
                                <div class="col-lg-6">
                                    <div class="bg-p p-3">
                                        <h6 class="mb-3">Check Out</h6>
                                        <h6>${room.dateTill || 'Not Available'}</h6>
                                       
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="d-flex justify-content-start align-items-end" style="font-size: 1rem !important;">
                            <div class="me-4">
                                <h5><b>You Selected</b></h5>
                                <p><b>Room Type:</b> ${room.room_type}</p>
                            </div>
                            <div>
                                <p><b>Nights:</b> ${room.nights}</p>
                            </div>
                        </div>

                    </div>
                `;
                carouselContainer.innerHTML += roomItem;
            });

        }

        if (data.tables && data.tables.length > 0) {
            data.tables.forEach((table, index) => {
                const isActive = data.rooms.length === 0 && index === 0 ? 'active' : ''; // Set first table active if no rooms
                const avgRating = table.avg_rating || 0;
                const fullStars = Math.floor(avgRating);  // Number of full stars
                const hasHalfStar = avgRating % 1 >= 0.5; // Check if there’s a half star

                // Generate stars based on avg_rating
                let starsHtml = '';
                for (let i = 0; i < fullStars; i++) {
                    starsHtml += `<img src="/static/images/Star 1.svg" style="height: 20px;" alt="">`;
                }
                if (hasHalfStar) {
                    starsHtml += `<img src="/static/images/Star_half.svg" style="height: 20px;" alt="">`;
                }
                const tableItem = `
                    <div class="carousel-item ${isActive} pe-2">
                        <div class="d-flex justify-content-between mb-3">
                            <div class="p-x13">
                                <img src="${table.images}" style="height: 100%; width:100%;"c class="rounded-4" alt="Table Image">
                            </div>
                            <div class="p-x14">
                                <div class="d-flex w-100">
                                    <div class="d-flex justify-content-between align-items-center p-x15" style="font-size: 1rem !important;">
                                        ${starsHtml} <span class="ms-3">(${avgRating})</span> 
                                    </div>
                                  
                                </div>
                                <h3 class="p-x17">${table.restaurant.name || 'Restaurant'}</h3>
                                <h3 class="p-x17">${table.price}$</h3>
                                <h3 class="p-x17">Table</h3>
                            </div>
                        </div>
                        <div class="row" style="font-size: 1rem !important;">
                            <div class="col-lg-6">
                                <div class="bg-p p-3" style="font-size: 1rem;">
                                    <h6 class="mb-3">Booking Date</h6>
                                    <h6>${table.date}</h6>
                                </div>
                            </div>
                            
                        </div>
                        
                    </div>
                `;
                carouselContainer.innerHTML += tableItem;
            });
        }

    }

    async function bookingSpreader() {
        try {
            const response = await fetch(`/posts/cart/serialize?source=${localData}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (response.ok) {
                const data = await response.json();
                generateTableContent(data);
            } else {
                console.error("Failed to fetch data:", response.statusText);
            }
        } catch (error) {
            console.error("Error:", error);
        }
    }


    async function DetailsCartSpreader() {
        try {
            const response = await fetch(`/posts/detail-cart/serialize?source=${localData}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (response.ok) {
                const data = await response.json();
                createCarousel(data);
            } else {
                console.error("Failed to fetch data:", response.statusText);
            }
        } catch (error) {
            console.error("Error:", error);
        }
    }
    // Function to generate table HTML for rooms and tables
    function generateTableSingleContent(data) {
        tableSpread.innerHTML = ""; // Clear previous content
        // Generate table for room data if type is "bed"
        if (data.type === "bed") {
            const roomTable = document.createElement("table");
            roomTable.classList.add("table", "table-bordered");
            roomTable.innerHTML = `
        <tbody>
            <tr>
                <td colspan="2">No of Rooms</td>
                <td>${data.rooms?.details?.length || 1}</td>
            </tr>
            <tr>
                <td colspan="2">Price</td>
                <td>${data.total_price || 0}$</td>
            </tr>
        </tbody>
    `;
            tableSpread.appendChild(roomTable);
        }

        // Generate table for table data if type is "table"
        if (data.type === "table") {
            const tablesTable = document.createElement("table");
            tablesTable.classList.add("table", "table-bordered");
            tablesTable.innerHTML = `
        <tbody>
            <tr>
                <td colspan="2">No of Tables</td>
                <td>1</td>
            </tr>
            <tr>
                <td colspan="2">Price</td>
                <td>${data.price || 0}$</td>
            </tr>
        </tbody>
    `;
            tableSpread.appendChild(tablesTable);
        }

        // Always show the total price table
        const totalPriceTable = document.createElement("table");
        totalPriceTable.classList.add("table", "table-bordered");
        totalPriceTable.innerHTML = `
        
    <tbody>
        <tr>
            <td colspan="2">Tax & Fee</td>
            <td>-</td>
        </tr>
        <tr>
            <td colspan="2">Booking Fee</td>
            <td>-</td>
        </tr>
        <tr>
            <td colspan="2" style="background-color: #4B75A5; color: white;">Amount</td>
            <td style="background-color: #4B75A5; color: white;">${data.total_price || data.price || 0}$</td>
        </tr>
    </tbody>
`;
        tableSpread.appendChild(totalPriceTable);
    }

    // Fetch and display booking details based on type
    async function fetchBookingDetails(key, type, dateParams) {
       
        try {
            const url = new URL(`/posts/cart/serialize`, window.location.origin);
            url.searchParams.append("key", key);
            url.searchParams.append("type", type);
            url.searchParams.append("nights", dateParams.nights);
            

            // Add date parameters dynamically
            Object.entries(dateParams).forEach(([key, value]) => {
                if (value) url.searchParams.append(key, value);
            });

            const response = await fetch(url, {
                method: "GET",
                headers: { "Content-Type": "application/json" }
            });

            if (response.ok) {
                const data = await response.json();
                generateTableSingleContent(data); // Assuming this function handles rendering data
            } else {
                console.error("Failed to fetch data:", response.statusText);
            }
        } catch (error) {
            console.error("Error:", error);
        }
    }

    // Create and display components based on type
    function createComponent(data) {
        const itemContainer = document.getElementById('ex__item');
        itemContainer.innerHTML = ''; // Clear previous content

        const avgRating = data.avg_rating || 0;
        const fullStars = Math.floor(avgRating);
        const hasHalfStar = avgRating % 1 >= 0.5;

        // Generate stars dynamically
        const starsHtml = Array(fullStars).fill(`<img src="/static/images/Star 1.svg" style="height: 20px;" alt="Full Star">`).join('') +
            (hasHalfStar ? `<img src="/static/images/Star_half.svg" style="height: 20px;" alt="Half Star">` : '');

        let contentHtml = '';

        if (data.type === "bed") {
            contentHtml = `
            <div class="mb-2">
                <div class="d-flex justify-content-between mb-3">
                    <div class="p-x13">
                        <img class="rounded-4" src="${data.image}" style="height: 100%; width:100%" alt="Room Image">
                    </div>
                    <div class="p-x14">
                        <div class="d-flex w-100">
                            <div class="d-flex justify-content-between align-items-center p-x15" style="font-size: 1rem !important;">
                                ${starsHtml} <span class="ms-3">(${avgRating})</span> 
                            </div>
                        </div>
                        <h4 class="p-x17">${data.hotel.name}</h4>
                        <h4 class="p-x17">${data.price}$</h4>
                        <h5 class="p-x17">Room</h5>
                    </div>
                </div>
                <div class="mb-4 booking-dates">
                    <div class="row">
                        <div class="col-lg-6">
                            <div class="bg-p p-3">
                                <h5 class="mb-3">Check In</h5>
                                <h6>${data.dateFrom}</h6>
                            </div>
                        </div>
                        <div class="col-lg-6">
                            <div class="bg-p p-3">
                                <h5 class="mb-3">Check Out</h5>
                                <h6>${data.dateTill}</h6>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="d-flex justify-content-start align-items-end">
                <div class="selection-details me-4">
                    <h5><b>You Selected</b></h5>
                    <p><b>Room Type:</b> ${data.room_type || 'Room Type'}</p>
                </div>
                <div class="selection-details">
                    
                    <p><b>Nights:</b> ${data.nights || 'nights'}</p>
                </div>
                </div>
            </div>`;
        } else if (data.type === "table") {
            contentHtml = `
            <div class="content-item pe-2">
                <div class="d-flex justify-content-between mb-3">
                    <div class="p-x13">
                        <img class="rounded-4" src="${data.images}" style="height: 100%; width:100%" alt="Table Image">
                    </div>
                    <div class="p-x14">
                        <div class="d-flex w-100">
                            <div class="d-flex justify-content-between align-items-center p-x15" style="font-size: 1rem !important;">
                                ${starsHtml} <span class="ms-3">(${avgRating})</span> 
                            </div>
                        </div>
                        <h3 class="p-x17">${data.restaurant.name}</h3>
                        <h3 class="p-x17">${data.price}$</h3>
                        <h3 class="p-x17">Table</h3>
                    </div>
                </div>
                <div class="row booking-date">
                    <div class="col-lg-6">
                        <div class="bg-p p-3">
                       
                            <h6>Booking Date</h6>
                            <h6>${data.bookingDate}</h6>
                        </div>
                    </div>
                </div>
            </div>`;
        }

        itemContainer.innerHTML += contentHtml;
    }

    // Fetch and render detailed cart data
    async function fetchCartDetails(key, type, dateParams) {
        try {
            const url = new URL(`/posts/detail-cart/serialize`, window.location.origin);
            url.searchParams.append("key", key);
            url.searchParams.append("type", type);

            // Add date parameters dynamically
            Object.entries(dateParams).forEach(([key, value]) => {
                if (value) url.searchParams.append(key, value);
            });

            const response = await fetch(url, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });

            if (response.ok) {
                const data = await response.json();
                createComponent(data);
            } else {
                console.error("Failed to fetch cart details:", response.statusText);
            }
        } catch (error) {
            console.error("Error:", error);
        }
    }

    // Check URL parameters and call appropriate functions
    const params = new URLSearchParams(window.location.search);

    if (params.has('source')) {
        bookingSpreader();
        DetailsCartSpreader();
    } else if (params.has('key') && params.has('type')) {
        const key = params.get('key');
        const type = params.get('type');

        const dateParams = type === "bed"
            ? { dateFrom: params.get('dateFrom'), dateTill: params.get('dateTill'), nights: params.get('nights') }
            : { date: params.get('date') };

        fetchBookingDetails(key, type, dateParams);
        fetchCartDetails(key, type, dateParams);
    } else {
        console.log("Data not received");
    }


    const cashBtn = document.getElementById('cashBtn');
    const cardBtn = document.getElementById('cardBtn');
    const contentCash = document.getElementById('contentCash');
    const cardContent = document.getElementById('card');

    // Show card payment by default
    contentCash.style.display = 'none';
    cardContent.style.display = 'block';

    // Event listener for Cash button
    cashBtn.addEventListener('click', () => {
        contentCash.style.display = 'block';
        cardContent.style.display = 'none';
    });

    // Event listener for Credit/Debit Card button
    cardBtn.addEventListener('click', () => {
        contentCash.style.display = 'none';
        cardContent.style.display = 'block';
    });

    const paymentForm = document.getElementById("paymentForm");

    paymentForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const dob = document.getElementById("dob").value; // Already in YYYY-MM-DD format
        let address_no_2 = document.getElementById("address2").value;
        const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

        // Parse address_no_2 into JSON if applicable


        const formData = {
            name: `${document.getElementById("firstName").value} ${document.getElementById("lastName").value}`,
            email: document.getElementById("email").value,
            phone_no: document.getElementById("phone").value,
            gender: document.getElementById("gender").value,
            date: dob,
            country: document.getElementById("country").value,
            state: document.getElementById("state").value,
            city: document.getElementById("city").value,
            address: document.getElementById("address1").value,
            address_no_2: address_no_2,
            time_zone: userTimeZone,
        };

        // Send data to the server
        try {
            const response = await fetch("/payment/payment-detail-user", {
                method: "POST",
                credentials: 'include',
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                const result = await response.json();
                alert(result.success || "Form submitted successfully!");
                paymentForm.reset();
            } else {
                const error = await response.json();
                alert(`Error: ${error.message || "Failed to submit the form."}`);
            }
        } catch (error) {
            console.error("Submission Error:", error);
            alert("Something went wrong. Please try again.");
        }
    });

});
async function setupStripeElements() {
    /**
     * Encodes the provided data into Base64 format.
     * @param {Object} data - The data to be encoded.
     * @returns {string} - Base64 encoded string.
     */
    function encodeBase64(data) {
        return btoa(JSON.stringify(data));
    }

    const stripe = Stripe('pk_test_51QGyWdFJdJFkrSKsL8o17pE7c567ZJ47VrtW9bCYAyX7cll5k28K5Eny1qiUaKqJaFpH9RAa0BwlYNhyPNyglopA00vlZLdic8');
    let paymentDataToken = "";

    const params = new URLSearchParams(window.location.search);

    try {
        if (
            params.has('key') &&
            params.has('type')

        ) {
            const key = params.get('key');
            const type = params.get('type');
            const dateFrom = params.get('dateFrom');
            const dateTill = params.get('dateTill');
            const nights = params.get('nights');


            const responseData = type === "bed" ?
                { key, type, dateFrom, dateTill, nights } :
                { key, type, date: params.get('date') };

            paymentDataToken = encodeBase64(responseData);
        } else if (params.has('source')) {
            paymentDataToken = localStorage.getItem('nk-pmt-data') || ""; // Default to empty string
        } else {
            console.error("No valid query parameters found.");
            return;
        }

        const response = await fetch('/payment/create-intent', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data_token: paymentDataToken }),
        });

        if (!response.ok) {
            throw new Error(`Failed to create payment intent: ${response.statusText}`);
        }

        const data = await response.json();
        if (!data.client_secret) {
            console.error("Error: Missing client_secret in response.");
            return;
        }

        const elements = stripe.elements({ clientSecret: data.client_secret });
        const paymentElement = elements.create('payment');
        paymentElement.mount('#payment-element');

        setupFormHandler(stripe, elements, paymentDataToken);
    } catch (error) {
        console.error("Error setting up Stripe Elements:", error.message);
    }
}

/**
 * Sets up the form submission handler for processing payments.
 * @param {Object} stripe - The Stripe instance.
 * @param {Object} elements - The Stripe Elements instance.
 * @param {string} paymentDataToken - The payment data token.
 */
function setupFormHandler(stripe, elements, paymentDataToken) {
    const form = document.getElementById('payment-form');
    let isSubmitting = false;

    form.addEventListener('submit', async (event) => {
        event.preventDefault();

        if (isSubmitting) return;

        isSubmitting = true;
        form.querySelector('button').disabled = true;

        try {
            const { error, paymentIntent } = await stripe.confirmPayment({
                elements,
                confirmParams: {},
                redirect: "if_required",
            });

            if (error) {
                throw new Error(error.message);
            }

            if (paymentIntent && paymentIntent.status === 'succeeded') {
                await handlePaymentSuccess(paymentDataToken);
            } else {
                console.error("Payment failed. Status:", paymentIntent?.status);
            }
        } catch (error) {
            console.error("Error during payment confirmation:", error.message);
        } finally {
            isSubmitting = false;
            form.querySelector('button').disabled = false;
        }
    });
}

/**
 * Handles post-payment success actions, such as notifying the backend.
 * @param {string} paymentDataToken - The payment data token.
 */
async function handlePaymentSuccess(paymentDataToken) {
    try {
        const response = await fetch('/payment/success', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data_token: paymentDataToken,  time_zone :Intl.DateTimeFormat().resolvedOptions().timeZone }),
        });

        if (!response.ok) {
            throw new Error(`Failed to notify backend: ${response.statusText}`);
        }

        const result = await response.json();
        window.location.href = `${window.location.origin}/nakiese/${LanguageManager.getLanguage()}/confirmation`;
    } catch (error) {
        console.error("Error during post-payment success handling:", error.message);
        alert("Payment successful, but failed to update the server. Please contact support.");
    }
}


document.addEventListener("DOMContentLoaded", setupStripeElements);