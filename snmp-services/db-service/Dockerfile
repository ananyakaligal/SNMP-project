FROM ubuntu:22.04

# Install SNMP and required packages
RUN apt-get update && apt-get install -y \
    snmpd \
    snmp \
    && rm -rf /var/lib/apt/lists/*

# Create directories
RUN mkdir -p /var/lib/snmp /etc/snmp

# Create simple SNMP config
RUN echo 'agentAddress udp:161' > /etc/snmp/snmpd.conf && \
    echo 'rocommunity public' >> /etc/snmp/snmpd.conf && \
    echo 'sysLocation "db-service Container"' >> /etc/snmp/snmpd.conf && \
    echo 'sysContact "admin@snmp-monitor.com"' >> /etc/snmp/snmpd.conf && \
    echo 'sysServices 72' >> /etc/snmp/snmpd.conf

# Expose SNMP port
EXPOSE 161/udp

# Start SNMP daemon
CMD ["snmpd", "-f", "-Lo", "-C", "-c", "/etc/snmp/snmpd.conf"]
