#Find interface that Customer connected to internet

import psutil

def get_network_interface_type():
    #get interface information
    net_if_addrs = psutil.net_if_addrs()

    #Check all interface to find connection
    for interface, addrs in net_if_addrs.items():
        for addr in addrs:
            
            if 'Wi-Fi' in interface or 'wlan' in interface.lower():
                return interface
            elif 'Ethernet' in interface or 'eth' in interface.lower():
                return interface
    
    return "Unknown", None




interface_name = get_network_interface_type()
if interface_name:
    print(f"Connection Type: on interface {interface_name}")
else:
    print("No active network interface found")