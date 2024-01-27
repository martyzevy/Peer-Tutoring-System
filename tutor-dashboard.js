let tutorId = null;
let pairingCheckInterval;
let isOnline = false;

function login() {
    tutorId = document.getElementById('tutor-id-input').value;
    if (tutorId && tutorId.trim().length === 24) {
        document.getElementById('login-section').style.display = 'none';
        document.getElementById('availability-section').style.display = 'block';

        fetch(`https://aptutor2-28cfb689813f.herokuapp.com/get-tutor/${tutorId}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Invalid Tutor ID');
                }
                return response.json();
            })
            .then(data => {
                console.log(data);
                isOnline = data.online; // Assuming 'data.online' is a boolean
                updateAvailabilityDisplay(); // Update the UI based on the online status
                startCheckingForPairing(); // Start checking for pairing
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Please enter a valid Tutor ID.');
                // Reset the UI if login failed
                document.getElementById('login-section').style.display = 'block';
                document.getElementById('availability-section').style.display = 'none';
            });
    } else {
        alert('Please enter a valid Tutor ID.');
    }
}



function toggleAvailability() {
    console.log(`Toggling availability for Tutor ID: ${tutorId}`);
    fetch(`https://aptutor2-28cfb689813f.herokuapp.com/toggle-tutor-availability/${tutorId}`, { method: 'PATCH' })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('Server response:', data);
            alert(data.message);
            isOnline = data.available;
            updateAvailabilityDisplay();
        })
        .catch(error => console.error('Error toggling availability:', error));
}

function updateAvailabilityDisplay() {
    const statusText = document.getElementById('status-text');
    const availabilityButton = document.getElementById('availability-button');

    if (isOnline) {
        statusText.textContent = 'Online';
        availabilityButton.textContent = 'Go Offline';
        startCheckingForPairing();
    } else {
        statusText.textContent = 'Offline';
        availabilityButton.textContent = 'Go Online';
        stopCheckingForPairing();
    }
}

function checkForPairing() {
    fetch(`https://aptutor2-28cfb689813f.herokuapp.com/check-tutor-pairing/${tutorId}`)
        .then(response => response.json())
        .then(data => {             
            if (data.offer) {
                displayOffer(data.subject);
                stopCheckingForPairing();
            }
        })
        .catch(error => console.error('Error checking for pairing:', error));
}

function displayOffer(index) {
    const subjects = [
        "AP Calculus AB", "AP Calculus BC", "AP Physics I",
        "AP Physics II", "AP Physics C", "AP Biology",
        "AP Chemistry", "AP English Language", "AP English Literature",
        "AP US History", "AP World History", "AP Macroeconomics",
        "AP Microeconomics"
    ];
    //console.log("index = ", subjects[index]);
    const message = `Offer to teach ${subjects[index]}. Do you accept?`;
    document.getElementById('gig-offer-message').textContent = message;
    document.getElementById('gig-offer-section').style.display = 'block';
    document.getElementById('signup-section').style.display = 'none';
}

function joinZoom() {
    // Open the Zoom link in a new tab
    window.open(`https://zoom.us/j/${zoomID}`, '_blank');
}

function acceptGig() {
    fetch(`https://aptutor2-28cfb689813f.herokuapp.com/accept-gig/${tutorId}`, { method: 'PATCH' })
        .then(response => response.json())
        .then(data => window.open(`https://zoom.us/j/${data.zoomID}`, '_blank'))
        .catch(error => console.error('Error accepting gig:', error));
    hideOffer();
    toggleAvailability();
}

function declineGig() {
    fetch(`https://aptutor2-28cfb689813f.herokuapp.com/decline-gig/${tutorId}`, { method: 'PATCH' })
        .then(response => response.json())
        .then(data => startCheckingForPairing())
        .catch(error => console.error('Error declining gig:', error));
    hideOffer();
}

function hideOffer() {
    document.getElementById('gig-offer-section').style.display = 'none';
    document.getElementById('signup-section').style.display = 'block';
}

function startCheckingForPairing() {
    if (pairingCheckInterval) clearInterval(pairingCheckInterval);
    pairingCheckInterval = setInterval(checkForPairing, 5000);
}

function stopCheckingForPairing() {
    clearInterval(pairingCheckInterval);
}

document.addEventListener('DOMContentLoaded', function() {
    const subjects = [
        "AP Calculus AB", "AP Calculus BC", "AP Physics I",
        "AP Physics II", "AP Physics C", "AP Biology",
        "AP Chemistry", "AP English Language", "AP English Literature",
        "AP US History", "AP World History", "AP Macroeconomics",
        "AP Microeconomics"
    ];

    const container = document.getElementById('subject-checkboxes');

    subjects.forEach((subject, index) => {
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `subject${index}`;
        checkbox.name = 'subjects';
        checkbox.value = index; // Value set to index for simplicity

        const label = document.createElement('label');
        label.htmlFor = `subject${index}`;
        label.textContent = subject;

        container.appendChild(checkbox);
        container.appendChild(label);
        container.appendChild(document.createElement('br')); // Line break for readability
    });
});

function signupTutor() {
    const _name = document.getElementById('tutor-name-input').value;
    const _zoomID = document.getElementById('tutor-zoomID-input').value;

    // Initialize an array of 13 elements, all set to false
    const subjectBooleans = new Array(13).fill(false);

    // For each subject, check if the corresponding checkbox is checked
    subjects.forEach((_, index) => {
        const checkbox = document.getElementById(`subject${index}`);
        if (checkbox && checkbox.checked) {
            subjectBooleans[index] = true;
        }
    });

    const tutorData = {
        _name,
        _zoomID,
        _subjects: subjectBooleans
    };

    fetch('https://aptutor2-28cfb689813f.herokuapp.com/create-tutor', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(tutorData)
    })
    .then(response => response.json())
    .then(data => {
        // After successful sign-up
        const signupMessageElement = document.getElementById('signup-message');
        signupMessageElement.innerHTML = `
            Tutor account created successfully! Use this ID to login: 
            <span class="tutor-id">${data.tutorId}</span>. 
            <span class="important">Do not forget or share this ID</span>, 
            it serves as your username and password.
        `;
    })
    .catch(error => console.error('Error signing up tutor:', error));
}

const subjects = [
    "AP Calculus AB", "AP Calculus BC", "AP Physics I",
    "AP Physics II", "AP Physics C", "AP Biology",
    "AP Chemistry", "AP English Language", "AP English Literature",
    "AP US History", "AP World History", "AP Macroeconomics",
    "AP Microeconomics"
];

function generateSubjectCheckboxes() {
    const container = document.getElementById('subject-checkboxes');
    subjects.forEach((subject, index) => {
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `subject${index}`;
        checkbox.value = subject;

        const label = document.createElement('label');
        label.htmlFor = `subject${index}`;
        label.textContent = subject;

        container.appendChild(checkbox);
        container.appendChild(label);
        container.appendChild(document.createElement('br')); // Line break for readability

        subjects.forEach((subject, index) => {
            const container = document.createElement('div');
            container.classList.add('checkbox-container');
        
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = `subject${index}`;
            checkbox.name = 'subjects';
            checkbox.value = subject;
        
            const label = document.createElement('label');
            label.htmlFor = `subject${index}`;
            label.textContent = subject;
        
            container.appendChild(checkbox);
            container.appendChild(label);
            document.getElementById('subject-checkboxes').appendChild(container);
        });        

    });
}

    // ... existing code ...



// ... existing code ...



generateSubjectCheckboxes();


