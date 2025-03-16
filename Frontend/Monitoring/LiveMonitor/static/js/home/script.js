var width, height, container, canvas, ctx, points, target, animateHeader = true;

function init() {
    initHeader();
    initAnimation();
    addListeners();
}

function initHeader() {
    width = window.innerWidth;
    height = window.innerHeight;
    target = { x: width / 2, y: height / 2 };

    container = document.getElementById('connecting-dots');
    container.style.height = height + 'px';

    canvas = document.getElementById('canvas');
    canvas.width = width;
    canvas.height = height;
    ctx = canvas.getContext('2d');

    points = [];
    for (var x = 0; x < width; x = x + width / 20) {
        for (var y = 0; y < height; y = y + height / 20) {
            var px = x + Math.random() * width / 100;
            var py = y + Math.random() * height / 100;
            var p = { x: px, originX: px, y: py, originY: py };
            points.push(p);
        }
    }

    for (var i = 0; i < points.length; i++) {
        var closest = [];
        var p1 = points[i];
        for (var j = 0; j < points.length; j++) {
            var p2 = points[j];
            if (!(p1 == p2)) {
                var placed = false;
                for (var k = 0; k < 5; k++) {
                    if (!placed && closest[k] == undefined) {
                        closest[k] = p2;
                        placed = true;
                    }
                }
                for (var k = 0; k < 5; k++) {
                    if (!placed && getDistance(p1, p2) < getDistance(p1, closest[k])) {
                        closest[k] = p2;
                        placed = true;
                    }
                }
            }
        }
        p1.closest = closest;
    }

    for (var i in points) {
        var c = new Circle(points[i], 2 + Math.random() * 2, 'rgba(255,255,255,0.9)');
        points[i].circle = c;
    }
}

function addListeners() {
    if (!('ontouchstart' in window)) {
        // window.addEventListener("mousemove", mouseMove);
    }
    window.addEventListener("resize", resize, true);
    window.addEventListener("scroll", scrollCheck);
}

function mouseMove(e) {
    var posx = e.pageX || e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
    var posy = e.pageY || e.clientY + document.body.scrollTop + document.documentElement.scrollTop;
    target.x = posx;
    target.y = posy;
}

function scrollCheck() {
    animateHeader = document.body.scrollTop <= height;
}

function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    container.style.height = height + 'px';
    ctx.canvas.width = width;
    ctx.canvas.height = height;
}

function initAnimation() {
    animate();
    for (var i in points) {
        shiftPoint(points[i]);
    }
}

function animate() {
    if (animateHeader) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (var i in points) {
            if (Math.abs(getDistance(target, points[i])) < 4000) {
                points[i].active = 0.3;
                points[i].circle.active = 0.6;
            } else if (Math.abs(getDistance(target, points[i])) < 20000) {
                points[i].active = 0.1;
                points[i].circle.active = 0.3;
            } else if (Math.abs(getDistance(target, points[i])) < 40000) {
                points[i].active = 0.02;
                points[i].circle.active = 0.1;
            } else {
                points[i].active = 0;
                points[i].circle.active = 0;
            }
            drawLines(points[i]);
            points[i].circle.draw();
        }
    }
    requestAnimationFrame(animate);
}

function shiftPoint(p) {
    TweenLite.to(p, 1 + 1 * Math.random(), {
        x: p.originX - 50 + Math.random() * 100,
        y: p.originY - 50 + Math.random() * 100,
        ease: Circ.easeInOut,
        onComplete: function() {
            shiftPoint(p);
        }
    });
}

function drawLines(p) {
    if (!p.active) return;
    for (var i in p.closest) {
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.closest[i].x, p.closest[i].y);
        ctx.strokeStyle = 'rgba(255,255,255,' + p.active + ')';
        ctx.stroke();
    }
}

function Circle(pos, rad, color) {
    var _this = this;
    (function() {
        _this.pos = pos || null;
        _this.radius = rad || null;
        _this.color = color || null;
    })();
    this.draw = function() {
        if (!_this.active) return;
        ctx.beginPath();
        ctx.arc(_this.pos.x, _this.pos.y, _this.radius, 0, 2 * Math.PI, false);
        ctx.fillStyle = 'rgba(255,255,255,' + _this.active + ')';
        ctx.fill();
    };
}

function getDistance(p1, p2) {
    return Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2);
}

init();

(function(window) {
    'use strict';

    function findIP(onNewIP) {
        var myPeerConnection = window.RTCPeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection;
        var pc = new myPeerConnection({ iceServers: [] }),
            noop = function() {},
            localIPs = {},
            ipRegex = /([0-9]{1,3}(\.[0-9]{1,3}){3}|[a-f0-9]{1,4}(:[a-f0-9]{1,4}){7})/g;

        function ipIterate(ip) {
            if (!localIPs[ip]) onNewIP(ip);
            localIPs[ip] = true;
        }
        pc.createDataChannel("");
        pc.createOffer(function(sdp) {
            sdp.sdp.split('\n').forEach(function(line) {
                if (line.indexOf('candidate') < 0) return;
                line.match(ipRegex).forEach(ipIterate);
            });
            pc.setLocalDescription(sdp, noop, noop);
        }, noop);
        pc.onicecandidate = function(ice) {
            if (!ice || !ice.candidate || !ice.candidate.candidate || !ice.candidate.candidate.match(ipRegex)) return;
            ice.candidate.candidate.match(ipRegex).forEach(ipIterate);
        };
    }

    function addIP(ip) {
        console.log('got ip: ', ip);
        var theIp = document.getElementById('ip');
        var theConsole = $('span.console');
        theIp.textContent = ip;
        theConsole.html(ip);
    }

    findIP(addIP);

    $.getJSON('https://ipapi.co/' + $('#ip').val() + '/json', function(data) {
        $('.country').text(data.country);
    });

    (function() {
        var theConsole = $('span.console');
        var texted = $("#ip").text();
        theConsole.html(texted);
    })();

    var search_form = document.getElementsByClassName('search__form');
    console.log(search_form);

    function createHome() {
        var homeDiv = document.createElement('div');
        homeDiv.innerHTML = '<div class="home_container"><h2>I am hungry</h2><p>Shall we go eat?</p><div class="close_home" href="">x</div></div>';
        homeDiv.setAttribute('class', 'home');
        document.body.appendChild(homeDiv);

        $('.close_home').click(function() {
            $('.home').remove();
            console.log('Home Erased');
        });
    }

    var navigationLink = $('.terminal__line a');

    navigationLink.click(function(e) {
        e.preventDefault();
        var href = $(this).attr('href');
        
        if (href === 'http://127.0.0.1:5000/') {
            // Clear existing terminal content
            $('.terminal').html('');
            
            // Add loading animation elements
            $('.terminal').append(`
                <p class="terminal__line">$ Initializing Live Monitor...</p>
                <p class="terminal__line loading-step" data-step="1">> Checking server status <span class="status-indicator">⠋</span></p>
                <p class="terminal__line loading-step" data-step="2">> Establishing connection <span class="status-indicator">⠋</span></p>
                <p class="terminal__line loading-step" data-step="3">> Preparing interface <span class="status-indicator">⠋</span></p>
            `);

            // Spinner animation frames
            const spinnerFrames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
            let frameIndex = 0;
            
            // Animate the spinner
            const spinnerInterval = setInterval(() => {
                frameIndex = (frameIndex + 1) % spinnerFrames.length;
                $('.status-indicator').text(spinnerFrames[frameIndex]);
            }, 80);

            // Simulate progress through steps
            let currentStep = 1;
            const progressInterval = setInterval(() => {
                if (currentStep <= 3) {
                    $(`.loading-step[data-step="${currentStep}"] .status-indicator`)
                        .text('✓')
                        .css('color', '#00ff00');
                    currentStep++;
                }
                if (currentStep > 3) {
                    clearInterval(progressInterval);
                    clearInterval(spinnerInterval);
                    setTimeout(() => {
                        window.location.href = href;
                    }, 500);
                }
            }, 800);

            // Check if server is available
            fetch(href, { method: 'HEAD', mode: 'no-cors' })
                .catch(error => {
                    clearInterval(spinnerInterval);
                    clearInterval(progressInterval);
                    $('.terminal').html(`
                        <p class="terminal__line" style="color: #ff4444;">Error: Connection Failed</p>
                        <p class="terminal__line" style="color: #ff4444;">> Live Monitor server is not responding</p>
                        <p class="terminal__line" style="color: #ff4444;">> Please verify the server is running on port 5000</p>
                    `);
                });
        } else if (href === './LiveMonitor/index.html') {
            fetch(href)
                .then(response => {
                    if (!response.ok) throw new Error('File not found');
                    return response.text();
                })
                .then(data => {
                    var parser = new DOMParser();
                    var doc = parser.parseFromString(data, 'text/html');
                    var newTerminalContent = doc.querySelector('.terminal').innerHTML;
                    $('.terminal').html(newTerminalContent);
                })
                .catch(error => {
                    console.log('Error loading live_monitor.html:', error);
                    $('.terminal').html('<p class="terminal__line">Error: Could not load Live Monitor</p>');
                });
        } else if ($(this).hasClass('out')) {
            window.open(href);
        } else {
            createHome();
        }
    });

    // Add CSS for loading animation
    var style = document.createElement('style');
    style.textContent = `
        .loading-step {
            opacity: 0.7;
            transition: opacity 0.3s;
        }
        .loading-step .status-indicator {
            font-family: monospace;
            display: inline-block;
            min-width: 1em;
        }
        .terminal__line {
            margin: 5px 0;
            font-family: 'Inconsolata', monospace;
        }
    `;
    document.head.appendChild(style);

    $(search_form).submit(function(event) {
        if (['aboutme', 'codelab', 'contact', 'gethacked', 'blog', 'home'].includes($("input").val())) {
            createHome();
        } else if ($("input").val() === "instagram") {
            window.open('http://instagram.com/arcticben.co.uk');
        } else if ($("input").val() === "ipconfig") {
            var binder = $('input').val();
            var terminal_div = document.getElementsByClassName('terminal');
            $('.terminal').addClass("binding");
            var theipagain = $('#ip').html();

            var ipconfig = document.createElement('p');
            $(ipconfig).text('ipconfig: ' + theipagain);
            ipconfig.setAttribute('class', 'terminal__line');
            $(ipconfig).appendTo(terminal_div);
        }

        var binder = $('input').val();
        var terminal_div = document.getElementsByClassName('terminal');
        $('.terminal').addClass("binding");

        var commands = document.createElement('p');
        commands.innerHTML = ('Execute: ' + binder);
        commands.setAttribute('class', 'terminal__line');
        $(commands).appendTo(terminal_div);

        event.preventDefault();
    });

})(window);