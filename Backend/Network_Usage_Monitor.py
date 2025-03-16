# Check Network Adapter Bandwidth

import psutil
import time
from adapter import get_network_interface_type
from collections import defaultdict
import datetime
import os
import sys

# Original function - unchanged for live-monitoring.py compatibility
def monitor_network_usage(adapter, interval=1):
    """Returns download and upload speed in Mbps for a given adapter."""
    prev_stats = psutil.net_io_counters(pernic=True).get(adapter)
    if not prev_stats:
        print("Error: Adapter not found!")
        return 0, 0

    time.sleep(interval)
    new_stats = psutil.net_io_counters(pernic=True).get(adapter)
    
    if new_stats:
        bytes_sent = new_stats.bytes_sent - prev_stats.bytes_sent
        bytes_recv = new_stats.bytes_recv - prev_stats.bytes_recv
        upload_speed = (bytes_sent * 8) / (1024 * 1024)  # Convert to Mbps
        download_speed = (bytes_recv * 8) / (1024 * 1024)  # Convert to Mbps
        return round(download_speed, 2), round(upload_speed, 2)
    
    return 0, 0

def monitor_bandwidth_spikes(adapter, start_time_str, end_time_str, threshold_download=1.0, threshold_upload=0.5, interval=1):
    """
    Robust bandwidth monitoring with concise, readable summary: detects significant apps using network,
    logs high-bandwidth timestamps, and aggregates process data.
    """
    # Parse times
    try:
        start_time = datetime.datetime.strptime(start_time_str, "%Y-%m-%d %H:%M:%S")
        end_time = datetime.datetime.strptime(end_time_str, "%Y-%m-%d %H:%M:%S")
        if start_time >= end_time:
            raise ValueError("Start time must be before end time!")
    except ValueError as e:
        print(f"Error: Invalid time format or logic - {e}. Use 'YYYY-MM-DD HH:MM:SS' (e.g., 2025-02-23 01:55:00)")
        return

    # Check admin privileges
    is_admin = os.getuid() == 0 if hasattr(os, 'getuid') else (sys.platform == "win32" and ctypes.windll.shell32.IsUserAnAdmin() != 0)
    if not is_admin:
        print("Warning: Not running as admin. Process detection may be limited.")

    # Track process usage and high-bandwidth events
    process_usage_history = defaultdict(lambda: {'bytes_recv': 0, 'bytes_sent': 0, 'last_seen': 0})
    high_bandwidth_events = []
    process_max_usage = defaultdict(lambda: {'download': 0, 'upload': 0, 'exe': 'N/A'})  # Aggregate max usage per process

    print(f"Monitoring bandwidth on {adapter} from {start_time_str} to {end_time_str}")
    print(f"Thresholds: Download > {threshold_download} Mbps, Upload > {threshold_upload} Mbps")
    print(f"{'Timestamp':<20} | {'Download (Mbps)':<15} | {'Upload (Mbps)':<15} | {'Status':<15} | {'Processes Using Network':<60}")
    print("-" * 135)

    # Wait with a spinning loading animation until start time
    spinner = ['|', '/', '-', '\\']
    i = 0
    while datetime.datetime.now() < start_time:
        print(f"\rWaiting for start at {start_time_str}... {spinner[i % 4]}", end='', flush=True)
        time.sleep(0.2)  # Faster updates for smooth animation
        i += 1
    print(f"\rMonitoring started at {start_time_str}...          ")  # Clear line when done

    # Monitoring loop
    while datetime.datetime.now() < end_time:
        loop_start = time.time()
        timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        # Get overall network usage
        download_speed, upload_speed = monitor_network_usage(adapter, interval=interval)

        # Detect high bandwidth
        is_high_bandwidth = download_speed > threshold_download or upload_speed > threshold_upload
        status = "High" if is_high_bandwidth else "Normal"
        processes_info = "No processes detected"
        active_processes = []

        # Scan processes for network activity
        try:
            for proc in psutil.process_iter(['pid', 'name', 'exe', 'create_time']):
                try:
                    net_io = proc.net_io_counters() if hasattr(proc, 'net_io_counters') else None
                    if net_io:  # Ensure all lines below are indented under this condition
                        bytes_sent = net_io.bytes_sent
                        bytes_recv = net_io.bytes_recv
                        prev_stats = process_usage_history[proc.pid]
                        time_diff = max(time.time() - prev_stats['last_seen'], interval) if prev_stats['last_seen'] else interval
                        download = ((bytes_recv - prev_stats['bytes_recv']) * 8) / (1024 * 1024) / time_diff if prev_stats['last_seen'] else 0
                        upload = ((bytes_sent - prev_stats['bytes_sent']) * 8) / (1024 * 1024) / time_diff if prev_stats['last_seen'] else 0

                        # Update cumulative bytes in history
                        process_usage_history[proc.pid] = {
                            'bytes_recv': bytes_recv,  # Total bytes received up to this point
                            'bytes_sent': bytes_sent,  # Total bytes sent up to this point
                            'last_seen': time.time()
                        }

                        # Include significant contributors
                        if download > 0.5 or upload > 0.5 or (is_high_bandwidth and (download > 0.1 or upload > 0.1)):
                            active_processes.append({
                                'name': proc.info['name'],
                                'pid': proc.pid,
                                'download': download,
                                'upload': upload,
                                'exe': proc.info['exe'] or "N/A"
                            })
                            process_max_usage[proc.pid].update({
                                'download': max(process_max_usage[proc.pid]['download'], download),
                                'upload': max(process_max_usage[proc.pid]['upload'], upload),
                                'exe': proc.info['exe'] or "N/A"
                            })
                except (psutil.NoSuchProcess, psutil.AccessDenied):
                    continue

            # Single fallback for high bandwidth if no processes detected
            if is_high_bandwidth and not active_processes:
                try:
                    for conn in psutil.net_connections(kind='inet'):
                        if conn.pid and conn.status in ('ESTABLISHED', 'SYN_SENT', 'SYN_RECV'):
                            try:
                                proc = psutil.Process(conn.pid)
                                pid = proc.pid
                                if pid not in [p['pid'] for p in active_processes]:
                                    net_io = proc.net_io_counters() if hasattr(proc, 'net_io_counters') else None
                                    if net_io:
                                        bytes_sent = net_io.bytes_sent
                                        bytes_recv = net_io.bytes_recv
                                        prev_stats = process_usage_history[pid]
                                        time_diff = max(time.time() - prev_stats['last_seen'], interval) if prev_stats['last_seen'] else interval
                                        download = ((bytes_recv - prev_stats['bytes_recv']) * 8) / (1024 * 1024) / time_diff if prev_stats['last_seen'] else 0
                                        upload = ((bytes_sent - prev_stats['bytes_sent']) * 8) / (1024 * 1024) / time_diff if prev_stats['last_seen'] else 0

                                        process_usage_history[pid] = {
                                            'bytes_recv': bytes_recv,
                                            'bytes_sent': bytes_sent,
                                            'last_seen': time.time()
                                        }

                                        if upload > threshold_upload / 2 or download > threshold_download / 2:
                                            active_processes.append({
                                                'name': proc.name(),
                                                'pid': pid,
                                                'download': download,
                                                'upload': upload,
                                                'exe': proc.exe() or "N/A"
                                            })
                                            process_max_usage[pid].update({
                                                'download': max(process_max_usage[pid]['download'], download),
                                                'upload': max(process_max_usage[pid]['upload'], upload),
                                                'exe': proc.exe() or "N/A"
                                            })
                            except (psutil.NoSuchProcess, psutil.AccessDenied):
                                continue
                except Exception as e:
                    print(f"Error with net_connections: {e}")
            # Enhanced fallback: Prioritize upload if high
            if is_high_bandwidth and not active_processes:
                try:
                    for conn in psutil.net_connections(kind='inet'):
                        if conn.pid and conn.status in ('ESTABLISHED', 'SYN_SENT', 'SYN_RECV'):
                            try:
                                proc = psutil.Process(conn.pid)
                                pid = proc.pid
                                if pid not in [p['pid'] for p in active_processes]:
                                    net_io = proc.net_io_counters() if hasattr(proc, 'net_io_counters') else None
                                    if net_io:
                                        bytes_sent = net_io.bytes_sent
                                        bytes_recv = net_io.bytes_recv
                                        prev_stats = process_usage_history[pid]
                                        time_diff = max(time.time() - prev_stats['last_seen'], interval) if prev_stats['last_seen'] else interval
                                        download = ((bytes_recv - prev_stats['bytes_recv']) * 8) / (1024 * 1024) / time_diff if prev_stats['last_seen'] else 0
                                        upload = ((bytes_sent - prev_stats['bytes_sent']) * 8) / (1024 * 1024) / time_diff if prev_stats['last_seen'] else 0

                                        process_usage_history[pid] = {
                                            'bytes_recv': bytes_recv,
                                            'bytes_sent': bytes_sent,
                                            'last_seen': time.time()
                                        }

                                        if upload > threshold_upload / 2 or download > threshold_download / 2:
                                            active_processes.append({
                                                'name': proc.name(),
                                                'pid': pid,
                                                'download': download,
                                                'upload': upload,
                                                'exe': proc.exe() or "N/A"
                                            })
                                            process_max_usage[pid].update({
                                                'download': max(process_max_usage[pid]['download'], download),
                                                'upload': max(process_max_usage[pid]['upload'], upload),
                                                'exe': proc.exe() or "N/A"
                                            })
                            except (psutil.NoSuchProcess, psutil.AccessDenied):
                                continue
                except Exception as e:
                    print(f"Error with net_connections: {e}")

            # Enhanced fallback: Prioritize upload if high
            if is_high_bandwidth and not active_processes:
                try:
                    for conn in psutil.net_connections(kind='inet'):
                        if conn.pid and conn.status in ('ESTABLISHED', 'SYN_SENT', 'SYN_RECV'):
                            try:
                                proc = psutil.Process(conn.pid)
                                pid = proc.pid
                                if pid not in [p['pid'] for p in active_processes]:
                                    net_io = proc.net_io_counters() if hasattr(proc, 'net_io_counters') else None
                                    if net_io:
                                        bytes_sent = net_io.bytes_sent
                                        bytes_recv = net_io.bytes_recv
                                        prev_stats = process_usage_history[pid]
                                        time_diff = max(time.time() - prev_stats['last_seen'], interval) if prev_stats['last_seen'] else interval
                                        download = ((bytes_recv - prev_stats['bytes_recv']) * 8) / (1024 * 1024) / time_diff
                                        upload = ((bytes_sent - prev_stats['bytes_sent']) * 8) / (1024 * 1024) / time_diff

                                        process_usage_history[pid] = {
                                            'bytes_recv': bytes_recv,
                                            'bytes_sent': bytes_sent,
                                            'last_seen': time.time()
                                        }

                                        if upload > threshold_upload / 2 or download > threshold_download / 2:
                                            active_processes.append({
                                                'name': proc.name(),
                                                'pid': pid,
                                                'download': download,
                                                'upload': upload,
                                                'exe': proc.exe() or "N/A"
                                            })
                                            process_max_usage[pid].update({
                                                'download': max(process_max_usage[pid]['download'], download),
                                                'upload': max(process_max_usage[pid]['upload'], upload),
                                                'exe': proc.exe() or "N/A"
                                            })
                            except (psutil.NoSuchProcess, psutil.AccessDenied):
                                continue
                except Exception as e:
                    print(f"Error with net_connections: {e}")

            # Fallback: Check connections for high-bandwidth cases
            if is_high_bandwidth and not active_processes:
                try:
                    for conn in psutil.net_connections(kind='inet'):
                        if conn.pid and conn.status in ('ESTABLISHED', 'SYN_SENT', 'SYN_RECV'):
                            try:
                                proc = psutil.Process(conn.pid)
                                pid = proc.pid
                                if pid not in [p['pid'] for p in active_processes]:
                                    # Use measured I/O if available, else estimate
                                    prev_stats = process_usage_history[pid]
                                    download = ((prev_stats['bytes_recv'] - process_usage_history[pid]['bytes_recv']) * 8) / (1024 * 1024) / interval if prev_stats['last_seen'] else download_speed
                                    upload = ((prev_stats['bytes_sent'] - process_usage_history[pid]['bytes_sent']) * 8) / (1024 * 1024) / interval if prev_stats['last_seen'] else upload_speed
                                    
                                    if download > 1.0 or upload > 1.0:
                                        active_processes.append({
                                            'name': proc.name(),
                                            'pid': pid,
                                            'download': download,
                                            'upload': upload,
                                            'exe': proc.exe() or "N/A"
                                        })
                                        process_max_usage[pid].update({
                                            'download': max(process_max_usage[pid]['download'], download),
                                            'upload': max(process_max_usage[pid]['upload'], upload),
                                            'exe': proc.exe() or "N/A"
                                        })
                            except (psutil.NoSuchProcess, psutil.AccessDenied):
                                continue
                except Exception as e:
                    print(f"Error with net_connections: {e}")

        except Exception as e:
            print(f"Error scanning processes: {e}")

        # Format process info concisely
        if active_processes:
            processes_info = " | ".join(f"{p['name']} ({p['pid']})" for p in sorted(active_processes, key=lambda x: x['download'] + x['upload'], reverse=True))

        # Log high-bandwidth event
        if is_high_bandwidth:
            high_bandwidth_events.append({
                'timestamp': timestamp,
                'download': download_speed,
                'upload': upload_speed,
                'processes': active_processes if active_processes else [{'name': 'Unknown', 'pid': -1, 'download': download_speed, 'upload': upload_speed, 'exe': 'N/A'}]
            })

        # Print real-time output
        print(f"{timestamp:<20} | {download_speed:<15.2f} | {upload_speed:<15.2f} | {status:<15} | {processes_info:<60}")

        # Maintain interval
        elapsed = time.time() - loop_start
        time.sleep(max(0, interval - elapsed))

    # Summary with total bandwidth from logged events
    print("\n=== Monitoring Complete ===")
    print(f"High Bandwidth Events (Download > {threshold_download} Mbps or Upload > {threshold_upload} Mbps):")
    if high_bandwidth_events:
        print("Timestamps of High Bandwidth Occurrences:")
        total_download_mbps = 0
        total_upload_mbps = 0
        for event in high_bandwidth_events:
            print(f"  - {event['timestamp']}: Download {event['download']:.2f} Mbps, Upload {event['upload']:.2f} Mbps")
            total_download_mbps += event['download']
            total_upload_mbps += event['upload']
        
        # Convert Mbps over 1-second intervals to MB (Mbps * seconds / 8 = MB)
        total_download_mb = (total_download_mbps * interval) / 8
        total_upload_mb = (total_upload_mbps * interval) / 8
        
        print("\nProcesses Contributing to High Bandwidth:")
        for pid, stats in sorted(process_max_usage.items(), key=lambda x: x[1]['download'] + x[1]['upload'], reverse=True):
            print(f"  - {stats['exe'].split('\\')[-1]} (PID: {pid}, Path: {stats['exe']}): "
                  f"Max Download {stats['download']:.2f} Mbps, Max Upload {stats['upload']:.2f} Mbps")
        
        print(f"\nOverall Total Bandwidth from High-Bandwidth Events: "
              f"Total Download {total_download_mb:.2f} MB, Total Upload {total_upload_mb:.2f} MB")
        
        # Print overall totals first
        print(f"Overall Total Bandwidth Used: Total Download {total_download_mb:.2f} MB, Total Upload {total_upload_mb:.2f} MB")
        
        # Then list per-process details
        for pid, stats in sorted(process_max_usage.items(), key=lambda x: x[1]['download'] + x[1]['upload'], reverse=True):
            per_process_download_mb = process_usage_history[pid]['bytes_recv'] / (1024 * 1024)
            per_process_upload_mb = process_usage_history[pid]['bytes_sent'] / (1024 * 1024)
            print(f"  - {stats['exe'].split('\\')[-1]} (PID: {pid}, Path: {stats['exe']}): "
                  f"Max Download {stats['download']:.2f} Mbps, Max Upload {stats['upload']:.2f} Mbps, "
                  f"Per-Process Total Download {per_process_download_mb:.2f} MB, Per-Process Total Upload {per_process_upload_mb:.2f} MB")
    # All processes summary
    # Summary with total bandwidth from logged events and per-process totals
    print("\n=== Monitoring Complete ===")
    print(f"High Bandwidth Events (Download > {threshold_download} Mbps or Upload > {threshold_upload} Mbps):")
    if high_bandwidth_events:
        print("Timestamps of High Bandwidth Occurrences:")
        total_download_mbps = 0
        total_upload_mbps = 0
        for event in high_bandwidth_events:
            print(f"  - {event['timestamp']}: Download {event['download']:.2f} Mbps, Upload {event['upload']:.2f} Mbps")
            total_download_mbps += event['download']
            total_upload_mbps += event['upload']
        
        # Convert Mbps over 1-second intervals to MB (Mbps * seconds / 8 = MB)
        total_download_mb = (total_download_mbps * interval) / 8
        total_upload_mb = (total_upload_mbps * interval) / 8
        
        print("\nProcesses Contributing to High Bandwidth:")
        for pid, stats in sorted(process_max_usage.items(), key=lambda x: x[1]['download'] + x[1]['upload'], reverse=True):
            print(f"  - {stats['exe'].split('\\')[-1]} (PID: {pid}, Path: {stats['exe']}): "
                  f"Max Download {stats['download']:.2f} Mbps, Max Upload {stats['upload']:.2f} Mbps")
        
        print(f"\nOverall Total Bandwidth from High-Bandwidth Events: "
              f"Total Download {total_download_mb:.2f} MB, Total Upload {total_upload_mb:.2f} MB")
        
        # Add per-process total bandwidth
        for pid, stats in sorted(process_max_usage.items(), key=lambda x: x[1]['download'] + x[1]['upload'], reverse=True):
            total_download_mb_per_app = process_usage_history[pid]['bytes_recv'] / (1024 * 1024)
            total_upload_mb_per_app = process_usage_history[pid]['bytes_sent'] / (1024 * 1024)
            print(f"{stats['exe'].split('\\')[-1]}: Total Download {total_download_mb_per_app:.2f} MB, Total Upload {total_upload_mb_per_app:.2f} MB")

if __name__ == "__main__":
    if sys.platform == "win32":
        import ctypes

    adapter = get_network_interface_type()
    if isinstance(adapter, tuple):
        adapter = adapter[1]
    
    if not adapter:
        print("Error: No active network adapter found.")
    else:
        start_time_str = input("Enter start time (YYYY-MM-DD HH:MM:SS): ")
        end_time_str = input("Enter end time (YYYY-MM-DD HH:MM:SS): ")
    # Get user-defined thresholds
        while True:
            try:
                threshold_download = float(input("Enter download threshold (Mbps): "))
                threshold_upload = float(input("Enter upload threshold (Mbps): "))
                if threshold_download > 0 and threshold_upload > 0:
                    break
                print("Thresholds must be positive numbers!")
            except ValueError:
                print("Invalid input! Please enter numeric values.")
        monitor_bandwidth_spikes(adapter, start_time_str, end_time_str, threshold_download=threshold_download, threshold_upload=threshold_upload, interval=1)
