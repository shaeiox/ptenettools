// When the page is loaded, initialize animations and elements
document.addEventListener('DOMContentLoaded', function() {
    // Initialize UI elements
    initUI();
    
    // Initialize animation sequence
    initIntroAnimation();
    
    // Add event listeners
    setupEventListeners();
});

// Initialize UI elements
function initUI() {
    // Set focus to username field after animation completes
    setTimeout(() => {
        const usernameInput = document.getElementById('username');
        if (usernameInput) {
            usernameInput.focus();
        }
    }, 1500);
    
    // Initialize any window elements
    if (document.getElementById("window1")) {
        document.getElementById("window1").classList.add("show");
    }
}

// Handle intro animation sequence
function initIntroAnimation() {
    // Animation is primarily handled by CSS
    console.log("Intro animation started");
    
    // Add a subtle transition to the background
    const area = document.querySelector('.area');
    if (area) {
        setTimeout(() => {
            area.classList.add('animated');
        }, 200);
    }
}

// Setup event listeners for interactive elements
function setupEventListeners() {
    // Handle enter key in username field
    const usernameInput = document.getElementById('username');
    if (usernameInput) {
        usernameInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                handleLogin();
            }
        });
    }
    
    // Handle submit button click
    const submitBtn = document.getElementById('submitBtn');
    if (submitBtn) {
        submitBtn.addEventListener('click', handleLogin);
    }
}

/**
 * Validate if input is a valid phone number
 * @param {string} input - The user input to validate
 * @returns {boolean} - True if valid phone number, false otherwise
 */
function isValidPhoneNumber(input) {
    // Remove any non-digit characters for validation
    const cleanedInput = input.replace(/\D/g, '');
    
    // Check if input consists of numbers only and has a valid length
    // Adjust the regex based on your specific phone number requirements
    return /^\d{10,12}$/.test(cleanedInput);
}

/**
 * Display validation error message
 * @param {string} message - The error message to display
 */
function showValidationError(message) {
    const validationMessage = document.getElementById('validation-message');
    const inputField = document.getElementById('username');
    
    if (validationMessage) {
        validationMessage.textContent = message;
        validationMessage.classList.add('show');
    }
    
    if (inputField) {
        inputField.classList.add('error');
        inputField.classList.add('shake');
        
        // Remove shake class after animation completes
        setTimeout(() => {
            inputField.classList.remove('shake');
        }, 500);
    }
}

/**
 * Clear validation errors
 */
function clearValidationError() {
    const validationMessage = document.getElementById('validation-message');
    const inputField = document.getElementById('username');
    
    if (validationMessage) {
        validationMessage.textContent = '';
        validationMessage.classList.remove('show');
    }
    
    if (inputField) {
        inputField.classList.remove('error');
    }
}

/**
 * Handle login action with phone number validation
 * Redirects to Homepage if valid phone number is entered
 */
function handleLogin() {
    const input = document.getElementById('username').value;
    
    // Clear previous validation errors
    clearValidationError();
    
    // Simple presence validation
    if (!input.trim()) {
        showValidationError('Please enter your phone number');
        return;
    }
    
    // Validate if input is a valid phone number
    if (isValidPhoneNumber(input)) {
        console.log("Valid phone number, saving username and redirecting to Homepage");
        
        // If using Electron IPC
        if (typeof require !== 'undefined') {
            try {
                const { ipcRenderer } = require('electron');
                // Save username via IPC
                ipcRenderer.send('save-username', input);
                return;
            } catch (error) {
                console.error('Error using Electron IPC:', error);
            }
        }
        
        // Fallback if not using Electron
        window.location.href = "../Homepage/index.html";
        return;
    } else {
        showValidationError('Please enter a valid phone number (10-12 digits)');
        console.log("Invalid phone number format");
        return;
    }
}

// Window switching functions
function showWindow2() {
    document.getElementById("window1").classList.remove("show");
    document.getElementById("window2").classList.add("show");
}

function showWindow1() {
    document.getElementById("window2").classList.remove("show");
    document.getElementById("window1").classList.add("show");
}