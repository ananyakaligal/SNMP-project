#!/bin/bash

# Start script for Auth Service SNMP Agent

echo "Starting Auth Service SNMP Agent..."

# Create log directory
mkdir -p /var/log

# Start SNMP daemon in background
echo "Starting SNMP daemon..."
snmpd -f -Lo -C -c /etc/snmp/snmpd.conf &

# Wait for SNMP daemon to start
sleep 2

# Verify SNMP daemon is running
if pgrep snmpd > /dev/null; then
    echo "SNMP daemon started successfully"
else
    echo "Failed to start SNMP daemon"
    exit 1
fi

# Test SNMP agent
echo "Testing SNMP agent..."
snmpwalk -v2c -c public localhost 1.3.6.1.4.1.9999.1.1.0

if [ $? -eq 0 ]; then
    echo "SNMP agent is working correctly"
else
    echo "SNMP agent test failed"
fi

# Keep the container running
echo "Auth Service SNMP Agent is ready"
# Keep container alive
while true; do
    sleep 30
    echo "Auth Service SNMP Agent is still running..."
done
