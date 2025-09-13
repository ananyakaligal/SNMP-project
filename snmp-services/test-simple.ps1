# Simple PowerShell script to test SNMP agents using Docker
# This doesn't require external SNMP tools

Write-Host "Testing SNMP Agents with Docker..." -ForegroundColor Green

# Function to test SNMP agent using Docker exec
function Test-SNMPAgent-Docker {
    param(
        [string]$ContainerName,
        [string]$ServiceName
    )
    
    Write-Host "Testing $ServiceName ($ContainerName)..." -ForegroundColor Yellow
    
    try {
        $result = docker exec $ContainerName snmpwalk -v2c -c public localhost 1.3.6.1.4.1.9999.1.1.0
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ $ServiceName is working!" -ForegroundColor Green
            Write-Host "Result: $result" -ForegroundColor Cyan
        } else {
            Write-Host "❌ $ServiceName failed!" -ForegroundColor Red
        }
    } catch {
        Write-Host "❌ Error testing $ServiceName : $($_.Exception.Message)" -ForegroundColor Red
    }
    Write-Host ""
}

# Test all services
Test-SNMPAgent-Docker "snmp-auth-service" "Auth Service"
Test-SNMPAgent-Docker "snmp-db-service" "DB Service"
Test-SNMPAgent-Docker "snmp-web-server" "Web Server"
Test-SNMPAgent-Docker "snmp-load-balancer" "Load Balancer"
Test-SNMPAgent-Docker "snmp-cache-service" "Cache Service"

Write-Host "SNMP testing completed!" -ForegroundColor Green
