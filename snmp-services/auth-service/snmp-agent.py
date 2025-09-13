#!/usr/bin/env python3
"""
SNMP Agent Script for Auth Service
Handles custom enterprise OIDs (1.3.6.1.4.1.9999.*)
"""

import sys
import json
import time
import random
import psutil
import subprocess
from datetime import datetime, timedelta

class AuthServiceSNMPAgent:
    def __init__(self):
        self.service_name = "Authentication Service"
        self.start_time = time.time()
        self.request_count = 0
        self.error_count = 0
        self.log_level = "INFO"
        
    def get_system_uptime(self):
        """Get system uptime in human readable format"""
        uptime_seconds = int(time.time() - self.start_time)
        days = uptime_seconds // 86400
        hours = (uptime_seconds % 86400) // 3600
        minutes = (uptime_seconds % 3600) // 60
        return f"{days}d {hours}h {minutes}m"
    
    def get_cpu_usage(self):
        """Get current CPU usage percentage"""
        return round(psutil.cpu_percent(interval=1), 1)
    
    def get_memory_usage(self):
        """Get current memory usage in MB"""
        memory = psutil.virtual_memory()
        return round(memory.used / 1024 / 1024, 1)
    
    def get_network_io(self):
        """Get network I/O statistics"""
        net_io = psutil.net_io_counters()
        return {
            'in': net_io.bytes_recv // 1024,  # KB/s
            'out': net_io.bytes_sent // 1024   # KB/s
        }
    
    def get_latency(self):
        """Simulate average response latency"""
        # Simulate realistic latency with some variation
        base_latency = 8.0
        variation = random.uniform(-2.0, 5.0)
        return round(base_latency + variation, 1)
    
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
            "1.3.6.1.4.1.9999.1.9.0": self.request_count, # requestsProcessed
            "1.3.6.1.4.1.9999.1.10.0": self.get_network_io()['in'],  # networkInBytes
            "1.3.6.1.4.1.9999.1.11.0": self.get_network_io()['out'], # networkOutBytes
            "1.3.6.1.4.1.9999.2.1.0": 2,                  # ifNumber
            "1.3.6.1.4.1.9999.3.1.0": 3,                  # serviceCount
            "1.3.6.1.4.1.9999.3.2.0": 2,                  # activeServices
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
    agent = AuthServiceSNMPAgent()
    
    # Check if called with specific metric name
    if len(sys.argv) > 1:
        metric_name = sys.argv[1]
        oid_map = {
            "sysName": "1.3.6.1.4.1.9999.1.1.0",
            "sysStatus": "1.3.6.1.4.1.9999.1.2.0",
            "cpuUsage": "1.3.6.1.4.1.9999.1.3.0",
            "memoryUsage": "1.3.6.1.4.1.9999.1.4.0",
            "avgLatency": "1.3.6.1.4.1.9999.1.5.0",
            "totalErrors": "1.3.6.1.4.1.9999.1.6.0",
            "logLevel": "1.3.6.1.4.1.9999.1.7.0",
            "uptime": "1.3.6.1.4.1.9999.1.8.0",
            "requestsProcessed": "1.3.6.1.4.1.9999.1.9.0",
            "networkInBytes": "1.3.6.1.4.1.9999.1.10.0",
            "networkOutBytes": "1.3.6.1.4.1.9999.1.11.0",
        }
        
        if metric_name in oid_map:
            oid = oid_map[metric_name]
            result = agent.get_oid_value(oid)
            print(result)
        else:
            print("Unknown metric")
        return
    
    # Original stdin processing for pass command
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
