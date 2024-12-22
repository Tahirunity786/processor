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

// Function to extract URL parameters and fetch search results
async function fetchSearchResults() {
    const params = new URLSearchParams(window.location.search);
    const cityName = params.get('city_name');
    const availabilityFrom = params.get('availability_from');
    const availabilityTill = params.get('availability_till');
    const capacity = params.get('capacity');


    const cityInput = document.getElementById("cityInput");
    const capacityInput = document.getElementById("capacityInput");

    if (cityInput) cityInput.value = cityName || '';
    if (capacityInput) capacityInput.value = capacity || '';

    // Validate if required params are available
    if (!cityName || !availabilityFrom || !availabilityTill) {
        alert('Invalid search parameters. Please try again.');
        return;
    }

    // API URL
    const apiUrl = `/posts/search/hotel?${params.toString()}`;

    try {
        // Fetch search results
        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });

        // Check if response is okay
        if (!response.ok) throw new Error(`Error: ${response.statusText}`);

        const result = await response.json();
        console.log(result);
        // Calculate and display reviews, then render the rooms
        renderHotelRooms(result, result.query_params);
        reviewCalAndDisplay(result);

    } catch (error) {
        console.error('Error fetching hotel rooms:', error);
        alert('An error occurred while fetching search results. Please try again later.');
    }
}



function displayReviews(av_reviews) {
    const intReviews = Math.round(av_reviews);
    let reviewFlex = '';
    for (let i = 1; i <= intReviews; i++) {
        reviewFlex += ` <div class="me-1">
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="gold" class="bi bi-star-fill"
      viewBox="0 0 16 16">
      <path
        d="M3.612 15.443c-.386.198-.824-.149-.746-.592l.83-4.73L.173 6.765c-.329-.314-.158-.888.283-.95l4.898-.696L7.538.792c.197-.39.73-.39.927 0l2.184 4.327 4.898.696c.441.062.612.636.282.95l-3.522 3.356.83 4.73c.078.443-.36.79-.746.592L8 13.187l-4.389 2.256z" />
    </svg>
    </div>`;
    }
    return reviewFlex;
}

// Render function to dynamically display hotel rooms
function renderHotelRooms(hotelRooms, cityName) {
    const container = document.getElementById('hotel_search__grid');
    const ex_c = document.getElementById("destination");
    const ex_c_2 = document.getElementById("countFound");

    if (!container || !ex_c || !ex_c_2) {
        console.error("Required elements not found.");
        return;
    }

    container.innerHTML = ''; // Clear previous results

    if (hotelRooms.results.length === 0) {
        ex_c_2.innerText = "0";
        container.innerHTML = `<img src='/static/images/image_processing20210917-4617-1u39vt2.gif' alt='Not Found'
      class='h-100 w-100' />`;
        return;
    }

    ex_c.innerText = cityName?.city_name || "City not found";
    ex_c_2.innerText = hotelRooms.results.length;

    container.innerHTML = generateGridItems(hotelRooms.results);
}

function generateGridItems(beds) {

    let gridHTML = '';

    beds.forEach((room) => {
        const description = room.description;
        const truncatedDescription = description.length > 138 ? description.substring(0, 138) + "..." : description;

        gridHTML += `
    <div class="mb-5">
      <div class="mb-3">
        <div class="card mb-3" style="max-width: 90%;">
          <div class="row g-0">
            <div class="col-md-4">
              <a id="nak-${room.room_id}" data-targetnak="${room.room_id}" class="w-100 h-100" style="cursor: pointer;">
                <img src="${room.image}" class="img-fluid rounded-start h-100" alt="Room image">
              </a>
            </div>
            <div class="col-md-8">
              <div class="card-body">
                <h5 class="card-title mb-0">
                  <div class="d-flex justify-content-between align-items-center mb-1">
                    <a id="nak-${room.room_id}-title" class="fs-4 nav-link" data-targetnak="${room.room_id}"
                      style="cursor: pointer;">
                      ${room.hotel.name}
                    </a>
                    <span class="badge text-bg-primary" id="avg_rate_${room.room_id}">4.3</span>
                  </div>
                </h5>
                <div class="d-flex justify-content-start align-items-center mb-3" id="re__flex-${room.room_id}">
                </div>
                <div class="d-flex justify-content-between align-items-center mb-3">
                  <p class="card-text mb-0">${room.hotel.city.name} ${room.hotel.country}</p>
                  <a id="nak-${room.room_id}-desc" data-targetnak="${room.room_id}" class="btn btn-primary">See
                    Details</a>
                </div>
                <div class="mb-2">
                  <p>${truncatedDescription}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    `;
    });

    return gridHTML;
}



// On page load, fetch search results
window.addEventListener('DOMContentLoaded', () => {
    fetchSearchResults();
});

// Event listener for room detail links (image or hotel name)
document.addEventListener('click', function (e) {
    // Traverse up to find the closest <a> tag with id starting with "nak-"
    const anchor = e.target.closest('a[id^="nak-"]');

    if (anchor) {
        const targetId = anchor.dataset.targetnak;
        if (targetId) {
            window.location.href = `/nakiese/${LanguageManager.getLanguage()}/hotel/bed-detail/${targetId}`;
        }
    }
});

function updatePrice(value) {
    document.getElementById('priceDisplay').innerText = value;
}
document.addEventListener('DOMContentLoaded', function () {
    const checkboxes = document.querySelectorAll('.form-check-input');

    // Load checkbox states from sessionStorage
    loadCheckboxStates(checkboxes);

    // Attach debounced event listener to all checkboxes
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', debounce(handleFilterChange, 300));
    });
});

// Function to load and set checkbox states from sessionStorage
function loadCheckboxStates(checkboxes) {
    checkboxes.forEach(checkbox => {
        const isChecked = sessionStorage.getItem(checkbox.id) === 'true';
        checkbox.checked = isChecked;
    });
}

// Handle filter changes for both amenities and ratings
function handleFilterChange(event) {
    // Store the checkbox state in sessionStorage
    sessionStorage.setItem(event.target.id, event.target.checked);

    applyFilters(); // Apply the filters on checkbox change
}

// Debounce function to limit excessive API calls
function debounce(fn, delay) {
    let timeoutId;
    return function (...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn.apply(this, args), delay);
    };
}

// Apply filters by fetching filtered results
function applyFilters() {
    const selectedFilters = collectSelectedFilters();
    const { cityName, availabilityFrom, availabilityTill, capacity } = getRequiredQueryParams();

    if (!cityName || !availabilityFrom || !availabilityTill || !capacity) {
        alert('Please fill in all required filters.');
        return;
    }



    // Build query string for GET request
    const queryString = buildQueryString({
        cityName,
        availabilityFrom,
        availabilityTill,
        capacity,
        ...selectedFilters // Spread the collected filters
    });

    // Fetch filtered results and update UI
    fetchFilteredResults(queryString);
}

// Collect selected filter values (amenities and ratings)
function collectSelectedFilters() {
    const selectedAmenities = Array.from(document.querySelectorAll('.form-check-input:checked'))
        .filter(checkbox => checkbox.id.startsWith('amenity')) // For amenities
        .map(checkbox => checkbox.value);

    const selectedRatings = Array.from(document.querySelectorAll('.form-check-input:checked'))
        .filter(checkbox => checkbox.id.startsWith('rating')) // For ratings
        .map(checkbox => checkbox.value);
    return { selectedAmenities, selectedRatings };
}
// Get required query parameters from the URL
function getRequiredQueryParams() {
    const params = new URLSearchParams(window.location.search);
    return {
        cityName: params.get('city_name'),
        availabilityFrom: params.get('availability_from'),
        availabilityTill: params.get('availability_till'),
        capacity: params.get('capacity'),
    };
}

function buildQueryString({ cityName, availabilityFrom, availabilityTill, capacity, selectedAmenities, selectedRatings }) {
    const queryString = new URLSearchParams({
        city_name: cityName,
        availability_from: availabilityFrom,
        availability_till: availabilityTill,
        capacity: capacity,
    });

    // Append each room_amenities value as a separate parameter
    selectedAmenities.forEach(amenity => {
        queryString.append('room_amenities', amenity); // Appending individual room_amenities values
    });
    // Append each room_rating value as a separate parameter
    selectedRatings.forEach(rating => {
        queryString.append('room_rating', rating); // Appending individual room_rating values
    });

    return queryString.toString(); // Return the final query string
}
// Fetch filtered results and update the UI
function fetchFilteredResults(queryString) {

    fetch(`/posts/search/hotel?${queryString}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
    })
        .then(response => {
            if (!response.ok) throw new Error('Network response was not ok');
            return response.json();
        })
        .then(data => updateUI(data, new URLSearchParams(queryString)))
        .catch(error => handleFetchError(error));
}

// Update the UI with filtered results
function updateUI(data, queryString) {
    const roomListContainer = document.getElementById('hotel_search__grid');
    roomListContainer.innerHTML = ''; // Clear the container

    if (Array.isArray(data.results) && data.results.length > 0) {
        roomListContainer.innerHTML = generateGridItems(data.results);
        updateSearchMeta(data, queryString);
        reviewCalAndDisplay(data);
    } else {
        showNotFoundImage(roomListContainer);
        updateSearchMeta(data, queryString);
    }
}

// Update search metadata (city name, count, etc.)
function updateSearchMeta(data, queryString) {
    const cityNameElem = document.getElementById("destination");
    const countElem = document.getElementById("countFound");

    const cityName = queryString.get('city_name') || 'City not found';
    const resultCount = data.results ? data.results.length : 0;

    cityNameElem.innerText = cityName;
    countElem.innerText = resultCount;
}

// Show a 'not found' image when no results are found
function showNotFoundImage(container) {
    const img = document.createElement('img');
    img.src = '/static/images/image_processing20210917-4617-1u39vt2.gif';
    img.alt = 'Not Found';
    img.classList.add('h-100', 'w-100');
    container.append(img);
}

// Handle fetch-related errors
function handleFetchError(error) {
    console.error('Error fetching filtered data:', error);
    alert('An error occurred while applying filters.');
}

// Function to calculate and display reviews
function reviewCalAndDisplay(obj) {
    if (!obj?.results?.length) {
        console.error("Missing or empty results data");
        return;
    }

    let overallAverage = 0; // Variable to store overall average rating
    let totalRooms = 0; // Variable to count total rooms with reviews

    obj.results.forEach(room => {
        const { room_id, reviews } = room;

        if (!reviews?.length) {
            console.log(`No reviews found for room ${room_id}`);
            return;
        }

        const ratingSums = {};
        const ratingCounts = {};
        let sumOfAverages = 0;
        let ratingTypesCount = 0;

        reviews.forEach(review => {
            review.rating.forEach(({ name, rate }) => {
                ratingSums[name] = (ratingSums[name] || 0) + parseFloat(rate);
                ratingCounts[name] = (ratingCounts[name] || 0) + 1;
            });
        });

        for (const type in ratingSums) {
            const averageRating = (ratingSums[type] / ratingCounts[type]).toFixed(1);
            sumOfAverages += parseFloat(averageRating);
            ratingTypesCount++;
        }

        const finalAverage = (sumOfAverages / ratingTypesCount).toFixed(1);
        overallAverage += parseFloat(finalAverage); // Add to overall average
        totalRooms++; // Increment total rooms with reviews

        // Use the unique ID for the review display
        const reviewElement = document.getElementById(`re__flex-${room_id}`);
        if (reviewElement) {
            reviewElement.innerHTML = displayReviews(finalAverage);
        }

        // Update the average rating in the badge for this room
        const avgRateElement = document.getElementById(`avg_rate_${room_id}`);
        if (avgRateElement) {
            avgRateElement.innerText = finalAverage; // Update the badge with average rating for this room
        }
    });

    // Set the overall average rating
    if (totalRooms > 0) {
        const avgRating = (overallAverage / totalRooms).toFixed(1);
        const avgRateElement = document.getElementById("avg_rate");
        if (avgRateElement) {
            avgRateElement.innerText = avgRating; // Update the badge with overall average rating
        }
    } else {
        const avgRateElement = document.getElementById("avg_rate");
        if (avgRateElement) {
            avgRateElement.innerText = "No ratings"; // Handle case with no ratings
        }
    }
}


let debounceTimer;

document.getElementById('customRange1').addEventListener('change', function () {
    // Clear any previous debounce timers
    clearTimeout(debounceTimer);

    debounceTimer = setTimeout(() => {
        const params = new URLSearchParams(window.location.search);
        const cityName = params.get('city_name');
        const availabilityFrom = params.get('availability_from');
        const availabilityTill = params.get('availability_till');
        const capacity = params.get('capacity');

        // Validate required fields
        if (!cityName || !availabilityFrom || !availabilityTill || !capacity) {
            alert('Please fill in all required filters.');
            return;
        }

        // Build the query string for the GET request
        const queryString = new URLSearchParams({
            city_name: cityName,
            availability_from: availabilityFrom,
            availability_till: availabilityTill,
            capacity: capacity,
            price: document.getElementById('customRange1').value,
        });

        // Fetch filtered results
        fetch(`/posts/search/hotel?${queryString}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                const roomListContainer = document.getElementById('hotel_search__grid'); // Container for room list
                roomListContainer.innerHTML = '';

                if (Array.isArray(data.results)) {
                    // Generate and insert room list HTML
                    roomListContainer.innerHTML = generateGridItems(data.results); // Assuming this function exists and works

                    reviewCalAndDisplay(data); // Assuming this is necessary for additional UI updates
                    updateSummary(data.results.length, queryString);

                } else {
                    console.error('Expected an array in results but got:', data.results);
                    alert('Unexpected response format. Please try again later.');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Error fetching hotel rooms. Please try again later.');
            });
    }, 300); // Debounce delay to prevent rapid API calls
});

function updateSummary(resultCount, queryString) {
    const container_ex = document.getElementById('hotel_search__grid');
    let ex_c = document.getElementById("destination");
    let ex_c_2 = document.getElementById("countFound");

    if (resultCount === 0) {
        ex_c_2.innerText = "0";
        let img = document.createElement('img');
        img.src = '/static/images/image_processing20210917-4617-1u39vt2.gif';
        img.alt = "Not Found";
        img.classList.add('h-100', 'w-100');
        container_ex.append(img);
        return;
    }

    ex_c.innerText = queryString.get('city_name') || "City not found";
    ex_c_2.innerText = resultCount;
}