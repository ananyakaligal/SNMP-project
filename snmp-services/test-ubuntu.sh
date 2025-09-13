#!/bin/bash

# Ubuntu script to test SNMP agents
# This can be run in a Docker container or WSL

echo "Testing SNMP Agents with Ubuntu..."

# Function to test SNMP agent
test_snmp_agent() {
    local service_name=$1
    local port=$2
    local oid=$3
    
    echo "Testing $service_name on port $port..."
    
    if snmpwalk -v2c -c public localhost:$port $oid 2>/dev/null; then
        echo "✅ $service_name is working!"
    else
        echo "❌ $service_name failed!"
    fi
    echo ""
}

# Test all services
test_snmp_agent "Auth Service" "16101" "1.3.6.1.4.1.9999.1.1.0"
test_snmp_agent "DB Service" "16102" "1.3.6.1.4.1.9999.1.1.0"
test_snmp_agent "Web Server" "16103" "1.3.6.1.4.1.9999.1.1.0"
test_snmp_agent "Load Balancer" "16104" "1.3.6.1.4.1.9999.1.1.0"
test_snmp_agent "Cache Service" "16105" "1.3.6.1.4.1.9999.1.1.0"

echo "SNMP testing completed!"
