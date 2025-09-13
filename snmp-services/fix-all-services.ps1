# PowerShell script to fix all SNMP services

Write-Host "Fixing all SNMP services..." -ForegroundColor Green

$services = @("auth-service", "db-service", "web-server", "load-balancer", "cache-service")

foreach ($service in $services) {
    Write-Host "Fixing $service..." -ForegroundColor Yellow
    
    # Fix snmpd.conf - comment out logfile
    $confFile = "$service/snmpd.conf"
    if (Test-Path $confFile) {
        $content = Get-Content $confFile
        $content = $content -replace "logfile /var/log/snmpd.log", "# logfile /var/log/snmpd.log"
        $content | Set-Content $confFile
        Write-Host "  ✅ Fixed $confFile" -ForegroundColor Green
    }
    
    # Fix start.sh - replace tail command
    $startFile = "$service/start.sh"
    if (Test-Path $startFile) {
        $content = Get-Content $startFile
        $content = $content -replace "tail -f /var/log/snmpd.log", @"
# Keep container alive
while true; do
    sleep 30
    echo "$service SNMP Agent is still running..."
done
"@
        $content | Set-Content $startFile
        Write-Host "  ✅ Fixed $startFile" -ForegroundColor Green
    }
}

Write-Host "All services fixed! Now rebuild with: docker compose up --build" -ForegroundColor Green
