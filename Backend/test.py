# Main live monitoring

import subprocess
import time
import statistics
import socket
import re
import datetime
from adapter import get_network_interface_type
from Network_Usage_Monitor import monitor_network_usage
from utils import is_valid_ip_or_domain
from traceroute_helper import get_second_hop_ip, get_default_gateway
import random

# Store abnormal logs
abnormal_logs = []
def abnormal_event_logger(event_type, value):
    """Logs abnormal network events with timestamps."""
    timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    log_entry = f"[{timestamp}] {event_type}: {value}"
    abnormal_logs.append(log_entry)

# ✅ Run `tracert` only **once** before starting the loop
second_hop_ip = get_second_hop_ip("8.8.8.8")  # Detect second-hop once
if not second_hop_ip:
    print("❌ Could not detect second-hop IP. Exiting.")

# Real ping implementation
def real_ping(server):
    """Executes a real ping command and returns the result."""
    try:
        result = subprocess.run(
            ["ping", "-n", "1", server], capture_output=True, text=True, timeout=2
        )
        return result
    except subprocess.TimeoutExpired:
        return None  # Simulate timeout

# Mock ping implementation for testing
def mock_ping(server):
    """Cycle through predefined responses."""
    responses = [
        subprocess.CompletedProcess(args=["ping", "-n", "1", server], returncode=0, stdout=f"Pinging {server}... time=15ms...", stderr=""),
        None,  # Timeout
        subprocess.CompletedProcess(args=["ping", "-n", "1", server], returncode=0, stdout=f"Pinging {server}... time=100ms...", stderr=""),
        subprocess.CompletedProcess(args=["ping", "-n", "1", server], returncode=0, stdout=f"Pinging {server}... time=21ms...", stderr=""),
    ]
    mock_ping.counter = getattr(mock_ping, 'counter', 0) % len(responses)
    result = responses[mock_ping.counter]
    mock_ping.counter += 1
    return result


    # Randomly choose a scenario
    return random.choice(scenarios)()

def ping_server(server: str, count: int, ping_func=real_ping):
    """Pings the given server and monitors network performance. Accepts a ping function as a parameter."""
    
    # ✅ Validate server address before proceeding
    if not is_valid_ip_or_domain(server):
        print("❌ Invalid server address! Please enter a valid IP or domain.")
        return
    
    ping_times = []
    jitter_values = []
    packet_loss = 0
    last_abnormal_ping = None  # Track last abnormal ping time
    
    # Get network interface type
    network_interface = get_network_interface_type()
    if isinstance(network_interface, tuple):
        network_interface = network_interface[1]  # Extract adapter name if it's a tuple

    if not network_interface:
        print("Error: Could not detect an active network interface.")
        return

    print(f"Using network interface: {network_interface}\n")
    print(f"{'Packet':<6} | {'Ping Time (ms)':<14} | {'Jitter (ms)':<12} | {'Download (Mbps)':<16} | {'Upload (Mbps)':<14}")
    print("-" * 80)

    last_ping = None  # Store last ping time for jitter calculation
    
    # Define thresholds for specific IPs/domains
    ping_thresholds = {
        "8.8.8.8": 80,
        "4.2.2.4": 110,
        "5.202.100.100": 20,
        "google.com": 90,
        "127.0.0.1": 2
    }

    packets_sent = 0
    packets_received = 0
    for i in range(1, count + 1):
        start_time = time.time()
        packets_sent += 1
        try:
            result = ping_func(server)  # Use the injected ping function
            end_time = time.time()

            if result is None or "Request timed out" in result.stdout or result.returncode != 0:
                packet_loss += 1
                abnormal_event_logger("Packet Loss", "Request timed out or ping failed")
                print(f"{i:<6} | {'Timeout':<14} | {'-':<12} | {'-':<16} | {'-':<14}")
                continue
            
            packets_received += 1
            # Extract ping time
            time_ms = float(result.stdout.split("time=")[1].split("ms")[0].strip())
            ping_times.append(time_ms)

            # Calculate jitter
            jitter = abs(time_ms - (ping_times[-2] if len(ping_times) > 1 else time_ms))
            jitter_values.append(jitter)
            last_ping = time_ms  # Update last ping time
            
            

            # Get real-time download/upload speeds
            try:
                download, upload = monitor_network_usage(network_interface)
            except Exception as e:
                download, upload = 0.0, 0.0  # Fallback if monitoring fails
                print(f"Warning: Network monitoring failed ({e})")
            
            ping_alert = server in ping_thresholds and time_ms > ping_thresholds[server]
            hop_2_alert = server == second_hop_ip and time_ms > 20  # Ensuring it's only for hop 2
            jitter_alert = jitter > 20  # General jitter alert
            bandwidth_alert = download > 1.0 or upload > 1.0

            # Check alert conditions
            if server == second_hop_ip:
                jitter2_alert = jitter > 10  # Alert when jitter > 10 for second hop
            else:
                jitter2_alert = False  # Avoid false positives

            default_gateway = get_default_gateway()
            if server == default_gateway:
                if network_interface == "Wi-Fi" :
                    default_gateway_time = default_gateway and time_ms > 5
                    gateway_jitter = jitter > 5
                    jitter_alert = False
                else :
                    default_gateway_time = default_gateway and time_ms > 1
                    gateway_jitter = jitter > 1
                    jitter_alert = False
            else :
                default_gateway_time = False
                gateway_jitter = False
                jitter_alert = True

            jitter_alert = jitter > 20  # General jitter alert

            # Log abnormal events
            if ping_alert:
                abnormal_event_logger("High Ping", f"{time_ms} ms")
                last_abnormal_ping = time_ms
            if hop_2_alert:
                abnormal_event_logger("Slow Second Hop", f"{time_ms} ms")
            if default_gateway_time:
                abnormal_event_logger("Modem Connection", f"{time_ms} ms")
            if jitter_alert:
                abnormal_event_logger("High Jitter", f"{jitter:.2f} ms")
            if jitter2_alert:
                abnormal_event_logger("High Jitter (Hop 2)", f"{jitter:.2f} ms")
            if gateway_jitter:
                abnormal_event_logger("High Modem Connection Jitter", f"{jitter:.2f} ms")
            if bandwidth_alert:
                abnormal_event_logger("High Bandwidth", f"Download: {download:.2f} Mbps, Upload: {upload:.2f} Mbps")

            # Display alert flag only if there's an issue
            alert_ping = "X" if ping_alert or hop_2_alert or default_gateway_time else ""
            alert_jitter = "X" if jitter_alert or jitter2_alert or gateway_jitter else ""
            alert_speed = "X" if download > 1.0 or upload > 1.0 else ""

            # Print formatted output
            print(f"{i:<6} | {alert_ping:<2}{time_ms:<12.2f} | {alert_jitter:<2}{jitter:<10.2f} | {alert_speed:<2}{download:<14.2f} | {alert_speed:<2}{upload:<14.2f}")


        except subprocess.TimeoutExpired:
            packet_loss += 1
            abnormal_event_logger("Packet Loss", "Subprocess timeout expired")
            print(f"{i:<6} | {'Timeout':<14} | {'-':<12} | {'-':<16} | {'-':<14}")
        except Exception as e:
            packet_loss += 1
            abnormal_event_logger("Packet Loss", f"Unexpected error: {e}")
            print(f"{i:<6} | {'Error':<14} | {'-':<12} | {'-':<16} | {'-':<14}")
            print(f"Debug: {e}")

        time.sleep(max(0, 1 - (end_time - start_time)))  # Maintain 1-second interval
    
    avg_ping = sum(ping_times) / len(ping_times) if ping_times else 0
    avg_jitter = sum(jitter_values) / len(jitter_values) if jitter_values else 0
    loss_percentage = (packet_loss / count) * 100

    def evaluate_network_status(avg_ping, avg_jitter, loss_percentage, packet_count):
        """
        Evaluates network status using average ping, average jitter, packet loss, and packet count.
        If packet count is low, the evaluation is less reliable.
        """
        
        # If the packet count is low, we reduce the reliability of the result
        if packet_count < 10:
            return "Uncertain - Too few packets"  # Not enough data for a reliable status
        
        # Check for extreme packet loss
        if loss_percentage > 20:
            return "Unstable - High packet loss"  # Too much loss, connection is bad

        # Excellent condition: Low ping, low jitter, no loss
        if avg_ping < 50 and avg_jitter < 10 and loss_percentage == 0:
            return "Excellent"

        # Good condition: Slightly higher ping but stable
        if avg_ping < 80 and avg_jitter < 10 and loss_percentage < 3:
            return "Good"

        # Fair condition: Ping is high but stable
        if avg_ping < 150 and avg_jitter < 15 and loss_percentage < 5:
            return "Fair"

        # Poor condition: Ping or packet loss is problematic
        return "Poor"

    network_status = evaluate_network_status(avg_ping, avg_jitter, loss_percentage, count)
    print('\n'f"Summary: Avg Ping: {avg_ping:.2f} ms, Avg Jitter: {avg_jitter:.2f} ms, Packet Loss: {loss_percentage:.2f}%")
    print(f"For Count: Packets Sent: {packets_sent}, Packets Received: {packets_received}, Packet Loss Count: {packet_loss}")
    print("Final Network Status:", network_status)

    # Show abnormal logs
    if abnormal_logs:
        print("\nAbnormal Events Detected:")
        for log in abnormal_logs:
            print(log)

    # Display last abnormal ping time
    if last_abnormal_ping:
        print(f"\nLast Abnormal Ping Time: {last_abnormal_ping:.2f} ms")

if __name__ == "__main__":
    # ✅ Keep asking until a valid IP/domain is entered
    while True:
        server_address = input("Enter server address: ").strip()
        if server_address and is_valid_ip_or_domain(server_address):
            break
        print("❌ Invalid server address! Please enter a valid IP or domain.")

    while True:
        try:
            packet_count = int(input("Enter number of packets: "))
            if packet_count > 0:
                break
            else:
                print("❌ Please enter a positive number!")
        except ValueError:
            print("❌ Invalid input! Please enter a valid number.")

    # For real pings, use: ping_server(server_address, packet_count)
    # For fake data, use: ping_server(server_address, packet_count, ping_func=mock_ping)
    ping_server(server_address, packet_count, ping_func=mock_ping)  # Switch to mock_ping for testing