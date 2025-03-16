$(document).ready(function() {
    // Terminal animation effects
    const terminal = $('.terminal');
    
    // Subtle pulsing effect for the terminal
    TweenLite.to(terminal, 2, {
        boxShadow: "0 10px 30px rgba(0, 255, 0, 0.1)",
        repeat: -1,
        yoyo: true,
        ease: Power1.easeInOut
    });
    
    // Smooth scrolling for terminal
    terminal.on('mousewheel DOMMouseScroll', function(e) {
        const delta = e.originalEvent.wheelDelta || -e.originalEvent.detail;
        this.scrollTop += (delta < 0 ? 1 : -1) * 30;
        e.preventDefault();
    });
    
    // Scroll to bottom of terminal on load
    terminal.scrollTop(terminal[0].scrollHeight);
    
    // ===== Real-time functionality =====
    let eventSource = null;
    const terminalContent = document.getElementById('terminal-content');
    const monitorForm = document.getElementById('monitor-form');
    const realtimeStatus = document.getElementById('realtime-status');
    const statusText = document.getElementById('status-text');
    const statusDot = document.querySelector('.status-dot');
    
    // Mode selection handling
    const modeInputs = document.querySelectorAll('input[name="mode"]');
    const form = document.getElementById('monitor-form');
    const serverInput = document.getElementById('server');
    const countInput = document.getElementById('count');
    const startBtn = document.getElementById('start-btn');

    modeInputs.forEach(input => {
        input.addEventListener('change', function() {
            // Remove previous mode class
            form.classList.remove('mode-realtime', 'mode-standard', 'mode-full');
            // Add new mode class
            form.classList.add(`mode-${this.value}`);

            // Update mode description
            const modeDescription = document.getElementById('mode-description');
            const descriptions = {
                'realtime': `Real-Time Mode: Monitor a single server with live updates. See ping times, jitter, and network performance as they happen. Best for detailed analysis of a specific connection.`,
                'standard': `Standard Mode: Test a single server with a set number of pings. Results are shown after completion. Ideal for quick network tests and generating detailed reports.`,
                'full': `Full Monitor Mode: Simultaneously monitor multiple pre-configured servers:
• Your Gateway (${getDefaultGateway()})
• Second Hop Router
• Google DNS (8.8.8.8)
• Level3 DNS (4.2.2.4)
• Local DNS (5.202.100.100)
• Google Website

This mode provides comprehensive network path analysis with a unified abnormal events log.`
            };

            // Add highlight class
            modeDescription.classList.add('highlight');
            // Update description
            modeDescription.innerHTML = `<p>${descriptions[this.value]}</p>`;
            // Remove highlight after animation
            setTimeout(() => modeDescription.classList.remove('highlight'), 300);

            if (this.value === 'full') {
                serverInput.removeAttribute('required');
                serverInput.value = ''; // Clear server input
                startBtn.textContent = 'Start Full Monitor';
                unifiedLogContainer.style.display = 'block';
                clearUnifiedLogs();
            } else {
                serverInput.setAttribute('required', 'required');
                startBtn.textContent = 'Start Monitoring';
                unifiedLogContainer.style.display = 'none';
            }

            // Stop any ongoing monitoring
            stopAllMonitors();
            stopRealTimeMonitoring();
            
            // Reset display
            mainTerminal.style.display = 'block';
            multiTerminalContainer.style.display = 'none';
            multiTerminalContainer.innerHTML = '';
        });
    });

    // Handle form submission
    monitorForm.addEventListener('submit', function(e) {
        e.preventDefault(); // Always prevent default to handle all modes
        
        const selectedMode = document.querySelector('input[name="mode"]:checked').value;
        const count = parseInt(countInput.value) || 10;
        
        if (count < 1 || count > 100) {
            alert('Packet count must be between 1 and 100');
            return;
        }
        
        switch(selectedMode) {
            case 'full':
                mainTerminal.style.display = 'none';
                multiTerminalContainer.style.display = 'grid';
                startFullMonitoring();
                break;
                
            case 'realtime':
                if (!serverInput.value.trim()) {
                    alert('Please enter a server address or IP');
                    return;
                }
                startRealTimeMonitoring();
                break;
                
            case 'standard':
                if (!serverInput.value.trim()) {
                    alert('Please enter a server address or IP');
                    return;
                }
                form.submit(); // Actually submit the form for standard mode
                break;
        }
    });
    
    // Stop button handler
    document.getElementById('stop-btn').addEventListener('click', function() {
        stopRealTimeMonitoring();
    });
    
    // Start real-time monitoring
    function startRealTimeMonitoring() {
        // Get form values
        const server = document.getElementById('server').value.trim();
        const count = document.getElementById('count').value;
        
        // Validate
        if (!server) {
            alert('Please enter a server address or IP');
            return;
        }
        
        // Close any existing connection
        stopRealTimeMonitoring();
        
        // Show status indicator
        realtimeStatus.style.display = 'block';
        statusDot.className = 'status-dot connecting';
        statusText.textContent = 'Connecting...';
        
        // Clear terminal and set initial content
        const currentTime = new Date().toLocaleTimeString();
        terminalContent.innerHTML = `// Network Monitoring Results - LIVE
// Server: ${server}
// Packets: ${count}
// Time: ${currentTime}
// -----------------------------------------------

`;
        
        // Connect to SSE endpoint
        try {
            eventSource = new EventSource(`/ping-stream?server=${encodeURIComponent(server)}&count=${count}&_=${Date.now()}`);
            
            // Variables to track results state
            let hasHeader = false;
            
            // Handle connection open
            eventSource.onopen = function() {
                statusDot.className = 'status-dot active';
                statusText.textContent = 'Connected';
            };
            
            // Handle connection error
            eventSource.onerror = function() {
                statusDot.className = 'status-dot error';
                statusText.textContent = 'Connection error';
                appendToTerminal('<span class="highlight-alert">Connection error. Please try again.</span>\n');
                // Don't close connection here - browser will try to reconnect
            };
            
            // Handle message
            eventSource.onmessage = function(event) {
                try {
                    // Check if it's a keepalive message
                    if (event.data.trim() === '') {
                        return;
                    }
                    
                    const data = JSON.parse(event.data);
                    
                    switch(data.type) {
                        case 'header':
                            // Add interface info and table header
                            const interfaceInfo = `Interface: ${data.interface}\n`;
                            const tableHeader = `Packet   | Ping (ms)    | Jitter (ms)  | Download (Mbps)  | Upload (Mbps)\n`;
                            const separator = `${'─'.repeat(70)}\n`;
                            
                            appendToTerminal(interfaceInfo + tableHeader + separator);
                            hasHeader = true;
                            break;
                            
                        case 'ping_result':
                            if (!hasHeader) break;
                            
                            // Update status
                            statusText.textContent = `Ping ${data.packet_num}/${count}`;
                            
                            let resultLine = '';
                            const packetNum = String(data.packet_num).padEnd(6);
                            
                            if (data.status === 'success') {
                                let pingDisplay = data.ping_display;
                                let jitterDisplay = data.jitter_display;
                                
                                // Format result line with proper padding
                                resultLine = `${packetNum} | ${pingDisplay.padEnd(12)} | ${jitterDisplay.padEnd(12)} | ${data.download.toFixed(2).padEnd(16)} | ${data.upload.toFixed(2).padEnd(14)}\n`;
                            } else {
                                resultLine = `${packetNum} | ${'Timeout'.padEnd(12)} | ${'-'.padEnd(12)} | ${'-'.padEnd(16)} | ${'-'.padEnd(14)}\n`;
                            }
                            
                            appendToTerminal(resultLine);
                            break;
                            
                        case 'summary':
                            // Update status
                            statusDot.className = 'status-dot complete';
                            statusText.textContent = 'Completed';
                            
                            // Format summary
                            let summaryText = `\n// Summary\n`;
                            summaryText += `// -----------------------------------------------\n`;
                            summaryText += `Interface: ${data.interface}\n`;
                            summaryText += `Average Ping: ${data.avg_ping.toFixed(2)} ms\n`;
                            summaryText += `Average Jitter: ${data.avg_jitter.toFixed(2)} ms\n`;
                            summaryText += `Packet Loss: ${data.packet_loss.toFixed(2)}%\n`;
                            
                            // Map network status to highlight class
                            let statusClass = 'info';
                            const statusLower = data.network_status.toLowerCase();
                            if (statusLower.includes('excellent') || statusLower.includes('good')) statusClass = 'success';
                            if (statusLower.includes('fair')) statusClass = 'warning';
                            if (statusLower.includes('poor') || statusLower.includes('unstable')) statusClass = 'alert';
                            
                            summaryText += `Network Status: <span class="highlight-${statusClass}">${data.network_status}</span>\n`;
                            
                            // Add logs if available
                            if (data.logs && data.logs.length > 0) {
                                summaryText += `\n// Abnormal Events Log\n`;
                                summaryText += `// -----------------------------------------------\n`;
                                data.logs.forEach(log => {
                                    summaryText += `${log}\n`;
                                });
                            }
                            
                            appendToTerminal(summaryText);
                            
                            // Close the connection
                            stopRealTimeMonitoring();
                            break;
                            
                        case 'error':
                            statusDot.className = 'status-dot error';
                            statusText.textContent = 'Error';
                            appendToTerminal(`<span class="highlight-alert">${data.message}</span>\n`);
                            break;
                    }
                } catch (error) {
                    console.error('Error processing event:', error);
                    appendToTerminal(`<span class="highlight-alert">Error processing data: ${error.message}</span>\n`);
                }
            };
        } catch (error) {
            console.error('Error creating EventSource:', error);
            statusDot.className = 'status-dot error';
            statusText.textContent = 'Connection failed';
            appendToTerminal(`<span class="highlight-alert">Error: Could not connect to server. ${error.message}</span>\n`);
        }
    }
    
    // Stop real-time monitoring
    function stopRealTimeMonitoring() {
        if (eventSource) {
            eventSource.close();
            eventSource = null;
        }
        
        realtimeStatus.style.display = 'none';
    }
    
    // Clear logs button functionality
    const clearLogsBtn = document.getElementById('clear-logs-btn');
    if (clearLogsBtn) {
        clearLogsBtn.addEventListener('click', function() {
            clearLogs();
        });
    }

    function clearLogs() {
        fetch('/clear-logs', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                // Hide the clear logs button
                const clearLogsBtn = document.getElementById('clear-logs-btn');
                if (clearLogsBtn) {
                    clearLogsBtn.style.display = 'none';
                }

                // Format server list with proper line breaks
                const serverListContent = data.server_list.map(server => server).join('\n');

                // Reset terminal to initial state with proper formatting
                const terminal = document.getElementById('terminal-content');
                terminal.innerHTML = `// Network Monitor Ready
// -----------------------------------------------

Please enter a server address or IP above and click
"Start Monitoring" to begin the network analysis.

The best servers that you can monitor:
// -----------------------------------------------
${serverListContent}

The monitor will analyze ping times, jitter, and
network throughput to evaluate connection quality.

Note: "Real-Time" mode shows results as they happen.
"Standard" mode shows all results after completion.`;
            }
        })
        .catch(error => console.error('Error:', error));
    }

    // Helper function to get server list from the page
    function getServerList() {
        const terminalContent = document.getElementById('terminal-content');
        const content = terminalContent.textContent;
        const servers = [];
        
        const startMarker = "The best servers that you can monitor:";
        const endMarker = "The monitor will analyze";
        
        if (content.includes(startMarker) && content.includes(endMarker)) {
            const start = content.indexOf(startMarker) + startMarker.length;
            const end = content.indexOf(endMarker);
            const serverSection = content.substring(start, end).trim();
            
            const lines = serverSection.split('\n')
                .filter(line => line.trim() && !line.includes('-------'))
                .map(line => {
                    const match = line.match(/(.*?)\s*\((.*?)\)/);
                    if (match) {
                        return {
                            address: match[1].trim(),
                            description: match[2].trim()
                        };
                    }
                    return null;
                })
                .filter(server => server !== null);
            
            return lines;
        }
        
        return [];
    }

    // Show clear button when results are available
    function showClearButton() {
        const clearLogsBtn = document.getElementById('clear-logs-btn');
        if (clearLogsBtn) {
            clearLogsBtn.style.display = 'inline-block';
        }
    }

    // Modify the appendToTerminal function to show clear button
    function appendToTerminal(content) {
        terminalContent.innerHTML += content;
        terminal.scrollTop(terminal[0].scrollHeight);
        showClearButton();
    }

    // Full Monitor functionality
    const fullMonitorBtn = document.getElementById('full-monitor-btn');
    const mainTerminal = document.getElementById('main-terminal');
    const multiTerminalContainer = document.getElementById('multi-terminal-container');
    let activeMonitors = new Map(); // Store active EventSource instances

    function createTerminalInstance(server) {
        const terminalDiv = document.createElement('div');
        terminalDiv.className = 'terminal-instance';
        terminalDiv.id = `terminal-${server.address}`;
        
        terminalDiv.innerHTML = `
            <div class="terminal-header">
                <span>${server.address} (${server.description})</span>
                <div class="status-indicator">
                    <span class="status-dot connecting"></span>
                    <span class="status-text">Connecting...</span>
                </div>
            </div>
            <div class="terminal-content"></div>
        `;
        
        return terminalDiv;
    }

    // Add unified log handling
    const unifiedLogContainer = document.getElementById('unified-log-container');
    const unifiedLogContent = document.querySelector('.unified-log-content');
    const unifiedLogDot = document.querySelector('.unified-log-header .status-dot');
    let unifiedLogs = new Set(); // Use Set to avoid duplicates

    function updateUnifiedLog(server, log) {
        if (log && log.trim()) {
            const now = new Date();
            const timestamp = now.toLocaleString('en-US', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false
            });
            const logEntry = `[${timestamp}] [${server.address}] ${log}`;
            unifiedLogs.add(logEntry);
            refreshUnifiedLogDisplay();
        }
    }

    function refreshUnifiedLogDisplay() {
        if (unifiedLogs.size > 0) {
            unifiedLogContent.innerHTML = Array.from(unifiedLogs).join('\n');
            unifiedLogContent.scrollTop = unifiedLogContent.scrollHeight;
            unifiedLogDot.classList.add('active');
        } else {
            unifiedLogContent.innerHTML = 'No abnormal events detected.';
            unifiedLogDot.classList.remove('active');
        }
    }

    function clearUnifiedLogs() {
        unifiedLogs.clear();
        refreshUnifiedLogDisplay();
    }

    function startMonitoring(server, terminalInstance, count) {
        const contentDiv = terminalInstance.querySelector('.terminal-content');
        const statusDot = terminalInstance.querySelector('.status-dot');
        const statusText = terminalInstance.querySelector('.status-text');
        
        // Initialize content
        contentDiv.innerHTML = `// Monitoring ${server.address} (${server.description})
// -----------------------------------------------\n\n`;
        
        const eventSource = new EventSource(`/ping-stream?server=${encodeURIComponent(server.address)}&count=${count}&_=${Date.now()}`);
        
        eventSource.onopen = function() {
            statusDot.className = 'status-dot active';
            statusText.textContent = 'Connected';
        };
        
        eventSource.onerror = function() {
            statusDot.className = 'status-dot error';
            statusText.textContent = 'Error';
            contentDiv.innerHTML += '<span class="highlight-alert">Connection error. Please try again.</span>\n';
        };
        
        eventSource.onmessage = function(event) {
            try {
                if (event.data.trim() === '') return;
                
                const data = JSON.parse(event.data);
                
                switch(data.type) {
                    case 'header':
                        contentDiv.innerHTML += `Interface: ${data.interface}\n`;
                        contentDiv.innerHTML += `Packet   | Ping (ms)    | Jitter (ms)  | Download (Mbps)  | Upload (Mbps)\n`;
                        contentDiv.innerHTML += `${'─'.repeat(70)}\n`;
                        break;
                        
                    case 'ping_result':
                        if (data.status === 'success') {
                            contentDiv.innerHTML += `${String(data.packet_num).padEnd(6)} | ${data.ping_display.padEnd(12)} | ${data.jitter_display.padEnd(12)} | ${data.download.toFixed(2).padEnd(16)} | ${data.upload.toFixed(2).padEnd(14)}\n`;
                            
                            // Add abnormal events to unified log
                            if (data.alerts && data.alerts.length > 0) {
                                data.alerts.forEach(alert => {
                                    const logMessage = `Alert: ${alert} - Ping: ${data.ping_display}, Jitter: ${data.jitter_display}`;
                                    updateUnifiedLog(server, logMessage);
                                });
                            }
                        }
                        break;
                        
                    case 'summary':
                        statusDot.className = 'status-dot complete';
                        statusText.textContent = 'Completed';
                        
                        contentDiv.innerHTML += `\n// Summary\n`;
                        contentDiv.innerHTML += `// -----------------------------------------------\n`;
                        contentDiv.innerHTML += `Average Ping: ${data.avg_ping.toFixed(2)} ms\n`;
                        contentDiv.innerHTML += `Average Jitter: ${data.avg_jitter.toFixed(2)} ms\n`;
                        contentDiv.innerHTML += `Packet Loss: ${data.packet_loss.toFixed(2)}%\n`;
                        contentDiv.innerHTML += `Network Status: ${data.network_status}\n`;
                        
                        // Remove the abnormal events section from individual terminals
                        // Add summary alerts to unified log if there are issues
                        if (data.network_status.toLowerCase().includes('poor') || 
                            data.network_status.toLowerCase().includes('unstable')) {
                            const summaryLog = `Summary Alert: ${data.network_status} - Avg Ping: ${data.avg_ping.toFixed(2)}ms, Packet Loss: ${data.packet_loss.toFixed(2)}%`;
                            updateUnifiedLog(server, summaryLog);
                        }
                        
                        // Close connection
                        eventSource.close();
                        activeMonitors.delete(server.address);
                        break;
                        
                    case 'error':
                        statusDot.className = 'status-dot error';
                        statusText.textContent = 'Error';
                        contentDiv.innerHTML += `<span class="highlight-alert">${data.message}</span>\n`;
                        break;
                }
                
                contentDiv.scrollTop = contentDiv.scrollHeight;
            } catch (error) {
                console.error('Error processing event:', error);
                updateUnifiedLog(server, `Error: ${error.message}`);
            }
        };
        
        return eventSource;
    }

    function stopAllMonitors() {
        activeMonitors.forEach((eventSource) => {
            eventSource.close();
        });
        activeMonitors.clear();
        clearUnifiedLogs();
    }

    function startFullMonitoring() {
        const servers = getServerList();
        if (servers.length === 0) {
            alert('No servers available to monitor.');
            return;
        }

        const count = parseInt(countInput.value) || 10;

        // Stop any existing monitors
        stopAllMonitors();
        multiTerminalContainer.innerHTML = '';

        // Start monitoring all servers
        servers.forEach(server => {
            const terminalInstance = createTerminalInstance(server);
            multiTerminalContainer.appendChild(terminalInstance);
            const eventSource = startMonitoring(server, terminalInstance, count);
            activeMonitors.set(server.address, eventSource);
        });
    }

    // Helper function to get default gateway from the server list
    function getDefaultGateway() {
        const servers = getServerList();
        const gateway = servers.find(server => server.description === 'Your Gateway');
        return gateway ? gateway.address : 'Auto-detected';
    }
});
