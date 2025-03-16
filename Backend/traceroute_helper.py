#Extract Second Hop Ip

import subprocess
import re
from adapter import get_network_interface_type
import netifaces

def get_second_hop_ip(target_ip: str) -> str:
    """Extracts the second-hop IP address from a tracert command."""
    try:
        print(f"🔍 Running traceroute to detect second-hop IP for: {target_ip}\n")
        
        # Run tracert with a timeout for reliability
        result = subprocess.run(
            ["tracert", "-d", "-h", "3", "-w", "100", target_ip],  # Increased timeout
            capture_output=True, text=True, timeout=15
        )

        if result.returncode != 0:
            print("❌ Traceroute command failed.")
            return None
        
        print("🔎 Traceroute Output:\n" + result.stdout)  # Debug output
        
        lines = result.stdout.splitlines()

        # Extract second-hop IP from traceroute output
        for line in lines:
            print(f"🛠️ Debugging line: {line}")  # Debugging each line
            match = re.search(r"\s*(\d+)\s+(?:\d+ ms\s+|\*\s+){1,3}(\d+\.\d+\.\d+\.\d+)", line)
            if match:
                hop_number = int(match.group(1))
                ip_address = match.group(2)
                print(f"📌 Hop {hop_number}: {ip_address}")
                if hop_number == 2:  # If this is the second hop
                    return ip_address  # Return second-hop IP immediately

        print("❌ No valid second-hop IP found.")
        return None

    except subprocess.TimeoutExpired:
        print("⚠️ Warning: Traceroute command took too long and was terminated.")
        return None
    except Exception as e:
        print(f"⚠️ Warning: Traceroute failed due to error: {e}")
        return None
    

# Get the default gateway for the active internet adapter
def get_default_gateway():
    try:
        gateways = netifaces.gateways()
        default_gateway = gateways['default'][netifaces.AF_INET][0]  # Get IP of default gateway
        return default_gateway
    except Exception as e:
        print(f"Error fetching default gateway: {e}")
        return None

# Test Code
if __name__ == "__main__":
    ip = get_default_gateway()
    print(ip)
    target = "8.8.8.8"  # Example target IP
    hop2_ip = get_second_hop_ip(target)
    if hop2_ip:
        print(f"✅ Extracted second-hop IP: {hop2_ip}")
    else:
        print("❌ Failed to extract second-hop IP.")
