

// Function to generate grid for rooms (fav_bed)
function generateGridRooms(beds) {
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
    if (!Array.isArray(beds) || beds.length === 0) {
        console.warn("generateGridRooms: Invalid or empty 'beds' array.");
        return '';
    }

    return beds.map(room => {
        const {
            room_id,
            image = 'placeholder.jpg',
            hotel: {
                name: hotelName = 'Unknown Hotel',
                city: { name: cityName = 'Unknown City' } = {},
                country = 'Unknown Country',
            } = {},
            room_type = 'Unknown Type',
            price = 0,
            avg_rating = 0,
            is_booked,
        } = room;

        // Disable links and apply styles if the room is booked
        const linkAttributes = is_booked
            ? `style="pointer-events: none; opacity: 0.5; cursor: not-allowed;" aria-disabled="true"`
            : '';

        return `
            <div class="col d-flex flex-column">
                <a href="/nakiese/${LanguageManager.getLanguage()}/hotel/bed-detail/${room_id}" 
                   data-targetnak="${room_id}" 
                   class="w-100 h-100" 
                   ${linkAttributes}>
                    <img src="${image}" class="rounded-4 w-100" style="height:200px; object-fit:cover;" alt="Room image">
                </a>
                <div class="card-body p-0">
                    <a href="/nakiese/${LanguageManager.getLanguage()}/hotel/bed-detail/${room_id}" 
                       class="fs-4 nav-link" 
                       data-targetnak="${room_id}" 
                       ${linkAttributes}>
                        ${hotelName}
                    </a>
                    <p class="card-text"><i class="fi fi-rr-marker"></i> ${cityName}, ${country}</p>
                    <p class="card-text"><i class="fi fi-rr-bed-alt"></i> ${room_type}</p>
                    <p class="card-text">
                        <strong>$${price}</strong>/night ★${avg_rating.toFixed(1)}
                    </p>
                </div>
            </div>`;
    }).join('');
}


function generateGridTables(tables) {
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
    // Validate input array
    if (!Array.isArray(tables) || tables.length === 0) {
        console.warn("generateGridTables: Invalid or empty 'tables' array.");
        return '';
    }

    // Generate HTML for tables
    return tables.map(table => {
        const {
            images = 'placeholder.jpg',
            capacity = 0,
            table_id = "None",
            avg_rating = 0,
            price = 0,
            restaurant = {},
            is_booked = false
        } = table;

        const {
            name: restaurantName = 'Unknown Restaurant',
            city = {},
            address = 'Unknown Address',
            country = 'Unknown Country'
        } = restaurant;

        const {
            name: cityName = 'Unknown City'
        } = city;

        // Define link attributes based on booking status
        const linkAttributes = is_booked
            ? 'style="pointer-events: none; opacity: 0.5; cursor: not-allowed; color: black; text-decoration: none;" aria-disabled="true"'
            : '';

        // Generate HTML structure for each table
        return `
            <div class="col d-flex flex-column">
                <a href="/nakiese/${LanguageManager.getLanguage()}/resturant/table/${table_id}" data-targetnak="${table_id}" class="w-100 h-100" ${linkAttributes}>
                    <img 
                        src="${images}" 
                        class="rounded-4 w-100" 
                        style="height: 200px; object-fit: cover;" 
                        alt="Table image"
                    >
                </a>
                <div class="card-body p-2">
                    <a href="/nakiese/${LanguageManager.getLanguage()}/resturant/table/${table_id}" class="card-text fs-4 nav-link"  ${linkAttributes}>
                        <strong>${restaurantName}</strong>
                    </a>
                    <p class="card-text">${cityName}, ${address}, ${country}</p>
                    <p class="card-text">Persons: ${capacity}</p>
                    <p class="card-text">
                        <b>$${price}</b> /night ★${avg_rating.toFixed(1)}
                    </p>
                </div>
            </div>
        `;
    }).join('');
}


// Function to fetch and render favourite list
async function favouriteList() {
    try {
        const response = await fetch('/posts/show-by-user', { credentials: "include" });

        if (!response.ok) {
            throw new Error(`Failed to fetch favourite list: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        if (Array.isArray(data) && data.length > 0) {
            const { fav_bed, fav_table } = data[0];
            const parentBlock = document.getElementById("parentBlock");

            // Clear previous content
            parentBlock.innerHTML = '';

            // Helper function to render a section
            const renderSection = (title, itemsHTML) => {
                const sectionHeader = document.createElement('h2');
                sectionHeader.classList.add('mb-4');
                sectionHeader.innerText = title;

                const gridContainer = document.createElement('div');
                gridContainer.classList.add('row', 'row-cols-lg-4', 'row-cols-md-2', 'row-cols-sm-1', 'g-2', 'mb-5');
                gridContainer.innerHTML = itemsHTML;

                parentBlock.append(sectionHeader, gridContainer);
            };

            // Render Bed Rooms Section
            if (fav_bed && fav_bed.length > 0) {
                const roomsHTML = generateGridRooms(fav_bed);
                renderSection("Favourite Beds", roomsHTML);
            }

            // Render Tables Section
            if (fav_table && fav_table.length > 0) {
                const tablesHTML = generateGridTables(fav_table);
                renderSection("Favourite Tables", tablesHTML);
            }

            // If both are empty, show a message
            if ((!fav_bed || fav_bed.length === 0) && (!fav_table || fav_table.length === 0)) {
                const noDataMessage = document.createElement('p');
                noDataMessage.innerText = "No favourites found.";
                noDataMessage.classList.add('text-muted');
                parentBlock.append(noDataMessage);
            }
        } else {
            console.warn("favouriteList: No data available.");
            document.getElementById("parentBlock").innerHTML = '<p class="text-muted">No favourites found.</p>';
        }
    } catch (error) {
        console.error(`Error in favouriteList: ${error.message}`);
    }
}

// Event listener to fetch favourite list when DOM content is loaded
document.addEventListener('DOMContentLoaded', favouriteList);
