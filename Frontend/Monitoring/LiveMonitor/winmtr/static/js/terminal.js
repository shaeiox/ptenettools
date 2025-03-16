// terminal.js - Enhances the network monitor terminal experience
$(document).ready(function() {
    // Get reference to the terminal element
    const terminal = $('.terminal');
    const terminalPre = $('.terminal pre');
    
    // Add terminal cursor effect
    if (terminalPre.length > 0 && !terminalPre.text().includes('Network Monitoring Results')) {
        const cursor = $('<span class="cursor">_</span>');
        terminalPre.append(cursor);
        
        // Cursor blink effect
        setInterval(function() {
            cursor.toggleClass('cursor-blink');
        }, 500);
    }
    
    // Create background canvas effect
    const canvas = document.createElement('canvas');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.zIndex = '-1';
    canvas.style.opacity = '0.2';
    document.body.appendChild(canvas);
    
    const ctx = canvas.getContext('2d');
    
    // Matrix-like background effect (subtle)
    const matrix = "abcdefghijklmnopqrstuvwxyz0123456789@#$%^&*()_+-=[]{}|;:,./<>?";
    const fontSize = 14;
    const columns = canvas.width / fontSize;
    const drops = [];
    
    // Initialize the drops
    for (let i = 0; i < columns; i++) {
        drops[i] = Math.random() * -100; // Random starting position above the canvas
    }
    
    // Drawing function
    function draw() {
        // Semi-transparent black background to create trail effect
        ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = 'rgba(51, 255, 0, 0.3)'; // Very light green
        ctx.font = fontSize + 'px monospace';
        
        // For each column
        for (let i = 0; i < drops.length; i++) {
            // Get random character
            const text = matrix[Math.floor(Math.random() * matrix.length)];
            
            // Draw the character
            ctx.fillText(text, i * fontSize, drops[i] * fontSize);
            
            // Reset the drop when it crosses the screen or randomly
            if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
                drops[i] = 0;
            }
            
            // Increment y coordinate
            drops[i]++;
        }
    }
    
    // Run the animation at a slow rate to keep it subtle
    setInterval(draw, 100);
    
    // Resize handler for the canvas
    window.addEventListener('resize', function() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    });
    
    // Highlight any alert indicators
    $('.terminal pre').html($('.terminal pre').html().replace(/!/g, '<span class="highlight-alert">!</span>'));
    
    // Add smooth scrolling behavior to terminal
    terminal.on('mousewheel DOMMouseScroll', function(e) {
        const delta = e.originalEvent.wheelDelta || -e.originalEvent.detail;
        this.scrollTop += (delta < 0 ? 1 : -1) * 30;
        e.preventDefault();
    });
    
    // Type writer effect for initial message (only apply if no monitoring results)
    if (!terminalPre.text().includes('Network Monitoring Results')) {
        const originalText = terminalPre.text();
        terminalPre.text('');
        
        let i = 0;
        const typeWriter = function() {
            if (i < originalText.length) {
                terminalPre.text(terminalPre.text() + originalText.charAt(i));
                i++;
                setTimeout(typeWriter, 10);
            }
        };
        
        typeWriter();
    } else {
        // If showing results, scroll to bottom of terminal
        terminal.scrollTop(terminal[0].scrollHeight);
    }
    
    // Add responsive terminal height
    function adjustTerminalHeight() {
        const windowHeight = $(window).height();
        const terminalTop = terminal.offset().top;
        const desiredHeight = windowHeight - terminalTop - 50; // 50px padding
        
        if (desiredHeight > 300) { // Minimum height
            terminal.css('height', desiredHeight + 'px');
        }
    }
    
    // Initial adjustment and resize listener
    adjustTerminalHeight();
    $(window).on('resize', adjustTerminalHeight);
    
    // Subtle animation for the form container
    TweenLite.from('.form-container', 1, {
        opacity: 0,
        y: -20,
        ease: Power2.easeOut
    });
    
    // Animate terminal entrance
    TweenLite.from('.terminal-container', 1.5, {
        opacity: 0,
        y: 30,
        ease: Power2.easeOut,
        delay: 0.3
    });
    
    // Subtle hover effects for buttons via jQuery
    $('button').hover(
        function() {
            TweenLite.to($(this), 0.3, {
                backgroundColor: 'rgba(30, 180, 30, 0.7)',
                letterSpacing: '1.5px',
                scale: 1.05
            });
        },
        function() {
            TweenLite.to($(this), 0.3, {
                backgroundColor: 'rgba(20, 120, 20, 0.6)',
                letterSpacing: '1px',
                scale: 1
            });
        }
    );
});