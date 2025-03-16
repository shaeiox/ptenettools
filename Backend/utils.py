#Check invalid Ip or dimain function

import socket
import re
def is_valid_ip_or_domain(address: str) -> bool:
    """Checks if the given address is a valid IPv4, IPv6, or domain name."""
    
    # Check if it's a valid IPv4 address
    def is_valid_ipv4(ip: str) -> bool:
        parts = ip.split(".")
        if len(parts) != 4:
            return False
        for part in parts:
            if not part.isdigit() or not 0 <= int(part) <= 255:
                return False
        return True
    
    # Check if it's a valid IPv6 address
    def is_valid_ipv6(ip: str) -> bool:
        try:
            socket.inet_pton(socket.AF_INET6, ip)
            return True
        except (socket.error, ValueError):
            return False
    
    # Check if it's a valid domain name
    def is_valid_domain(domain: str) -> bool:
        domain_regex = re.compile(
            r"^(?!-)[A-Za-z0-9-]{1,63}(?<!-)(\.[A-Za-z]{2,6})+$"
        )
        return bool(domain_regex.match(domain))

    # Validate the input
    if is_valid_ipv4(address) or is_valid_ipv6(address):
        return True  # It's a valid IP
    elif is_valid_domain(address):
        return True  # It's a valid domain
    else:
        return False  # Invalid IP or domain


if is_valid_ip_or_domain("invalid-input"):
    print("Invalid server address! Please enter a valid IP or domain.")
