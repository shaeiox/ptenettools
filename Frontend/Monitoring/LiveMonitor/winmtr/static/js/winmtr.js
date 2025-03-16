document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const traceForm = document.getElementById('trace-form');
    const modeRadios = document.querySelectorAll('input[name="mode"]');
    const modeDescription = document.getElementById('mode-description');
    const targetInput = document.getElementById('target');
    const multiTargetInput = document.getElementById('multi-targets');
    const multiTargetInputGroup = document.getElementById('multi-target-input');
    const targetInputGroup = document.getElementById('target-input-group');
    const startBtn = document.getElementById('start-btn');
    const exportBtn = document.getElementById('export-btn');
    const clearBtn = document.getElementById('clear-btn');
    const stopBtn = document.getElementById('stop-btn');
    const realtimeStatus = document.getElementById('realtime-status');
    const statusText = document.getElementById('status-text');
    const progressBar = document.getElementById('progress-bar');
    const progressText = document.getElementById('progress-text');
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabPanes = document.querySelectorAll('.tab-pane');
    const hopTable = document.getElementById('hop-table');
    const traceSummary = document.getElementById('trace-summary');
    const rawDataContent = document.getElementById('raw-data-content');
    const networkGraphViz = document.getElementById('network-graph-visualization');
    const multiTargetResults = document.getElementById('multi-target-results');
    const multiTargetTbody = document.getElementById('multi-target-tbody');
    const exportDialog = document.getElementById('export-dialog');
    const exportDownloadBtn = document.getElementById('export-download-btn');
    const exportCancelBtn = document.getElementById('export-cancel-btn');
    
    // Charts
    let latencyChart = null;
    let lossChart = null;
    let jitterChart = null;
    let historyChart = null;
    
    // Network graph
    let networkGraph = null;
    
    // State
    let currentMode = 'standard';
    let activeTraceId = null;
    let eventSource = null;
    let traceResults = null;
    let multiTraceResults = {};
    
    // Initialize
    initializeModeSelection();
    initializeTabs();
    initializeFormEvents();
    
    // Functions
    
    function initializeModeSelection() {
        modeRadios.forEach(radio => {
            radio.addEventListener('change', function() {
                currentMode = this.value;
                updateModeDescription(currentMode);
                toggleInputs(currentMode);
            });
        });
    }
    
    function updateModeDescription(mode) {
        let description = '';
        
        switch(mode) {
            case 'standard':
                description = 'Standard Mode: Complete trace to a single target. Provides detailed hop-by-hop analysis with statistics.';
                break;
            case 'realtime':
                description = 'Real-Time Mode: Watch the trace progress hop by hop with live updates. Best for detailed analysis of the path to a destination.';
                break;
            case 'multi':
                description = 'Multi-Target Mode: Trace multiple destinations simultaneously. Ideal for comparing network paths to different services or locations.';
                break;
        }
        
        modeDescription.innerHTML = `<p>${description}</p>`;
    }
    
    function toggleInputs(mode) {
        const packetCountInput = document.getElementById('packet-count');
        const packetCountGroup = packetCountInput.closest('.input-group');
        const multiTargetInput = document.getElementById('multi-target-input');
        const targetInputGroup = document.getElementById('target-input-group');
        
        if (mode === 'multi') {
            multiTargetInput.style.display = 'block';
            targetInputGroup.style.display = 'none';
        } else {
            multiTargetInput.style.display = 'none';
            targetInputGroup.style.display = 'flex';
            
            // Hide packet count input in realtime mode
            if (mode === 'realtime') {
                packetCountGroup.style.display = 'none';
            } else {
                packetCountGroup.style.display = 'block';
            }
        }
    }
    
    function initializeTabs() {
        tabButtons.forEach(button => {
            button.addEventListener('click', function() {
                const tabId = this.getAttribute('data-tab');
                
                // Remove active class from all buttons and panes
                tabButtons.forEach(btn => btn.classList.remove('active'));
                tabPanes.forEach(pane => pane.classList.remove('active'));
                
                // Add active class to current button and pane
                this.classList.add('active');
                document.getElementById(tabId).classList.add('active');
                
                // Special handling for network graph tab
                if (tabId === 'network-graph' && traceResults && networkGraph === null) {
                    initializeNetworkGraph(traceResults);
                }
                
                // Special handling for charts tab
                if (tabId === 'charts' && traceResults) {
                    updateCharts(traceResults);
                }
            });
        });
    }
    
    function initializeFormEvents() {
        traceForm.addEventListener('submit', function(e) {
            e.preventDefault();
            startTrace();
        });
        
        clearBtn.addEventListener('click', function() {
            resetUI();
        });
        
        stopBtn.addEventListener('click', function() {
            stopTrace();
        });
        
        exportBtn.addEventListener('click', function() {
            showExportDialog();
        });
        
        exportCancelBtn.addEventListener('click', function() {
            hideExportDialog();
        });
        
        exportDownloadBtn.addEventListener('click', function() {
            const format = document.querySelector('input[name="export-format"]:checked').value;
            exportResults(format);
            hideExportDialog();
        });
    }
    
    function startTrace() {
        const mode = document.querySelector('input[name="mode"]:checked').value;
        const target = document.getElementById('target').value;
        const multiTargets = document.getElementById('multi-targets').value;
        const probeType = document.getElementById('probe-type').value;
        const useIpv6 = document.getElementById('use-ipv6').checked;
        
        // Reset UI
        resetUI();
        
        // Show status for real-time mode
        if (mode === 'realtime') {
            document.getElementById('realtime-status').style.display = 'block';
        }
        
        // Prepare trace data
        let data = {
            probe_type: probeType,
            use_ipv6: useIpv6
        };
        
        if (mode === 'multi') {
            // Handle multi-target mode
            const targets = multiTargets.split('\n').filter(t => t.trim());
            if (!targets.length) {
                showError('Please enter at least one target');
                return;
            }
            data.targets = targets;
            startMultiTrace(data);
        } else {
            // Handle single target modes
            if (!target) {
                showError('Please enter a target');
                return;
            }
            data.target = target;
            
            // Only include packet_count for standard mode
            if (mode === 'standard') {
                data.packet_count = parseInt(document.getElementById('packet-count').value);
            }
            
            if (mode === 'realtime') {
                startRealtimeTrace(data);
            } else {
                startStandardTrace(data);
            }
        }
    }
    
    function startStandardTrace(data) {
        startBtn.disabled = true;
        statusText.textContent = 'Starting trace...';
        realtimeStatus.style.display = 'block';
        
        console.log('Starting standard trace with data:', data);
        
        fetch('/api/trace', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
        .then(response => {
            console.log('Received response:', response);
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('Parsed response data:', data);
            if (data.error) {
                showError(data.error);
                return;
            }
            
            activeTraceId = data.trace_id;
            statusText.textContent = 'Trace in progress...';
            
            // Poll for trace completion
            pollTraceStatus();
        })
        .catch(error => {
            console.error('Error starting trace:', error);
            showError('Failed to start trace: ' + error.message);
        });
    }
    
    function startRealtimeTrace(data) {
        // Start a continuous trace without packet count
        console.log('Starting realtime trace with data:', data);
        
        fetch('/api/trace', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
        .then(response => {
            console.log('Received response:', response);
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('Parsed response data:', data);
            if (data.error) {
                showError(data.error);
                return;
            }
            
            activeTraceId = data.trace_id;
            
            // Enable stop button
            stopBtn.disabled = false;
            startBtn.disabled = true;
            
            // Connect to event stream for real-time updates
            connectToEventStream(data.trace_id);
        })
        .catch(error => {
            console.error('Error starting realtime trace:', error);
            showError('Failed to start trace: ' + error.message);
        });
    }
    
    function startMultiTrace(data) {
        startBtn.disabled = true;
        statusText.textContent = 'Starting multi-target trace...';
        realtimeStatus.style.display = 'block';
        
        console.log('Starting multi-target trace with data:', data);
        
        fetch('/api/multi-trace', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
        .then(response => {
            console.log('Received response:', response);
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('Parsed multi-trace response data:', data);
            if (data.error) {
                showError(data.error);
                return;
            }
            
            // Show multi-target results container
            multiTargetResults.style.display = 'block';
            
            // Setup the multi-target table
            setupMultiTargetTable(data.traces);
            
            // Start polling for each trace
            for (const target in data.traces) {
                const traceInfo = data.traces[target];
                if (traceInfo.error) {
                    updateMultiTargetStatus(target, 'error', traceInfo.error);
                } else {
                    pollTraceStatus(traceInfo.trace_id, target);
                }
            }
        })
        .catch(error => {
            console.error('Error starting multi-target trace:', error);
            showError('Failed to start multi-target trace: ' + error.message);
        });
    }
    
    function setupMultiTargetTable(traces) {
        multiTargetTbody.innerHTML = '';
        
        Object.entries(traces).forEach(([target, traceInfo]) => {
            const row = document.createElement('tr');
            row.id = `trace-row-${traceInfo.trace_id || 'error'}`;
            
            if (traceInfo.error) {
                row.innerHTML = `
                    <td>${target}</td>
                    <td class="status error">Error</td>
                    <td>-</td>
                    <td>-</td>
                    <td>-</td>
                    <td>${traceInfo.error}</td>
                `;
            } else {
                row.innerHTML = `
                    <td>${target}</td>
                    <td class="status pending">Pending</td>
                    <td>-</td>
                    <td>-</td>
                    <td>-</td>
                    <td>
                        <button class="view-btn" data-trace-id="${traceInfo.trace_id}" disabled>View</button>
                        <button class="export-btn" data-trace-id="${traceInfo.trace_id}" disabled>Export</button>
                    </td>
                `;
            }
            
            multiTargetTbody.appendChild(row);
        });
    }
    
    function pollTraceStatus(traceId = null, targetName = null) {
        const id = traceId || activeTraceId;
        if (!id) return;
        
        console.log(`Polling trace status for ${id}${targetName ? ' (' + targetName + ')' : ''}`);
        
        const checkStatus = () => {
            fetch(`/api/trace/${id}`)
            .then(response => {
                console.log(`Received status response for ${id}:`, response);
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                console.log(`Parsed status data for ${id}:`, data);
                
                // Update progress
                const progress = data.progress || 0;
                updateProgress(progress);
                
                if (targetName) {
                    // Update multi-target progress
                    updateMultiTargetProgress(id, data.status, progress);
                }
                
                // Check if trace is complete
                if (data.status === 'complete' || data.status === 'stopped') {
                    if (targetName) {
                        // Update multi-target results
                        updateMultiTargetStatus(id, data.status);
                        updateMultiTargetResults(id, data.all_results, targetName);
                    } else {
                        // Update single target results
                        statusText.textContent = 'Trace complete';
                        startBtn.disabled = false;
                        exportBtn.disabled = false;
                        
                        // Display results
                        if (data.all_results) {
                            displayTraceResults(data.all_results);
                        } else {
                            fetchTraceResults(id);
                        }
                    }
                } else {
                    // Continue polling
                    setTimeout(checkStatus, 1000);
                }
            })
            .catch(error => {
                console.error(`Error polling trace status for ${id}:`, error);
                statusText.textContent = `Error: ${error.message}`;
                if (targetName) {
                    updateMultiTargetStatus(id, 'error', error.message);
                }
                startBtn.disabled = false;
            });
        };
        
        // Start checking status
        checkStatus();
    }
    
    function updateMultiTargetProgress(traceId, status, progress) {
        const row = document.getElementById(`trace-row-${traceId}`);
        if (!row) return;
        
        const statusCell = row.querySelector('.status');
        if (statusCell) {
            statusCell.textContent = status === 'complete' ? 'Complete' : 'In Progress';
            statusCell.className = `status ${status === 'complete' ? 'complete' : 'pending'}`;
        }
    }
    
    function updateMultiTargetStatus(traceId, status, message = '') {
        const row = document.getElementById(`trace-row-${traceId}`);
        if (!row) return;
        
        const statusCell = row.querySelector('.status');
        if (statusCell) {
            statusCell.textContent = status === 'error' ? 'Error' : status;
            statusCell.className = `status ${status}`;
        }
        
        // If we have a message and this is an error, update the last cell
        if (message && status === 'error') {
            const cells = row.querySelectorAll('td');
            if (cells.length >= 6) {
                cells[5].textContent = message;
            }
        }
    }
    
    function updateMultiTargetResults(traceId, results, targetName) {
        const row = document.getElementById(`trace-row-${traceId}`);
        if (!row) return;
        
        const cells = row.querySelectorAll('td');
        
        // Store the results
        multiTraceResults[traceId] = {
            target: targetName,
            results: results
        };
        
        // Calculate summary values
        let hopCount = results.length;
        let avgRtt = '-';
        let packetLoss = '-';
        
        // Extract metrics if available
        const validRtts = results.filter(hop => hop.avg_rtt !== null).map(hop => hop.avg_rtt);
        if (validRtts.length > 0) {
            const sum = validRtts.reduce((a, b) => a + b, 0);
            avgRtt = (sum / validRtts.length).toFixed(1) + ' ms';
        }
        
        // Calculate overall packet loss
        const totalProbes = results.reduce((sum, hop) => sum + (hop.probes ? hop.probes.length : 0), 0);
        const totalTimeouts = results.reduce((sum, hop) => sum + (hop.timeouts || 0), 0);
        if (totalProbes > 0) {
            packetLoss = ((totalTimeouts / totalProbes) * 100).toFixed(1) + '%';
        }
        
        // Update the table cells
        if (cells.length >= 6) {
            cells[2].textContent = hopCount;
            cells[3].textContent = avgRtt;
            cells[4].textContent = packetLoss;
            
            // Enable buttons
            const viewBtn = row.querySelector('.view-btn');
            const exportBtn = row.querySelector('.export-btn');
            
            if (viewBtn) {
                viewBtn.disabled = false;
                viewBtn.addEventListener('click', () => {
                    viewMultiTargetResults(traceId);
                });
            }
            
            if (exportBtn) {
                exportBtn.disabled = false;
                exportBtn.addEventListener('click', () => {
                    showExportDialog(traceId);
                });
            }
        }
    }
    
    function viewMultiTargetResults(traceId) {
        if (!multiTraceResults[traceId]) return;
        
        // Hide multi-target results
        multiTargetResults.style.display = 'none';
        
        // Display the results for this trace
        displayTraceResults(multiTraceResults[traceId].results);
        
        // Add a back button
        const backBtn = document.createElement('button');
        backBtn.textContent = 'Back to Multi-Target Results';
        backBtn.className = 'back-btn';
        backBtn.addEventListener('click', () => {
            multiTargetResults.style.display = 'block';
            backBtn.remove();
        });
        
        traceSummary.parentNode.insertBefore(backBtn, traceSummary);
    }
    
    function connectToEventStream(traceId) {
        if (window.traceEventSource) {
            window.traceEventSource.close();
        }
        
        window.traceEventSource = new EventSource(`/api/trace/${traceId}/stream`);
        
        window.traceEventSource.onmessage = function(event) {
            const data = JSON.parse(event.data);
            
            if (data.error) {
                showError(data.error);
                closeEventSource();
                return;
            }
            
            // Update progress and status
            updateProgress(data.progress);
            
            // Update status text
            const statusText = document.getElementById('status-text');
            if (statusText) {
                if (data.status === 'discovering') {
                    statusText.textContent = 'Discovering route...';
                } else if (data.status === 'probing') {
                    statusText.textContent = 'Monitoring network path...';
                    // Enable export button once we start getting data
                    document.getElementById('export-btn').disabled = false;
                }
            }
            
            // Always update results in real-time mode
            if (data.all_results && data.all_results.length > 0) {
                displayTraceResults(data.all_results);
            } else if (data.latest_results) {
                updateRealtimeResults(data.latest_results);
            }
            
            // Only close the event source if explicitly stopped
            if (data.status === 'stopped') {
                closeEventSource();
            }
        };
        
        window.traceEventSource.onerror = function() {
            showError('Lost connection to server');
            closeEventSource();
        };
    }
    
    function closeEventSource() {
        if (window.traceEventSource) {
            window.traceEventSource.close();
            window.traceEventSource = null;
        }
        
        // Enable export button
        if (traceResults) {
            exportBtn.disabled = false;
        }
        
        // Re-enable start button
        startBtn.disabled = false;
    }
    
    function fetchTraceResults(traceId, targetName = null) {
        console.log(`Fetching trace results for ${traceId}${targetName ? ' (' + targetName + ')' : ''}`);
        
        fetch(`/api/trace/${traceId}/results`)
        .then(response => {
            console.log(`Received results response for ${traceId}:`, response);
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log(`Parsed results data for ${traceId}:`, data);
            
            if (data.error) {
                if (targetName) {
                    updateMultiTargetStatus(traceId, 'error', data.error);
                } else {
                    showError(data.error);
                }
                return;
            }
            
            if (targetName) {
                // Update multi-target results
                updateMultiTargetResults(traceId, data, targetName);
            } else {
                // Update single target results
                statusText.textContent = 'Trace complete';
                startBtn.disabled = false;
                exportBtn.disabled = false;
                
                // Display results
                displayTraceResults(data);
            }
        })
        .catch(error => {
            console.error(`Error fetching trace results for ${traceId}:`, error);
            if (targetName) {
                updateMultiTargetStatus(traceId, 'error', error.message);
            } else {
                showError('Failed to fetch trace results: ' + error.message);
                startBtn.disabled = false;
            }
        });
    }
    
    function displayTraceResults(results) {
        // Display hop table
        displayHopTable(results);
        
        // Display summary
        displayTraceSummary(results);
        
        // Update raw data view
        rawDataContent.textContent = JSON.stringify(results, null, 2);
        
        // Initialize charts
        updateCharts(results);
    }
    
    function displayHopTable(results) {
        let tableHtml = `
            <table class="hop-table">
                <thead>
                    <tr>
                        <th>Hop</th>
                        <th>IP Address</th>
                        <th>Hostname</th>
                        <th>Loss %</th>
                        <th>Sent</th>
                        <th>Recv</th>
                        <th>Best</th>
                        <th>Avg</th>
                        <th>Worst</th>
                        <th>Jitter</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        results.forEach(hop => {
            const totalProbes = hop.probes ? hop.probes.length : 0;
            const timeouts = hop.timeouts || 0;
            const received = totalProbes - timeouts;
            const lossPercent = totalProbes > 0 ? ((timeouts / totalProbes) * 100).toFixed(1) : '0.0';
            
            // Determine row class based on loss percentage
            let rowClass = '';
            if (lossPercent > 50) {
                rowClass = 'high-loss';
            } else if (lossPercent > 20) {
                rowClass = 'medium-loss';
            }
            
            // Format RTT values
            const minRtt = hop.min_rtt !== null ? hop.min_rtt.toFixed(1) : '-';
            const avgRtt = hop.avg_rtt !== null ? hop.avg_rtt.toFixed(1) : '-';
            const maxRtt = hop.max_rtt !== null ? hop.max_rtt.toFixed(1) : '-';
            const jitter = hop.jitter !== null ? hop.jitter.toFixed(1) : '-';
            
            // Get primary IP and hostname (first ones in the arrays)
            const primaryIp = hop.ips && hop.ips.length > 0 ? hop.ips[0] : '*';
            const primaryHostname = hop.hostnames && hop.hostnames.length > 0 ? hop.hostnames[0] : '';
            
            tableHtml += `
                <tr class="${rowClass}">
                    <td>${hop.hop}</td>
                    <td>${primaryIp}</td>
                    <td>${primaryHostname}</td>
                    <td>${lossPercent}%</td>
                    <td>${totalProbes}</td>
                    <td>${received}</td>
                    <td>${minRtt}</td>
                    <td>${avgRtt}</td>
                    <td>${maxRtt}</td>
                    <td>${jitter}</td>
                </tr>
            `;
        });
        
        tableHtml += `
                </tbody>
            </table>
        `;
        
        hopTable.innerHTML = tableHtml;
    }
    
    function displayTraceSummary(results) {
        // Extract basic information
        const totalHops = results.length;
        const lastHop = results[totalHops - 1];
        const targetIp = lastHop.ips && lastHop.ips.length > 0 ? lastHop.ips[0] : '*';
        const targetHostname = lastHop.hostnames && lastHop.hostnames.length > 0 ? lastHop.hostnames[0] : '';
        
        // Calculate overall statistics
        let totalSent = 0;
        let totalLost = 0;
        let validRtts = [];
        
        results.forEach(hop => {
            const sent = hop.probes ? hop.probes.length : 0;
            const lost = hop.timeouts || 0;
            
            totalSent += sent;
            totalLost += lost;
            
            if (hop.avg_rtt !== null) {
                validRtts.push(hop.avg_rtt);
            }
        });
        
        // Calculate overall loss percentage
        const overallLossPercent = totalSent > 0 ? ((totalLost / totalSent) * 100).toFixed(1) : '0.0';
        
        // Calculate path quality metrics
        let minRtt = '-';
        let avgRtt = '-';
        let maxRtt = '-';
        let pathQuality = 'Unknown';
        
        if (validRtts.length > 0) {
            const min = Math.min(...validRtts);
            const max = Math.max(...validRtts);
            const avg = validRtts.reduce((sum, rtt) => sum + rtt, 0) / validRtts.length;
            
            minRtt = min.toFixed(1);
            avgRtt = avg.toFixed(1);
            maxRtt = max.toFixed(1);
            
            // Simple quality assessment
            if (max < 50 && overallLossPercent < 5) {
                pathQuality = 'Excellent';
            } else if (max < 100 && overallLossPercent < 10) {
                pathQuality = 'Good';
            } else if (max < 200 && overallLossPercent < 20) {
                pathQuality = 'Fair';
            } else {
                pathQuality = 'Poor';
            }
        }
        
        // Generate summary HTML
        let summaryHtml = `
            <div class="summary-stats">
                <div class="stat-item">
                    <div class="stat-label">Target</div>
                    <div class="stat-value">${targetIp}</div>
                    <div class="stat-subvalue">${targetHostname}</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">Hops</div>
                    <div class="stat-value">${totalHops}</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">Path Quality</div>
                    <div class="stat-value ${pathQuality.toLowerCase()}">${pathQuality}</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">Packet Loss</div>
                    <div class="stat-value">${overallLossPercent}%</div>
                    <div class="stat-subvalue">${totalLost} of ${totalSent} packets</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">Avg RTT</div>
                    <div class="stat-value">${avgRtt} ms</div>
                    <div class="stat-subvalue">Min: ${minRtt} ms, Max: ${maxRtt} ms</div>
                </div>
            </div>
        `;
        
        traceSummary.querySelector('.summary-content').innerHTML = summaryHtml;
    }
    
    function updateRealtimeResults(latestHop) {
        if (!latestHop) return;
        
        // Get or create the hop table
        let hopTable = document.getElementById('hop-table');
        if (!hopTable) {
            hopTable = document.createElement('div');
            hopTable.id = 'hop-table';
            hopTable.className = 'results-table';
            document.querySelector('.results-table').replaceWith(hopTable);
            
            // Create table header
            hopTable.innerHTML = `
                <table class="hop-table">
                    <thead>
                        <tr>
                            <th>Hop</th>
                            <th>IP</th>
                            <th>Hostname</th>
                            <th>Loss</th>
                            <th>Sent</th>
                            <th>Recv</th>
                            <th>Best</th>
                            <th>Avg</th>
                            <th>Worst</th>
                            <th>Last</th>
                            <th>Jitter</th>
                        </tr>
                    </thead>
                    <tbody></tbody>
                </table>
            `;
        }
        
        const tbody = hopTable.querySelector('tbody');
        if (!tbody) return;
        
        // Find or create row for this hop
        let row = tbody.querySelector(`tr[data-hop="${latestHop.hop}"]`);
        if (!row) {
            row = document.createElement('tr');
            row.setAttribute('data-hop', latestHop.hop);
            tbody.appendChild(row);
        }
        
        // Calculate statistics
        const totalProbes = latestHop.responses + latestHop.timeouts;
        const loss = (latestHop.timeouts / totalProbes * 100) || 0;
        const lastRtt = latestHop.probes && latestHop.probes.length > 0 ? 
            latestHop.probes[latestHop.probes.length - 1].rtt : null;
        
        // Update row content
        row.innerHTML = `
            <td>${latestHop.hop}</td>
            <td>${latestHop.ips ? latestHop.ips[0] || '*' : '*'}</td>
            <td>${latestHop.hostnames ? latestHop.hostnames[0] || '' : ''}</td>
            <td>${loss.toFixed(1)}%</td>
            <td>${totalProbes}</td>
            <td>${latestHop.responses}</td>
            <td>${latestHop.min_rtt ? latestHop.min_rtt.toFixed(1) : '*'}</td>
            <td>${latestHop.avg_rtt ? latestHop.avg_rtt.toFixed(1) : '*'}</td>
            <td>${latestHop.max_rtt ? latestHop.max_rtt.toFixed(1) : '*'}</td>
            <td>${lastRtt ? lastRtt.toFixed(1) : '*'}</td>
            <td>${latestHop.jitter ? latestHop.jitter.toFixed(1) : '*'}</td>
        `;
        
        // Update row class based on loss and latency
        row.className = '';
        if (loss > 20) {
            row.classList.add('high-loss');
        } else if (loss > 5) {
            row.classList.add('medium-loss');
        }
        if (latestHop.avg_rtt > 200) {
            row.classList.add('high-latency');
        }
        
        // Update charts in real-time
        if (document.querySelector('.tab-btn[data-tab="charts"]').classList.contains('active')) {
            updateCharts([latestHop]);
        }
        
        // Update network graph in real-time
        if (document.querySelector('.tab-btn[data-tab="network-graph"]').classList.contains('active')) {
            updateNetworkGraph([latestHop]);
        }
    }
    
    function updateCharts(results) {
        // Prepare data for charts
        const labels = [];
        const rttData = [];
        const jitterData = [];
        const lossData = [];
        
        results.forEach(hop => {
            // Create label (hostname or IP)
            let label = `Hop ${hop.hop}`;
            if (hop.hostnames && hop.hostnames.length > 0 && hop.hostnames[0]) {
                label = hop.hostnames[0];
                // Truncate long hostnames
                if (label.length > 15) {
                    label = label.substring(0, 12) + '...';
                }
            } else if (hop.ips && hop.ips.length > 0) {
                label = hop.ips[0];
            }
            
            labels.push(label);
            
            // RTT data
            rttData.push(hop.avg_rtt !== null ? hop.avg_rtt : 0);
            
            // Jitter data
            jitterData.push(hop.jitter !== null ? hop.jitter : 0);
            
            // Loss data
            const totalProbes = hop.probes ? hop.probes.length : 0;
            const timeouts = hop.timeouts || 0;
            const lossPercent = totalProbes > 0 ? (timeouts / totalProbes) * 100 : 0;
            lossData.push(lossPercent);
        });
        
        // Create or update latency chart
        if (latencyChart) {
            latencyChart.data.labels = labels;
            latencyChart.data.datasets[0].data = rttData;
            latencyChart.update();
        } else {
            const latencyCtx = document.getElementById('latency-chart').getContext('2d');
            latencyChart = new Chart(latencyCtx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Average RTT (ms)',
                        data: rttData,
                        borderColor: 'rgb(75, 192, 192)',
                        backgroundColor: 'rgba(75, 192, 192, 0.2)',
                        tension: 0.1,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    scales: {
                        y: {
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: 'RTT (ms)'
                            }
                        }
                    }
                }
            });
        }
        
        // Create or update loss chart
        if (lossChart) {
            lossChart.data.labels = labels;
            lossChart.data.datasets[0].data = lossData;
            lossChart.update();
        } else {
            const lossCtx = document.getElementById('loss-chart').getContext('2d');
            lossChart = new Chart(lossCtx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Packet Loss (%)',
                        data: lossData,
                        backgroundColor: lossData.map(value => 
                            value > 50 ? 'rgba(255, 99, 132, 0.6)' : 
                            value > 20 ? 'rgba(255, 159, 64, 0.6)' : 
                            'rgba(54, 162, 235, 0.6)'
                        )
                    }]
                },
                options: {
                    responsive: true,
                    scales: {
                        y: {
                            beginAtZero: true,
                            max: 100,
                            title: {
                                display: true,
                                text: 'Loss (%)'
                            }
                        }
                    }
                }
            });
        }
        
        // Create or update jitter chart
        if (jitterChart) {
            jitterChart.data.labels = labels;
            jitterChart.data.datasets[0].data = jitterData;
            jitterChart.update();
        } else {
            const jitterCtx = document.getElementById('jitter-chart').getContext('2d');
            jitterChart = new Chart(jitterCtx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Jitter (ms)',
                        data: jitterData,
                        backgroundColor: 'rgba(153, 102, 255, 0.6)'
                    }]
                },
                options: {
                    responsive: true,
                    scales: {
                        y: {
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: 'Jitter (ms)'
                            }
                        }
                    }
                }
            });
        }
    }
    
    function initializeNetworkGraph(results) {
        // Filter out hops with no IP address
        const filteredResults = results.filter(hop => hop.ips && hop.ips.length > 0 && hop.ips[0] !== '*');
        
        // Create nodes and edges arrays
        const nodes = [];
        const edges = [];
        
        filteredResults.forEach((hop, index) => {
            // Create node label (hostname or IP)
            let label = `Hop ${hop.hop}`;
            let title = `Hop ${hop.hop}`;
            
            if (hop.ips && hop.ips.length > 0) {
                title += `\nIP: ${hop.ips[0]}`;
                
                if (!hop.hostnames || !hop.hostnames[0]) {
                    label = hop.ips[0];
                }
            }
            
            if (hop.hostnames && hop.hostnames.length > 0 && hop.hostnames[0]) {
                label = hop.hostnames[0];
                // Truncate long hostnames for label
                if (label.length > 15) {
                    label = label.substring(0, 12) + '...';
                }
                title += `\nHostname: ${hop.hostnames[0]}`;
            }
            
            // Add RTT info to title
            if (hop.avg_rtt !== null) {
                title += `\nAvg RTT: ${hop.avg_rtt.toFixed(1)} ms`;
            }
            
            // Calculate loss percentage for node color
            const totalProbes = hop.probes ? hop.probes.length : 0;
            const timeouts = hop.timeouts || 0;
            const lossPercent = totalProbes > 0 ? (timeouts / totalProbes) * 100 : 0;
            title += `\nPacket Loss: ${lossPercent.toFixed(1)}%`;
            
            // Calculate node color (higher loss = more red)
            const redValue = Math.min(255, Math.round(lossPercent * 2.55));
            const greenBlueValue = Math.max(0, Math.round(255 - redValue));
            const color = `rgb(${redValue}, ${greenBlueValue}, ${greenBlueValue})`;
            
            // Calculate node size based on RTT (higher RTT = larger node)
            const size = hop.avg_rtt !== null ? Math.min(50, Math.max(15, hop.avg_rtt / 5)) : 15;
            
            nodes.push({
                id: hop.hop,
                label: label,
                title: title,
                color: color,
                size: size
            });
            
            // Create edge to next hop if it exists
            if (index < filteredResults.length - 1) {
                const nextHop = filteredResults[index + 1];
                
                // Calculate edge properties based on RTT difference
                let rttDiff = 0;
                if (hop.avg_rtt !== null && nextHop.avg_rtt !== null) {
                    rttDiff = nextHop.avg_rtt - hop.avg_rtt;
                }
                
                // Create edge label based on RTT difference
                let edgeLabel = '';
                let edgeWidth = 1;
                
                if (rttDiff > 20) {
                    edgeLabel = `+${rttDiff.toFixed(1)} ms`;
                    edgeWidth = Math.min(5, 1 + rttDiff / 30);
                }
                
                edges.push({
                    from: hop.hop,
                    to: nextHop.hop,
                    label: edgeLabel,
                    width: edgeWidth,
                    arrows: 'to'
                });
            }
        });
        
        // Create a vis.js network
        const container = document.getElementById('network-graph-visualization');
        const data = {
            nodes: new vis.DataSet(nodes),
            edges: new vis.DataSet(edges)
        };
        
        const options = {
            physics: {
                enabled: true,
                solver: 'forceAtlas2Based',
                forceAtlas2Based: {
                    gravitationalConstant: -50,
                    centralGravity: 0.01,
                    springLength: 100,
                    springConstant: 0.08
                },
                stabilization: {
                    enabled: true,
                    iterations: 100,
                    fit: true
                }
            },
            nodes: {
                font: {
                    size: 12
                }
            },
            edges: {
                font: {
                    size: 10,
                    align: 'middle'
                },
                smooth: {
                    type: 'curvedCW',
                    roundness: 0.2
                }
            }
        };
        
        networkGraph = new vis.Network(container, data, options);
    }
    
    function updateProgress(percent) {
        progressBar.style.width = `${percent}%`;
        progressText.textContent = `${Math.round(percent)}%`;
    }
    
    function showError(message) {
        statusText.textContent = `Error: ${message}`;
        statusText.className = 'error';
        startBtn.disabled = false;
        realtimeStatus.style.display = 'block';
    }
    
    function stopTrace() {
        // Close event source if active
        closeEventSource();
        
        // Reset UI
        statusText.textContent = 'Trace stopped';
        startBtn.disabled = false;
    }
    
    function resetUI() {
        // Reset trace state
        traceResults = null;
        activeTraceId = null;
        closeEventSource();
        
        // Reset UI elements
        hopTable.innerHTML = '';
        traceSummary.querySelector('.summary-content').innerHTML = '<p>No trace performed yet. Click "Start Trace" to begin.</p>';
        rawDataContent.textContent = 'No data available yet.';
        multiTargetResults.style.display = 'none';
        
        // Reset status and progress
        statusText.textContent = '';
        statusText.className = '';
        progressBar.style.width = '0%';
        progressText.textContent = '0%';
        realtimeStatus.style.display = 'none';
        
        // Reset buttons
        exportBtn.disabled = true;
        startBtn.disabled = false;
        
        // Reset charts
        if (latencyChart) latencyChart.destroy();
        if (lossChart) lossChart.destroy();
        if (jitterChart) jitterChart.destroy();
        if (historyChart) historyChart.destroy();
        latencyChart = null;
        lossChart = null;
        jitterChart = null;
        historyChart = null;
        
        // Reset network graph
        if (networkGraph) networkGraph.destroy();
        networkGraph = null;
        
        // Remove any back buttons
        const backBtn = document.querySelector('.back-btn');
        if (backBtn) backBtn.remove();
    }
    
    function showExportDialog(traceId = null) {
        // Set active trace ID for export
        activeTraceId = traceId || activeTraceId;
        
        // Show dialog
        exportDialog.style.display = 'flex';
    }
    
    function hideExportDialog() {
        exportDialog.style.display = 'none';
    }
    
    function exportResults(format) {
        if (!activeTraceId) return;
        
        // Redirect to export URL
        window.location.href = `/api/trace/${activeTraceId}/export?format=${format}`;
    }
});