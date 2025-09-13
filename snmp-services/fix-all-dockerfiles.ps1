# PowerShell script to fix all Dockerfiles

Write-Host "Fixing all Dockerfiles..." -ForegroundColor Green

$services = @("auth-service", "db-service", "web-server", "load-balancer", "cache-service")

foreach ($service in $services) {
    Write-Host "Fixing $service Dockerfile..." -ForegroundColor Yellow
    
    $dockerfile = "$service/Dockerfile"
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

# Create simple SNMP config
RUN echo 'agentAddress udp:161' > /etc/snmp/snmpd.conf && \
    echo 'rocommunity public' >> /etc/snmp/snmpd.conf && \
    echo 'sysLocation "$service Container"' >> /etc/snmp/snmpd.conf && \
    echo 'sysContact "admin@snmp-monitor.com"' >> /etc/snmp/snmpd.conf && \
    echo 'sysServices 72' >> /etc/snmp/snmpd.conf

# Expose SNMP port
EXPOSE 161/udp

# Start SNMP daemon
CMD ["snmpd", "-f", "-Lo", "-C", "-c", "/etc/snmp/snmpd.conf"]
"@
        $content | Set-Content $dockerfile
        Write-Host "  ✅ Fixed $dockerfile" -ForegroundColor Green
    }
}

Write-Host "All Dockerfiles fixed! Now rebuild with: docker compose up --build" -ForegroundColor Green
