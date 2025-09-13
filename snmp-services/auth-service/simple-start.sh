#!/bin/bash

echo "Starting Simple Auth Service SNMP Agent..."

# Start SNMP daemon with simple config
echo "Starting SNMP daemon with simple configuration..."
snmpd -f -Lo -C -c /etc/snmp/simple-snmpd.conf &

# Wait for SNMP daemon to start
sleep 3

# Test SNMP agent
echo "Testing SNMP agent..."
snmpwalk -v2c -c public localhost 1.3.6.1.4.1.9999.1.1.0

if [ $? -eq 0 ]; then
    echo "✅ SNMP agent is working correctly"
else
    echo "❌ SNMP agent test failed"
fi

# Keep the container running
echo "Auth Service SNMP Agent is ready"
while true; do
    sleep 60
    echo "Auth Service SNMP Agent is still running..."
done
