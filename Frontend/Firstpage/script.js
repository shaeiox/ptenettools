// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize the page
    initPage();
});

// Main initialization function
function initPage() {
    // Handle loading animation
    handleLoading();
    
    // Create particle effects
    createParticles();
    
    // Add event listeners for service boxes
    initServiceBoxes();
    
    // Add glowing effect to buttons on hover
    initButtonEffects();
}

// Loading screen animation
function handleLoading() {
    const loadingScreen = document.querySelector('.loading');
    
    // Hide loading screen after content is loaded
    window.addEventListener('load', function() {
        setTimeout(function() {
            loadingScreen.classList.add('hide');
            
            // Remove loading screen from DOM after animation completes
            setTimeout(function() {
                loadingScreen.remove();
            }, 500);
        }, 500);
    });
    
    // Fallback: Hide loading screen if it takes too long
    setTimeout(function() {
        if (loadingScreen) {
            loadingScreen.classList.add('hide');
        }
    }, 3000);
}

// Create floating particles in the background
function createParticles() {
    const particlesContainer = document.getElementById('particles');
    const colors = ['#00c853', '#0091ea', '#ffd600']; // ADSL, LTE, FTTH colors
    const particleCount = 15;
    
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.classList.add('particle');
        
        // Random properties
        const size = Math.random() * 100 + 50; // 50-150px
        const posX = Math.random() * 100; // 0-100%
        const posY = Math.random() * 100; // 0-100%
        const color = colors[Math.floor(Math.random() * colors.length)];
        const animationDuration = Math.random() * 10 + 10; // 10-20s
        const animationDelay = Math.random() * 5; // 0-5s
        
        // Apply styles
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        particle.style.left = `${posX}%`;
        particle.style.top = `${posY}%`;
        particle.style.backgroundColor = color;
        particle.style.animationDuration = `${animationDuration}s`;
        particle.style.animationDelay = `${animationDelay}s`;
        particle.style.opacity = `${Math.random() * 0.2}`; // Low opacity
        
        // Add to container
        particlesContainer.appendChild(particle);
    }
}

// Initialize service boxes effects
function initServiceBoxes() {
    const boxes = document.querySelectorAll('.box');
    
    boxes.forEach(box => {
        // Add 3D tilt effect on mouse movement
        box.addEventListener('mousemove', function(e) {
            const boxRect = box.getBoundingClientRect();
            const mouseX = e.clientX - boxRect.left;
            const mouseY = e.clientY - boxRect.top;
            
            // Calculate rotation based on mouse position
            const rotateY = ((mouseX / boxRect.width) - 0.5) * 10; // -5 to 5 degrees
            const rotateX = ((mouseY / boxRect.height) - 0.5) * -10; // -5 to 5 degrees
            
            // Apply transform
            box.style.transform = `
                perspective(1000px) 
                rotateX(${rotateX}deg) 
                rotateY(${rotateY}deg) 
                translateZ(10px)
            `;
        });
        
        // Reset transform on mouse leave
        box.addEventListener('mouseleave', function() {
            box.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) translateZ(0)';
        });
    });
}

// Initialize button effects
function initButtonEffects() {
    const buttons = document.querySelectorAll('.btn-service');
    
    buttons.forEach(button => {
        // Add click ripple effect
        button.addEventListener('click', function(e) {
            // Create ripple element
            const ripple = document.createElement('span');
            ripple.classList.add('ripple');
            
            // Position ripple at click point
            const rect = button.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            ripple.style.left = `${x}px`;
            ripple.style.top = `${y}px`;
            
            // Add ripple to button
            button.appendChild(ripple);
            
            // Remove ripple after animation
            setTimeout(() => {
                ripple.remove();
            }, 600);
        });
    });
}

// Add existing monitoring functionalities from original script
async function fetchBandwidthData() {
    try {
        const response = await fetch('http://127.0.0.1:5000/api/bandwidth');
        const data = await response.json();
        updateBandwidthTable(data.applications);
    } catch (error) {
        console.error('خطا در دریافت داده‌های پهنای باند:', error);
        document.getElementById('bandwidth-data').innerHTML = `
            <tr>
                <td colspan="4">خطا در اتصال به سرور مانیتورینگ. لطفاً مطمئن شوید سرویس پایتون در حال اجراست.</td>
            </tr>
        `;
    }
}

function updateBandwidthTable(applications) {
    const tableBody = document.getElementById('bandwidth-data');
    
    if (!applications || applications.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="4">هیچ برنامه‌ای در حال استفاده از شبکه نیست.</td>
            </tr>
        `;
        return;
    }
    
    let tableHtml = '';
    applications.forEach(app => {
        const total = (app.download + app.upload).toFixed(2);
        tableHtml += `
            <tr>
                <td>${app.name}</td>
                <td>${app.download} MB</td>
                <td>${app.upload} MB</td>
                <td>${total} MB</td>
            </tr>
        `;
    });
    
    tableBody.innerHTML = tableHtml;
}

function initBandwidthMonitoring() {
    // Initial data fetch
    fetchBandwidthData();
    
    // Update every 5 seconds
    setInterval(fetchBandwidthData, 5000);
}

// Terminal functionality from original script
function initTerminal() {
    const terminal = document.getElementById('terminal');
    if (!terminal) return;
    
    terminal.style.display = 'block';
    
    // Terminal typing effect
    let terminalText = "minime % ls -la\n";
    terminalText += "total 24\n";
    terminalText += "drwxr-xr-x  10 user  staff   320B  4 آبان 15:32 .\n";
    terminalText += "drwxr-xr-x   3 user  staff    96B  4 آبان 14:28 ..\n";
    terminalText += "drwxr-xr-x  12 user  staff   384B  4 آبان 15:30 .git\n";
    terminalText += "-rw-r--r--   1 user  staff   1.5K  4 آبان 15:29 config.json\n";
    terminalText += "drwxr-xr-x   4 user  staff   128B  4 آبان 15:28 logs\n";
    terminalText += "-rwxr-xr-x   1 user  staff   2.3K  4 آبان 15:32 server.js\n";
    terminalText += "drwxr-xr-x   8 user  staff   256B  4 آبان 15:31 utils\n";
    terminalText += "\nminime % _";
    
    let i = 0;
    const terminalContent = document.querySelector('.terminal-content');
    if (!terminalContent) return;
    
    const typingSpeed = 20; // Typing speed
    
    function typeText() {
        if (i < terminalText.length) {
            terminalContent.innerHTML = terminalText.substring(0, i) + '<span id="cursor">_</span>';
            i++;
            setTimeout(typeText, typingSpeed);
        }
    }
    
    typeText();
    
    // Cursor blinking
    setInterval(() => {
        const cursor = document.getElementById('cursor');
        if (cursor) {
            cursor.style.visibility = cursor.style.visibility === 'hidden' ? 'visible' : 'hidden';
        }
    }, 500);
}

// Show different pages functionality from original script
function showPage(pageId) {
    // Hide all pages
    const pages = document.querySelectorAll('.dashboard-page');
    pages.forEach(page => {
        page.classList.remove('active');
    });
    
    // Show target page
    const targetPage = document.getElementById(pageId);
    if (targetPage) {
        targetPage.classList.add('active');
    }
    
    // Initialize terminal if selected
    if (pageId === 'terminal-page') {
        initTerminal();
    }
    
    // Initialize bandwidth monitoring if selected
    if (pageId === 'monitoring-page') {
        initBandwidthMonitoring();
    }
}

// Toggle menu functionality from original script
function toggleMenu() {
    const sidebar = document.getElementById('sidebar');
    const menuIcon = document.getElementById('menu-icon');
    
    if (sidebar && menuIcon) {
        sidebar.classList.toggle('open');
        
        if (sidebar.classList.contains('open')) {
            menuIcon.innerHTML = `
                <path d="M18 6L6 18M6 6l12 12" stroke-width="2" stroke-linecap="round"/>
            `;
        } else {
            menuIcon.innerHTML = `
                <path d="M21 18H3M21 12H3M21 6H3" stroke-width="2" stroke-linecap="round"/>
            `;
        }
    }
}

// Update date and time from original script
function updateDateTime() {
    const timestampElement = document.querySelector('.timestamp');
    if (!timestampElement) return;
    
    const now = new Date();
    const year = 1403; // Persian equivalent year
    const month = 8; // Persian equivalent month
    const day = 4; // Persian equivalent day
    
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');
    
    timestampElement.textContent = `${year}/${month.toString().padStart(2, '0')}/${day.toString().padStart(2, '0')} - ${hours}:${minutes}:${seconds}`;
}

// Call updateDateTime function if needed
function startClock() {
    const timestampElement = document.querySelector('.timestamp');
    if (timestampElement) {
        setInterval(updateDateTime, 1000);
        updateDateTime();
    }
}