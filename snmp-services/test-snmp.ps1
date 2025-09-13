# PowerShell script to test SNMP agents using Ubuntu container
# This uses Docker Desktop with Ubuntu for SNMP testing

Write-Host "Setting up Ubuntu test environment..." -ForegroundColor Green

# Build the test container
Write-Host "Building Ubuntu test container..." -ForegroundColor Yellow
docker build -f Dockerfile.test -t snmp-test .

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to build test container!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Test container built successfully!" -ForegroundColor Green

# Run the test script
Write-Host "Running SNMP tests..." -ForegroundColor Yellow
docker run --rm --network host snmp-test /test-ubuntu.sh

Write-Host "SNMP testing completed!" -ForegroundColor Green
