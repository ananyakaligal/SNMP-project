#!/bin/bash

echo "Testing minimal SNMP setup..."

# Create a simple test container
docker run -d --name test-snmp -p 16199:161/udp ubuntu:22.04 bash -c "
apt-get update && apt-get install -y snmpd snmp &&
echo 'agentAddress udp:161' > /etc/snmp/snmpd.conf &&
echo 'rocommunity public' >> /etc/snmp/snmpd.conf &&
echo 'sysLocation Test Container' >> /etc/snmp/snmpd.conf &&
echo 'sysContact admin@test.com' >> /etc/snmp/snmpd.conf &&
snmpd -f -Lo -C -c /etc/snmp/snmpd.conf &
sleep 5 &&
tail -f /dev/null
"

echo "Waiting for container to start..."
sleep 10

echo "Testing SNMP..."
snmpwalk -v2c -c public localhost:16199 1.3.6.1.2.1.1.1.0

echo "Cleaning up..."
docker stop test-snmp
docker rm test-snmp
