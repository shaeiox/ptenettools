from flask import Flask, render_template, request, Response, jsonify
import subprocess
import time
import datetime
import json
import sys
import threading
import os
from adapter import get_network_interface_type
from Network_Usage_Monitor import monitor_network_usage
from utils import is_valid_ip_or_domain
from traceroute_helper import get_second_hop_ip, get_default_gateway

# Get the absolute paths to the Frontend/Monitoring/LiveMonitor directories
base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'Frontend', 'Monitoring'))
template_dir = os.path.join(base_dir, 'LiveMonitor', 'templates')  # templates are in LiveMonitor/templates
static_dir = os.path.join(base_dir, 'LiveMonitor', 'static')  # static is in LiveMonitor/static

# Create static directory if it doesn't exist
os.makedirs(static_dir, exist_ok=True)
os.makedirs(os.path.join(static_dir, 'css'), exist_ok=True)
os.makedirs(os.path.join(static_dir, 'js', 'lib'), exist_ok=True)

app = Flask(__name__, 
           template_folder=template_dir,
           static_folder=static_dir,
           static_url_path='/static')

# Global ping process tracker to ensure cleanup
active_ping_processes = {}

# Store abnormal logs
abnormal_logs = []
def abnormal_event_logger(event_type, value):
    """Logs abnormal network events with timestamps."""
    timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    log_entry = f"[{timestamp}] {event_type}: {value}"
    abnormal_logs.append(log_entry)
    # Keep only the last 50 logs to prevent excessive memory usage
    if len(abnormal_logs) > 50:
        abnormal_logs.pop(0)

# Try to get second hop IP once at startup
try:
    second_hop_ip = get_second_hop_ip("8.8.8.8") 
    if not second_hop_ip:
        second_hop_ip = "Could not detect second-hop IP."
except Exception as e:
    second_hop_ip = "Error detecting second-hop IP."

def ping_server(server: str, count: int):
    """Pings the given server and monitors network performance."""
    # Validate server address before proceeding
    if not is_valid_ip_or_domain(server):
        return ["Invalid server address. Please enter a valid IP or domain."]
    
    # Initialize values
    ping_times = []
    jitter_values = []
    gateway_jitter_values = []  # Dedicated jitter for gateway
    second_hop_jitter_values = []  # Dedicated jitter for second hop
    packet_loss = 0
    results = []
    
    # Get network interface type
    network_interface = get_network_interface_type()
    if isinstance(network_interface, tuple):
        network_interface = network_interface[1]  # Extract adapter name if it's a tuple
    if not network_interface:
        return ["No network interface detected. Please check your connection."]
    
    # Get default gateway for comparison
    default_gateway = get_default_gateway()
    is_gateway = server == default_gateway
    is_second_hop = server == second_hop_ip
    is_wifi = network_interface == "Wi-Fi"
    
    results.append(f"Interface: {network_interface}")
    results.append(f"{'Packet':<6} | {'Ping (ms)':<12} | {'Jitter (ms)':<12} | {'Download (Mbps)':<16} | {'Upload (Mbps)':<14}")
    results.append("─" * 70)
    
    # Define thresholds for specific IPs/domains
    ping_thresholds = {
        "8.8.8.8": 80,
        "4.2.2.4": 110,
        "5.202.100.100": 20,
        "google.com": 90,
        "127.0.0.1": 2
    }

    # Initialize counters
    packets_sent = 0
    packets_received = 0

    for i in range(1, count + 1):
        start_time = time.time()
        packets_sent += 1
        try:
            # Use ping command appropriate for the OS
            ping_cmd = ["ping", "-n", "1", server] if sys.platform == "win32" else ["ping", "-c", "1", server]
            
            result = subprocess.run(
                ping_cmd, capture_output=True, text=True, timeout=2
            )
            end_time = time.time()

            if result is None or "Request timed out" in result.stdout or "100% packet loss" in result.stdout or result.returncode != 0:
                packet_loss += 1
                abnormal_event_logger("Packet Loss", "Request timed out or ping failed")
                results.append(f"{i:<6} | {'Timeout':<12} | {'-':<12} | {'-':<16} | {'-':<14}")
                continue
            
            # Add Packet
            packets_received += 1

            # Extract ping time - adjust extraction based on OS
            if sys.platform == "win32":
                # Windows format
                if "time=" in result.stdout:
                    time_ms = float(result.stdout.split("time=")[1].split("ms")[0].strip())
                elif "time<" in result.stdout:
                    time_ms = 1.0  # Assume 1ms if "time<1ms"
                else:
                    time_ms = 0.0
            else:
                # Linux/Mac format
                if "time=" in result.stdout:
                    time_ms = float(result.stdout.split("time=")[1].split(" ms")[0].strip())
                else:
                    time_ms = 0.0
            
            ping_times.append(time_ms)

            # Calculate appropriate jitter based on target
            if is_gateway:
                current_jitter = abs(time_ms - (ping_times[-2] if len(ping_times) > 1 else time_ms))
                gateway_jitter_values.append(current_jitter)
                jitter = current_jitter  # Use gateway jitter for display
            elif is_second_hop:
                current_jitter = abs(time_ms - (ping_times[-2] if len(ping_times) > 1 else time_ms))
                second_hop_jitter_values.append(current_jitter)
                jitter = current_jitter  # Use second hop jitter for display
            else:
                # Standard jitter calculation for other targets
                jitter = abs(time_ms - (ping_times[-2] if len(ping_times) > 1 else time_ms))
                jitter_values.append(jitter)
            
            # Get real-time download/upload speeds
            try:
                download, upload = monitor_network_usage(network_interface)
            except Exception as e:
                download, upload = 0.0, 0.0
                results.append(f"Warning: Network monitoring failed ({e})")
            
            # Initialize alert flags
            alerts = []
            
            # Check conditions based on target type
            if is_gateway:
                if is_wifi:
                    if time_ms > 5:
                        alerts.append("high_gateway_ping")
                        abnormal_event_logger("High Gateway Ping (Wi-Fi)", f"{time_ms} ms")
                    if jitter > 5:
                        alerts.append("high_gateway_jitter")
                        abnormal_event_logger("High Gateway Jitter (Wi-Fi)", f"{jitter:.2f} ms")
                else:
                    if time_ms > 1:
                        alerts.append("high_gateway_ping")
                        abnormal_event_logger("High Gateway Ping (Wired)", f"{time_ms} ms")
                    if jitter > 1:
                        alerts.append("high_gateway_jitter")
                        abnormal_event_logger("High Gateway Jitter (Wired)", f"{jitter:.2f} ms")
            elif is_second_hop:
                if time_ms > 20:
                    alerts.append("high_second_hop_ping")
                    abnormal_event_logger("High Second Hop Ping", f"{time_ms} ms")
                if jitter > 10:
                    alerts.append("high_second_hop_jitter")
                    abnormal_event_logger("High Second Hop Jitter", f"{jitter:.2f} ms")
            else:
                # Standard thresholds for other targets
                if server in ping_thresholds and time_ms > ping_thresholds[server]:
                    alerts.append("high_ping")
                    abnormal_event_logger("High Ping", f"{time_ms} ms")
                if jitter > 20:
                    alerts.append("high_jitter")
                    abnormal_event_logger("High Jitter", f"{jitter:.2f} ms")
            
            # Check for bandwidth alerts
            if download > 1.0 or upload > 1.0:
                alerts.append("high_bandwidth")
                abnormal_event_logger("High Bandwidth", f"Download: {download:.2f} Mbps, Upload: {upload:.2f} Mbps")

            # Format the output line with indicators for issues
            ping_display = f"{time_ms:.2f}"
            jitter_display = f"{jitter:.2f}"
            
            if any(alert for alert in alerts if 'ping' in alert):
                ping_display = f"{time_ms:.2f} !"
            
            if any(alert for alert in alerts if 'jitter' in alert):
                jitter_display = f"{jitter:.2f} !"

            # Add formatted line to results
            results.append(f"{i:<6} | {ping_display:<12} | {jitter_display:<12} | {download:<16.2f} | {upload:<14.2f}")

        except subprocess.TimeoutExpired:
            packet_loss += 1
            abnormal_event_logger("Packet Loss", "Subprocess timeout expired")
            results.append(f"{i:<6} | {'Timeout':<12} | {'-':<12} | {'-':<16} | {'-':<14}")
        except Exception as e:
            packet_loss += 1
            abnormal_event_logger("Packet Loss", f"Unexpected error: {e}")
            results.append(f"{i:<6} | {'Error':<12} | {'-':<12} | {'-':<16} | {'-':<14}")

        # Control ping rate
        time.sleep(max(0, 1 - (end_time - start_time)))
    
    # Calculate summary statistics
    if ping_times:
        avg_ping = sum(ping_times) / len(ping_times)
        
        # Calculate appropriate average jitter based on target
        if is_gateway:
            avg_jitter = sum(gateway_jitter_values) / len(gateway_jitter_values) if gateway_jitter_values else 0
        elif is_second_hop:
            avg_jitter = sum(second_hop_jitter_values) / len(second_hop_jitter_values) if second_hop_jitter_values else 0
        else:
            avg_jitter = sum(jitter_values) / len(jitter_values) if jitter_values else 0
        
        loss_percentage = (packet_loss / count) * 100
        
        # Evaluate network status based on target type
        if count < 5:
            status = "Uncertain - Too few packets"
        elif loss_percentage > 20:
            status = "Unstable - High packet loss"
        elif is_gateway:
            if is_wifi:
                if avg_ping < 5 and avg_jitter < 5 and loss_percentage == 0:
                    status = "Excellent"
                elif avg_ping < 10 and avg_jitter < 10 and loss_percentage < 1:
                    status = "Good"
                else:
                    status = "Poor - Gateway Issues"
            else:
                if avg_ping < 1 and avg_jitter < 1 and loss_percentage == 0:
                    status = "Excellent"
                elif avg_ping < 2 and avg_jitter < 2 and loss_percentage < 1:
                    status = "Good"
                else:
                    status = "Poor - Gateway Issues"
        elif is_second_hop:
            if avg_ping < 20 and avg_jitter < 10 and loss_percentage == 0:
                status = "Excellent"
            elif avg_ping < 30 and avg_jitter < 15 and loss_percentage < 1:
                status = "Good"
            else:
                status = "Poor - Second Hop Issues"
        else:
            if avg_ping < 50 and avg_jitter < 10 and loss_percentage == 0:
                status = "Excellent"
            elif avg_ping < 80 and avg_jitter < 10 and loss_percentage < 3:
                status = "Good"
            elif avg_ping < 150 and avg_jitter < 15 and loss_percentage < 5:
                status = "Fair"
            else:
                status = "Poor"
        
        # Add summary to results
        results.append("\n// Summary")
        results.append("// -----------------------------------------------")
        results.append(f"Interface: {network_interface}")
        results.append(f"Target Type: {'Gateway' if is_gateway else 'Second Hop' if is_second_hop else 'External Server'}")
        results.append(f"Average Ping: {avg_ping:.2f} ms")
        results.append(f"Average Jitter: {avg_jitter:.2f} ms")
        results.append(f"Packet Loss: {loss_percentage:.2f}%")
        results.append(f"Network Status: {status}")
    
    return results

def stream_ping_results(server, count, request_id):
    """Generator function for streaming ping results."""
    global active_ping_processes
    
    def format_sse(data):
        """Helper function to format SSE data properly"""
        if isinstance(data, bytes):
            return data
        try:
            message = f"data: {json.dumps(data)}\n\n"
            return message.encode('utf-8')
        except Exception as e:
            message = f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"
            return message.encode('utf-8')
    
    # Track this streaming process
    active_ping_processes[request_id] = True
    
    try:
        # Validate server address
        if not is_valid_ip_or_domain(server):
            yield format_sse({
                'type': 'error', 
                'message': 'Invalid server address. Please enter a valid IP or domain.'
            })
            return
            
        # Get network interface
        network_interface = get_network_interface_type()
        if isinstance(network_interface, tuple):
            network_interface = network_interface[1]
        
        if not network_interface:
            yield format_sse({
                'type': 'error', 
                'message': 'No network interface detected. Please check your connection.'
            })
            return
        
        # Get default gateway for comparison
        default_gateway = get_default_gateway()
        is_gateway = server == default_gateway
        is_second_hop = server == second_hop_ip
        is_wifi = network_interface == "Wi-Fi"
            
        # Send header
        yield format_sse({
            'type': 'header', 
            'interface': network_interface,
            'time': datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            'server': server,
            'count': count,
            'target_type': 'Gateway' if is_gateway else 'Second Hop' if is_second_hop else 'External Server'
        })
        
        # Initialize tracking variables
        ping_times = []
        jitter_values = []
        gateway_jitter_values = []
        second_hop_jitter_values = []
        packet_loss = 0
        ping_thresholds = {
            "8.8.8.8": 80,
            "4.2.2.4": 110,
            "5.202.100.100": 20,
            "google.com": 90,
            "127.0.0.1": 2
        }
        
        # Process each ping
        for i in range(1, count + 1):
            # Check if the client is still connected
            if request_id not in active_ping_processes:
                return
                
            start_time = time.time()
            
            try:
                # Use ping command appropriate for the OS
                ping_cmd = ["ping", "-n", "1", server] if sys.platform == "win32" else ["ping", "-c", "1", server]
                result = subprocess.run(ping_cmd, capture_output=True, text=True, timeout=2)
                
                if result is None or "Request timed out" in result.stdout or "100% packet loss" in result.stdout or result.returncode != 0:
                    packet_loss += 1
                    abnormal_event_logger("Packet Loss", "Request timed out or ping failed")
                    
                    yield format_sse({
                        'type': 'ping_result',
                        'packet_num': i,
                        'status': 'timeout'
                    })
                    
                else:
                    # Extract ping time based on OS format
                    if sys.platform == "win32":
                        if "time=" in result.stdout:
                            time_ms = float(result.stdout.split("time=")[1].split("ms")[0].strip())
                        elif "time<" in result.stdout:
                            time_ms = 1.0
                        else:
                            time_ms = 0.0
                    else:
                        if "time=" in result.stdout:
                            time_ms = float(result.stdout.split("time=")[1].split(" ms")[0].strip())
                        else:
                            time_ms = 0.0
                    
                    ping_times.append(time_ms)
                    
                    # Calculate appropriate jitter based on target
                    if is_gateway:
                        current_jitter = abs(time_ms - (ping_times[-2] if len(ping_times) > 1 else time_ms))
                        gateway_jitter_values.append(current_jitter)
                        jitter = current_jitter
                    elif is_second_hop:
                        current_jitter = abs(time_ms - (ping_times[-2] if len(ping_times) > 1 else time_ms))
                        second_hop_jitter_values.append(current_jitter)
                        jitter = current_jitter
                    else:
                        jitter = abs(time_ms - (ping_times[-2] if len(ping_times) > 1 else time_ms))
                        jitter_values.append(jitter)
                    
                    # Get network usage data
                    try:
                        download, upload = monitor_network_usage(network_interface)
                    except Exception:
                        download, upload = 0.0, 0.0
                    
                    # Initialize alerts
                    alerts = []
                    
                    # Check conditions based on target type
                    if is_gateway:
                        if is_wifi:
                            if time_ms > 5:
                                alerts.append("high_gateway_ping")
                                abnormal_event_logger("High Gateway Ping (Wi-Fi)", f"{time_ms} ms")
                            if jitter > 5:
                                alerts.append("high_gateway_jitter")
                                abnormal_event_logger("High Gateway Jitter (Wi-Fi)", f"{jitter:.2f} ms")
                        else:
                            if time_ms > 1:
                                alerts.append("high_gateway_ping")
                                abnormal_event_logger("High Gateway Ping (Wired)", f"{time_ms} ms")
                            if jitter > 1:
                                alerts.append("high_gateway_jitter")
                                abnormal_event_logger("High Gateway Jitter (Wired)", f"{jitter:.2f} ms")
                    elif is_second_hop:
                        if time_ms > 20:
                            alerts.append("high_second_hop_ping")
                            abnormal_event_logger("High Second Hop Ping", f"{time_ms} ms")
                        if jitter > 10:
                            alerts.append("high_second_hop_jitter")
                            abnormal_event_logger("High Second Hop Jitter", f"{jitter:.2f} ms")
                    else:
                        if server in ping_thresholds and time_ms > ping_thresholds[server]:
                            alerts.append("high_ping")
                            abnormal_event_logger("High Ping", f"{time_ms} ms")
                        if jitter > 20:
                            alerts.append("high_jitter")
                            abnormal_event_logger("High Jitter", f"{jitter:.2f} ms")
                    
                    # Check for bandwidth alerts
                    if download > 1.0 or upload > 1.0:
                        alerts.append("high_bandwidth")
                        abnormal_event_logger("High Bandwidth", f"Download: {download:.2f} Mbps, Upload: {upload:.2f} Mbps")
                    
                    # Format display strings
                    ping_display = f"{time_ms:.2f}"
                    jitter_display = f"{jitter:.2f}"
                    
                    if any(alert for alert in alerts if 'ping' in alert):
                        ping_display = f"{time_ms:.2f} !"
                    
                    if any(alert for alert in alerts if 'jitter' in alert):
                        jitter_display = f"{jitter:.2f} !"
                    
                    # Send result
                    yield format_sse({
                        'type': 'ping_result',
                        'packet_num': i,
                        'status': 'success',
                        'ping': time_ms,
                        'ping_display': ping_display,
                        'jitter': jitter,
                        'jitter_display': jitter_display,
                        'download': download,
                        'upload': upload,
                        'alerts': alerts
                    })
            
            except subprocess.TimeoutExpired:
                packet_loss += 1
                abnormal_event_logger("Packet Loss", "Subprocess timeout expired")
                yield format_sse({
                    'type': 'ping_result',
                    'packet_num': i,
                    'status': 'timeout'
                })
                
            except Exception as e:
                packet_loss += 1
                abnormal_event_logger("Packet Loss", f"Unexpected error: {e}")
                yield format_sse({
                    'type': 'ping_result',
                    'packet_num': i,
                    'status': 'error',
                    'message': str(e)
                })
            
            # Control ping rate
            time.sleep(max(0, 1 - (time.time() - start_time)))
            
            # Send keepalive
            yield b":\n\n"
        
        # Finalize with summary statistics
        if ping_times:
            avg_ping = sum(ping_times) / len(ping_times)
            
            # Calculate appropriate average jitter based on target
            if is_gateway:
                avg_jitter = sum(gateway_jitter_values) / len(gateway_jitter_values) if gateway_jitter_values else 0
            elif is_second_hop:
                avg_jitter = sum(second_hop_jitter_values) / len(second_hop_jitter_values) if second_hop_jitter_values else 0
            else:
                avg_jitter = sum(jitter_values) / len(jitter_values) if jitter_values else 0
            
            loss_percentage = (packet_loss / count) * 100
            
            # Evaluate network status based on target type
            if count < 5:
                status = "Uncertain - Too few packets"
            elif loss_percentage > 20:
                status = "Unstable - High packet loss"
            elif is_gateway:
                if is_wifi:
                    if avg_ping < 5 and avg_jitter < 5 and loss_percentage == 0:
                        status = "Excellent"
                    elif avg_ping < 10 and avg_jitter < 10 and loss_percentage < 1:
                        status = "Good"
                    else:
                        status = "Poor - Gateway Issues"
                else:
                    if avg_ping < 1 and avg_jitter < 1 and loss_percentage == 0:
                        status = "Excellent"
                    elif avg_ping < 2 and avg_jitter < 2 and loss_percentage < 1:
                        status = "Good"
                    else:
                        status = "Poor - Gateway Issues"
            elif is_second_hop:
                if avg_ping < 20 and avg_jitter < 10 and loss_percentage == 0:
                    status = "Excellent"
                elif avg_ping < 30 and avg_jitter < 15 and loss_percentage < 1:
                    status = "Good"
                else:
                    status = "Poor - Second Hop Issues"
            else:
                if avg_ping < 50 and avg_jitter < 10 and loss_percentage == 0:
                    status = "Excellent"
                elif avg_ping < 80 and avg_jitter < 10 and loss_percentage < 3:
                    status = "Good"
                elif avg_ping < 150 and avg_jitter < 15 and loss_percentage < 5:
                    status = "Fair"
                else:
                    status = "Poor"
            
            # Send summary
            yield format_sse({
                'type': 'summary',
                'interface': network_interface,
                'target_type': 'Gateway' if is_gateway else 'Second Hop' if is_second_hop else 'External Server',
                'avg_ping': avg_ping,
                'avg_jitter': avg_jitter,
                'packet_loss': loss_percentage,
                'network_status': status,
                'logs': abnormal_logs
            })
    
    except Exception as e:
        yield format_sse({
            'type': 'error',
            'message': f"Server error: {str(e)}"
        })
    
    finally:
        active_ping_processes.pop(request_id, None)

def cleanup_connection(request_id):
    """Clean up connection when client disconnects."""
    if request_id in active_ping_processes:
        active_ping_processes.pop(request_id, None)

@app.route('/ping-stream')
def ping_stream():
    """Stream ping results using Server-Sent Events."""
    server = request.args.get('server', '')
    try:
        count = int(request.args.get('count', 10))
    except ValueError:
        count = 10
    
    if not is_valid_ip_or_domain(server):
        return jsonify({"error": "Invalid server address!"})
    
    request_id = f"{time.time()}-{server}-{count}"
    
    def generate():
        try:
            for data in stream_ping_results(server, count, request_id):
                yield data
        finally:
            cleanup_connection(request_id)
    
    headers = {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'X-Accel-Buffering': 'no',
        'Connection': 'keep-alive',
    }
    
    return Response(
        generate(),
        mimetype='text/event-stream',
        headers=headers,
        direct_passthrough=True
    )

@app.route('/', methods=['GET', 'POST'])
def monitor():
    """Handle form submission and render templates"""
    current_time = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    # Get default gateway
    default_gateway = get_default_gateway()
    
    # Get second hop IP for 8.8.8.8
    try:
        second_hop = get_second_hop_ip("8.8.8.8")
        if not second_hop or second_hop == "Could not detect second-hop IP.":
            # Try with another target if 8.8.8.8 fails
            second_hop = get_second_hop_ip("4.2.2.4")
    except Exception:
        second_hop = "Could not detect second-hop IP."
    
    # Create server list with descriptions
    server_list = []
    
    # Add gateway if available
    if default_gateway and default_gateway != "Could not detect gateway.":
        server_list.append({'address': default_gateway, 'description': 'Your Gateway'})
    
    # Add second hop if available
    if second_hop and second_hop not in ["Could not detect second-hop IP.", "Error detecting second-hop IP."]:
        server_list.append({'address': second_hop, 'description': 'Second Hop Router'})
    
    # Add predefined servers
    predefined_servers = {
        "8.8.8.8": "Google DNS",
        "4.2.2.4": "Level3 DNS",
        "5.202.100.100": "Local DNS",
        "google.com": "Google Website"
    }
    
    for address, description in predefined_servers.items():
        server_list.append({'address': address, 'description': description})
    
    if request.method == 'POST':
        server = request.form.get('server', '').strip()
        try:
            count = int(request.form.get('count', 10))
        except ValueError:
            count = 10
        
        if not is_valid_ip_or_domain(server):
            return render_template('index.html', error="Invalid server address!", server_list=server_list)
        
        # Check if real-time mode is selected
        use_realtime = request.form.get('realtime', 'true').lower() == 'true'
        
        if not use_realtime:
            # Use traditional method
            results = ping_server(server, count)
            return render_template('index.html', 
                                server=server, 
                                count=count, 
                                results=results, 
                                logs=abnormal_logs,
                                current_time=current_time,
                                server_list=server_list)
        else:
            # For real-time mode, we'll still render index.html,
            # but the JavaScript will handle connecting to the SSE endpoint
            return render_template('index.html',
                                server=server,
                                count=count,
                                current_time=current_time,
                                server_list=server_list)
    
    # For GET requests, render the form
    return render_template('index.html', server_list=server_list)

@app.route('/clear-logs', methods=['POST'])
def clear_logs():
    """Clear all logs and cached results."""
    global abnormal_logs
    abnormal_logs = []
    
    # Get default gateway
    default_gateway = get_default_gateway()
    
    # Get second hop IP
    try:
        second_hop = get_second_hop_ip("8.8.8.8")
        if not second_hop or second_hop == "Could not detect second-hop IP.":
            second_hop = get_second_hop_ip("4.2.2.4")
    except Exception:
        second_hop = "Could not detect second-hop IP."
    
    # Create server list with descriptions
    server_list = []
    
    # Add gateway if available
    if default_gateway and default_gateway != "Could not detect gateway.":
        server_list.append({'address': default_gateway, 'description': 'Your Gateway'})
    
    # Add second hop if available
    if second_hop and second_hop not in ["Could not detect second-hop IP.", "Error detecting second-hop IP."]:
        server_list.append({'address': second_hop, 'description': 'Second Hop Router'})
    
    # Add predefined servers
    predefined_servers = {
        "8.8.8.8": "Google DNS",
        "4.2.2.4": "Level3 DNS",
        "5.202.100.100": "Local DNS",
        "google.com": "Google Website"
    }
    
    for address, description in predefined_servers.items():
        server_list.append({'address': address, 'description': description})
    
    # Format server list as strings
    formatted_servers = []
    for server in server_list:
        formatted_servers.append(f"{server['address']} ({server['description']})")
    
    return jsonify({
        "status": "success",
        "message": "Logs cleared successfully",
        "server_list": formatted_servers
    })

@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    return response

if __name__ == "__main__":
    # Use threaded mode with a smaller buffer size
    app.run(debug=True, threaded=True)