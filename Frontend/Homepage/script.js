// Custom cursor effect - DISABLED
const cursor = document.querySelector('.cursor-fx');
if (cursor) {
    cursor.style.display = 'none';
}

// Detect if running in Electron
const isElectron = () => {
    return window && window.process && window.process.type;
};

// Apply Electron-specific fixes
function applyElectronFixes() {
    if (!isElectron()) return;
    
    // Add electron class to body if not already added
    if (!document.body.classList.contains('electron')) {
        document.body.classList.add('electron');
    }
    
    // Ensure all internal links open within Electron
    document.querySelectorAll('a').forEach(link => {
        const href = link.getAttribute('href');
        
        // Skip links without href or javascript: links
        if (!href || href.startsWith('javascript:')) return;
        
        // Handle internal links that should open within Electron
        if (href.includes('pishgaman.net') || 
            href.includes('speedtest.pishgaman.net') ||
            link.classList.contains('internal-link')) {
            
            // Remove existing event listeners by cloning and replacing the node
            const newLink = link.cloneNode(true);
            link.parentNode.replaceChild(newLink, link);
            
            newLink.addEventListener('click', function(e) {
                e.preventDefault();
                
                // Get the URL from the href attribute
                const url = this.getAttribute('href');
                
                // Save current sidebar state
                const sidebar = document.querySelector('.sidebar');
                if (sidebar) {
                    const isExpanded = sidebar.offsetWidth > 60;
                    try {
                        localStorage.setItem('sidebarExpanded', isExpanded ? 'true' : 'false');
                    } catch (e) {
                        console.error('Error saving sidebar state:', e);
                    }
                }
                
                // Determine title and icon based on the URL
                let title, iconClass;
                
                if (url.includes('speedtest.pishgaman.net')) {
                    title = 'تست سرعت';
                    iconClass = 'fas fa-tachometer-alt';
                } else if (url.includes('pishgaman.net/category') && 
                          url.includes('%d9%85%d9%82%d8%a7%d9%84%d8%a7%d8%aa-%d8%a2%d9%85%d9%88%d8%b2%d8%b4%db%8c')) {
                    title = 'مقالات آموزشی';
                    iconClass = 'fas fa-graduation-cap';
                } else if (url === 'https://pishgaman.net/' || url === 'http://pishgaman.net/') {
                    title = 'سایت پیشگامان';
                    iconClass = 'fas fa-globe';
                } else if (url.includes('pishgaman.net') && url.includes('%d8%aa%d9%85%d8%a7%d8%b3-%d8%a8%d8%a7-%d9%85%d8%a7')) {
                    title = 'تماس با ما';
                    iconClass = 'fas fa-phone-alt';
                } else {
                    // Default values
                    title = 'محتوای وب';
                    iconClass = 'fas fa-globe';
                }
                
                // Create modal window for the content
                createContentModal(title, url, iconClass);
                
                // Close the sidebar after clicking
                if (sidebar && sidebar.classList.contains('active')) {
                    closeSidebar();
                }
            });
        }
    });
}

// Fix sidebar hover and click functionality
const sidebar = document.querySelector('.sidebar');
const hamburger = document.querySelector('.hamburger');

// Function to toggle sidebar
function toggleSidebar() {
    if (sidebar) {
        sidebar.classList.toggle('active');
        
        // Store sidebar state in localStorage
        const isActive = sidebar.classList.contains('active');
        try {
            localStorage.setItem('sidebarExpanded', isActive ? 'true' : 'false');
        } catch (e) {
            console.error('Error saving sidebar state:', e);
        }
    }
}

// Function to close sidebar
function closeSidebar() {
    if (sidebar) {
        sidebar.classList.remove('active');
        try {
            localStorage.setItem('sidebarExpanded', 'false');
        } catch (e) {
            console.error('Error saving sidebar state:', e);
        }
    }
}

// Add click handler for hamburger menu
if (hamburger) {
    hamburger.addEventListener('click', function(e) {
        e.stopPropagation(); // Prevent event bubbling
        toggleSidebar();
    });
}

// Close sidebar when clicking outside of it
document.addEventListener('click', function(e) {
    // Check if the click is outside the sidebar
    if (sidebar && !sidebar.contains(e.target)) {
        closeSidebar();
    }
});

// Add keyboard shortcut to toggle sidebar (Alt+S)
document.addEventListener('keydown', function(e) {
    if (e.altKey && e.key === 's') {
        toggleSidebar();
    }
});

// Initialize sidebar state from localStorage
document.addEventListener('DOMContentLoaded', function() {
    if (!sidebar) return;
    
    try {
        const sidebarState = localStorage.getItem('sidebarExpanded');
        
        if (sidebarState === 'true') {
            sidebar.classList.add('active');
        } else {
            // Ensure the sidebar is in the default state
            sidebar.classList.remove('active');
            localStorage.setItem('sidebarExpanded', 'false');
        }
    } catch (e) {
        console.error('Error reading sidebar state:', e);
        // Default to closed state if there's an error
        sidebar.classList.remove('active');
    }
    
    // Apply Electron-specific fixes
    applyElectronFixes();
    
    // Add Python server status check if running in Electron
    if (isElectron()) {
        checkPythonServerStatus();
    }
});

// Function to create a modal window for content
function createContentModal(title, contentSrc, iconClass) {
    // Hide system status widget when showing modal
    const statsWidget = document.querySelector('.stats-widget');
    if (statsWidget) {
        statsWidget.style.display = 'none';
    }
    
    // Create modal container
    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'modal-overlay';
    modalOverlay.style.position = 'fixed';
    modalOverlay.style.top = '0';
    modalOverlay.style.left = '0';
    modalOverlay.style.width = '100%';
    modalOverlay.style.height = '100%';
    modalOverlay.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    modalOverlay.style.backdropFilter = 'blur(5px)';
    modalOverlay.style.zIndex = '2000';
    modalOverlay.style.display = 'flex';
    modalOverlay.style.justifyContent = 'center';
    modalOverlay.style.alignItems = 'center';
    modalOverlay.style.opacity = '0';
    modalOverlay.style.transition = 'opacity 0.3s ease';
    
    // Create content window container
    const contentWindow = document.createElement('div');
    contentWindow.className = 'content-window';
    contentWindow.style.width = '85%';
    contentWindow.style.height = '85%';
    contentWindow.style.backgroundColor = '#0c0e1b';
    contentWindow.style.borderRadius = '12px';
    contentWindow.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.5), 0 0 20px var(--accent-transparent)';
    contentWindow.style.overflow = 'hidden';
    contentWindow.style.display = 'flex';
    contentWindow.style.flexDirection = 'column';
    contentWindow.style.border = '1px solid var(--accent-transparent)';
    contentWindow.style.transform = 'scale(0.95)';
    contentWindow.style.transition = 'transform 0.3s ease';
    
    // Create content header
    const contentHeader = document.createElement('div');
    contentHeader.className = 'content-header';
    contentHeader.style.padding = '12px 20px';
    contentHeader.style.backgroundColor = '#0d101e';
    contentHeader.style.borderBottom = '1px solid var(--accent-transparent)';
    contentHeader.style.display = 'flex';
    contentHeader.style.justifyContent = 'space-between';
    contentHeader.style.alignItems = 'center';
    
    // Content title
    const contentTitle = document.createElement('div');
    contentTitle.className = 'content-title';
    contentTitle.style.display = 'flex';
    contentTitle.style.alignItems = 'center';
    contentTitle.style.gap = '10px';
    
    const titleIcon = document.createElement('i');
    titleIcon.className = iconClass;
    titleIcon.style.color = 'var(--accent-color)';
    
    const titleText = document.createElement('span');
    titleText.textContent = title;
    titleText.style.color = 'var(--text-color)';
    titleText.style.fontWeight = '500';
    
    contentTitle.appendChild(titleIcon);
    contentTitle.appendChild(titleText);
    
    // Window controls with modern minimal design
    const windowControls = document.createElement('div');
    windowControls.className = 'window-controls';
    windowControls.style.display = 'flex';
    windowControls.style.gap = '4px';
    windowControls.style.marginRight = '5px';
    
    // Modern minimal window controls (Windows arrangement)
    const minimizeBtn = document.createElement('button');
    minimizeBtn.className = 'window-btn minimize';
    minimizeBtn.style.width = '34px';
    minimizeBtn.style.height = '34px';
    minimizeBtn.style.border = 'none';
    minimizeBtn.style.background = 'transparent';
    minimizeBtn.style.cursor = 'pointer';
    minimizeBtn.style.display = 'flex';
    minimizeBtn.style.justifyContent = 'center';
    minimizeBtn.style.alignItems = 'center';
    minimizeBtn.style.borderRadius = '4px';
    minimizeBtn.style.transition = 'all 0.2s cubic-bezier(0.25, 1, 0.5, 1)';
    minimizeBtn.style.outline = 'none';
    minimizeBtn.title = 'Minimize';
    minimizeBtn.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
            <line x1="2" y1="7" x2="12" y2="7" stroke="var(--text-color)" stroke-width="1.5" stroke-linecap="round" class="minimize-line">
                <animate attributeName="x1" values="2;4;2" dur="0.4s" begin="minimize.mouseenter" fill="freeze" />
                <animate attributeName="x2" values="12;10;12" dur="0.4s" begin="minimize.mouseenter" fill="freeze" />
            </line>
        </svg>
    `;
    
    const maximizeBtn = document.createElement('button');
    maximizeBtn.className = 'window-btn maximize';
    maximizeBtn.style.width = '34px';
    maximizeBtn.style.height = '34px';
    maximizeBtn.style.border = 'none';
    maximizeBtn.style.background = 'transparent';
    maximizeBtn.style.cursor = 'pointer';
    maximizeBtn.style.display = 'flex';
    maximizeBtn.style.justifyContent = 'center';
    maximizeBtn.style.alignItems = 'center';
    maximizeBtn.style.borderRadius = '4px';
    maximizeBtn.style.transition = 'all 0.2s cubic-bezier(0.25, 1, 0.5, 1)';
    maximizeBtn.style.outline = 'none';
    maximizeBtn.title = 'Maximize';
    maximizeBtn.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="2" y="2" width="10" height="10" rx="1" stroke="var(--text-color)" stroke-width="1.5" stroke-linecap="round" fill="none" class="maximize-rect">
                <animate attributeName="width" values="10;8;10" dur="0.4s" begin="maximize.mouseenter" fill="freeze" />
                <animate attributeName="height" values="10;8;10" dur="0.4s" begin="maximize.mouseenter" fill="freeze" />
                <animate attributeName="x" values="2;3;2" dur="0.4s" begin="maximize.mouseenter" fill="freeze" />
                <animate attributeName="y" values="2;3;2" dur="0.4s" begin="maximize.mouseenter" fill="freeze" />
            </rect>
        </svg>
    `;
    
    const closeBtn = document.createElement('button');
    closeBtn.className = 'window-btn close';
    closeBtn.style.width = '34px';
    closeBtn.style.height = '34px';
    closeBtn.style.border = 'none';
    closeBtn.style.background = 'transparent';
    closeBtn.style.cursor = 'pointer';
    closeBtn.style.display = 'flex';
    closeBtn.style.justifyContent = 'center';
    closeBtn.style.alignItems = 'center';
    closeBtn.style.borderRadius = '4px';
    closeBtn.style.transition = 'all 0.2s cubic-bezier(0.25, 1, 0.5, 1)';
    closeBtn.style.outline = 'none';
    closeBtn.title = 'Close';
    closeBtn.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
            <g class="close-icon">
                <line x1="3" y1="3" x2="11" y2="11" stroke="var(--text-color)" stroke-width="1.5" stroke-linecap="round">
                    <animate attributeName="x1" values="3;4;3" dur="0.4s" begin="close.mouseenter" fill="freeze" />
                    <animate attributeName="y1" values="3;4;3" dur="0.4s" begin="close.mouseenter" fill="freeze" />
                    <animate attributeName="x2" values="11;10;11" dur="0.4s" begin="close.mouseenter" fill="freeze" />
                    <animate attributeName="y2" values="11;10;11" dur="0.4s" begin="close.mouseenter" fill="freeze" />
                </line>
                <line x1="11" y1="3" x2="3" y2="11" stroke="var(--text-color)" stroke-width="1.5" stroke-linecap="round">
                    <animate attributeName="x1" values="11;10;11" dur="0.4s" begin="close.mouseenter" fill="freeze" />
                    <animate attributeName="y1" values="3;4;3" dur="0.4s" begin="close.mouseenter" fill="freeze" />
                    <animate attributeName="x2" values="3;4;3" dur="0.4s" begin="close.mouseenter" fill="freeze" />
                    <animate attributeName="y2" values="11;10;11" dur="0.4s" begin="close.mouseenter" fill="freeze" />
                </line>
            </g>
        </svg>
    `;
    
    windowControls.appendChild(minimizeBtn);
    windowControls.appendChild(maximizeBtn);
    windowControls.appendChild(closeBtn);
    
    contentHeader.appendChild(contentTitle);
    contentHeader.appendChild(windowControls);
    
    // Add browser-like navigation controls if this is the user panel
    let contentFrame;
    let browserControls;
    
    if (title === 'پنل کاربری') {
        // Create browser controls container
        browserControls = document.createElement('div');
        browserControls.className = 'browser-controls';
        browserControls.style.padding = '8px 15px';
        browserControls.style.backgroundColor = '#0a0d1a';
        browserControls.style.borderBottom = '1px solid var(--accent-transparent)';
        browserControls.style.display = 'flex';
        browserControls.style.alignItems = 'center';
        browserControls.style.gap = '10px';
        
        // Back button
        const backBtn = document.createElement('button');
        backBtn.className = 'browser-btn';
        backBtn.style.width = '32px';
        backBtn.style.height = '32px';
        backBtn.style.border = 'none';
        backBtn.style.background = 'transparent';
        backBtn.style.cursor = 'pointer';
        backBtn.style.display = 'flex';
        backBtn.style.justifyContent = 'center';
        backBtn.style.alignItems = 'center';
        backBtn.style.borderRadius = '4px';
        backBtn.style.transition = 'all 0.2s ease';
        backBtn.title = 'Back';
        backBtn.innerHTML = '<i class="fas fa-arrow-left" style="color: var(--text-color);"></i>';
        
        // Forward button
        const forwardBtn = document.createElement('button');
        forwardBtn.className = 'browser-btn';
        forwardBtn.style.width = '32px';
        forwardBtn.style.height = '32px';
        forwardBtn.style.border = 'none';
        forwardBtn.style.background = 'transparent';
        forwardBtn.style.cursor = 'pointer';
        forwardBtn.style.display = 'flex';
        forwardBtn.style.justifyContent = 'center';
        forwardBtn.style.alignItems = 'center';
        forwardBtn.style.borderRadius = '4px';
        forwardBtn.style.transition = 'all 0.2s ease';
        forwardBtn.title = 'Forward';
        forwardBtn.innerHTML = '<i class="fas fa-arrow-right" style="color: var(--text-color);"></i>';
        
        // Refresh button
        const refreshBtn = document.createElement('button');
        refreshBtn.className = 'browser-btn';
        refreshBtn.style.width = '32px';
        refreshBtn.style.height = '32px';
        refreshBtn.style.border = 'none';
        refreshBtn.style.background = 'transparent';
        refreshBtn.style.cursor = 'pointer';
        refreshBtn.style.display = 'flex';
        refreshBtn.style.justifyContent = 'center';
        refreshBtn.style.alignItems = 'center';
        refreshBtn.style.borderRadius = '4px';
        refreshBtn.style.transition = 'all 0.2s ease';
        refreshBtn.title = 'Refresh';
        refreshBtn.innerHTML = '<i class="fas fa-sync-alt" style="color: var(--text-color);"></i>';
        
        // Address bar
        const addressBar = document.createElement('div');
        addressBar.className = 'address-bar';
        addressBar.style.flex = '1';
        addressBar.style.height = '32px';
        addressBar.style.backgroundColor = '#161b33';
        addressBar.style.borderRadius = '16px';
        addressBar.style.display = 'flex';
        addressBar.style.alignItems = 'center';
        addressBar.style.padding = '0 15px';
        addressBar.style.color = 'var(--text-color)';
        addressBar.style.fontSize = '14px';
        addressBar.style.fontFamily = 'Arial, sans-serif';
        addressBar.style.overflow = 'hidden';
        addressBar.style.whiteSpace = 'nowrap';
        addressBar.style.textOverflow = 'ellipsis';
        addressBar.style.border = '1px solid rgba(255, 255, 255, 0.1)';
        
        // Site info icon
        const siteInfoIcon = document.createElement('i');
        siteInfoIcon.className = 'fas fa-lock';
        siteInfoIcon.style.color = '#4CAF50';
        siteInfoIcon.style.marginRight = '8px';
        siteInfoIcon.style.fontSize = '12px';
        
        // URL text
        const urlText = document.createElement('span');
        urlText.textContent = contentSrc;
        
        addressBar.appendChild(siteInfoIcon);
        addressBar.appendChild(urlText);
        
        // Add browser controls to container
        browserControls.appendChild(backBtn);
        browserControls.appendChild(forwardBtn);
        browserControls.appendChild(refreshBtn);
        browserControls.appendChild(addressBar);
        
        // Create iframe for content
        contentFrame = document.createElement('iframe');
        contentFrame.src = contentSrc;
        contentFrame.style.width = '100%';
        contentFrame.style.height = '100%';
        contentFrame.style.border = 'none';
        contentFrame.style.backgroundColor = '#fff';
        contentFrame.id = 'browser-frame';
        
        // Add event listeners for browser controls
        backBtn.addEventListener('click', function() {
            contentFrame.contentWindow.history.back();
        });
        
        forwardBtn.addEventListener('click', function() {
            contentFrame.contentWindow.history.forward();
        });
        
        refreshBtn.addEventListener('click', function() {
            contentFrame.contentWindow.location.reload();
        });
        
        // Update address bar when iframe navigates
        contentFrame.addEventListener('load', function() {
            try {
                const currentUrl = contentFrame.contentWindow.location.href;
                urlText.textContent = currentUrl;
                
                // Update lock icon based on protocol
                if (currentUrl.startsWith('https://')) {
                    siteInfoIcon.className = 'fas fa-lock';
                    siteInfoIcon.style.color = '#4CAF50';
                } else {
                    siteInfoIcon.className = 'fas fa-info-circle';
                    siteInfoIcon.style.color = '#FFC107';
                }
            } catch (e) {
                // Handle cross-origin restrictions
                console.log('Cannot access iframe URL due to same-origin policy');
            }
        });
        
        // Add hover effects to browser buttons
        [backBtn, forwardBtn, refreshBtn].forEach(btn => {
            btn.addEventListener('mouseenter', function() {
                this.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
            });
            
            btn.addEventListener('mouseleave', function() {
                this.style.backgroundColor = 'transparent';
            });
            
            btn.addEventListener('mousedown', function() {
                this.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
                this.style.transform = 'scale(0.95)';
            });
            
            btn.addEventListener('mouseup', function() {
                this.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                this.style.transform = 'scale(1)';
            });
        });
    } else {
        // Create iframe for content (non-browser version)
        contentFrame = document.createElement('iframe');
        contentFrame.src = contentSrc;
        contentFrame.style.width = '100%';
        contentFrame.style.height = '100%';
        contentFrame.style.border = 'none';
        contentFrame.style.backgroundColor = '#0c0e1b';
    }
    
    // Add elements to DOM
    contentWindow.appendChild(contentHeader);
    if (browserControls) {
        contentWindow.appendChild(browserControls);
    }
    contentWindow.appendChild(contentFrame);
    modalOverlay.appendChild(contentWindow);
    document.body.appendChild(modalOverlay);
    
    // Fade in animation
    setTimeout(() => {
        modalOverlay.style.opacity = '1';
        contentWindow.style.transform = 'scale(1)';
    }, 10);
    
    // Modern hover effects with animations
    [minimizeBtn, maximizeBtn, closeBtn].forEach(btn => {
        btn.addEventListener('mouseenter', function() {
            if (this.classList.contains('minimize')) {
                this.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
                // Trigger SVG animation
                const svg = this.querySelector('svg');
                if (svg) svg.dispatchEvent(new Event('mouseenter'));
            } else if (this.classList.contains('maximize')) {
                this.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
                // Trigger SVG animation
                const svg = this.querySelector('svg');
                if (svg) svg.dispatchEvent(new Event('mouseenter'));
            } else if (this.classList.contains('close')) {
                this.style.backgroundColor = 'rgba(232, 17, 35, 0.9)';
                // Trigger SVG animation
                const svg = this.querySelector('svg');
                if (svg) svg.dispatchEvent(new Event('mouseenter'));
            }
        });
        
        btn.addEventListener('mouseleave', function() {
            this.style.backgroundColor = 'transparent';
        });
        
        btn.addEventListener('mousedown', function() {
            if (this.classList.contains('close')) {
                this.style.backgroundColor = 'rgba(232, 17, 35, 1)';
            } else {
                this.style.backgroundColor = 'rgba(255, 255, 255, 0.12)';
            }
            this.style.transform = 'scale(0.95)';
        });
        
        btn.addEventListener('mouseup', function() {
            if (this.classList.contains('close')) {
                this.style.backgroundColor = 'rgba(232, 17, 35, 0.9)';
            } else {
                this.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
            }
            this.style.transform = 'scale(1)';
        });
    });
    
    // Add click handlers to buttons with animations
    minimizeBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        
        // Animate minimizing with a smooth shrink effect
        contentWindow.style.transition = 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease';
        contentWindow.style.transformOrigin = 'bottom center';
        contentWindow.style.transform = 'scale(0.1) translateY(500px)';
        contentWindow.style.opacity = '0';
        
        // Create minimized indicator with entrance animation
        const minimizedIndicator = document.createElement('div');
        minimizedIndicator.className = 'minimized-content';
        minimizedIndicator.style.position = 'fixed';
        minimizedIndicator.style.bottom = '-50px'; // Start below the screen
        minimizedIndicator.style.left = '50%';
        minimizedIndicator.style.transform = 'translateX(-50%)';
        minimizedIndicator.style.padding = '8px 15px';
        minimizedIndicator.style.backgroundColor = '#131832';
        minimizedIndicator.style.borderRadius = '20px';
        minimizedIndicator.style.display = 'flex';
        minimizedIndicator.style.alignItems = 'center';
        minimizedIndicator.style.gap = '8px';
        minimizedIndicator.style.cursor = 'pointer';
        minimizedIndicator.style.boxShadow = '0 5px 15px rgba(0, 0, 0, 0.3)';
        minimizedIndicator.style.border = '1px solid var(--accent-transparent)';
        minimizedIndicator.style.zIndex = '2001';
        minimizedIndicator.style.transition = 'bottom 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)';
        
        const indicatorIcon = document.createElement('i');
        indicatorIcon.className = iconClass;
        indicatorIcon.style.color = 'var(--accent-color)';
        
        const indicatorText = document.createElement('span');
        indicatorText.textContent = title;
        indicatorText.style.color = 'var(--text-color)';
        
        minimizedIndicator.appendChild(indicatorIcon);
        minimizedIndicator.appendChild(indicatorText);
        document.body.appendChild(minimizedIndicator);
        
        // Animate the indicator entrance
        setTimeout(() => {
            minimizedIndicator.style.bottom = '20px';
        }, 50);
        
        // Show system status widget again with fade-in
        if (statsWidget) {
            statsWidget.style.opacity = '0';
            statsWidget.style.display = 'block';
            statsWidget.style.transition = 'opacity 0.3s ease';
            setTimeout(() => {
                statsWidget.style.opacity = '1';
            }, 100);
        }
        
        // Restore content when clicking indicator with animation
        minimizedIndicator.addEventListener('click', function() {
            // Animate the window back
            contentWindow.style.transform = 'scale(1) translateY(0)';
            contentWindow.style.opacity = '1';
            
            // Animate the indicator exit
            minimizedIndicator.style.bottom = '-50px';
            
            // Remove indicator after animation completes
            setTimeout(() => {
                if (minimizedIndicator.parentNode) {
                    document.body.removeChild(minimizedIndicator);
                }
            }, 400);
            
            // Hide system status widget again with fade-out
            if (statsWidget) {
                statsWidget.style.transition = 'opacity 0.3s ease';
                statsWidget.style.opacity = '0';
                setTimeout(() => {
                    statsWidget.style.display = 'none';
                }, 300);
            }
        });
    });
    
    maximizeBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        
        if (contentWindow.style.width === '100%') {
            // Restore with animation
            contentWindow.style.transition = 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)';
            contentWindow.style.width = '85%';
            contentWindow.style.height = '85%';
            contentWindow.style.borderRadius = '12px';
            
            // Add a subtle bounce effect
            setTimeout(() => {
                contentWindow.style.transform = 'scale(1.02)';
                setTimeout(() => {
                    contentWindow.style.transform = 'scale(1)';
                }, 150);
            }, 50);
            
            // Update maximize icon to show maximize
            this.innerHTML = `
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="2" y="2" width="10" height="10" rx="1" stroke="var(--text-color)" stroke-width="1.5" stroke-linecap="round" fill="none" class="maximize-rect">
                        <animate attributeName="width" values="10;8;10" dur="0.4s" begin="maximize.mouseenter" fill="freeze" />
                        <animate attributeName="height" values="10;8;10" dur="0.4s" begin="maximize.mouseenter" fill="freeze" />
                        <animate attributeName="x" values="2;3;2" dur="0.4s" begin="maximize.mouseenter" fill="freeze" />
                        <animate attributeName="y" values="2;3;2" dur="0.4s" begin="maximize.mouseenter" fill="freeze" />
                    </rect>
                </svg>
            `;
        } else {
            // Maximize with animation
            contentWindow.style.transition = 'all 0.3s cubic-bezier(0.05, 0.7, 0.1, 1.0)';
            
            // Add a subtle expand effect
            contentWindow.style.transform = 'scale(1.02)';
            setTimeout(() => {
                contentWindow.style.width = '100%';
                contentWindow.style.height = '100%';
                contentWindow.style.borderRadius = '0';
                
                setTimeout(() => {
                    contentWindow.style.transform = 'scale(1)';
                }, 150);
            }, 50);
            
            // Update maximize icon to show restore down
            this.innerHTML = `
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <g>
                        <rect x="5" y="2" width="7" height="7" rx="1" stroke="var(--text-color)" stroke-width="1.5" stroke-linecap="round" fill="none">
                            <animate attributeName="width" values="7;6;7" dur="0.4s" begin="maximize.mouseenter" fill="freeze" />
                            <animate attributeName="height" values="7;6;7" dur="0.4s" begin="maximize.mouseenter" fill="freeze" />
                        </rect>
                        <rect x="2" y="5" width="7" height="7" rx="1" stroke="var(--text-color)" stroke-width="1.5" stroke-linecap="round" fill="none">
                            <animate attributeName="width" values="7;6;7" dur="0.4s" begin="maximize.mouseenter" fill="freeze" />
                            <animate attributeName="height" values="7;6;7" dur="0.4s" begin="maximize.mouseenter" fill="freeze" />
                        </rect>
                    </g>
                </svg>
            `;
        }
    });
    
    closeBtn.addEventListener('click', function() {
        // Create a more dramatic close animation
        modalOverlay.style.transition = 'opacity 0.4s ease';
        contentWindow.style.transition = 'all 0.4s cubic-bezier(0.68, -0.6, 0.32, 1.6)';
        
        // First slightly expand the window
        contentWindow.style.transform = 'scale(1.03)';
        
        setTimeout(() => {
            // Then rapidly shrink and fade it out
            contentWindow.style.transform = 'scale(0.5)';
            contentWindow.style.opacity = '0';
            modalOverlay.style.opacity = '0';
            
            // Add a subtle rotation for style
            contentWindow.style.rotate = '2deg';
            
            // Show system status widget again with fade-in
            if (statsWidget) {
                statsWidget.style.opacity = '0';
                statsWidget.style.display = 'block';
                statsWidget.style.transition = 'opacity 0.3s ease';
                setTimeout(() => {
                    statsWidget.style.opacity = '1';
                }, 200);
            }
            
            // Remove after animation completes
            setTimeout(() => {
                document.body.removeChild(modalOverlay);
            }, 400);
        }, 50);
    });
    
    return modalOverlay;
}

// ChatBot card click event
document.getElementById('chatbot-card').addEventListener('click', function() {
    // Save current sidebar state
    const sidebar = document.querySelector('.sidebar');
    const isExpanded = sidebar.offsetWidth > 60;
    localStorage.setItem('sidebarExpanded', isExpanded);
    
    // Create modal window for ChatBot
    createContentModal('چت‌بات', '../Chatbot/index.html', 'fas fa-comment-dots');
});

// Terminal card click event
document.getElementById('terminal-card').addEventListener('click', function() {
    // Save current sidebar state
    const sidebar = document.querySelector('.sidebar');
    const isExpanded = sidebar.offsetWidth > 60;
    localStorage.setItem('sidebarExpanded', isExpanded);
    
    // Create modal window for Terminal
    createContentModal('ترمینال', '../Monitoring/index.html', 'fas fa-terminal');
});

// User Panel card click event
document.getElementById('user-panel-card').addEventListener('click', function(e) {
    // Check if the click was on the guide link or its children
    if (e.target.closest('.guide-link')) {
        // If clicked on the guide link, don't open the panel
        // The link will handle opening the guide page in a new tab
        return;
    }
    
    // Save current sidebar state
    const sidebar = document.querySelector('.sidebar');
    const isExpanded = sidebar.offsetWidth > 60;
    localStorage.setItem('sidebarExpanded', isExpanded);
    
    // Create a notification about opening in external window
    const notification = document.getElementById('notification');
    const notificationTitle = notification.querySelector('.notification-title');
    const notificationMessage = notification.querySelector('.notification-message');
    
    notificationTitle.textContent = 'پنل کاربری';
    notificationMessage.textContent = 'در حال باز کردن پنل کاربری در مرورگر پیش‌فرض...';
    notification.classList.add('show');
    
    // Hide notification after 3 seconds
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
    
    // Define desired window dimensions - use fixed dimensions for consistency
    const windowWidth = 1200;  // Fixed width
    const windowHeight = 800;  // Fixed height
    
    // Check if we're running in Electron
    if (isElectron()) {
        try {
            // Get the ipcRenderer module
            const { ipcRenderer } = require('electron');
            
            // Send a message to the main process to open the URL in a new BrowserWindow
            ipcRenderer.send('open-user-panel-window', { 
                url: 'https://my.pishgaman.net',
                width: windowWidth,
                height: windowHeight
            });
            
            // Listen for the response
            ipcRenderer.once('user-panel-window-opened', (event, response) => {
                if (!response.success) {
                    // Show error notification if opening failed
                    notificationTitle.textContent = 'خطا';
                    notificationMessage.textContent = 'خطا در باز کردن پنل کاربری. لطفاً مجدداً تلاش کنید.';
                    notification.classList.add('show');
                    
                    // Hide error notification after 5 seconds
                    setTimeout(() => {
                        notification.classList.remove('show');
                    }, 5000);
                }
            });
        } catch (error) {
            console.error('Error using Electron IPC:', error);
            // Fallback to the old window.open method if IPC fails
            openUserPanelFallback(windowWidth, windowHeight);
        }
    } else {
        // Not running in Electron, use the fallback method
        openUserPanelFallback(windowWidth, windowHeight);
    }
});

// Fallback function to open User Panel in a new window
function openUserPanelFallback(width = 1200, height = 800) {
    // Calculate position to center the window on the screen
    const left = Math.round((window.screen.width - width) / 2);
    const top = Math.round((window.screen.height - height) / 2);
    
    // Create a simple HTML page that will handle the window sizing and redirection
    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>پنل کاربری پیشگامان</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    background-color: #f5f5f5;
                    color: #333;
                    text-align: center;
                    margin: 0;
                    padding: 20px;
                    direction: rtl;
                }
                .container {
                    margin-top: 50px;
                }
                .spinner {
                    width: 40px;
                    height: 40px;
                    margin: 20px auto;
                    border: 4px solid rgba(0, 0, 0, 0.1);
                    border-radius: 50%;
                    border-top: 4px solid #3498db;
                    animation: spin 1s linear infinite;
                }
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            </style>
            <script>
                // Function to run when the page loads
                window.onload = function() {
                    // Resize the window first
                    window.resizeTo(${width}, ${height});
                    
                    // Center the window on screen
                    const screenWidth = window.screen.availWidth;
                    const screenHeight = window.screen.availHeight;
                    const left = Math.round((screenWidth - ${width}) / 2);
                    const top = Math.round((screenHeight - ${height}) / 2);
                    window.moveTo(left, top);
                    
                    // Redirect to the target URL after a short delay
                    setTimeout(function() {
                        window.location.href = "https://my.pishgaman.net";
                    }, 500);
                };
            </script>
        </head>
        <body>
            <div class="container">
                <h2>در حال انتقال به پنل کاربری پیشگامان...</h2>
                <div class="spinner"></div>
                <p>لطفاً منتظر بمانید</p>
            </div>
        </body>
        </html>
    `;
    
    // Create a blob URL from the HTML content
    const blob = new Blob([html], { type: 'text/html' });
    const blobUrl = URL.createObjectURL(blob);
    
    // Open the blob URL in a new window
    const newWindow = window.open(
        blobUrl, 
        'pishgamanUserPanel',
        `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes,status=yes,location=yes,toolbar=yes`
    );
    
    // Focus the new window
    if (newWindow) {
        newWindow.focus();
        
        // Clean up the blob URL after the window has loaded
        setTimeout(() => {
            URL.revokeObjectURL(blobUrl);
        }, 10000);
    } else {
        // Popup was blocked, show a notification with instructions
        const notification = document.getElementById('notification');
        const notificationTitle = notification.querySelector('.notification-title');
        const notificationMessage = notification.querySelector('.notification-message');
        
        notificationTitle.textContent = 'پنجره مسدود شد';
        notificationMessage.textContent = 'لطفاً پاپ‌آپ‌ها را برای این سایت فعال کنید یا روی دکمه زیر کلیک کنید.';
        notification.classList.add('show');
        
        // Create a direct link button
        const directLinkBtn = document.createElement('button');
        directLinkBtn.textContent = 'باز کردن پنل کاربری';
        directLinkBtn.style.display = 'block';
        directLinkBtn.style.margin = '20px auto';
        directLinkBtn.style.padding = '10px 20px';
        directLinkBtn.style.backgroundColor = 'var(--accent-color)';
        directLinkBtn.style.color = '#fff';
        directLinkBtn.style.border = 'none';
        directLinkBtn.style.borderRadius = '5px';
        directLinkBtn.style.cursor = 'pointer';
        directLinkBtn.style.fontFamily = 'inherit';
        directLinkBtn.style.fontSize = '14px';
        directLinkBtn.style.transition = 'all 0.2s ease';
        
        directLinkBtn.addEventListener('mouseenter', function() {
            this.style.backgroundColor = 'var(--accent-hover)';
            this.style.transform = 'translateY(-2px)';
            this.style.boxShadow = '0 5px 15px rgba(0, 0, 0, 0.2)';
        });
        
        directLinkBtn.addEventListener('mouseleave', function() {
            this.style.backgroundColor = 'var(--accent-color)';
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = 'none';
        });
        
        directLinkBtn.addEventListener('click', function() {
            // Try to open with specific dimensions using the same blob URL approach
            const newBlob = new Blob([html], { type: 'text/html' });
            const newBlobUrl = URL.createObjectURL(newBlob);
            
            window.open(
                newBlobUrl, 
                '_blank',
                `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes,status=yes,location=yes,toolbar=yes`
            );
            
            // Clean up the blob URL after a delay
            setTimeout(() => {
                URL.revokeObjectURL(newBlobUrl);
            }, 10000);
            
            notification.classList.remove('show');
            if (this.parentNode) {
                this.parentNode.removeChild(this);
            }
        });
        
        // Add the button to the welcome section
        const welcomeSection = document.querySelector('.welcome-section');
        welcomeSection.appendChild(directLinkBtn);
        
        // Keep notification visible for longer
        setTimeout(() => {
            notification.classList.remove('show');
        }, 8000);
    }
}

// Make cards clickable with cursor pointer
const cards = document.querySelectorAll('.card');
cards.forEach(card => {
    card.style.cursor = 'pointer';
});

// Handle guide link click for Electron compatibility
document.querySelector('.guide-link').addEventListener('click', function(e) {
    e.preventDefault(); // Prevent default link behavior
    
    // Save current sidebar state
    const sidebar = document.querySelector('.sidebar');
    const isExpanded = sidebar.offsetWidth > 60;
    localStorage.setItem('sidebarExpanded', isExpanded);
    
    // Create modal window for Guide Panel with custom logo
    createContentModal('آموزش استفاده از پنل', 'https://pishgaman.net/%d8%b1%d8%a7%d9%87%d9%86%d9%85%d8%a7%db%8c-%d8%a7%d8%b3%d8%aa%d9%81%d8%a7%d8%af%d9%87-%d8%a7%d8%b2-%d9%be%d9%86%d9%84-%da%a9%d8%a7%d8%b1%d8%a8%d8%b1%db%8c/', 'fas fa-graduation-cap');
});

// Add click effect to cards
cards.forEach(card => {
    card.addEventListener('mousedown', function() {
        this.style.transform = 'scale(0.95) translateY(0)';
    });
    
    card.addEventListener('mouseup', function() {
        this.style.transform = '';
    });
    
    // Reset transform when mouse leaves during click
    card.addEventListener('mouseleave', function() {
        this.style.transform = '';
    });
});

// Initialize Three.js scene
function initThreeScene() {
    const container = document.getElementById('canvas-container');
    
    // Scene, camera, renderer setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 5;
    
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);
    
    // Create particles
    const particlesGeometry = new THREE.BufferGeometry();
    const particleCount = 200;
    
    const posArray = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount * 3; i++) {
        posArray[i] = (Math.random() - 0.5) * 10;
    }
    
    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    
    const particlesMaterial = new THREE.PointsMaterial({
        size: 0.05,
        color: 0x36f1cd,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending
    });
    
    const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particlesMesh);
    
    // Animation loop
    const animate = function() {
        requestAnimationFrame(animate);
        
        // Rotate particles
        particlesMesh.rotation.x += 0.0005;
        particlesMesh.rotation.y += 0.0005;
        
        // Responsive resize
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        
        renderer.render(scene, camera);
    };
    
    animate();
    
    // Handle window resize
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
}

// Initialize the scene if THREE is available
if (typeof THREE !== 'undefined') {
    initThreeScene();
}

// Create separate elements for time and date to avoid flashing
function setupTimeDisplay() {
    const timeElement = document.getElementById('live-time');
    
    // Clear existing content
    timeElement.innerHTML = '';
    
    // Create separate spans for hours, minutes, seconds, and date
    const hoursSpan = document.createElement('span');
    hoursSpan.id = 'time-hours';
    
    const separatorSpan1 = document.createElement('span');
    separatorSpan1.textContent = ':';
    
    const minutesSpan = document.createElement('span');
    minutesSpan.id = 'time-minutes';
    
    const separatorSpan2 = document.createElement('span');
    separatorSpan2.textContent = ':';
    
    const secondsSpan = document.createElement('span');
    secondsSpan.id = 'time-seconds';
    
    const dateSpan = document.createElement('span');
    dateSpan.id = 'time-date';
    dateSpan.style.marginLeft = '10px';
    
    // Append all elements
    timeElement.appendChild(hoursSpan);
    timeElement.appendChild(separatorSpan1);
    timeElement.appendChild(minutesSpan);
    timeElement.appendChild(separatorSpan2);
    timeElement.appendChild(secondsSpan);
    timeElement.appendChild(document.createTextNode(' - '));
    timeElement.appendChild(dateSpan);
    
    // Initialize with current values
    updateTimeElements();
}

// Update only the elements that need to change
function updateTimeElements() {
    const now = new Date();
    
    // Update time elements
    document.getElementById('time-hours').textContent = String(now.getHours()).padStart(2, '0');
    document.getElementById('time-minutes').textContent = String(now.getMinutes()).padStart(2, '0');
    document.getElementById('time-seconds').textContent = String(now.getSeconds()).padStart(2, '0');
    
    // Only update date when it changes (once per day or on initial load)
    const currentDay = now.getDate();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    // Store the current date in a data attribute to check if it changed
    const dateSpan = document.getElementById('time-date');
    const storedDate = dateSpan.getAttribute('data-date');
    const currentDateString = `${currentYear}-${currentMonth}-${currentDay}`;
    
    if (storedDate !== currentDateString) {
        // Date has changed, update it
        const persianDate = gregorianToJalali(currentYear, currentMonth + 1, currentDay);
        const formattedPersianDate = `${persianDate[0]}/${String(persianDate[1]).padStart(2, '0')}/${String(persianDate[2]).padStart(2, '0')}`;
        
        dateSpan.textContent = formattedPersianDate;
        dateSpan.setAttribute('data-date', currentDateString);
    }
}

// Simple Gregorian to Jalali (Persian) date converter
function gregorianToJalali(gy, gm, gd) {
    var g_d_m, jy, jm, jd, gy2, days;
    g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
    
    if (gy > 1600) {
        jy = 979;
        gy -= 1600;
    } else {
        jy = 0;
        gy -= 621;
    }
    
    gy2 = (gm > 2) ? (gy + 1) : gy;
    days = (365 * gy) + (parseInt((gy2 + 3) / 4)) - (parseInt((gy2 + 99) / 100)) + (parseInt((gy2 + 399) / 400)) - 80 + gd + g_d_m[gm - 1];
    jy += 33 * (parseInt(days / 12053));
    days %= 12053;
    jy += 4 * (parseInt(days / 1461));
    days %= 1461;
    
    if (days > 365) {
        jy += parseInt((days - 1) / 365);
        days = (days - 1) % 365;
    }
    
    jm = (days < 186) ? 1 + parseInt(days / 31) : 7 + parseInt((days - 186) / 30);
    jd = 1 + ((days < 186) ? (days % 31) : ((days - 186) % 30));
    
    return [jy, jm, jd];
}

// Initialize time display and start updates
document.addEventListener('DOMContentLoaded', function() {
    setupTimeDisplay();
    // Update every second
    setInterval(updateTimeElements, 1000);
});

// Create a common sidebar script that can be included in all pages
// This function extracts sidebar creation and functionality
function createSidebarScript() {
    const script = document.createElement('script');
    script.textContent = `
        // Sidebar functionality
        function initSidebar() {
            const sidebar = document.querySelector('.sidebar');
            const hamburger = document.querySelector('.hamburger');
            if (!sidebar || !hamburger) return;
            
            // Initialize sidebar state from localStorage
            const sidebarState = localStorage.getItem('sidebarExpanded');
            if (sidebarState === 'true') {
                sidebar.classList.add('active');
            }
            
            // Add click handler for hamburger menu
            hamburger.addEventListener('click', function(e) {
                e.stopPropagation(); // Prevent event bubbling
                sidebar.classList.toggle('active');
                
                // Store sidebar state in localStorage
                const isActive = sidebar.classList.contains('active');
                localStorage.setItem('sidebarExpanded', isActive);
            });
        }
        
        // Initialize sidebar on page load
        document.addEventListener('DOMContentLoaded', initSidebar);
    `;
    return script;
}

// Generate a file that can be included on other pages
function generateSidebarFile() {
    // This would create a separate JS file for inclusion on other pages
    // Since we can't actually create files here, this is just a demonstration
    // of what could be done in a real implementation
    const sidebarJS = `
// sidebar-persistence.js - Include this file on all pages that use the sidebar

// Sidebar functionality
function initSidebar() {
const sidebar = document.querySelector('.sidebar');
const hamburger = document.querySelector('.hamburger');
if (!sidebar || !hamburger) return;

// Initialize sidebar state from localStorage
const sidebarState = localStorage.getItem('sidebarExpanded');
if (sidebarState === 'true') {
sidebar.classList.add('active');
}

// Add click handler for hamburger menu
hamburger.addEventListener('click', function(e) {
e.stopPropagation(); // Prevent event bubbling
sidebar.classList.toggle('active');

// Store sidebar state in localStorage
const isActive = sidebar.classList.contains('active');
localStorage.setItem('sidebarExpanded', isActive);
});
}

// Initialize sidebar on page load
document.addEventListener('DOMContentLoaded', initSidebar);
    `;
    
    console.log("Generated sidebar persistence JavaScript that should be saved as 'sidebar-persistence.js'");
}

// Add this script to the document
document.head.appendChild(createSidebarScript());

// Show how the sidebar persistence file would be created
// In a real implementation, this would write to a file
generateSidebarFile();

// Show notification after a delay
setTimeout(() => {
    document.getElementById('notification').classList.add('show');
    
    // Hide notification after 5 seconds
    setTimeout(() => {
        document.getElementById('notification').classList.remove('show');
    }, 5000);
}, 3000);

// Setup the stats button and hover card
function setupStatsButton() {
    const statsButton = document.getElementById('stats-button');
    const statsHoverCard = document.querySelector('.stats-hover-card');
    
    if (!statsButton || !statsHoverCard) return;
    
    // Function to update stats with random values
    function updateStatsWithRandomValues() {
        const cpuValue = Math.floor(Math.random() * 100);
        const memoryUsed = (Math.random() * 8 + 2).toFixed(1);
        const storageUsed = Math.floor(Math.random() * 400 + 100);
        const networkSpeed = Math.floor(Math.random() * 150 + 50);

        // Update values and charts
        const statItems = statsHoverCard.querySelectorAll('.stat-item');
        
        // CPU
        statItems[0].querySelector('.stat-value').textContent = `${cpuValue}%`;
        statItems[0].querySelector('.stat-chart-fill').style.width = `${cpuValue}%`;

        // Memory
        statItems[1].querySelector('.stat-value').textContent = `${memoryUsed}GB / 16GB`;
        statItems[1].querySelector('.stat-chart-fill').style.width = `${(memoryUsed / 16) * 100}%`;

        // Storage
        statItems[2].querySelector('.stat-value').textContent = `${storageUsed}GB / 512GB`;
        statItems[2].querySelector('.stat-chart-fill').style.width = `${(storageUsed / 512) * 100}%`;

        // Network
        statItems[3].querySelector('.stat-value').textContent = `${networkSpeed} Mbps ↓`;
        statItems[3].querySelector('.stat-chart-fill').style.width = `${(networkSpeed / 150) * 100}%`;
    }

    // Update stats periodically when card is visible
    let updateInterval;
    
    function startUpdating() {
        updateStatsWithRandomValues();
        updateInterval = setInterval(updateStatsWithRandomValues, 2000);
    }

    function stopUpdating() {
        clearInterval(updateInterval);
    }

    statsButton.addEventListener('mouseenter', startUpdating);
    statsHoverCard.addEventListener('mouseenter', startUpdating);
    
    statsButton.addEventListener('mouseleave', function(e) {
        if (!statsHoverCard.matches(':hover')) {
            stopUpdating();
        }
    });
    
    statsHoverCard.addEventListener('mouseleave', stopUpdating);
}

// Remove the file path tooltip from terminal card
function removeTerminalTooltip() {
    // Remove the existing toast notification functionality
    const terminalCard = document.getElementById('terminal-card');
    if (terminalCard) {
        // Clone the element to remove all event listeners
        const newTerminalCard = terminalCard.cloneNode(true);
        terminalCard.parentNode.replaceChild(newTerminalCard, terminalCard);
        
        // Add back only the click event for opening the terminal
        newTerminalCard.addEventListener('click', function() {
            // Save current sidebar state
            const sidebar = document.querySelector('.sidebar');
            const isExpanded = sidebar.offsetWidth > 60;
            localStorage.setItem('sidebarExpanded', isExpanded);
            
            // Create modal window for Terminal
            createContentModal('ترمینال', '../Monitoring/LiveMonitor/index.html', 'fas fa-terminal');
        });
        
        // Add back the click effect
        newTerminalCard.addEventListener('mousedown', function() {
            this.style.transform = 'scale(0.95) translateY(0)';
        });
        
        newTerminalCard.addEventListener('mouseup', function() {
            this.style.transform = '';
        });
        
        // Reset transform when mouse leaves during click
        newTerminalCard.addEventListener('mouseleave', function() {
            this.style.transform = '';
        });
    }
    
    // Remove any existing toast elements
    const existingToast = document.getElementById('terminal-toast');
    if (existingToast && existingToast.parentNode) {
        existingToast.parentNode.removeChild(existingToast);
    }
}

// Initialize both functions
document.addEventListener('DOMContentLoaded', function() {
    setupStatsButton();
    removeTerminalTooltip();
});

// Theme Switching Logic
const themeButtons = document.querySelectorAll('.theme-switcher button');
const htmlElement = document.documentElement;

// Load saved theme
const savedTheme = localStorage.getItem('theme') || 'dark';
htmlElement.setAttribute('data-theme', savedTheme);
updateThemeButtons(savedTheme);

themeButtons.forEach(button => {
    button.addEventListener('click', () => {
        const theme = button.id.replace('Mode', '');
        htmlElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        updateThemeButtons(theme);
        
        // Trigger smooth transition effect
        document.body.style.opacity = '0.8';
        setTimeout(() => {
            document.body.style.opacity = '1';
        }, 200);
    });
});

function updateThemeButtons(activeTheme) {
    themeButtons.forEach(button => {
        button.classList.remove('active');
        if (button.id === `${activeTheme}Mode`) {
            button.classList.add('active');
        }
    });
}

// Initialize Electron IPC functionality if available
let ipcRenderer;
try {
    if (typeof require !== 'undefined') {
        ipcRenderer = require('electron').ipcRenderer;
    }
} catch (error) {
    console.error('Electron IPC not available:', error);
}

// Username management functions
function initUserProfile() {
    // Get username display element
    const usernameDisplay = document.getElementById('username-display');
    const editUsernameBtn = document.getElementById('edit-username');
    const deleteUsernameBtn = document.getElementById('delete-username');
    const usernameModal = document.getElementById('username-modal');
    const deleteConfirmation = document.getElementById('delete-confirmation');
    const closeModal = document.querySelector('.close-modal');
    const saveUsernameBtn = document.getElementById('save-username');
    const cancelDeleteBtn = document.getElementById('cancel-delete');
    const confirmDeleteBtn = document.getElementById('confirm-delete');
    const newUsernameInput = document.getElementById('new-username');
    const userProfileCard = document.querySelector('.user-profile-card');
    const avatarRipple = document.querySelector('.avatar-ripple');
    
    // Load and display the current username
    loadUsername();
    
    // Initialize ripple animation
    if (avatarRipple) {
        // Stagger the ripple animation for a more dynamic effect
        setTimeout(() => {
            avatarRipple.style.animation = 'rippleEffect 2s linear infinite';
        }, 1000);
    }
    
    // Create floating particles for the profile card
    if (userProfileCard) {
        // Create particle elements
        for (let i = 0; i < 8; i++) {
            const particle = document.createElement('div');
            particle.classList.add('particle');
            
            // Set random initial positions
            particle.style.top = `${Math.random() * 100}%`;
            particle.style.left = `${Math.random() * 100}%`;
            
            // Set random sizes
            const size = 2 + Math.random() * 3;
            particle.style.width = `${size}px`;
            particle.style.height = `${size}px`;
            
            // Set random animation delays
            particle.style.animationDelay = `${Math.random() * 2}s`;
            
            // Add particle to the card
            userProfileCard.appendChild(particle);
        }
        
        // Add interactive hover effects
        userProfileCard.addEventListener('mousemove', function(e) {
            const rect = this.getBoundingClientRect();
            const x = e.clientX - rect.left; // x position within the element
            const y = e.clientY - rect.top;  // y position within the element
            
            // Calculate rotation based on mouse position
            // Limiting the rotation to a small amount for subtlety
            const rotateY = (x / rect.width - 0.5) * 5; // -2.5 to 2.5 degrees
            const rotateX = (y / rect.height - 0.5) * -5; // 2.5 to -2.5 degrees
            
            // Calculate distance from center (0-1)
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const distanceX = Math.abs(x - centerX) / centerX;
            const distanceY = Math.abs(y - centerY) / centerY;
            const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);
            
            // Apply the transform with intensity based on mouse distance from center
            const intensity = 1 - Math.min(1, distance * 1.5);
            this.style.transform = `translateY(${-3 - intensity * 2}px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
            
            // Update the glow effect based on mouse position
            const accentColorRGB = getComputedStyle(document.documentElement).getPropertyValue('--accent-color-rgb').trim();
            const isDarkTheme = document.documentElement.getAttribute('data-theme') === 'dark';
            
            if (isDarkTheme) {
                this.style.boxShadow = `
                    0 15px 35px rgba(0, 0, 0, 0.3),
                    0 0 0 1px rgba(255, 255, 255, 0.1) inset,
                    ${(x - rect.width/2) / 10}px ${(y - rect.height/2) / 10}px 20px rgba(${accentColorRGB}, ${0.15 + intensity * 0.1})
                `;
            } else {
                this.style.boxShadow = `
                    0 15px 35px rgba(0, 0, 0, 0.15),
                    0 0 0 1px rgba(0, 0, 0, 0.05) inset,
                    ${(x - rect.width/2) / 10}px ${(y - rect.height/2) / 10}px 20px rgba(${accentColorRGB}, ${0.05 + intensity * 0.1})
                `;
            }
            
            // Move particles based on mouse
            const particles = this.querySelectorAll('.particle');
            particles.forEach(particle => {
                const particleRect = particle.getBoundingClientRect();
                const particleX = particleRect.left - rect.left + particleRect.width / 2;
                const particleY = particleRect.top - rect.top + particleRect.height / 2;
                
                // Calculate direction vector from mouse to particle
                const dirX = particleX - x;
                const dirY = particleY - y;
                
                // Calculate distance
                const particleDistance = Math.sqrt(dirX * dirX + dirY * dirY);
                
                // Only affect particles within a certain radius
                if (particleDistance < 50) {
                    // Move particles away from mouse with intensity based on proximity
                    const factor = (1 - particleDistance / 50) * 5;
                    const moveX = (dirX / particleDistance) * factor;
                    const moveY = (dirY / particleDistance) * factor;
                    
                    particle.style.transform = `translate(${moveX}px, ${moveY}px)`;
                } else {
                    particle.style.transform = '';
                }
            });
        });
        
        // Reset on mouse leave
        userProfileCard.addEventListener('mouseleave', function() {
            this.style.transform = '';
            this.style.boxShadow = '';
            
            // Reset all particles
            const particles = this.querySelectorAll('.particle');
            particles.forEach(particle => {
                particle.style.transform = '';
            });
        });
        
        // Add pulse effect on click
        userProfileCard.addEventListener('click', function(e) {
            // Don't pulse if clicking the edit button
            if (e.target.closest('#edit-username')) {
                return;
            }
            
            this.classList.add('card-pulse');
            setTimeout(() => {
                this.classList.remove('card-pulse');
            }, 300);
        });
    }
    
    // Set up event listeners for editing username
    if (editUsernameBtn) {
        editUsernameBtn.addEventListener('click', function(e) {
            e.stopPropagation(); // Prevent triggering the card click event
            
            // Add animation before showing modal
            if (userProfileCard) {
                userProfileCard.classList.add('edit-mode');
                setTimeout(() => {
                    // Show the edit modal
                    usernameModal.style.display = 'block';
                    
                    // Populate the input with current username
                    if (usernameDisplay && newUsernameInput) {
                        newUsernameInput.value = usernameDisplay.textContent;
                        newUsernameInput.focus();
                    }
                    
                    // Remove the animation class after delay
                    setTimeout(() => {
                        userProfileCard.classList.remove('edit-mode');
                    }, 300);
                }, 300);
            } else {
                // Fallback if card animation doesn't work
                usernameModal.style.display = 'block';
                
                // Populate the input with current username
                if (usernameDisplay && newUsernameInput) {
                    newUsernameInput.value = usernameDisplay.textContent;
                    newUsernameInput.focus();
                }
            }
        });
    }
    
    // Close modal when clicking the X
    if (closeModal) {
        closeModal.addEventListener('click', function() {
            usernameModal.style.display = 'none';
        });
    }
    
    // Close modal when clicking outside
    window.addEventListener('click', function(event) {
        if (event.target == usernameModal) {
            usernameModal.style.display = 'none';
        }
    });
    
    // Save username when clicking Save button
    if (saveUsernameBtn) {
        saveUsernameBtn.addEventListener('click', saveNewUsername);
    }
    
    // Save username when pressing Enter in input
    if (newUsernameInput) {
        newUsernameInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                saveNewUsername();
            }
        });
    }
    
    // Set up event listeners for deleting username
    if (deleteUsernameBtn) {
        deleteUsernameBtn.addEventListener('click', function(e) {
            e.stopPropagation(); // Prevent triggering the card click event
            
            // Add animation before showing confirmation
            if (userProfileCard) {
                userProfileCard.classList.add('edit-mode');
                setTimeout(() => {
                    // Show the delete confirmation
                    deleteConfirmation.style.display = 'block';
                    
                    // Remove the animation class after delay
                    setTimeout(() => {
                        userProfileCard.classList.remove('edit-mode');
                    }, 300);
                }, 300);
            } else {
                // Fallback if card animation doesn't work
                deleteConfirmation.style.display = 'block';
            }
        });
    }
    
    // Cancel delete button
    if (cancelDeleteBtn) {
        cancelDeleteBtn.addEventListener('click', function() {
            deleteConfirmation.style.display = 'none';
        });
    }
    
    // Confirm delete button
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', function() {
            removeUsername();
        });
    }
    
    // Close delete modal when clicking outside
    window.addEventListener('click', function(event) {
        if (event.target == deleteConfirmation) {
            deleteConfirmation.style.display = 'none';
        }
    });
}

// Load the username from Electron storage or fallback
function loadUsername() {
    const usernameDisplay = document.getElementById('username-display');
    if (!usernameDisplay) return;
    
    if (ipcRenderer) {
        // Use Electron IPC to get username
        const username = ipcRenderer.sendSync('get-username');
        usernameDisplay.textContent = username || 'Guest';
    } else {
        // Fallback if not using Electron
        usernameDisplay.textContent = 'Guest';
    }
}

// Save the new username
function saveNewUsername() {
    const newUsernameInput = document.getElementById('new-username');
    const usernameModal = document.getElementById('username-modal');
    const usernameDisplay = document.getElementById('username-display');
    const validationMessage = document.getElementById('edit-validation-message');
    
    // Validate input
    if (!newUsernameInput || !newUsernameInput.value.trim()) {
        if (validationMessage) {
            validationMessage.textContent = 'Please enter a valid username';
            validationMessage.style.display = 'block';
        }
        return;
    }
    
    // Clear validation message if any
    if (validationMessage) {
        validationMessage.textContent = '';
        validationMessage.style.display = 'none';
    }
    
    const newUsername = newUsernameInput.value.trim();
    
    if (ipcRenderer) {
        // Use Electron IPC to save username
        ipcRenderer.send('update-username', newUsername);
        
        // Listen for confirmation
        ipcRenderer.once('username-updated', () => {
            // Update display
            if (usernameDisplay) {
                usernameDisplay.textContent = newUsername;
            }
            
            // Close modal
            if (usernameModal) {
                usernameModal.style.display = 'none';
            }
        });
    } else {
        // Fallback if not using Electron
        if (usernameDisplay) {
            usernameDisplay.textContent = newUsername;
        }
        
        // Close modal
        if (usernameModal) {
            usernameModal.style.display = 'none';
        }
    }
}

// Remove username and redirect to Firstpage
function removeUsername() {
    if (ipcRenderer) {
        // Use Electron IPC to remove username
        ipcRenderer.send('remove-username');
        
        // Add a visual loading effect before redirecting
        const userProfileCard = document.querySelector('.user-profile-card');
        const deleteConfirmation = document.getElementById('delete-confirmation');
        
        // First hide the confirmation dialog
        if (deleteConfirmation) {
            deleteConfirmation.style.display = 'none';
        }
        
        // Apply a removal animation to the profile card
        if (userProfileCard) {
            userProfileCard.classList.add('removing');
            
            // Update the username display to show removing status
            const usernameDisplay = document.getElementById('username-display');
            if (usernameDisplay) {
                usernameDisplay.textContent = 'Signing out...';
            }
            
            // After animation completes, redirect to Firstpage
            setTimeout(() => {
                window.location.href = "../Firstpage/index.html";
            }, 1500);
        } else {
            // Fallback if card animation doesn't work
            window.location.href = "../Firstpage/index.html";
        }
    } else {
        // Fallback if not using Electron
        window.location.href = "../Firstpage/index.html";
    }
}

// Add this function to check the Python server status
function checkPythonServerStatus() {
    try {
        const { ipcRenderer } = require('electron');
        
        ipcRenderer.invoke('check-python-server').then(result => {
            if (!result.running) {
                // Show notification that the server isn't running
                const notification = document.getElementById('notification');
                const notificationTitle = notification.querySelector('.notification-title');
                const notificationMessage = notification.querySelector('.notification-message');
                
                notificationTitle.textContent = 'Server Status';
                notificationMessage.textContent = 'The monitoring server is not running. Click to restart.';
                notification.classList.add('show');
                
                // Add click handler to restart the server
                notification.addEventListener('click', function restartServer() {
                    // Remove the click handler to prevent multiple restarts
                    notification.removeEventListener('click', restartServer);
                    
                    notificationMessage.textContent = 'Restarting monitoring server...';
                    
                    ipcRenderer.invoke('restart-python-server').then(restartResult => {
                        if (restartResult.success) {
                            notificationMessage.textContent = 'Monitoring server restarted successfully.';
                            
                            // Hide notification after 3 seconds
                            setTimeout(() => {
                                notification.classList.remove('show');
                            }, 3000);
                        } else {
                            notificationMessage.textContent = 'Failed to restart monitoring server.';
                        }
                    });
                });
                
                // Keep notification visible until clicked
            }
        });
    } catch (error) {
        console.error('Error checking Python server status:', error);
    }
}

// Call this function when the page loads
document.addEventListener('DOMContentLoaded', function() {
    // Initialize existing functionality
    // ...
    
    // Initialize user profile management
    initUserProfile();
    
    // Check Python server status
    checkPythonServerStatus();
});
