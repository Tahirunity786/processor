document.addEventListener('DOMContentLoaded', () => {
    const dragDropArea = document.getElementById('dragDropArea');
    const fileInput = document.getElementById('fileInput');
    const previewContainer = document.getElementById('previewContainer');
    const progressBar = document.getElementById('progressBar');
    const progress = document.getElementById('progress');

    dragDropArea.addEventListener('click', () => {
        fileInput.click();
    });

    fileInput.addEventListener('change', (event) => {
        handleFiles(event.target.files);
    });

    dragDropArea.addEventListener('dragover', (event) => {
        event.preventDefault();
        dragDropArea.classList.add('drag-over');
    });

    dragDropArea.addEventListener('dragleave', () => {
        dragDropArea.classList.remove('drag-over');
    });

    dragDropArea.addEventListener('drop', (event) => {
        event.preventDefault();
        dragDropArea.classList.remove('drag-over');
        const files = event.dataTransfer.files;
        handleFiles(files);
    });

    function handleFiles(files) {
        for (const file of files) {
            if (file.type.startsWith('image/')) {
                showProgress();
                uploadFile(file);
            } else {
                alert('Please upload an image file.');
            }
        }
    }

    function showProgress() {
        progressBar.style.display = 'block';
        progress.style.width = '0';
    }

    function uploadFile(file) {
        const reader = new FileReader();
        reader.onloadstart = () => {
            updateProgress(0);
        };
        reader.onprogress = (event) => {
            if (event.lengthComputable) {
                const progressValue = Math.round((event.loaded / event.total) * 100);
                updateProgress(progressValue);
            }
        };
        reader.onloadend = (event) => {
            updateProgress(100);
            setTimeout(() => {
                displayImage(event.target.result);
                progressBar.style.display = 'none';
            }, 500); // Small delay to show 100% completion
        };
        reader.readAsDataURL(file);
    }

    function updateProgress(value) {
        progress.style.width = `${value}%`;
    }

    function displayImage(src) {
        const img = document.createElement('img');
        img.src = src;
        previewContainer.innerHTML = '';
        previewContainer.appendChild(img);
    }
});



// JavaScript to filter cities dynamically
document.getElementById('cityInput').addEventListener('input', function () {
    let filter = this.value.toLowerCase();
    let items = document.querySelectorAll('#cityDropdown .dropdown-item');

    items.forEach(function (item) {
        if (item.textContent.toLowerCase().includes(filter)) {
            item.style.display = '';
        } else {
            item.style.display = 'none';
        }
    });
});
document.addEventListener('DOMContentLoaded', function () {
    async function BedDetailPopulator() {
        try {
            const response = await fetch('/posts/city-all', {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                },
            });
            if (!response.ok) throw new Error('Failed to fetch hotel details');
            const data = await response.json();
            const cities = [];

            data.forEach(ex_cities => {
                cities.push(ex_cities.name);
            });
            const initialDisplayCount = 5;  // How many cities to show initially
            let expanded = false;

            function populateDropdown() {
                const cityDropdown = document.getElementById('cityDropdown');
                cityDropdown.innerHTML = ''; // Clear the dropdown

                let citiesToDisplay = expanded ? cities : cities.slice(0, initialDisplayCount);

                citiesToDisplay.forEach(city => {
                    // Create the list item
                    let cityItem = document.createElement('li');
                    cityItem.classList.add('dropdown-item');
                    cityItem.style.cursor = "pointer";

                    // Create the SVG icon
                    let svgIcon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
                    svgIcon.setAttribute("xmlns", "http://www.w3.org/2000/svg");
                    svgIcon.setAttribute("width", "16");
                    svgIcon.setAttribute("height", "16");
                    svgIcon.setAttribute("fill", "currentColor");
                    svgIcon.setAttribute("class", "bi bi-geo-alt-fill me-2"); // Adding a Bootstrap margin for spacing
                    svgIcon.setAttribute("viewBox", "0 0 16 16");

                    // Create the path for the SVG
                    let path = document.createElementNS("http://www.w3.org/2000/svg", "path");
                    path.setAttribute("d", "M8 16s6-5.686 6-10A6 6 0 0 0 2 6c0 4.314 6 10 6 10m0-7a3 3 0 1 1 0-6 3 3 0 0 1 0 6");

                    // Append the path to the SVG
                    svgIcon.appendChild(path);

                    // Append the SVG to the list item
                    cityItem.appendChild(svgIcon);

                    // Add the city name after the SVG
                    cityItem.append(city);

                    // Add click event listener
                    cityItem.addEventListener('click', function () {
                        document.getElementById('cityInput').value = city;
                        cityDropdown.classList.remove('show'); // Hide dropdown on item selection
                    });

                    // Append the list item to the dropdown
                    cityDropdown.appendChild(cityItem);
                });

            }

            // Show the dropdown on input click
            const cityInput = document.getElementById('cityInput');
            cityInput.addEventListener('click', function () {
                let dropdownMenu = new bootstrap.Dropdown(this);
                dropdownMenu.show();
                populateDropdown();
                document.getElementById('cityDropdown').classList.add('show'); // Show dropdown
            });

            // Close dropdown when clicking outside
            document.addEventListener('click', function (event) {
                const cityDropdown = document.getElementById('cityDropdown');
                if (!cityInput.contains(event.target) && !cityDropdown.contains(event.target)) {
                    cityDropdown.classList.remove('show');  // Hide dropdown when clicked outside
                }
            });

            // Ensure the dropdown is hidden when an item is selected
            cityInput.addEventListener('change', function () {
                document.getElementById('cityDropdown').classList.remove('show');
            });
        } catch (error) {
            console.log(error)
        }
    }
    BedDetailPopulator();
});


document.addEventListener('DOMContentLoaded', function () {
    // Initialize "Date From" picker
    const dateFrom = flatpickr("#dateInputg", {
        dateFormat: "d-m-Y",  // Specify the date format as Day-Month-Year
        minDate: "today",     // Disable past dates
        enableTime: false,    // Only allow date selection
        altInput: true,       // Shows a more user-friendly date format in the input field
        altFormat: "F j, Y",  // Format for the alternative input (e.g., "January 1, 2024")
        locale: {
            firstDayOfWeek: 1 // Start the week on Monday
        },
        disableMobile: true,  // Ensure the custom UI works on mobile as well
        onChange: function (selectedDates, dateStr, instance) {
            // Set the minimum date of the "Date Till" field based on the selected "Date From"
            dateTill.set("minDate", selectedDates[0]);  // selectedDates[0] is the selected "Date From"
        }
    });

    // Initialize "Date Till" picker
    const dateTill = flatpickr("#dateInputa", {
        dateFormat: "d-m-Y",  // Specify the date format as Day-Month-Year
        minDate: "today",     // Disable past dates
        enableTime: false,    // Only allow date selection
        altInput: true,       // Shows a more user-friendly date format in the input field
        altFormat: "F j, Y",  // Format for the alternative input (e.g., "January 1, 2024")
        locale: {
            firstDayOfWeek: 1 // Start the week on Monday
        },
        disableMobile: true,  // Ensure the custom UI works on mobile as well
    });
});


