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

    let sumCheckout = document.getElementById('sum__checkout');

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

    const cacheGet = localStorage.getItem('nk-pmt-data');
    if (!cacheGet) return console.log('No cached data found.');

    const decodedCache = decodeBase64(cacheGet);



    if (!decodedCache || !Array.isArray(decodedCache) || decodedCache.length === 0) {
        return console.warn('Decoded cache is empty or invalid.');
    }

    const { roomDataByType, tableDataByType } = decodedCache.reduce(
        (acc, item) => {
            const { key, type, dateFrom, dateTill, nights, date } = item;

            if (type === 'bed' && key && dateFrom && dateTill && nights != null) {
                acc.roomDataByType[type] = acc.roomDataByType[type] || { keys: [], nights: [] };
                acc.roomDataByType[type].keys.push(key);
                acc.roomDataByType[type].nights.push(nights);
            }

            if (type === 'table' && key && date) {
                acc.tableDataByType[type] = acc.tableDataByType[type] || { keys: [], dates: [] };
                acc.tableDataByType[type].keys.push(key);
                acc.tableDataByType[type].dates.push(date);
            }

            return acc;
        },
        { roomDataByType: {}, tableDataByType: {} }
    );

    function generateRoomHtml(roomData) {
        return `
            <div class="mb-4"><h4>Selected Rooms</h4></div>
            <div class="card">
                <div class="card-body">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Hotel</th>
                                <th>Image</th>
                                <th>Nights</th>
                                <th>Price</th>
                                <th>Delete</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${roomData.map(item => `
                                <tr>
                                    <th scope="row">${item.hotel || 'N/A'}</th>
                                    <td><img src="${item.image || ''}" height="60" width="60" alt="image" class="rounded-3"></td>
                                    <td>${item.nights}</td>
                                    <td>${item.total_price}$</td>
                                    <td>
                                        <button class="btn btn-danger p-0 d-flex align-items-center justify-content-center del" style="width: 35px; height: 35px;" data-id="${item.room_id}">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash3" viewBox="0 0 16 16">
                                                <path d="M6.5 1h3a.5.5 0 0 1 .5.5v1H6v-1a.5.5 0 0 1 .5-.5M11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3A1.5 1.5 0 0 0 5 1.5v1H1.5a.5.5 0 0 0 0 1h.538l.853 10.66A2 2 0 0 0 4.885 16h6.23a2 2 0 0 0 1.994-1.84l.853-10.66h.538a.5.5 0 0 0 0-1zm1.958 1-.846 10.58a1 1 0 0 1-.997.92h-6.23a1 1 0 0 1-.997-.92L3.042 3.5zm-7.487 1a.5.5 0 0 1 .528.47l.5 8.5a.5.5 0 0 1-.998.06L5 5.03a.5.5 0 0 1 .47-.53Zm5.058 0a.5.5 0 0 1 .47.53l-.5 8.5a.5.5 0 1 1-.998-.06l.5-8.5a.5.5 0 0 1 .528-.47M8 4.5a.5.5 0 0 1 .5.5v8.5a.5.5 0 0 1-1 0V5a.5.5 0 0 1 .5-.5"></path>
                                            </svg>
                                        </button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>`;
    }

    function generateTableHtml(tableData) {
        return `
            <div class="mb-4 mt-5"><h4>Selected Tables</h4></div>
            <div class="card">
                <div class="card-body">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Restaurant</th>
                                <th>Image</th>
                                <th>Date</th>
                                <th>Price</th>
                                <th>Delete</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${tableData.map(item => `
                                <tr>
                                    <th scope="row">${item.restaurant.name || 'N/A'}</th>
                                    <td><img src="${item.images || ''}" height="60" width="60" alt="image" class="rounded-3"></td>
                                    <td>${item.date || 'N/A'}</td>
                                    <td>${item.price}$</td>
                                    <td>
                                        <button class="btn btn-danger p-0 d-flex align-items-center justify-content-center del" style="width: 35px; height: 35px;" data-id="${item.table_id}">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash3" viewBox="0 0 16 16">
                                                <path d="M6.5 1h3a.5.5 0 0 1 .5.5v1H6v-1a.5.5 0 0 1 .5-.5M11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3A1.5 1.5 0 0 0 5 1.5v1H1.5a.5.5 0 0 0 0 1h.538l.853 10.66A2 2 0 0 0 4.885 16h6.23a2 2 0 0 0 1.994-1.84l.853-10.66h.538a.5.5 0 0 0 0-1zm1.958 1-.846 10.58a1 1 0 0 1-.997.92h-6.23a1 1 0 0 1-.997-.92L3.042 3.5zm-7.487 1a.5.5 0 0 1 .528.47l.5 8.5a.5.5 0 0 1-.998.06L5 5.03a.5.5 0 0 1 .47-.53Zm5.058 0a.5.5 0 0 1 .47.53l-.5 8.5a.5.5 0 1 1-.998-.06l.5-8.5a.5.5 0 0 1 .528-.47M8 4.5a.5.5 0 0 1 .5.5v8.5a.5.5 0 0 1-1 0V5a.5.5 0 0 1 .5-.5"></path>
                                            </svg>
                                        </button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>`;
    }

    function cartItemSpreader(data, type) {
        const roomsSec = document.getElementById('sel__rooms_sec');
        const tablesSec = document.getElementById('sel__table_sec');
    
        if (type === 'room') {
            roomsSec.innerHTML = data.length > 0 
                ? generateRoomHtml(data) 
                : ''; // Clear the section if no data
        } else if (type === 'table') {
            tablesSec.innerHTML = data.length > 0 
                ? generateTableHtml(data) 
                : ''; // Clear the section if no data
        }
    }
    

    async function fetchCartData(type, url, requestBody) {
        if (!requestBody || !requestBody.keys || requestBody.keys.length === 0) {
            console.warn(`No ${type} data found in cache.`);
            return [];
        }

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody),
            });

            if (!response.ok) {
                console.error(`Failed to fetch ${type} details:`, await response.text());
                throw new Error(`Error: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error(`Error in ${type} cart render:`, error);
            return [];
        }
    }
    function calculateSummary(roomData = [], tableData = []) {
        // Initialize subtotal
        let subtotal = 0;

        // Add up room prices
        subtotal += roomData.reduce((total, room) => total + (room.total_price || 0), 0);

        // Add up table prices
        subtotal += tableData.reduce((total, table) => total + (table.price || 0), 0);

        // Display the calculated subtotal

        document.getElementById('sub___total').innerText = `${subtotal || 0}$`;
        document.getElementById('G___total').innerText = `${subtotal || 0}$`;
    }


    async function renderCarts() {
        const roomRequestBody = roomDataByType['bed'] ? { keys: roomDataByType['bed'].keys, nights: roomDataByType['bed'].nights } : null;
        const tableRequestBody = tableDataByType['table'] ? { keys: tableDataByType['table'].keys, dates: tableDataByType['table'].dates } : null;

        const [roomData, tableData] = await Promise.all([
            fetchCartData('room', '/posts/cart/room', roomRequestBody),
            fetchCartData('table', '/posts/cart/table', tableRequestBody),
        ]);


        cartItemSpreader(roomData, 'room');
        cartItemSpreader(tableData, 'table');

        // Calculate Summary
        calculateSummary(roomData, tableData);
    }

    renderCarts();



    document.body.addEventListener('click', function (event) {
        if (event.target.closest('.del')) { // Checks if the clicked element or its parent has the 'del' class
            const button = event.target.closest('.del'); // Gets the button element

            // Get the item key from the data-id attribute of the clicked button
            const itemKey = button.getAttribute('data-id');

            // Decode and parse data from localStorage
            const encodedData = localStorage.getItem('nk-pmt-data');
            if (encodedData) {
                // Decode the base64-encoded data and parse it into JSON
                let decodedData = JSON.parse(atob(encodedData));
                // Filter out the item based on its 'key' property
                decodedData = decodedData.filter(item => item.key !== itemKey);
                // Encode and save the updated data back to localStorage
                const updatedEncodedData = btoa(JSON.stringify(decodedData));
                localStorage.setItem('nk-pmt-data', updatedEncodedData);

                // Re-render the cart or update the UI
                renderCarts();
                window.location.reload();
            }
        }
    });


    sumCheckout.addEventListener('click', () => {
        let source = localStorage.getItem('nk-pmt-data');
        if (source) {
            setTimeout(() => {
                window.location.href = `/nakiese/${LanguageManager.getLanguage()}/payment?source=${source}`
            }, 1000)
        } else {
            butterup.toast({
                title: 'Empty Cart',
                message: 'Your cart is empty!',
                type: 'info',
            });
        }
    })
});


