#!/usr/bin/env python3
"""
SNMP Agent Script for Load Balancer
Handles custom enterprise OIDs (1.3.6.1.4.1.9999.*)
"""

import sys
import json
import time
import random
import psutil
import subprocess
from datetime import datetime, timedelta

class LoadBalancerSNMPAgent:
    def __init__(self):
        self.service_name = "Load Balancer"
        self.start_time = time.time()
        self.request_count = 0
        self.error_count = 0
        self.log_level = "INFO"
        self.backend_servers = 3
        self.active_backends = 2
        self.connections_per_second = 0
        
    def get_system_uptime(self):
        """Get system uptime in human readable format"""
        uptime_seconds = int(time.time() - self.start_time)
        days = uptime_seconds // 86400
        hours = (uptime_seconds % 86400) // 3600
        minutes = (uptime_seconds % 3600) // 60
        return f"{days}d {hours}h {minutes}m"
    
    def get_cpu_usage(self):
        """Get current CPU usage percentage"""
        base_cpu = psutil.cpu_percent(interval=1)
        # Load balancers typically have moderate CPU usage
        lb_load = random.uniform(2, 8)
        return round(min(base_cpu + lb_load, 100), 1)
    
    def get_memory_usage(self):
        """Get current memory usage in MB"""
        memory = psutil.virtual_memory()
        base_memory = memory.used / 1024 / 1024
        lb_memory = random.uniform(100, 300)  # Load balancer memory usage
        return round(base_memory + lb_memory, 1)
    
    def get_network_io(self):
        """Get network I/O statistics"""
        net_io = psutil.net_io_counters()
        return {
            'in': (net_io.bytes_recv // 1024) + random.randint(200, 600),  # KB/s
            'out': (net_io.bytes_sent // 1024) + random.randint(150, 500) # KB/s
        }
    
    def get_latency(self):
        """Simulate average response latency for load balancer"""
        base_latency = 3.0
        variation = random.uniform(-0.5, 2.0)
        return round(base_latency + variation, 1)
    
    def get_connections_per_second(self):
        """Simulate connections per second"""
        self.connections_per_second += random.randint(1, 8)
        return self.connections_per_second
    
    def get_backend_status(self):
        """Simulate backend server status"""
        # Randomly simulate backend server failures
        if random.random() < 0.05:  # 5% chance of backend failure
            self.active_backends = max(1, self.active_backends - 1)
        elif random.random() < 0.02:  # 2% chance of backend recovery
            self.active_backends = min(self.backend_servers, self.active_backends + 1)
        
        return self.active_backends
    
    def get_oid_value(self, oid):
        """Get value for specific OID"""
        oid_map = {
            "1.3.6.1.4.1.9999.1.1.0": self.service_name,  # sysName
            "1.3.6.1.4.1.9999.1.2.0": "UP",              # sysStatus
            "1.3.6.1.4.1.9999.1.3.0": self.get_cpu_usage(),  # cpuUsage
            "1.3.6.1.4.1.9999.1.4.0": self.get_memory_usage(),  # memoryUsage
            "1.3.6.1.4.1.9999.1.5.0": self.get_latency(),  # avgLatency
            "1.3.6.1.4.1.9999.1.6.0": self.error_count,   # totalErrors
            "1.3.6.1.4.1.9999.1.7.0": self.log_level,     # logLevel
            "1.3.6.1.4.1.9999.1.8.0": self.get_system_uptime(),  # uptime
            "1.3.6.1.4.1.9999.1.9.0": self.get_connections_per_second(), # requestsProcessed
            "1.3.6.1.4.1.9999.1.10.0": self.get_network_io()['in'],  # networkInBytes
            "1.3.6.1.4.1.9999.1.11.0": self.get_network_io()['out'], # networkOutBytes
            "1.3.6.1.4.1.9999.2.1.0": 4,                  # ifNumber
            "1.3.6.1.4.1.9999.3.1.0": 5,                  # serviceCount
            "1.3.6.1.4.1.9999.3.2.0": self.get_backend_status(), # activeServices
        }
        
        return oid_map.get(oid, "No Such Instance")
    
    def set_oid_value(self, oid, value):
        """Set value for specific OID (only writable OIDs)"""
        if oid == "1.3.6.1.4.1.9999.1.7.0":  # logLevel
            if value in ["INFO", "DEBUG", "ERROR"]:
                self.log_level = value
                return True
        return False
    
    def process_request(self, request_type, oid, value=None):
        """Process SNMP request"""
        self.request_count += 1
        
        try:
            if request_type == "GET":
                result = self.get_oid_value(oid)
                return f"{oid} = {result}"
            elif request_type == "SET" and value is not None:
                if self.set_oid_value(oid, value):
                    return f"{oid} = {value}"
                else:
                    return "Error: OID is read-only or invalid value"
            else:
                return "Error: Invalid request"
        except Exception as e:
            self.error_count += 1
            return f"Error: {str(e)}"

def main():
    agent = LoadBalancerSNMPAgent()
    
    # Read input from snmpd
    for line in sys.stdin:
        line = line.strip()
        if not line:
            continue
            
        try:
            # Parse the request from snmpd
            parts = line.split()
            if len(parts) < 2:
                continue
                
            request_type = parts[0]
            oid = parts[1]
            value = parts[2] if len(parts) > 2 else None
            
            # Process the request
            result = agent.process_request(request_type, oid, value)
            print(result)
            sys.stdout.flush()
            
        except Exception as e:
            print(f"Error processing request: {str(e)}")
            sys.stdout.flush()

if __name__ == "__main__":
    main()
