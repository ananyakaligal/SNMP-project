#!/usr/bin/env python3
"""
SNMP Agent Script for Cache Service
Handles custom enterprise OIDs (1.3.6.1.4.1.9999.*)
"""

import sys
import json
import time
import random
import psutil
import subprocess
from datetime import datetime, timedelta

class CacheServiceSNMPAgent:
    def __init__(self):
        self.service_name = "Cache Service"
        self.start_time = time.time()
        self.request_count = 0
        self.error_count = 0
        self.log_level = "INFO"
        self.cache_hits = 0
        self.cache_misses = 0
        self.cache_size = 0
        
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
        # Cache services typically have low CPU usage
        cache_load = random.uniform(0, 5)
        return round(min(base_cpu + cache_load, 100), 1)
    
    def get_memory_usage(self):
        """Get current memory usage in MB"""
        memory = psutil.virtual_memory()
        base_memory = memory.used / 1024 / 1024
        # Cache services use significant memory for caching
        cache_memory = random.uniform(800, 2000)  # Cache memory usage
        return round(base_memory + cache_memory, 1)
    
    def get_network_io(self):
        """Get network I/O statistics"""
        net_io = psutil.net_io_counters()
        return {
            'in': (net_io.bytes_recv // 1024) + random.randint(300, 800),  # KB/s
            'out': (net_io.bytes_sent // 1024) + random.randint(200, 600) # KB/s
        }
    
    def get_latency(self):
        """Simulate average response latency for cache operations"""
        # Cache operations are typically very fast
        base_latency = 1.0
        variation = random.uniform(-0.2, 0.5)
        return round(base_latency + variation, 1)
    
    def get_cache_operations(self):
        """Simulate cache operations"""
        # Simulate cache hits and misses
        if random.random() < 0.8:  # 80% cache hit rate
            self.cache_hits += 1
        else:
            self.cache_misses += 1
        
        return self.cache_hits + self.cache_misses
    
    def get_cache_hit_rate(self):
        """Calculate cache hit rate percentage"""
        total_ops = self.cache_hits + self.cache_misses
        if total_ops == 0:
            return 0
        return round((self.cache_hits / total_ops) * 100, 1)
    
    def get_cache_size(self):
        """Simulate cache size in MB"""
        self.cache_size = random.randint(500, 1500)
        return self.cache_size
    
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
            "1.3.6.1.4.1.9999.1.9.0": self.get_cache_operations(), # requestsProcessed
            "1.3.6.1.4.1.9999.1.10.0": self.get_network_io()['in'],  # networkInBytes
            "1.3.6.1.4.1.9999.1.11.0": self.get_network_io()['out'], # networkOutBytes
            "1.3.6.1.4.1.9999.2.1.0": 2,                  # ifNumber
            "1.3.6.1.4.1.9999.3.1.0": 5,                  # serviceCount
            "1.3.6.1.4.1.9999.3.2.0": 5,                  # activeServices
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
    agent = CacheServiceSNMPAgent()
    
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
