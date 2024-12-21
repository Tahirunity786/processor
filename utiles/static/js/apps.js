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

document.addEventListener('DOMContentLoaded', function () {

    // Handle the signup form
    const signupForm = document.getElementById('signupForm');
    const message = document.getElementById('msg');
    if (signupForm) {
        signupForm.addEventListener('submit', async function (event) {
            event.preventDefault(); // Prevent the default form submission

            const email = document.getElementById('stremail').value;

            if (email) {
                try {
                    const response = await fetch('/account-control/user/email-checker', {
                        method: 'POST',
                        body: JSON.stringify({ email: email }),
                        headers: {
                            'Accept': 'application/json',
                            'Content-Type': 'application/json',
                        }
                    });

                    const result = await response.json();

                    if (response.ok) {
                        // Email check was successful, proceed with form submission or next steps
                        sessionStorage.setItem('ntempEmail', email); // Store the email in session storage
                        window.location.href = '/register-process'; // Redirect to the next page
                    } else {
                        // Handle errors returned from the server
                        message.style.color = "red";
                        message.innerText = result.message;

                    }
                } catch (e) {
                    butterup.toast({
                        title: 'Unknown Error',
                        message: 'An error occurred while processing request',
                        type: 'error',
                    });
                }
            } else {
                alert('Please enter an email.');
            }
        });
    }

    const signupContinueForm = document.getElementById('signup-continue');
    if (signupContinueForm) {
        signupContinueForm.addEventListener('submit', async function (event) {
            event.preventDefault(); // Prevent the default form submission
            const email = sessionStorage.getItem('ntempEmail');
            const form = event.target;
            const formData = new FormData(form);
            formData.append('email', email);

            // Password confirmation validation
            if (formData.get('password') !== formData.get('confirm_password')) {
                butterup.toast({
                    title: 'Registration Error',
                    message: 'Passwords do not match!',
                    type: 'error',
                });
                return;
            }

            try {
                const response = await fetch('/account-control/user/create', {
                    method: 'POST',
                    body: formData,
                    headers: {
                        'Accept': 'application/json',
                        // No need for 'Content-Type': 'multipart/form-data' when using FormData
                    }
                });

                if (response.ok) {
                    const result = await response.json();

                    localStorage.setItem('exn-u-cookie', JSON.stringify(result.user))
                    window.location.href = '/';
                } else {
                    // Handle errors
                    const errorData = await response.json();
                    if (errorData.errors && Array.isArray(errorData.errors)) {
                        errorData.errors.forEach(error => {
                            butterup.toast({
                                title: 'Registration Error',
                                message: error,
                                type: 'error',
                            });
                        });
                    } else {
                        butterup.toast({
                            title: 'Registration Error',
                            message: 'An unknown error occurred. Please try again.',
                            type: 'error',
                        });
                    }
                }
            } catch (error) {

                butterup.toast({
                    title: 'Registration Error',
                    message: 'An error occurred while submitting the form.',
                    type: 'error',
                });
            }
        });
    }


    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async function (event) {
            event.preventDefault(); // Prevent the default form submission

            const form = event.target;
            const formData = new FormData(form);


            try {
                const response = await fetch('/account-control/user/login ', {
                    method: 'POST',
                    body: formData,
                    headers: {
                        'Accept': 'application/json',

                    }
                });

                if (response.ok) {
                    const result = await response.json();
                    const lastUrl = sessionStorage.getItem('currenturl')
                    // Handle success (e.g., redirect, show a message)
                    if (lastUrl) {

                        window.location.href = lastUrl;
                    }
                    else {
                        window.location.href = '/';
                    }

                    localStorage.setItem('exn-u-cookie', JSON.stringify(result.user));

                } else {
                    // Handle errors
                    const errorData = await response.json();
                    if (errorData.errors && Array.isArray(errorData.errors)) {
                        errorData.errors.forEach(error => {
                            butterup.toast({
                                title: 'Login Error',
                                message: error,
                                type: 'error',
                            });
                        });
                    } else {
                        butterup.toast({
                            title: 'Login Error',
                            message: 'An unknown error occurred. Please try again.',
                            type: 'error',
                        });
                    }
                }
            } catch (error) {
                butterup.toast({
                    title: 'Login Error',
                    message: 'An error occurred while submitting the form.',
                    type: 'error',
                });
            }
        });
    }

    let studentDetails = document.getElementById("student-details");

    if (studentDetails) {
        let user_data = localStorage.getItem('exn-u-cookie');
        let user = JSON.parse(user_data);

        (async () => {
            try {
                const response = await fetch('/account-control/user/profile', {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${user.token.access}`
                    }
                });

                if (response.ok) {
                    const result = await response.json();

                    // Clear any existing data
                    patientsData.innerHTML = '';

                    // Initialize an incremental counter
                    let counter = 1;

                    // Iterate over the result and create HTML elements for each patient
                    result.forEach(patient => {


                        // Create the patient item element
                        let patientItem = document.createElement('div');
                        patientItem.className = 'nak-item';
                        patientItem.id = `nak-item-${counter}`;
                        patientItem.dataset.id = patient._id;
                        patientItem.textContent = `${patient.first_name} ${patient.last_name}`;

                        // Create the line separator element
                        let lineSeparator = document.createElement('div');
                        lineSeparator.className = 'line';

                        // Append the patient item and line separator to the patientsData container
                        patientsData.appendChild(patientItem);
                        patientsData.appendChild(lineSeparator);

                        // Increment the counter for the next patient
                        counter++;
                    });

                    // Success message

                } else {
                    const errorData = await response.json();

                    if (errorData.errors && Array.isArray(errorData.errors)) {
                        errorData.errors.forEach(error => {
                            butterup.toast({
                                title: 'Error',
                                message: error,
                                type: 'error',
                            });
                        });
                    } else if (errorData.message) {
                        butterup.toast({
                            title: 'Error',
                            message: errorData.message,
                            type: 'error',
                        });
                    } else {
                        butterup.toast({
                            title: 'Error',
                            message: 'An unknown error occurred. Please try again.',
                            type: 'error',
                        });
                    }
                }
            } catch (error) {

                butterup.toast({
                    title: 'Error',
                    message: 'An error occurred while fetching patient data. Please check your network connection and try again.',
                    type: 'error',
                });
            }
        })();
    }

    const utiles = document.getElementById('utiles');
    const user = localStorage.getItem('exn-u-cookie');

    const languageDropdown = `
    <div class="dropdown">
        <button type="button" class="btn btn-light rounded-pill d-flex justify-content-center align-items-center p-0 ms-4"
          style="height: 40px; width: 40px; border: 1px solid rgb(218, 218, 218);" data-bs-toggle="dropdown" aria-expanded="false">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-globe"
            viewBox="0 0 16 16">
            <path
              d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8m7.5-6.923c-.67.204-1.335.82-1.887 1.855A8 8 0 0 0 5.145 4H7.5zM4.09 4a9.3 9.3 0 0 1 .64-1.539 7 7 0 0 1 .597-.933A7.03 7.03 0 0 0 2.255 4zm-.582 3.5c.03-.877.138-1.718.312-2.5H1.674a7 7 0 0 0-.656 2.5zM4.847 5a12.5 12.5 0 0 0-.338 2.5H7.5V5zM8.5 5v2.5h2.99a12.5 12.5 0 0 0-.337-2.5zM4.51 8.5a12.5 12.5 0 0 0 .337 2.5H7.5V8.5zm3.99 0V11h2.653c.187-.765.306-1.608.338-2.5zM5.145 12q.208.58.468 1.068c.552 1.035 1.218 1.65 1.887 1.855V12zm.182 2.472a7 7 0 0 1-.597-.933A9.3 9.3 0 0 1 4.09 12H2.255a7 7 0 0 0 3.072 2.472M3.82 11a13.7 13.7 0 0 1-.312-2.5h-2.49c.062.89.291 1.733.656 2.5zm6.853 3.472A7 7 0 0 0 13.745 12H11.91a9.3 9.3 0 0 1-.64 1.539 7 7 0 0 1-.597.933M8.5 12v2.923c.67-.204 1.335-.82 1.887-1.855q.26-.487.468-1.068zm3.68-1h2.146c.365-.767.594-1.61.656-2.5h-2.49a13.7 13.7 0 0 1-.312 2.5m2.802-3.5a7 7 0 0 0-.656-2.5H12.18c.174.782.282 1.623.312 2.5zM11.27 2.461c.247.464.462.98.64 1.539h1.835a7 7 0 0 0-3.072-2.472c.218.284.418.598.597.933M10.855 4a8 8 0 0 0-.468-1.068C9.835 1.897 9.17 1.282 8.5 1.077V4z" />
          </svg>
        </button>
        <ul class="dropdown-menu">
            <li><a class="dropdown-item" href="#" id="en">English</a></li>
            <li><a class="dropdown-item" href="#" id="fr">French</a></li>
        </ul>
    </div>
        `;

    const notificationDropdown = `
            <div class="dropdown">
          <button class="btn btn-light rounded-pill d-flex justify-content-center align-items-center p-0 ms-4"
            role="button" data-bs-toggle="dropdown" aria-expanded="false"
            style="height: 40px; width: 40px; border: 1px solid rgb(218, 218, 218);">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" class="bi bi-bell-fill"
              viewBox="0 0 16 16">
              <path
                d="M8 16a2 2 0 0 0 2-2H6a2 2 0 0 0 2 2m.995-14.901a1 1 0 1 0-1.99 0A5 5 0 0 0 3 6c0 1.098-.5 6-2 7h14c-1.5-1-2-5.902-2-7 0-2.42-1.72-4.44-4.005-4.901" />
            </svg>
          </button>
          <ul class="dropdown-menu">
            <li class="m-1"><a class="dropdown-item" href="#">no notification yet</a></li>
           
          </ul>
        </div>`;

    const userDropdown = `
            <div class="dropdown">
            <button class="btn btn-light rounded-pill d-flex justify-content-center align-items-center p-0 ms-4 "
                role="button" data-bs-toggle="dropdown" aria-expanded="false"
                style="height: 40px; width: 40px; border: 1px solid rgb(218, 218, 218);">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" class="bi bi-person"
                    viewBox="0 0 16 16">
                        <path
                        d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6m2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0m4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4m-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.289 10 8 10s-3.516.68-4.168 1.332c-.678.678-.83 1.418-.832 1.664z" />
                    </svg>
            </button>

                <ul class="dropdown-menu">
                    <li><a class="dropdown-item" href="/nakiese/${LanguageManager.getLanguage()}/accounts/settings">Manage Account</a></li>
                    <li><a class="dropdown-item" href="#">My Bookings</a></li>
                    <li><a class="dropdown-item" href="#">My Reviews</a></li>
                    <li><a class="dropdown-item" href="/nakiese/${LanguageManager.getLanguage()}/booking-list">My Favourites</a></li>
                    <li><a class="dropdown-item" id="logout" href="#">Logout</a></li>
                </ul>
            </div>`;
            const favButton = `
                <div>
                    <a href="/nakiese/en/booking-list" type="button" class="btn btn-light rounded-pill d-flex justify-content-center align-items-center p-0 ms-4"
                     style="height: 40px; width: 40px; border: 1px solid rgb(218, 218, 218);">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-heart-fill" viewBox="0 0 16 16">
                            <path fill-rule="evenodd" d="M8 1.314C12.438-3.248 23.534 4.735 8 15-7.534 4.736 3.562-3.248 8 1.314"/>
                        </svg>
                    </a>
                </div>`;
            const bookingBTN = `
                <div>
                    <a href="/nakiese/en/my-bookings" type="button" class="btn btn-light rounded-pill d-flex justify-content-center align-items-center p-0 ms-4"
                     style="height: 40px; width: 40px; border: 1px solid rgb(218, 218, 218);">
                       <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-clipboard-check" viewBox="0 0 16 16">
                          <path fill-rule="evenodd" d="M10.854 7.146a.5.5 0 0 1 0 .708l-3 3a.5.5 0 0 1-.708 0l-1.5-1.5a.5.5 0 1 1 .708-.708L7.5 9.793l2.646-2.647a.5.5 0 0 1 .708 0"/>
                          <path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1z"/>
                          <path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0z"/>
                        </svg>
                    </a>
                </div>`;

    if (user) {
        utiles.innerHTML = `
                ${favButton}
                ${languageDropdown}
                ${notificationDropdown}
                ${userDropdown}
            `;
        attachLogoutListener(); // Attach the logout event listener
    } else {
        
        const loginButton = `
                <div>
                    <a href="/login" class="btn btn-primary ms-3 rounded-pill text-light text-center">Login</a>
                </div>`;

        const signUpButton = `
                <div>
                    <a href="/register" class="btn btn-primary ms-3 rounded-pill text-light text-center">Sign Up</a>
                </div>`;

        utiles.innerHTML = `
                ${bookingBTN}
                ${favButton}
                ${languageDropdown}
                ${loginButton}
                ${signUpButton}
            `;
    }
});

document.addEventListener('DOMContentLoaded', function () {
    function setLanguage(lang) {
        localStorage.setItem('lang', lang);

        setTimeout(() => {
            window.location.reload();
        }, 2000); // Delay of 3000ms (3 seconds)
    }

    // Attach event listeners to the dropdown items
    document.getElementById('en').addEventListener('click', function () {
        setLanguage('en');
    });

    document.getElementById('fr').addEventListener('click', function () {
        setLanguage('fr');
    });
});

document.addEventListener('DOMContentLoaded', function () {
    const logout = document.getElementById("logout");
    const logoutSettings = document.getElementById("setSignout");

    if (logout) {
        logout.addEventListener('click', function (event) {
            // event.preventDefault(); // Prevent default link behaviorn
            localStorage.removeItem('exn-u-cookie');
            window.location.reload();
        });
    }
    if (logoutSettings) {
        logoutSettings.addEventListener('click', function (event) {
            // event.preventDefault(); // Prevent default link behaviorn
            localStorage.removeItem('exn-u-cookie');
            window.location.reload()
        });
    }
});

document.addEventListener('DOMContentLoaded', function () {
    const lang = LanguageManager.getLanguage();
    const ids = ['account-personal', 'account-security', 'account-notification', 'account-payment', 'account-preferences'];
    const links = {
        'account-personal': `/nakiese/${lang}/accounts/settings/persoanl-details`,
        'account-security': `/nakiese/${lang}/accounts/settings/security`,
        'account-notification': `/nakiese/${lang}/accounts/settings/email-notification`,
        'account-payment': `/nakiese/${lang}/accounts/settings/payment-handle`,
        'account-preferences': `/nakiese/${lang}/accounts/settings/preferences`
    };

    ids.forEach(function (id) {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('click', function (event) {

                const link = links[id];
                if (link) {
                    window.location.href = link; // Navigate to the specified URL
                }
            });
        }
    });


});

document.addEventListener('DOMContentLoaded', async function () {
    let user = localStorage.getItem('exn-u-cookie');
    let Personald = document.getElementById('Personal-d');

    if (user && Personald) {
        try {
            // Parse the user object if it's stored as a JSON string
            user = JSON.parse(user);

            const response = await fetch('/account-control/user/profile', {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token.access}`  // Make sure the token is correct
                }
            });

            if (response.ok) {
                const result = await response.json();

                // Populate the HTML elements with data
                const nameElement = document.getElementById('fullname');
                const emailElement = document.getElementById('email');
                const phnoElement = document.getElementById('phno');
                const dobElement = document.getElementById('dob');
                const nationalityElement = document.getElementById('nationality');
                const genderElement = document.getElementById('gender');
                const addressElement = document.getElementById('address');

                if (nameElement) nameElement.textContent = `${result.first_name || 'Add name'} ${result.last_name || 'Add name'}`;
                if (emailElement) emailElement.textContent = result.email || 'Add email';
                if (phnoElement) phnoElement.textContent = result.phone_no || 'Add phone number';
                if (dobElement) dobElement.textContent = result.date_of_bith ? result.date_of_bith : 'Add date of birth';
                if (nationalityElement) nationalityElement.textContent = result.nationality || 'Add nationality';
                if (genderElement) genderElement.textContent = result.gender || 'Add gender';
                if (addressElement) addressElement.textContent = result.address || 'Add address';

            } else {
                const errorResult = await response.json();
                // Optional: Display error to the user
                alert('An error occurred: ' + (errorResult.message || 'Unknown error'));
            }
        } catch (e) {
            butterup.toast({
                title: 'Error',
                message: "Please click " + " " + `<b><a href="/login">Login</a></b>` + " " + " to continue",
                type: 'error',
            });
        }
    }
});

document.addEventListener('DOMContentLoaded', function () {



    let fName = document.getElementById('firstName');
    let lName = document.getElementById('lastName');
    let saveButton = document.getElementById('name');

    if (fName && lName && saveButton) {

        saveButton.addEventListener('click', async function () {
            let user = localStorage.getItem('exn-u-cookie');
            let token;
            user = JSON.parse(user);
            if (user) {
                try {
                    // Parse the user object if it's stored as a JSON string
                    token = user.token ? user.token.access : null;  // Safely check for the token



                    const requestData = {
                        first_name: fName.value,
                        last_name: lName.value
                    };

                    const response = await fetch('/account-control/user/profile/update', {
                        method: 'PUT',
                        headers: {
                            'Accept': 'application/json',
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`  // Ensure the token is correct
                        },
                        body: JSON.stringify(requestData)  // Sending the data in JSON format
                    });

                    if (response.ok) {
                        window.location.reload();
                    } else {
                        butterup.toast({
                            title: 'Updation Error',
                            message: "Error while updating name, please try again",
                            type: 'error',
                        });
                    }
                } catch (error) {
                    butterup.toast({
                        title: 'Authentication Error',
                        message: "Please click " + " " + `<b><a href="/login">Login</a></b>` + " " + " to continue",
                        type: 'error',
                    });
                }
            } else {

                butterup.toast({
                    title: 'Authentication Error',
                    message: "Please click " + " " + `<b><a href="/login">Login</a></b>` + " " + "  to continue",
                    type: 'error',
                });
            }
        });
    }

    let emailId = document.getElementById('emailId');
    let savemail = document.getElementById('savemeil');
    if (emailId && savemail) {
        savemail.addEventListener('click', async function () {
            let user = localStorage.getItem('exn-u-cookie');

            user = JSON.parse(user);
            if (user) {
                try {
                    // Parse the user object if it's stored as a JSON string

                    const requestData = {
                        email: emailId.value,

                    };

                    const response = await fetch('/account-control/user/profile/update', {
                        method: 'PUT',
                        headers: {
                            'Accept': 'application/json',
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${user.token.access}`  // Ensure the token is correct
                        },
                        body: JSON.stringify(requestData)  // Sending the data in JSON format
                    });

                    if (response.ok) {
                        window.location.reload();
                    } else {
                        butterup.toast({
                            title: 'Updation Error',
                            message: "Error while updating email, please try again",
                            type: 'error',
                        });
                    }
                } catch (error) {
                    butterup.toast({
                        title: 'Unknown Error',
                        message: "An Unknown error has been occured.",
                        type: 'error',
                    });
                }
            } else {
                butterup.toast({
                    title: 'Authentication Error',
                    message: "Please click" + " " + `<b><a href="/login">Login</a></b>` + " " + "  to continue",
                    type: 'error',
                });
            }
        });
    }

    let dob = document.getElementById('dob2');
    let savedob = document.getElementById('savedob');
    if (dob && savedob) {
        savedob.addEventListener('click', async function () {
            let user = localStorage.getItem('exn-u-cookie');

            try {
                // Ensure 'user' is parsed only once
                user = typeof user === 'string' ? JSON.parse(user) : user;

                if (user && user.token && user.token.access) {
                    const requestData = {
                        date_of_bith: dob.value,  // Ensure correct spelling
                    };

                    const response = await fetch('/account-control/user/profile/update', {
                        method: 'PUT',
                        headers: {
                            'Accept': 'application/json',
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${user.token.access}`  // Ensure token is valid
                        },
                        body: JSON.stringify(requestData)  // Sending the data in JSON format
                    });

                    if (response.ok) {
                        window.location.reload();
                    } else {
                        butterup.toast({
                            title: 'Unknown Error',
                            message: "An unknown error has occurred.",
                            type: 'error',
                        });
                    }
                } else {
                    butterup.toast({
                        title: 'Authentication Error',
                        message: `Please click <b><a href="/login">Login</a></b> to continue`,
                        type: 'error',
                    });
                }
            } catch (error) {
                butterup.toast({
                    title: 'Error',
                    message: 'An error occurred while processing your request.',
                    type: 'error',
                });
            }
        });
    }

    let nat = document.getElementById('nat');
    let savnat = document.getElementById('savnat');
    if (dob && savedob) {
        savnat.addEventListener('click', async function () {
            try {
                let user = localStorage.getItem('exn-u-cookie');
                // Parse the user object if it's stored as a JSON string
                user = JSON.parse(user);

                const requestData = {
                    nationality: nat.value,

                };

                const response = await fetch('/account-control/user/profile/update', {
                    method: 'PUT',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${user.token.access}`  // Ensure the token is correct
                    },
                    body: JSON.stringify(requestData)  // Sending the data in JSON format
                });

                if (response.ok) {
                    window.location.reload();
                } else {
                    butterup.toast({
                        title: 'Updation Error',
                        message: "Error while updating Nationality, please try again",
                        type: 'error',
                    });
                }
            } catch (error) {
                butterup.toast({
                    title: 'Unknown Error',
                    message: "An Unknown error has been occured.",
                    type: 'error',
                });
            }
        });
    }
    let genderInput = document.getElementById('genderInput');
    let savgender = document.getElementById('savgender');
    if (dob && savedob) {
        savgender.addEventListener('click', async function () {
            try {
                let user = localStorage.getItem('exn-u-cookie');
                // Parse the user object if it's stored as a JSON string
                user = JSON.parse(user);

                const requestData = {
                    gender: genderInput.value,

                };

                const response = await fetch('/account-control/user/profile/update', {
                    method: 'PUT',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${user.token.access}`  // Ensure the token is correct
                    },
                    body: JSON.stringify(requestData)  // Sending the data in JSON format
                });

                if (response.ok) {
                    window.location.reload();
                } else {
                    butterup.toast({
                        title: 'Updation Error',
                        message: "Error while updating gender, please try again",
                        type: 'error',
                    });
                }
            } catch (error) {
                butterup.toast({
                    title: 'Unknown Error',
                    message: "An Unknown error has been occured.",
                    type: 'error',
                });
            }
        });
    }
    let addressInput = document.getElementById('addressInput');
    let savaddress = document.getElementById('savaddress');
    if (dob && savedob) {
        savaddress.addEventListener('click', async function () {
            try {
                let user = localStorage.getItem('exn-u-cookie');
                // Parse the user object if it's stored as a JSON string
                user = JSON.parse(user);

                const requestData = {
                    address: addressInput.value,

                };

                const response = await fetch('/account-control/user/profile/update', {
                    method: 'PUT',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${user.token.access}`  // Ensure the token is correct
                    },
                    body: JSON.stringify(requestData)  // Sending the data in JSON format
                });

                if (response.ok) {

                    window.location.reload();
                } else {
                    butterup.toast({
                        title: 'Updation Error',
                        message: "Error while updating address, please try again",
                        type: 'error',
                    });
                }
            } catch (error) {
                butterup.toast({
                    title: 'Unknown Error',
                    message: "An Unknown error has been occured.",
                    type: 'error',
                });
            }
        });
    }

});

document.addEventListener('DOMContentLoaded', function () {
    let phId = document.getElementById('phno2');
    let savePh = document.getElementById('saveph');

    // Check if the elements are available
    if (phId && savePh) {
        // Retrieve and parse user data from localStorage
        let user = localStorage.getItem('exn-u-cookie');
        user = JSON.parse(user);
        if (user) {
            try {

                // Add click event listener for save button
                savePh.addEventListener('click', async function () {
                    try {
                        // Validate phone number input
                        const phoneNumber = phId.value ? phId.value.trim() : '';
                        if (!phoneNumber) {
                            return;
                        }

                        // Construct request data
                        const requestData = { phone_no: phoneNumber };


                        // Make the fetch request
                        const response = await fetch('/account-control/user/profile/update', {
                            method: 'PUT',
                            headers: {
                                'Accept': 'application/json',
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${user.token.access}`  // Ensure the token is correct
                            },
                            body: JSON.stringify(requestData)  // Sending the data in JSON format
                        });

                        // Handle the response
                        if (response.ok) {
                            window.location.reload();
                        } else {
                            const error = await response.text();
                            butterup.toast({
                                title: 'Error Occured',
                                message: error,
                                type: 'error',
                            });
                        }
                    } catch (error) {
                        butterup.toast({
                            title: 'Unknown error Occured',
                            message: error,
                            type: 'error',
                        });
                    }
                });
            } catch (error) {
                butterup.toast({
                    title: 'Authentication Error',
                    message: "Please click" + " " + `<a  href="/login">Login </a>` + " " + "to continue",
                    type: 'error',
                });
            }
        } else {
            butterup.toast({
                title: 'Authentication Error',
                message: "Please click" + " " + `<a  href="/login">Login </a>` + " " + "to continue",
                type: 'error',
            });
        }
    }

    // Attach logout listener (ensure this function is defined somewhere)
    if (typeof attachLogoutListener === 'function') {
        attachLogoutListener();
    }
});


document.addEventListener("DOMContentLoaded", () => {

    // Get elements
    const openModalLink = document.querySelector('.custom-open-modal-link');
    const openModalDelLink = document.querySelector('.custom-open-modal-del-link');
    const closeModalBtns = document.querySelectorAll('.custom-close-modal-btn');
    const closeModalBtns2 = document.querySelectorAll('.custom-close-modal-btn2');
    const modalOverlay = document.getElementById('customModalOverlay');
    const modalOverlay2 = document.getElementById('customModalOverlay2');



    // Open Modal
    if (openModalLink) {


        openModalLink.addEventListener('click', (e) => {
            e.preventDefault(); // Prevent default anchor behavior

            modalOverlay.style.display = 'flex';
        });
    }
    if (openModalDelLink) {
        openModalDelLink.addEventListener('click', (e) => {
            e.preventDefault(); // Prevent default anchor behavior

            modalOverlay2.style.display = 'flex';
        });
    }

    // Close Modal
    closeModalBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            modalOverlay.style.display = 'none';
        });
    });
    closeModalBtns2.forEach(btn => {
        btn.addEventListener('click', () => {
            modalOverlay2.style.display = 'none';
        });
    });

    // Prevent Modal Close on Outside Click
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) {
            modalOverlay.style.display = 'none';
        }
    });



    let submitReset = document.getElementById("send-reset");

    const oldpass = document.getElementById('custom-old-password');
    const newPass = document.getElementById('custom-new-password');
    const condirPass = document.getElementById('custom-confirm-password');

    let user = localStorage.getItem('exn-u-cookie');
    user = JSON.parse(user);

    if (submitReset) {
        submitReset.addEventListener('click', async function () {
            try {
                if (!user && !user.token.access) {

                    return
                }
                const requestData = {
                    'old_password': oldpass.value,
                    'new_password': newPass.value,
                    'confirm_password': condirPass.value
                };
                try {
                    const response = await fetch('/account-control/user/change-password', {
                        method: 'PUT',
                        headers: {
                            'Accept': 'application/json',
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${user.token.access}`  // Ensure the token is correct
                        },
                        body: JSON.stringify(requestData)  // Sending the data in JSON format
                    });
                    if (response.ok) {
                        const result = await response.json();
                        butterup.toast({
                            title: 'Password Successfully Changed',
                            message: result.detail,
                            type: 'success',
                        });
                        modalOverlay.style.display = 'none';
                    }
                    else {
                        butterup.toast({
                            title: 'Unknown error Occured',
                            message: error,
                            type: 'error',
                        });
                    }
                } catch (error) {
                    butterup.toast({
                        title: 'Unknown error Occured',
                        message: error,
                        type: 'error',
                    });
                }
            } catch (error) {
                butterup.toast({
                    title: 'Unknown error Occured',
                    message: error,
                    type: 'error',
                });
            }
        });
    }
    let delacc = document.getElementById("delacc");
    if (delacc) {
        delacc.addEventListener('click', async function () {
            try {
                if (!user && !user.token.access) {

                    return
                }

                try {
                    const response = await fetch('/account-control/user/del', {
                        method: 'POST',
                        headers: {
                            'Accept': 'application/json',
                            'Authorization': `Bearer ${user.token.access}`  // Ensure the token is correct
                        },

                    });
                    if (response.ok) {
                        const result = await response.json();
                        butterup.toast({
                            title: 'Delete Account',
                            message: result.detail,
                            type: 'success',
                        });
                        modalOverlay.style.display = 'none';
                        localStorage.removeItem("exn-u-cookie");
                        window.location.href = "/register";
                    }
                    else {
                        butterup.toast({
                            title: 'Unknown error Occured',
                            message: error,
                            type: 'error',
                        });
                    }
                } catch (error) {
                    butterup.toast({
                        title: 'Unknown error Occured',
                        message: error,
                        type: 'error',
                    });
                }
            } catch (error) {
                butterup.toast({
                    title: 'Unknown error Occured',
                    message: error,
                    type: 'error',
                });
            }
        });
    }



});
// Function to populate the city grid
function cityPopulator(cities, grid_id) {
    let gridHTML = '';
    cities.forEach(i => {
        gridHTML += `
        <div class="col d-flex flex-column">
            <div class="position-relative rounded-4 city-container" data-city-id="${i.city_id}"
                style="background-image: url(${i.image}); background-size: cover; background-position: center; height:200px; cursor: pointer;">
    
                <!-- Overlay for the dark background -->
                <div class="w-100 h-100 rounded-4" style="background-color: rgba(56, 56, 56, 0.226); z-index: 100;"></div>
    
                <!-- Text content, positioned absolutely within the parent div -->
                <div class="position-absolute" style="top: 20px; left: 40px; z-index: 100;">
                    <p class="text-light mb-1" style="font-size: smaller;">Establishment</p>
                    <h4 class="text-light" style="font-size: large; font-weight: bold;">${i.name}</h4>
                </div>
    
                <!-- Button positioned at the bottom -->
                <button class="btn btn-light rounded-pill position-absolute explore-btn" data-city-id="${i.city_id}"
                    style="bottom: 20px; left: 40px; z-index: 100;">
                    Explore
                </button>
            </div>
        </div>
        `;
    });

    // Inject the generated HTML into the grid container
    grid_id.innerHTML = gridHTML;

    // Attach click event listeners to the dynamically generated elements
    attachClickListeners();
}

// Function to attach event listeners after injecting content
function attachClickListeners() {
    const lang = LanguageManager.getLanguage();
    // Select all the city containers and explore buttons
    const cityContainers = document.querySelectorAll('.city-container');
    const exploreButtons = document.querySelectorAll('.explore-btn');

    // Add click event listener for city container
    cityContainers.forEach(container => {
        container.addEventListener('click', function () {
            const cityId = container.getAttribute('data-city-id');
            window.location.href = `/nakiese/${lang}/city/explore?city_id=${cityId}`;
        });
    });

    // Add click event listener for explore button
    exploreButtons.forEach(button => {
        button.addEventListener('click', function (event) {
            event.stopPropagation();  // Prevent triggering the container click event
            const cityId = button.getAttribute('data-city-id');
            window.location.href = `/nakiese/${lang}/city/explore?city_id=${cityId}`;
        });
    });
}



document.addEventListener("DOMContentLoaded", () => {
    const hotelGrid = document.getElementById("hotel__grid");
    let cityGridTable = document.getElementById('city_grid__hotel');
    let user = localStorage.getItem('exn-u-cookie');
    const lang = LanguageManager.getLanguage();
    user = JSON.parse(user);

    if (hotelGrid) {
        async function HotelDataPupolator() {
            try {
                const response = await fetch('/posts/h-post/', {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json',
                    },
                });

                if (response.ok) {
                    const result = await response.json();

                    let count = 0;
                    result.hotel_data.forEach(ex => {
                        const colItem = document.createElement('div');
                        colItem.classList.add('col', 'd-flex', 'flex-column', 'position-relative'); // Add position-relative to colItem for absolute positioning within it

                        // Image element
                        const image = document.createElement('img');
                        image.classList.add('img-fluid', 'custom-image');
                        image.alt = ex.hotel.name; // Default alt text for better UX
                        image.src = ex.image;
                        image.style.borderRadius = '10px';
                        image.loading = 'lazy';
                        image.style.cursor = ex.is_booked ? 'not-allowed' : 'pointer';

                        // Attach event listener to the image for redirection with security
                        image.addEventListener('click', () => {
                            const targetId = ex.room_id; // Use the room_id for redirection

                            // Validate the targetId to ensure it's safe and valid
                            if (targetId && /^[a-zA-Z0-9_-]+$/.test(targetId) && ex.is_booked == false) {
                                window.open(`/nakiese/${lang}/hotel/bed-detail/${targetId}`, '_blank', 'noopener,noreferrer');
                            }
                        });

                        // Favorite button
                        const favoriteButton = document.createElement('button');
                        favoriteButton.classList.add('btn', 'btn-light', 'rounded-pill', 'd-flex', 'align-items-center', 'justify-content-center', 'position-absolute', 'top-0', 'p-0', 'm-2'); // Position button on top-right
                        favoriteButton.style.width = '35px';
                        favoriteButton.style.height = '35px';

                        // Initial heart icon SVG (default color)
                        favoriteButton.innerHTML = `
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-suit-heart" viewBox="0 0 16 16">
                              <path d="m8 6.236-.894-1.789c-.222-.443-.607-1.08-1.152-1.595C5.418 2.345 4.776 2 4 2 2.324 2 1 3.326 1 4.92c0 1.211.554 2.066 1.868 3.37.337.334.721.695 1.146 1.093C5.122 10.423 6.5 11.717 8 13.447c1.5-1.73 2.878-3.024 3.986-4.064.425-.398.81-.76 1.146-1.093C14.446 6.986 15 6.131 15 4.92 15 3.326 13.676 2 12 2c-.777 0-1.418.345-1.954.852-.545.515-.93 1.152-1.152 1.595zm.392 8.292a.513.513 0 0 1-.784 0c-1.601-1.902-3.05-3.262-4.243-4.381C1.3 8.208 0 6.989 0 4.92 0 2.755 1.79 1 4 1c1.6 0 2.719 1.05 3.404 2.008.26.365.458.716.596.992a7.6 7.6 0 0 1 .596-.992C9.281 2.049 10.4 1 12 1c2.21 0 4 1.755 4 3.92 0 2.069-1.3 3.288-3.365 5.227-1.193 1.12-2.642 2.48-4.243 4.38z"/>
                            </svg>
                        `;

                        // Add event listener to favorite button for favorite functionality
                        favoriteButton.addEventListener('click', async (e) => {
                            e.stopPropagation(); // Prevent image click event

                            const heartIcon = favoriteButton.querySelector('svg');
                            const currentColor = heartIcon.getAttribute('fill');

                            try {
                                // API call for favorite
                                const response = await fetch('/posts/favourites/bed', {
                                    method: 'POST', // Correct HTTP method
                                    headers: {
                                        'Accept': 'application/json',
                                        'Content-Type': 'application/json', // JSON content type
                                    },
                                    credentials: 'include', // Include cookies
                                    body: JSON.stringify({ id: ex.room_id }), // Ensure ex.room_id is defined
                                });

                                if (response.ok) {
                                    if (currentColor === 'currentColor') {
                                        heartIcon.setAttribute('fill', '#e91e63'); // Dark pink for the icon
                                        favoriteButton.style.backgroundColor = '#ffcccb'; // Light pink background
                                    } else {
                                        heartIcon.setAttribute('fill', 'currentColor'); // Default color for the icon
                                        favoriteButton.style.backgroundColor = ''; // Reset background to default
                                    }
                                } else {
                                    console.error('API call failed:', response.status, response.statusText);
                                }
                            } catch (error) {
                                console.error('Error in API call:', error);
                            }
                        });



                        // Card body with hotel name and details
                        const cardBody = document.createElement('div');
                        cardBody.classList.add('card-body', 'p-0');

                        // Create a container for title and booking status
                        const titleContainer = document.createElement('div');
                        titleContainer.style.display = 'flex';
                        titleContainer.style.justifyContent = 'space-between';
                        titleContainer.style.alignItems = 'center';

                        // Booking status
                        const bookingStatus = document.createElement('span');
                        if (ex.is_booked) {
                            bookingStatus.className = 'badge rounded-pill text-bg-danger mt-2';
                            bookingStatus.textContent = 'Booked';
                        } else {

                            bookingStatus.className = 'badge rounded-pill text-bg-primary mt-2';
                            bookingStatus.textContent = 'Vacant';
                        }

                        // Hotel name as clickable link
                        const cardTitle = document.createElement('a');
                        cardTitle.id = `nak-${count}`;
                        cardTitle.style.fontSize = '1.6rem';
                        cardTitle.style.marginTop = '10px';
                        cardTitle.style.cursor = ex.is_booked ? 'not-allowed' : 'pointer'; // Disable link for booked status
                        cardTitle.classList.add('nav-link');
                        cardTitle.dataset.targetnak = ex.room_id; // Set data-targetnak
                        cardTitle.textContent = ex.hotel.name; // Default text for better UX

                        // Conditionally enable/disable link
                        if (ex.is_booked) {
                            cardTitle.style.pointerEvents = 'none'; // Disable clicks for booked status
                            cardTitle.style.color = 'gray'; // Visually indicate disabled state
                        } else {
                            // Attach event listener for redirection with security
                            cardTitle.addEventListener('click', () => {
                                const targetId = cardTitle.dataset.targetnak; // Get data-targetnak value

                                // Validate the targetId to ensure it's safe and valid
                                if (targetId && /^[a-zA-Z0-9_-]+$/.test(targetId)) {
                                    window.open(`/nakiese/${lang}/hotel/bed-detail/${targetId}`, '_blank', 'noopener,noreferrer');
                                } else {
                                    console.warn('Invalid or missing room_id for entry:', ex);
                                }
                            });
                        }

                        // Append cardTitle and bookingStatus to the container
                        titleContainer.appendChild(cardTitle);
                        titleContainer.appendChild(bookingStatus);

                        // Location text
                        const locationText = document.createElement('p');
                        locationText.classList.add('card-text');
                        const locationIcon = document.createElement('i');
                        locationIcon.classList.add('fi', 'fi-rr-marker');
                        locationText.appendChild(locationIcon);
                        locationText.textContent += ` ${ex.hotel.city.name}, ${ex.hotel.country}`;



                        // Bed text
                        const bedText = document.createElement('p');
                        bedText.classList.add('card-text');
                        const bedIcon = document.createElement('i');
                        bedIcon.classList.add('fi', 'fi-rr-bed-alt');
                        bedText.appendChild(bedIcon);
                        bedText.textContent += ` ${ex.room_type}`;

                        // Price and rating
                        const priceRatingText = document.createElement('p');
                        priceRatingText.classList.add('card-text');
                        priceRatingText.innerHTML = `<strong>$${ex.price || 'N/A'}</strong>/night ★${ex.avg_rating || '0'}`;

                        // Append elements to card body and column
                        cardBody.appendChild(titleContainer);
                        cardBody.appendChild(locationText);
                        cardBody.appendChild(bedText);
                        cardBody.appendChild(priceRatingText);
                        colItem.appendChild(image);
                        colItem.appendChild(favoriteButton); // Add favorite button to the column
                        colItem.appendChild(cardBody);

                        // Append the column to the hotel grid container
                        hotelGrid.appendChild(colItem);

                        count++;
                    });

                    const carousel = document.querySelector('.carousel');  // Select the carousel container

                    if (result?.cities && carousel) {
                        carousel.innerHTML = ''; // Clear previous cities (if needed)

                        result.cities.forEach(city => {
                            const cityElement = `
                                <div style="position: relative; display: inline-block; cursor: pointer;" class="city-container" data-city-id="${city.city_id}">
                                    <div style="position: absolute; top:20px; left: 40px;">
                                        <p class="text-light">${city.establishment}</p>
                                        <h4 class="text-light">${city.name}</h4>
                                    </div>
                                    <button class="btn btn-light rounded-pill explore-btn" style="position: absolute; bottom: 40px; left: 40px;" data-city-id="${city.city_id}">
                                        Explore
                                    </button>
                                    <img src="${city.image}" alt="${city.name}" class="rounded-3" draggable="false" style="width: 90%;">
                                </div>
                            `;

                            // Append the newly created city item to the carousel
                            carousel.insertAdjacentHTML('beforeend', cityElement);
                        });

                        // Add event listeners to handle redirection when clicking on the city container or the Explore button
                        document.addEventListener('click', function (event) {
                            const cityContainer = event.target.closest('.city-container');
                            const exploreButton = event.target.closest('.explore-btn');

                            if (exploreButton) {
                                const cityId = exploreButton.getAttribute('data-city-id');
                                window.location.href = `/nakiese/${lang}/city/explore?city_id=${cityId}`;
                            } else if (cityContainer) {
                                const cityId = cityContainer.getAttribute('data-city-id');
                                window.location.href = `/nakiese/${lang}/city/explore?city_id=${cityId}`;
                            }
                        });


                        // Define initCarousel function here since it's used in the reinitAfterDynamicContent
                        const initCarousel = () => {
                            let firstImg = carousel?.querySelectorAll("img")[0];
                            let arrowIcons = document.querySelectorAll(".wrapper i");

                            if (!firstImg || !arrowIcons.length) {
                                return;
                            }

                            const showHideIcons = () => {
                                let scrollWidth = carousel.scrollWidth - carousel.clientWidth;
                                arrowIcons[0].style.display = carousel.scrollLeft === 0 ? "none" : "block";
                                arrowIcons[1].style.display = carousel.scrollLeft === scrollWidth ? "none" : "block";
                            }

                            arrowIcons.forEach(icon => {
                                icon.addEventListener("click", () => {
                                    let firstImgWidth = firstImg.clientWidth + 14;
                                    carousel.scrollLeft += icon.id === "left" ? -firstImgWidth : firstImgWidth;
                                    setTimeout(() => showHideIcons(), 60);
                                });
                            });

                            carousel.addEventListener("mousedown", dragStart);
                            carousel.addEventListener("touchstart", dragStart);
                            document.addEventListener("mousemove", dragging);
                            carousel.addEventListener("touchmove", dragging);
                            document.addEventListener("mouseup", dragStop);
                            carousel.addEventListener("touchend", dragStop);

                            showHideIcons();
                        };

                        const reinitAfterDynamicContent = () => {
                            setTimeout(() => {
                                if (carousel) initCarousel(); // Now `initCarousel` is available here
                            }, 100); // Delay to ensure images are loaded
                        };

                        reinitAfterDynamicContent();  // Call after content is added
                    }
                    if (result?.cities && cityGridTable) {
                        cityGridTable.innerHTML = '';

                        cityPopulator(result.cities, cityGridTable);

                    }
                } else {
                    butterup.toast({
                        title: 'Something went wrong',
                        message: "please ",
                        type: 'error',
                    });
                }
            } catch (error) {
                butterup.toast({
                    title: 'Unknown error Occured',
                    message: error,
                    type: 'error',
                });
            }
        }

        HotelDataPupolator();

    }

    if (document.getElementById("nak__grid-2")) {
        async function BedDetailPopulator() {
            try {
                const currentUrl = window.location.pathname;
                const postId = currentUrl.split("/").pop();
                const a1 = document.getElementById("a__1");
                const a2 = document.getElementById("a__2");
                const roomPrs = document.getElementById("room_prs");
                const gTotal = document.getElementById("g__total");
                const subTotal = document.getElementById("subtotal");


                const gridItem = document.getElementById("grid__items2");
                const addToCheckout = document.getElementById("add-to__chk");
                const addToReserve = document.getElementById("add-to__reserve");
                const favbtn = document.getElementById("favbtn");

                if (postId) {
                    const apiUrl = `/posts/sp-h-post/${postId}/`;

                    const response = await fetch(apiUrl, {
                        method: 'GET',
                        headers: {
                            'Accept': 'application/json',
                        },
                    });

                    if (!response.ok) throw new Error('Failed to fetch hotel details');

                    const data = await response.json();

                    roomPrs.innerText = `${data.specific_bed.price}$`;
                    gTotal.innerText = `${data.specific_bed.price}$`;
                    subTotal.innerText = `${data.specific_bed.price}$`;
                    addToCheckout.dataset.id = data.specific_bed.room_id;
                    addToReserve.dataset.id = data.specific_bed.room_id;
                    favbtn.dataset.id = data.specific_bed.room_id;
                    document.getElementById("av_rating").innerText = data.
                        specific_bed.avg_rating;
                    let nkShare = document.getElementById('nak-share');
                    nkShare.dataset.id = data.specific_bed.room_id;


                    const container = document.getElementById('image-container');
                    const reviewGridinn1 = document.getElementById('review__grid_inn_1');
                    const reviewGridinn2 = document.getElementById('review__grid_inn_2');
                    const reviewGrid2 = document.getElementById('review__grid_2');
                    const Amenities = document.getElementById('amenities');
                    container.innerHTML = ''; // Clear previous content
                    reviewGridinn1.innerHTML = ''; // Clear previous content
                    reviewGridinn2.innerHTML = ''; // Clear previous content
                    reviewGrid2.innerHTML = ''; // Clear previous content

                    // Process hotel images
                    if (data.specific_bed?.hotel?.images && Array.isArray(data.specific_bed.hotel.images)) {
                        const images = data.specific_bed.hotel.images;
                        container.innerHTML = generateImageGrid(images);
                    }

                    // Append hotel address details
                    if (data.specific_bed?.hotel?.city && data.specific_bed.hotel.country && data.specific_bed.hotel.address) {
                        a1.innerText = `${data.specific_bed.hotel.city.name}, ${data.specific_bed.hotel.country}`;
                        a2.innerText = data.specific_bed.hotel.address;
                    }

                    if (data?.specific_bed?.room_amenities) {
                        Amenities.innerHTML = '';
                        data.specific_bed.room_amenities.forEach(
                            (ex, index) => {
                                let Li = document.createElement('li');
                                Li.classList.add('badge', 'text-bg-primary', 'p-2', 'me-2');
                                Li.style.fontSize = '16px';
                                Li.innerText = ex.name;
                                Amenities.append(Li);
                            }
                        );

                        // bedDescription.innerText = data.specific_bed.description;
                    } else {
                        let Para = document.createElement('p');
                        Para.innerText = "Room has not amenities";
                        Amenities.append(Para);
                    }

                    let reviews = data.specific_bed.reviews; // Assuming this is populated with your data
                    let reviewsPerPage = 3; // Number of reviews to show initially

                    // Function to display a limited number of reviews
                    function displayReviews(limit) {
                        reviewGrid2.innerHTML = ''; // Clear the review grid
                        for (let i = 0; i < Math.min(limit, reviews.length); i++) {
                            let review = reviews[i];
                            let reviewBed = createReviewElement(review);
                            reviewGrid2.appendChild(reviewBed);
                        }
                    }

                    // Function to create a review element
                    function createReviewElement(review) {
                        let reviewBed = document.createElement('div');
                        reviewBed.classList.add('mb-3');

                        let flexContainer = document.createElement('div');
                        flexContainer.classList.add('d-flex', 'justify-content-start', 'align-items-center');

                        let imageContainer = document.createElement('div');
                        let image = document.createElement('img');
                        image.src = "https://dummyimage.com/50x50/000/fff";
                        image.classList.add('rounded-pill');
                        image.alt = "image";
                        imageContainer.appendChild(image);

                        let textContainer = document.createElement('div');
                        textContainer.classList.add('ms-3');

                        let reviewerName = document.createElement('p');
                        reviewerName.classList.add('mb-1');
                        reviewerName.innerText = `${review.user.first_name} ${review.user.last_name}` || "Anonymous";
                        textContainer.appendChild(reviewerName);

                        let reviewDate = document.createElement('p');
                        reviewDate.classList.add('mb-1');
                        reviewDate.innerText = new Date(review.date_of_notice).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long'
                        });
                        textContainer.appendChild(reviewDate);

                        flexContainer.appendChild(imageContainer);
                        flexContainer.appendChild(textContainer);

                        let commentParagraph = document.createElement('p');
                        commentParagraph.style.marginTop = '10px';
                        commentParagraph.style.marginLeft = '65px';
                        commentParagraph.innerText = review.comment || "No comment available.";

                        reviewBed.appendChild(flexContainer);
                        reviewBed.appendChild(commentParagraph);

                        return reviewBed;
                    }

                    // Function to create the Load More button
                    function createLoadMoreButton() {
                        let loadMoreBtn = document.createElement('button');
                        loadMoreBtn.id = 'loadMoreBtn';
                        loadMoreBtn.classList.add('btn', 'btn-outline-dark', 'mt-3', 'mb-4');
                        loadMoreBtn.innerText = 'Load More Reviews';
                        loadMoreBtn.addEventListener('click', showAllReviews);
                        return loadMoreBtn;
                    }

                    // Function to create the Close Reviews button
                    function createCloseButton() {
                        let closeBtn = document.createElement('button');
                        closeBtn.id = 'closeBtn';
                        closeBtn.classList.add('btn', 'btn-outline-dark', 'mt-3', 'mb-4');
                        closeBtn.innerText = 'Close Reviews';
                        closeBtn.addEventListener('click', function () {
                            displayReviews(reviewsPerPage);
                            if (reviews.length > reviewsPerPage) {
                                reviewGrid2.appendChild(createLoadMoreButton()); // Show the Load More button again
                            }
                            closeBtn.remove(); // Remove the Close button
                        });
                        return closeBtn;
                    }

                    // Function to show all reviews
                    function showAllReviews() {
                        displayReviews(reviews.length); // Show all reviews
                        let closeButton = createCloseButton();
                        reviewGrid2.appendChild(closeButton); // Add the Close Reviews button
                        document.getElementById('loadMoreBtn').remove(); // Remove the Load More button
                    }

                    // Initial load: Show first 3 reviews and possibly the Load More button
                    displayReviews(reviewsPerPage);
                    if (reviews.length > reviewsPerPage) {
                        reviewGrid2.appendChild(createLoadMoreButton());
                    }

                    if (data.specific_bed?.reviews && data.specific_bed.reviews.length > 0) {
                        let ratingSums = {};
                        let ratingCounts = {};

                        // Loop through each review and accumulate ratings for each review type
                        data.specific_bed.reviews.forEach(review => {
                            review.rating.forEach(rating => {
                                if (!ratingSums[rating.name]) {
                                    ratingSums[rating.name] = 0;  // Initialize sum for each review type
                                    ratingCounts[rating.name] = 0;  // Initialize count for each review type
                                }
                                ratingSums[rating.name] += parseFloat(rating.rate);  // Add the rating
                                ratingCounts[rating.name] += 1;  // Count the occurrence
                            });
                        });

                        let sumOfAverage = 0;
                        for (let type in ratingSums) {
                            let averageRating = (ratingSums[type] / ratingCounts[type]).toFixed(1);  // Calculate average and fix to 1 decimal place
                            sumOfAverage += parseFloat(averageRating);  // Convert the averageRating back to a number and add it to sumOfAverage

                            // Create a new div for the review type name
                            let nameDiv = document.createElement('div');
                            let nameParagraph = document.createElement('p');
                            nameParagraph.classList.add('mb-1');
                            nameParagraph.textContent = type;  // The review type (e.g., Cleanliness)
                            nameDiv.appendChild(nameParagraph);

                            // Create a new div for the average rating
                            let valueDiv = document.createElement('div');
                            let valueParagraph = document.createElement('p');
                            valueParagraph.classList.add('mb-1');
                            valueParagraph.textContent = averageRating;  // The average rating (rounded to 1 decimal place)
                            valueDiv.appendChild(valueParagraph);

                            // Append both divs to the reviewGrid
                            reviewGridinn1.appendChild(nameDiv);
                            reviewGridinn2.appendChild(valueDiv);
                        }


                    } else {
                        let reviewContainer = document.getElementById("review__container");
                        reviewContainer.innerHTML = "";
                        reviewContainer.style.marginBottom = "50px";
                        let img = document.createElement('img');
                        img.src = '/static/images/image-review.png';
                        img.style.maxWidth = '300px';
                        img.style.maxHeight = '300px';
                        img.alt = 'Not reviews available';
                        reviewContainer.append(img);
                        document.getElementById("av_rating").innerText = "0";
                    }

                    // Grid Items Creation
                    if (gridItem && data.all_beds && Array.isArray(data.all_beds) && data.all_beds.length > 0) {
                        gridItem.innerHTML = generateGridItems(data.all_beds);
                    } else {
                        if (gridItem) {
                            gridItem.style.width = "100%";
                            let H6 = document.createElement('h6');
                            H6.innerText = "No beds available at the moment. Please check back later.";
                            H6.style.width = "100%";
                            gridItem.innerHTML = ''; // Clear any existing content
                            gridItem.appendChild(H6); // Append the new H3 element
                        }
                    }



                }
            } catch (error) {

            }
        }

        BedDetailPopulator();

        // Helper functions

        function generateGridItems(beds) {
            let gridHTML = '';
            beds.forEach((ex, index) => {
                gridHTML += `
                    <div class="col d-flex flex-column">
                        <a id="nak-${ex.room_id}" data-targetnak="${ex.room_id}" class="w-100 h-100" style="cursor: pointer;">
                          <img src="${ex.image}" class="rounded-4 w-100" style="height:200px; object-fit:cover;" alt="Room image">
                        </a>                        <div class="card-body p-0">
                        <a id="nak-${ex.room_id}-title" class="fs-4 nav-link" data-targetnak="${ex.room_id}" style="cursor: pointer;">
                            ${ex.hotel.name}
                        </a>
                            <p class="card-text"><i class="fi fi-rr-marker"></i> ${ex.hotel.city.name}, ${ex.hotel.country}</p>
                            <p class="card-text"><i class="fi fi-rr-bed-alt"></i> ${ex.room_type}</p>
                            <p class="card-text"><strong>$${ex.price}</strong>/nuit ★${ex.avg_rating || '0'}</p>
                        </div>
                    </div>`;
            });

            return gridHTML;
        }


        // Event delegation for clicks on card titles
        // Event listener for room detail links (image or hotel name)
        document.addEventListener('click', function (e) {
            const lang = LanguageManager.getLanguage();

            // Traverse up to find the closest <a> tag with id starting with "nak-"
            const anchor = e.target.closest('a[id^="nak-"]');

            if (anchor) {
                const targetId = anchor.dataset.targetnak;
                if (targetId) {
                    window.location.href = `/nakiese/${lang}/hotel/bed-detail/${targetId}`;
                }
            }
        });
    }

});

function generateImageGrid(images) {
    const isLargeScreen = window.innerWidth >= 992;
    let htmlContent = "";

    if (isLargeScreen) {

        if (images.length === 1) {
            htmlContent = `
                <div class="row">
                    <div class="col-lg-12">
                        <img src="${images[0].image}" alt="image" style="height:450px;" class="w-100 rounded-4">
                    </div>
                </div>`;
        } else if (images.length === 2) {
            htmlContent = `
                <div class="row">
                    ${images.map(img => `
                        <div class="col-lg-6">
                            <img src="${img.image}" alt="image" style="height:450px;" class="w-100 rounded-4">
                        </div>
                    `).join('')}
                </div>`;
        } else if (images.length === 3) {
            htmlContent = `
                <div class="row">
                    <div class="col-lg-6">
                        <img src="${images[0].image}" alt="image" class="img-fluid w-100 h-100 rounded-4">
                    </div>
                    <div class="col-lg-6">
                        <div class="row mb-3">
                            ${images.slice(1, 3).map(img => `
                                <div class="col-lg-6">
                                    <img src="${img.image}" alt="image" class="img-fluid w-100 h-100 rounded-4">
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>`;
        } else if (images.length === 4) {
            htmlContent = `
                <div class="row">
                    <div class="col-lg-6">
                        <img src="${images[0].image}" alt="image" class="img-fluid w-100 h-100 rounded-4">
                    </div>
                    <div class="col-lg-6">
                        <div class="row mb-3">
                            ${images.slice(1, 3).map(img => `
                                <div class="col-lg-6">
                                    <img src="${img.image}" alt="image" class="img-fluid w-100 h-100 rounded-4">
                                </div>
                            `).join('')}
                        </div>
                        <div class="row pt-1">
                            <div class="col-lg-6">
                                <img src="${images[3].image}" alt="image" class="img-fluid w-100 h-100 rounded-4">
                            </div>
                        </div>
                    </div>
                </div>`;
        } else if (images.length >= 5) {
            htmlContent = `
                <div class="row">
                    <div class="col-lg-6">
                        <img src="${images[0].image}" alt="image" class="img-fluid w-100 h-100 rounded-4">
                    </div>
                    <div class="col-lg-6">
                        <div class="row mb-3">
                            ${images.slice(1, 3).map(img => `
                                <div class="col-lg-6">
                                    <img src="${img.image}" alt="image" class="img-fluid w-100 h-100 rounded-4">
                                </div>
                            `).join('')}
                        </div>
                        <div class="row pt-1">
                            ${images.slice(3, 5).map(img => `
                                <div class="col-lg-6">
                                    <img src="${img.image}" alt="image" class="img-fluid w-100 h-100 rounded-4">
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>`;
        }
    } else {
        htmlContent = `
    <div class="p-3">
        <div id="carouselExampleControls" class="carousel slide" data-bs-ride="carousel">
            <div class="carousel-inner">
                ${images.map((image, index) => `
                    <div class="carousel-item ${index === 0 ? 'active' : ''} pe-2">
                        <img src="${image.image}" alt="image" class="w-100 rounded-4" style="height:300px;">
                    </div>
                `).join('')}
            </div>
            <button class="carousel-control-prev" type="button" data-bs-target="#carouselExampleControls" data-bs-slide="prev">
                <span class="carousel-control-prev-icon" aria-hidden="true"></span>
                <span class="visually-hidden">Previous</span>
            </button>
            <button class="carousel-control-next" type="button" data-bs-target="#carouselExampleControls" data-bs-slide="next">
                <span class="carousel-control-next-icon" aria-hidden="true"></span>
                <span class="visually-hidden">Next</span>
            </button>
        </div>
    </div>
`;

    }

    return htmlContent;
}


document.addEventListener("DOMContentLoaded", () => {
    const tableGrid = document.getElementById("table__grid");
    const lang = LanguageManager.getLanguage();
    let user = localStorage.getItem('exn-u-cookie');
    user = JSON.parse(user);

    if (tableGrid) {
        async function hotelDataPopulator() {
            try {
                const response = await fetch('/posts/t-post/', {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json',
                    },
                });

                if (!response.ok) {
                    return;
                }
                let cityGridTable = document.getElementById('city_grid__table');
                const result = await response.json();
                if (!result?.table_data) return;

                let fragment = document.createDocumentFragment(); // Use a document fragment for batch DOM updates
                let count = 0;

                result.table_data.forEach(ex => {

                    if (!ex || !ex.restaurant) {
                        console.warn(`Missing data for entry:`, ex);
                        return;
                    }

                    // Create elements
                    const colItem = document.createElement('div');
                    colItem.classList.add('col', 'd-flex', 'flex-column', 'position-relative');

                    const image = document.createElement('img');
                    image.classList.add('rounded-2', 'mb-2');
                    image.alt = ex.restaurant.name;
                    image.style.cursor = ex.is_booked ? 'not-allowed' : 'pointer';
                    image.style.height = '200px';
                    image.loading = 'lazy';
                    image.src = ex.images;

                    // Favorite button
                    const favoriteButton = document.createElement('button');
                    favoriteButton.classList.add('btn', 'btn-light', 'rounded-pill', 'd-flex', 'align-items-center', 'justify-content-center', 'position-absolute', 'top-0', 'p-0', 'm-2'); // Position button on top-right
                    favoriteButton.style.width = '35px';
                    favoriteButton.style.height = '35px';

                    // Initial heart icon SVG (default color)
                    favoriteButton.innerHTML = `
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-suit-heart" viewBox="0 0 16 16">
                          <path d="m8 6.236-.894-1.789c-.222-.443-.607-1.08-1.152-1.595C5.418 2.345 4.776 2 4 2 2.324 2 1 3.326 1 4.92c0 1.211.554 2.066 1.868 3.37.337.334.721.695 1.146 1.093C5.122 10.423 6.5 11.717 8 13.447c1.5-1.73 2.878-3.024 3.986-4.064.425-.398.81-.76 1.146-1.093C14.446 6.986 15 6.131 15 4.92 15 3.326 13.676 2 12 2c-.777 0-1.418.345-1.954.852-.545.515-.93 1.152-1.152 1.595zm.392 8.292a.513.513 0 0 1-.784 0c-1.601-1.902-3.05-3.262-4.243-4.381C1.3 8.208 0 6.989 0 4.92 0 2.755 1.79 1 4 1c1.6 0 2.719 1.05 3.404 2.008.26.365.458.716.596.992a7.6 7.6 0 0 1 .596-.992C9.281 2.049 10.4 1 12 1c2.21 0 4 1.755 4 3.92 0 2.069-1.3 3.288-3.365 5.227-1.193 1.12-2.642 2.48-4.243 4.38z"/>
                        </svg>
                    `;

                    // Add event listener to favorite button for favorite functionality
                    favoriteButton.addEventListener('click', async (e) => {
                        e.stopPropagation(); // Prevent image click event

                        const heartIcon = favoriteButton.querySelector('svg');
                        const currentColor = heartIcon.getAttribute('fill');

                        try {
                            // API call for favorite
                            const response = await fetch('/posts/favourites/table', {
                                method: 'POST', // Correct HTTP method
                                headers: {
                                    'Accept': 'application/json',
                                    'Content-Type': 'application/json', // JSON content type
                                },
                                credentials: 'include', // Include cookies
                                body: JSON.stringify({ id: ex.table_id }), // Ensure ex.room_id is defined
                            });

                            if (response.ok) {
                                if (currentColor === 'currentColor') {
                                    heartIcon.setAttribute('fill', '#e91e63'); // Dark pink for the icon
                                    favoriteButton.style.backgroundColor = '#ffcccb'; // Light pink background
                                } else {
                                    heartIcon.setAttribute('fill', 'currentColor'); // Default color for the icon
                                    favoriteButton.style.backgroundColor = ''; // Reset background to default
                                }
                            } else {
                                console.error('API call failed:', response.status, response.statusText);
                            }
                        } catch (error) {
                            console.error('Error in API call:', error);
                        }
                    });


                    const cardBody = document.createElement('div');
                    cardBody.classList.add('card-body', 'p-0');

                    const titleContainer = document.createElement('div');
                    titleContainer.classList.add('d-flex', 'justify-content-between', 'align-items-center');

                    const cardTitle = document.createElement('a');
                    cardTitle.textContent = ex.restaurant.name;
                    cardTitle.id = `nak-${count}`;
                    cardTitle.style.fontSize = '1.6rem';
                    cardTitle.style.marginTop = '10px';
                    cardTitle.style.cursor = ex.is_booked ? 'not-allowed' : 'pointer';
                    cardTitle.classList.add('nav-link', 'mt-0');
                    cardTitle.dataset.targetnak = ex.table_id;

                    const sideContent = document.createElement('div');
                    sideContent.classList.add('d-flex', 'justify-content-between', 'align-items-center');

                    const ratingText = document.createElement('h5');
                    ratingText.textContent = `★${ex.rating || '0'}`;
                    ratingText.style.marginTop = '10px';
                    // Booking status
                    const bookingStatus = document.createElement('span');

                    if (ex.is_booked) {
                        bookingStatus.className = 'badge rounded-pill text-bg-danger me-2 mt-1';
                        bookingStatus.textContent = 'Booked';
                    } else {

                        bookingStatus.className = 'badge rounded-pill text-bg-primary  me-2 mt-1';
                        bookingStatus.textContent = 'Vacant';
                    }
                    sideContent.appendChild(bookingStatus);
                    sideContent.appendChild(ratingText);

                    const locationText = document.createElement('p');
                    locationText.classList.add('card-text', 'mb-0');
                    locationText.innerHTML = `<i class="fi fi-rr-marker"></i> ${ex.restaurant.city.name}, ${ex.restaurant.country}`;

                    const bedText = document.createElement('p');
                    bedText.classList.add('card-text', 'mb-1', 'mt-2');
                    bedText.innerHTML = `<b>Persons<b/> ${ex.capacity}`;

                    const priceText = document.createElement('p');
                    priceText.classList.add('card-text', 'mb-1');
                    priceText.innerHTML = `<strong>$${ex.price || '0'} </strong> / table`;

                    // Append elements to card body and colItem

                    titleContainer.appendChild(cardTitle);

                    titleContainer.appendChild(sideContent);
                    cardBody.appendChild(titleContainer);
                    cardBody.appendChild(locationText);
                    cardBody.appendChild(bedText);
                    cardBody.appendChild(priceText);
                    colItem.appendChild(image);
                    colItem.appendChild(favoriteButton);
                    colItem.appendChild(cardBody);

                    // Append colItem to fragment (not directly to the DOM)
                    fragment.appendChild(colItem);

                    // Define a function for redirection
                    const redirectToDetails = () => {
                        const targetId = ex.table_id;

                        // Validate the targetId to ensure it's not malicious
                        if (targetId && /^[a-zA-Z0-9_-]+$/.test(targetId) && ex.is_booked == false) {
                            const url = `/nakiese/${lang}/resturant/table/${targetId}`;

                            // Open in a new tab with added security measures
                            const newWindow = window.open(url, '_blank', 'noopener,noreferrer');

                            // Optionally check if the window was successfully opened
                            if (!newWindow) {
                                console.warn('Failed to open new window for entry:', ex);
                            }
                        }


                        else {
                            console.warn('Missing or invalid room_id for entry:', ex);
                        }
                    };

                    // Set up redirection on both image and title click
                    cardTitle.addEventListener('click', redirectToDetails);
                    image.addEventListener('click', redirectToDetails);



                    count++;
                });
                // Append fragment to tableGrid in one operation
                tableGrid.appendChild(fragment);
                cityGridTable.innerHTML = '';
                cityPopulator(result.cities, cityGridTable);


            } catch (error) {

            }
        }


        // Debounce the population function to avoid rapid firing
        const debouncedHotelDataPopulator = debounce(hotelDataPopulator, 300);
        debouncedHotelDataPopulator();
    }

    // Debounce utility function
    function debounce(func, wait) {
        let timeout;
        return function (...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    if (document.getElementById('nak-grid-3')) {

        async function BedDetailPopulator() {
            try {
                const currentUrl = window.location.pathname;
                const postId = currentUrl.split("/").pop();
                const a1 = document.getElementById("t__1");
                const a2 = document.getElementById("t__2");
                const totalPayable = document.getElementById("total__payable");
                const gridItem = document.getElementById("grid__items2");

                if (postId) {
                    const apiUrl = `/posts/sp-t-post/${postId}/`;

                    const response = await fetch(apiUrl, {
                        method: 'GET',
                        headers: {
                            'Accept': 'application/json',

                        },
                    });

                    if (!response.ok) throw new Error('Failed to fetch hotel details');


                    const data = await response.json();
                    const container = document.getElementById('image-container');
                    const reviewGridinn1 = document.getElementById('review__grid_inn_1');
                    const reviewGridinn2 = document.getElementById('review__grid_inn_2');
                    const reviewGrid2 = document.getElementById('review__grid_2');
                    const bedDescription = document.getElementById('table_description');
                    const menuGrid = document.getElementById('menu__grid');
                    const city_grid__table = document.getElementById('table__for');
                    const sub__total = document.getElementById('sub__total');
                    const table__capacity = document.getElementById('table__capacity');
                    const table__price = document.getElementById('table__price');
                    const addToCart = document.getElementById('add-to__chk');
                    const addToReserve = document.getElementById('add-to__reserve');
                    const favbtn = document.getElementById('favbtn');
                    const nakShare = document.getElementById('nak-share');
                    container.innerHTML = ''; // Clear previous content
                    reviewGridinn1.innerHTML = ''; // Clear previous content
                    reviewGridinn2.innerHTML = ''; // Clear previous content
                    reviewGrid2.innerHTML = ''; // Clear previous content
                    menuGrid.innerHTML = ''; // Clear previous content

                    totalPayable.innerText = `${data.specific_table.price}$`;
                    totalPayable.innerText = `${data.specific_table.price}$`;
                    table__price.innerText = `${data.specific_table.price}$`;
                    sub__total.innerText = `${data.specific_table.price}$`;
                    favbtn.dataset.id = data.specific_table.table_id;
                    nakShare.dataset.id = data.specific_table.table_id;
                    addToCart.dataset.id = data.specific_table.table_id;
                    addToReserve.dataset.id = data.specific_table.table_id;

                    // Process hotel images
                    if (data.specific_table?.restaurant?.images && Array.isArray(data.specific_table.restaurant.images)) {
                        const images = data.specific_table.restaurant.images;
                        container.innerHTML = generateImageGrid(images);
                    }

                    if (data.specific_table.capacity) {
                        city_grid__table.innerText = data.specific_table.capacity;
                        table__capacity.innerText = data.specific_table.capacity;
                    }


                    // Append hotel address details
                    if (data.specific_table?.restaurant?.city && data.specific_table?.restaurant.country) {
                        a1.innerText = `${data.specific_table.restaurant.city.name}, ${data.specific_table.restaurant.country}`;
                        a2.innerText = data.specific_table.restaurant.address;
                    }
                    // Append hotel Description
                    if (data.specific_table?.restaurant?.description) {
                        bedDescription.innerText = '';
                        bedDescription.innerText = data.specific_table.restaurant.description;
                    }
                    // All Relation Menu
                    if (data?.menu) {
                        menuGrid.innerHTML = generateGridItem_a(data.menu)
                    }

                    let reviews = data.specific_table.review; // Assuming this is populated with your data
                    let reviewsPerPage = 3; // Number of reviews to show initially

                    // Function to display a limited number of reviews
                    function displayReviews(limit) {
                        reviewGrid2.innerHTML = ''; // Clear the review grid
                        for (let i = 0; i < Math.min(limit, reviews.length); i++) {
                            let review = reviews[i];
                            let reviewBed = createReviewElement(review);
                            reviewGrid2.appendChild(reviewBed);
                        }
                    }

                    // Function to create a review element
                    function createReviewElement(review) {


                        let reviewBed = document.createElement('div');
                        reviewBed.classList.add('mb-3');

                        let flexContainer = document.createElement('div');
                        flexContainer.classList.add('d-flex', 'justify-content-start', 'align-items-center');

                        let imageContainer = document.createElement('div');
                        let image = document.createElement('img');
                        image.src = review.user.profile_url || "https://dummyimage.com/50x50/000/fff";
                        image.classList.add('rounded-pill');
                        image.alt = "image";
                        imageContainer.appendChild(image);

                        let textContainer = document.createElement('div');
                        textContainer.classList.add('ms-3');

                        let reviewerName = document.createElement('p');
                        reviewerName.classList.add('mb-1');
                        reviewerName.innerText = `${review.user.first_name} ${review.user.last_name}` || "Anonymous";
                        textContainer.appendChild(reviewerName);

                        let reviewDate = document.createElement('p');
                        reviewDate.classList.add('mb-1');
                        reviewDate.innerText = new Date(review.date_of_notice).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long'
                        });
                        textContainer.appendChild(reviewDate);

                        flexContainer.appendChild(imageContainer);
                        flexContainer.appendChild(textContainer);

                        let commentParagraph = document.createElement('p');
                        commentParagraph.style.marginTop = '10px';
                        commentParagraph.style.marginLeft = '65px';
                        commentParagraph.innerText = review.comment || "No comment available.";

                        reviewBed.appendChild(flexContainer);
                        reviewBed.appendChild(commentParagraph);

                        return reviewBed;
                    }

                    // Function to create the Load More button
                    function createLoadMoreButton() {
                        let loadMoreBtn = document.createElement('button');
                        loadMoreBtn.id = 'loadMoreBtn';
                        loadMoreBtn.classList.add('btn', 'btn-outline-dark', 'mt-3', 'mb-4');
                        loadMoreBtn.innerText = 'Load More Reviews';
                        loadMoreBtn.addEventListener('click', showAllReviews);
                        return loadMoreBtn;
                    }

                    // Function to create the Close Reviews button
                    function createCloseButton() {
                        let closeBtn = document.createElement('button');
                        closeBtn.id = 'closeBtn';
                        closeBtn.classList.add('btn', 'btn-outline-dark', 'mt-3', 'mb-4');
                        closeBtn.innerText = 'Close Reviews';
                        closeBtn.addEventListener('click', function () {
                            displayReviews(reviewsPerPage);
                            if (reviews.length > reviewsPerPage) {
                                reviewGrid2.appendChild(createLoadMoreButton()); // Show the Load More button again
                            }
                            closeBtn.remove(); // Remove the Close button
                        });
                        return closeBtn;
                    }

                    // Function to show all reviews
                    function showAllReviews() {
                        displayReviews(reviews.length); // Show all reviews
                        let closeButton = createCloseButton();
                        reviewGrid2.appendChild(closeButton); // Add the Close Reviews button
                        document.getElementById('loadMoreBtn').remove(); // Remove the Load More button
                    }

                    // Initial load: Show first 3 reviews and possibly the Load More button
                    displayReviews(reviewsPerPage);
                    if (reviews.length > reviewsPerPage) {
                        reviewGrid2.appendChild(createLoadMoreButton());
                    }

                    if (data.specific_table?.review) {
                        let ratingSums = {};
                        let ratingCounts = {};

                        // Loop through each review and accumulate ratings for each review type
                        data.specific_table.review.forEach(review => {
                            review.rating.forEach(rating => {
                                if (!ratingSums[rating.name]) {
                                    ratingSums[rating.name] = 0;  // Initialize sum for each review type
                                    ratingCounts[rating.name] = 0;  // Initialize count for each review type
                                }
                                ratingSums[rating.name] += parseFloat(rating.rate);  // Add the rating
                                ratingCounts[rating.name] += 1;  // Count the occurrence
                            });
                        });

                        let sumOfAverage = 0;
                        for (let type in ratingSums) {
                            let averageRating = (ratingSums[type] / ratingCounts[type]).toFixed(1);  // Calculate average and fix to 1 decimal place
                            sumOfAverage += parseFloat(averageRating);  // Convert the averageRating back to a number and add it to sumOfAverage

                            // Create a new div for the review type name
                            let nameDiv = document.createElement('div');
                            let nameParagraph = document.createElement('p');
                            nameParagraph.classList.add('mb-1');
                            nameParagraph.textContent = type;  // The review type (e.g., Cleanliness)
                            nameDiv.appendChild(nameParagraph);

                            // Create a new div for the average rating
                            let valueDiv = document.createElement('div');
                            let valueParagraph = document.createElement('p');
                            valueParagraph.classList.add('mb-1');
                            valueParagraph.textContent = averageRating;  // The average rating (rounded to 1 decimal place)
                            valueDiv.appendChild(valueParagraph);

                            // Append both divs to the reviewGrid
                            reviewGridinn1.appendChild(nameDiv);
                            reviewGridinn2.appendChild(valueDiv);
                        }
                        document.getElementById("av_rating").innerText = (sumOfAverage / 5).toFixed(1);
                        document.getElementById("av_rating_b").innerHTML = `${(sumOfAverage / 5).toFixed(1)} 
                        <span class="ms-1">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor"
                                class="bi bi-star-fill" viewBox="0 0 16 16">
                                <path
                                    d="M3.612 15.443c-.386.198-.824-.149-.746-.592l.83-4.73L.173 6.765c-.329-.314-.158-.888.283-.95l4.898-.696L7.538.792c.197-.39.73-.39.927 0l2.184 4.327 4.898.696c.441.062.612.636.282.95l-3.522 3.356.83 4.73c.078.443-.36.79-.746.592L8 13.187l-4.389 2.256z" />
                            </svg>
                        </span>
                        `;

                    } else {
                        let reviewContainer = document.getElementById("review__container");
                        reviewContainer.innerHTML = "";
                        reviewContainer.style.marginBottom = "50px";
                        let img = document.createElement('img');
                        img.src = '/static/images/image-review.png';
                        img.style.maxWidth = '300px';
                        img.style.maxHeight = '300px';
                        img.alt = 'Not reviews available';
                        reviewContainer.append(img);
                        document.getElementById("av_rating").innerText = "0";
                    }

                    // Grid Items Creation

                }
            } catch (error) {

            }
        }

        BedDetailPopulator();

        function generateGridItem_a(tables) {
            let gridHTML = '';
            tables.forEach((ex, index) => {
                gridHTML += `
                <div class="mb-3 mt-3">
                    <div class="card mb-3" style="max-width: 540px; border:none;">
                        <div class="row g-0">
                            <div class="col-md-4">
                                <img src=${ex.image} class="rounded-4 w-100" style="height:170px;" alt="${ex.name}">
                            </div>
                            <div class="col-md-8">
                                <div class="card-body p-4">
                                <p class="card-text mb-1" style="font-size:12px; font-weight:800;  color:#03b303;">${ex.category.toUpperCase()}</p>
                                <h5 class="card-title mb-4">${ex.name}</h5>
                                <p class="card-text" style="font-weight:bold;font-size:1.6rem">
                                    ${(Number(ex.price) || 0).toFixed(0)}$
                                </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                `;
            });

            return gridHTML;
        }


    }

    // Detail handle
});




// Helper function to get input values by ID
function getInputValue(inputId) {
    const element = document.getElementById(inputId);
    return element ? element.value : '';
}

// Function to parse date in "d-m-Y" format to "YYYY-MM-DD"
function parseDateDMY(dateString) {
    const [day, month, year] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day); // month is 0-based in JavaScript Date

    if (isNaN(date.getTime())) {
        throw new Error('Invalid date format. Please use a valid date in the format dd-mm-yyyy.');
    }

    // Set to noon to avoid timezone issues and return formatted date
    date.setHours(12);
    return date.toISOString().split('T')[0];
}

// Main search function
function searchHotelRooms(section = '') {
    const cityName = getInputValue('cityInput');
    const availabilityFromInput = getInputValue('dateInputg');
    const availabilityTillInput = section === 'a' ? getInputValue('dateInputa') : '';
    const capacity = getInputValue('capacityInput') || ''; // Optional field

    // Validate city name
    if (!cityName.trim()) {
        alert('Please provide a city name for the search.');
        return;
    }

    // Validate date inputs based on the section
    if (!availabilityFromInput) {
        alert('Please provide a start date for availability.');
        return;
    }
    if (section === 'a' && !availabilityTillInput) {
        alert('Please provide an end date for availability.');
        return;
    }

    // Parse and format the dates to "YYYY-MM-DD"
    let formattedAvailabilityFrom, formattedAvailabilityTill;
    try {
        formattedAvailabilityFrom = parseDateDMY(availabilityFromInput);
        if (section === 'a') {
            formattedAvailabilityTill = parseDateDMY(availabilityTillInput);
        }
    } catch (error) {
        alert(error.message);
        return;
    }

    // Construct query parameters
    const queryParams = new URLSearchParams({
        city_name: cityName,
        availability_from: formattedAvailabilityFrom,
        availability_till: section === 'a' ? formattedAvailabilityTill : '',
        capacity: capacity
    });

    // Determine the appropriate search URL based on the section
    const searchUrl = section === 'a' ? `/nakiese/${LanguageManager.getLanguage()}/search-h` : `/nakiese/${LanguageManager.getLanguage()}/search-res`;
    window.location.href = `${searchUrl}?${queryParams.toString()}`;
}

// Event listener for the search button
// Select both buttons by ID
const searchButton = document.getElementById('searchButton');
const searchButtonRes = document.getElementById('searchButton-res');


// Define the click handler function
const handleSearchClick = (event) => {
    event.preventDefault(); // Prevent form submission

    // Determine which section to search based on available elements
    if (document.getElementById('search__a')) {
        searchHotelRooms('a'); // Redirect for availability-based search
    } else if (document.getElementById('search__b')) {
        searchHotelRooms(); // Redirect for reservation-based search
    }
};

// Attach the event listener to both buttons
searchButton.addEventListener('click', handleSearchClick);
searchButtonRes.addEventListener('click', handleSearchClick);
