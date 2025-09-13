FROM ubuntu:22.04

# Install SNMP and required packages
RUN apt-get update && apt-get install -y \
    snmpd \
    snmp \
    && rm -rf /var/lib/apt/lists/*

# Create directories
RUN mkdir -p /var/lib/snmp /etc/snmp

# Create SNMP config with custom OIDs
RUN echo 'agentAddress udp:161' > /etc/snmp/snmpd.conf && \
    echo 'rocommunity public' >> /etc/snmp/snmpd.conf && \
    echo 'sysLocation "Auth Service Container"' >> /etc/snmp/snmpd.conf && \
    echo 'sysContact "admin@snmp-monitor.com"' >> /etc/snmp/snmpd.conf && \
    echo 'sysServices 72' >> /etc/snmp/snmpd.conf && \
    echo 'extend .1.3.6.1.4.1.9999.1.1.0 /bin/echo "Authentication Service"' >> /etc/snmp/snmpd.conf && \
    echo 'extend .1.3.6.1.4.1.9999.1.2.0 /bin/echo "UP"' >> /etc/snmp/snmpd.conf && \
    echo 'extend .1.3.6.1.4.1.9999.1.3.0 /bin/echo "45"' >> /etc/snmp/snmpd.conf && \
    echo 'extend .1.3.6.1.4.1.9999.1.4.0 /bin/echo "2048"' >> /etc/snmp/snmpd.conf && \
    echo 'extend .1.3.6.1.4.1.9999.1.5.0 /bin/echo "12"' >> /etc/snmp/snmpd.conf && \
    echo 'extend .1.3.6.1.4.1.9999.1.6.0 /bin/echo "3"' >> /etc/snmp/snmpd.conf && \
    echo 'extend .1.3.6.1.4.1.9999.1.7.0 /bin/echo "INFO"' >> /etc/snmp/snmpd.conf && \
    echo 'extend .1.3.6.1.4.1.9999.1.8.0 /bin/echo "5d 12h 30m"' >> /etc/snmp/snmpd.conf && \
    echo 'extend .1.3.6.1.4.1.9999.1.9.0 /bin/echo "15420"' >> /etc/snmp/snmpd.conf && \
    echo 'extend .1.3.6.1.4.1.9999.1.10.0 /bin/echo "1024"' >> /etc/snmp/snmpd.conf && \
    echo 'extend .1.3.6.1.4.1.9999.1.11.0 /bin/echo "768"' >> /etc/snmp/snmpd.conf

# Expose SNMP port
EXPOSE 161/udp

# Start SNMP daemon
CMD ["snmpd", "-f", "-Lo", "-C", "-c", "/etc/snmp/snmpd.conf"]
