document.addEventListener('DOMContentLoaded', () => {
    const carousels = document.querySelectorAll('.product-carousel-container'); // Assuming there's a container for each carousel

    carousels.forEach((carouselContainer) => {
        const productCarousel = carouselContainer.querySelector('.product-carousel');
        const productItems = carouselContainer.querySelectorAll('.product-carousel-item');
        const prevProductBtn = carouselContainer.querySelector('.prev-product-btn');
        const nextProductBtn = carouselContainer.querySelector('.next-product-btn');

        let currentIndex = 0;
        const totalItems = productItems.length;
        let itemsPerSlide = 4;

        // Adjust items per slide dynamically based on screen size
        const updateItemsPerSlide = () => {
            if (window.innerWidth <= 480) {
                itemsPerSlide = 1;
            } else if (window.innerWidth <= 768) {
                itemsPerSlide = 2;
            } else if (window.innerWidth <= 1024) {
                itemsPerSlide = 3;
            } else {
                itemsPerSlide = 4;
            }
        };

        // Update carousel position and button visibility
        const updateCarousel = () => {
            const offset = -(currentIndex * 100) / itemsPerSlide;
            productCarousel.style.transform = `translateX(${offset}%)`;

            // Hide prev button when at the first set of products
            if (currentIndex === 0) {
                prevProductBtn.classList.add('hidden');
            } else {
                prevProductBtn.classList.remove('hidden');
            }

            // Hide next button when at the last set of products
            if (currentIndex + itemsPerSlide >= totalItems) {
                nextProductBtn.classList.add('hidden');
            } else {
                nextProductBtn.classList.remove('hidden');
            }
        };

        // Handle next button click
        nextProductBtn.addEventListener('click', () => {
            if (currentIndex + itemsPerSlide < totalItems) {
                currentIndex += itemsPerSlide;
            } else {
                currentIndex = 0; // Move back to the first set
            }
            updateCarousel();
        });

        // Handle prev button click
        prevProductBtn.addEventListener('click', () => {
            if (currentIndex > 0) {
                currentIndex -= itemsPerSlide;
            }
            updateCarousel();
        });

        // Initial state - Update the carousel based on screen size
        updateItemsPerSlide();
        updateCarousel();

        // Adjust the carousel on window resize
        window.addEventListener('resize', () => {
            updateItemsPerSlide();
            updateCarousel();
        });
    });
});

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
    const carousels = document.querySelectorAll('.product-carousel-container');

    // Function to fetch data for the carousels
    async function fetchCityData(cityId) {
        try {
            let response = await fetch(`/posts/city-explore-view?city_id=${cityId}`);
            if (!response.ok) throw new Error('Failed to fetch city data');
            return await response.json();
        } catch (error) {
            console.error('Error fetching city data:', error);
            return null;
        }
    }

    // Function to render carousel items dynamically
    const renderCarouselItems = (container, items, type) => {
        const carousel = container.querySelector('.product-carousel');
        carousel.innerHTML = '';  // Clear any previous content

        items.forEach((ex, length) => {
            const carouselItem = document.createElement('div');
            carouselItem.classList.add('product-carousel-item');

            // Create the inner HTML based on the type (bedroom/table)
            let content = '';
            if (type === 'bed') {
                content = `
                    <a href="/nakiese/${LanguageManager.getLanguage()}/hotel/bed-detail/${ex.room_id}"   data-targetnak="${ex.room_id}" class="w-100" style="cursor: pointer; height: 220px;">
                        <img src="${ex.image}" class="img-fluid rounded-start" style="height: inherit;" alt="Room image">
                    </a>                        
                    <div class="card-body p-0 ps-2">
                    <a href="/nakiese/${LanguageManager.getLanguage()}/hotel/bed-detail/${ex.room_id}"  class="fs-4 nav-link text-start" data-targetnak="${ex.room_id}" style="cursor: pointer;">
                        ${ex.hotel.name}
                    </a>
                    <p class="card-text text-start"><i class="fi fi-rr-marker"></i> ${ex.hotel.city.name}, ${ex.hotel.country}</p>
                    <p class="card-text text-start"><i class="fi fi-rr-bed-alt"></i> ${ex.room_type}</p>
                    <p class="card-text text-start"><strong>$${ex.price}</strong>/nuit ★${ex.avg_rating || '0'}</p>
                    </div>
                `;
            } else if (type === 'table') {
                content = `
                    <a href="/nakiese/${LanguageManager.getLanguage()}/resturant/table/${ex.table_id}" data-targetnak="${ex.table_id}" class="w-100" style="cursor: pointer; height: 220px;">
                        <img src="${ex.images}" class="img-fluid rounded-start" loading="lazy" style="height: inherit;" alt="Room image">
                    </a>  
                    <div class="card-body p-2">
                        <div class="d-flex justify-content-between align-items-center">
                            <a href="/nakiese/${LanguageManager.getLanguage()}/resturant/table/${ex.table_id}" class="nav-link mt-0" data-targetnak=${ex.table_id} style="font-size: 1.6rem; margin-top: 10px; cursor: pointer;">
                            Idola Best
                            </a>
                            <h6 style="margin-top: 10px;">★${ex.avg_rating || '0'}</h6>
                        </div>
                       
                        <p class="card-text text-start mt-2"><strong>Table for ${ex.capacity} persons</strong></p>
                        <p class="card-text text-start mt-2"><strong>$${ex.price} / table</strong></p>
                    </div>
                `;
            }

            carouselItem.innerHTML = content;
            carousel.appendChild(carouselItem);
        });
    };

    // Initialize carousel functionality
    const initCarousel = (carouselContainer, itemsPerSlide = 4) => {
        const productCarousel = carouselContainer.querySelector('.product-carousel');
        const productItems = carouselContainer.querySelectorAll('.product-carousel-item');
        const prevProductBtn = carouselContainer.querySelector('.prev-product-btn');
        const nextProductBtn = carouselContainer.querySelector('.next-product-btn');

        let currentIndex = 0;
        const totalItems = productItems.length;

        // Update carousel based on current index
        const updateCarousel = () => {
            const offset = -(currentIndex * 100) / itemsPerSlide;
            productCarousel.style.transform = `translateX(${offset}%)`;

            prevProductBtn.classList.toggle('hidden', currentIndex === 0);
            nextProductBtn.classList.toggle('hidden', currentIndex + itemsPerSlide >= totalItems);
        };

        // Next/Previous Button Handlers
        nextProductBtn.addEventListener('click', () => {
            currentIndex = Math.min(currentIndex + itemsPerSlide, totalItems - itemsPerSlide);
            updateCarousel();
        });

        prevProductBtn.addEventListener('click', () => {
            currentIndex = Math.max(currentIndex - itemsPerSlide, 0);
            updateCarousel();
        });

        // Initial Update
        updateCarousel();
    };

    // Fetch city_id from the URL
    const params = new URLSearchParams(window.location.search);
    const cityId = params.get('city_id');

    if (cityId) {
        (async () => {
            const cityData = await fetchCityData(cityId);
            let CityNameMain = document.getElementById('city__name');
            let cityBg = document.getElementById('main-bg');
            if (cityData) {
                if (CityNameMain && cityBg) {
                    CityNameMain.innerHTML = cityData.results.city.name;
                    cityBg.style.backgroundImage = `url(${cityData.results.city.image})`; // Corrected this line
                }
                
                // Render Bedrooms Carousel
                const bedroomsCarousel = document.querySelector('#bedrooms-carousel');
            
                if (bedroomsCarousel && cityData.results.beds) {
                    
                    renderCarouselItems(bedroomsCarousel, cityData.results.beds, 'bed');
                    initCarousel(bedroomsCarousel);
                }

                // Render Tables Carousel
                const tablesCarousel = document.querySelector('#tables-carousel');
                if (tablesCarousel && cityData.results.tables) {
                    
                    renderCarouselItems(tablesCarousel, cityData.results.tables, 'table');
                    initCarousel(tablesCarousel);
                }
            }
        })();
    }
});