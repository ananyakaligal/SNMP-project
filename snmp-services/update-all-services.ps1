# PowerShell script to add custom OIDs to all services

Write-Host "Adding custom OIDs to all services..." -ForegroundColor Green

$services = @(
    @{name="auth-service"; serviceName="Authentication Service"; cpu="45"; memory="2048"; latency="12"; errors="3"; uptime="5d 12h 30m"; requests="15420"; netIn="1024"; netOut="768"},
    @{name="db-service"; serviceName="Database Service"; cpu="65"; memory="4096"; latency="25"; errors="1"; uptime="12d 8h 15m"; requests="28450"; netIn="2048"; netOut="1536"},
    @{name="web-server"; serviceName="Web Server"; cpu="35"; memory="1536"; latency="8"; errors="5"; uptime="3d 6h 45m"; requests="45680"; netIn="1536"; netOut="2048"},
    @{name="load-balancer"; serviceName="Load Balancer"; cpu="25"; memory="1024"; latency="5"; errors="2"; uptime="7d 2h 20m"; requests="67890"; netIn="3072"; netOut="2560"},
    @{name="cache-service"; serviceName="Cache Service"; cpu="15"; memory="3072"; latency="2"; errors="0"; uptime="15d 4h 10m"; requests="125000"; netIn="2560"; netOut="2048"}
)

foreach ($service in $services) {
    Write-Host "Updating $($service.name)..." -ForegroundColor Yellow
    
    $dockerfile = "$($service.name)/Dockerfile"
    if (Test-Path $dockerfile) {
        $content = @"
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
    echo 'sysLocation "$($service.serviceName) Container"' >> /etc/snmp/snmpd.conf && \
    echo 'sysContact "admin@snmp-monitor.com"' >> /etc/snmp/snmpd.conf && \
    echo 'sysServices 72' >> /etc/snmp/snmpd.conf && \
    echo 'extend .1.3.6.1.4.1.9999.1.1.0 /bin/echo "$($service.serviceName)"' >> /etc/snmp/snmpd.conf && \
    echo 'extend .1.3.6.1.4.1.9999.1.2.0 /bin/echo "UP"' >> /etc/snmp/snmpd.conf && \
    echo 'extend .1.3.6.1.4.1.9999.1.3.0 /bin/echo "$($service.cpu)"' >> /etc/snmp/snmpd.conf && \
    echo 'extend .1.3.6.1.4.1.9999.1.4.0 /bin/echo "$($service.memory)"' >> /etc/snmp/snmpd.conf && \
    echo 'extend .1.3.6.1.4.1.9999.1.5.0 /bin/echo "$($service.latency)"' >> /etc/snmp/snmpd.conf && \
    echo 'extend .1.3.6.1.4.1.9999.1.6.0 /bin/echo "$($service.errors)"' >> /etc/snmp/snmpd.conf && \
    echo 'extend .1.3.6.1.4.1.9999.1.7.0 /bin/echo "INFO"' >> /etc/snmp/snmpd.conf && \
    echo 'extend .1.3.6.1.4.1.9999.1.8.0 /bin/echo "$($service.uptime)"' >> /etc/snmp/snmpd.conf && \
    echo 'extend .1.3.6.1.4.1.9999.1.9.0 /bin/echo "$($service.requests)"' >> /etc/snmp/snmpd.conf && \
    echo 'extend .1.3.6.1.4.1.9999.1.10.0 /bin/echo "$($service.netIn)"' >> /etc/snmp/snmpd.conf && \
    echo 'extend .1.3.6.1.4.1.9999.1.11.0 /bin/echo "$($service.netOut)"' >> /etc/snmp/snmpd.conf

# Expose SNMP port
EXPOSE 161/udp

# Start SNMP daemon
CMD ["snmpd", "-f", "-Lo", "-C", "-c", "/etc/snmp/snmpd.conf"]
"@
        $content | Set-Content $dockerfile
        Write-Host "  ✅ Updated $dockerfile" -ForegroundColor Green
    }
}

Write-Host "All services updated! Now rebuild with: docker compose up --build" -ForegroundColor Green
