# SNMP Services

This directory contains SNMP agents for different services in the monitoring system.

## Services

- **auth-service**: Authentication Service SNMP Agent
- **db-service**: Database Service SNMP Agent  
- **web-server**: Web Server SNMP Agent
- **load-balancer**: Load Balancer SNMP Agent
- **cache-service**: Cache Service SNMP Agent

All 5 services are now fully implemented with their own SNMP agents!

## Quick Start

1. **Build and start all services:**
   ```bash
   cd snmp-services
   docker-compose up --build
   ```

2. **Test SNMP agents:**

   **On Linux/Mac:**
   ```bash
   # Test auth service
   snmpwalk -v2c -c public localhost:16101 1.3.6.1.4.1.9999.1.1.0
   
   # Test db service  
   snmpwalk -v2c -c public localhost:16102 1.3.6.1.4.1.9999.1.1.0
   
   # Test web server
   snmpwalk -v2c -c public localhost:16103 1.3.6.1.4.1.9999.1.1.0
   
   # Test load balancer
   snmpwalk -v2c -c public localhost:16104 1.3.6.1.4.1.9999.1.1.0
   
   # Test cache service
   snmpwalk -v2c -c public localhost:16105 1.3.6.1.4.1.9999.1.1.0
   ```

   **On Windows (using Docker Desktop):**
   ```powershell
   # Use the Ubuntu test container (recommended)
   .\test-snmp.ps1
   
   # Or test individual containers
   docker exec snmp-auth-service snmpwalk -v2c -c public localhost 1.3.6.1.4.1.9999.1.1.0
   
   # Or use the simple test script
   .\test-simple.ps1
   ```

3. **Get specific metrics:**
   ```bash
   # CPU usage
   snmpget -v2c -c public localhost:16101 1.3.6.1.4.1.9999.1.3.0
   
   # Memory usage
   snmpget -v2c -c public localhost:16101 1.3.6.1.4.1.9999.1.4.0
   
   # System status
   snmpget -v2c -c public localhost:16101 1.3.6.1.4.1.9999.1.2.0
   ```

## Port Mapping

| Service | SNMP Port | Container Port |
|---------|-----------|----------------|
| auth-service | 16101 | 161/udp |
| db-service | 16102 | 161/udp |
| web-server | 16103 | 161/udp |
| load-balancer | 16104 | 161/udp |
| cache-service | 16105 | 161/udp |

## MIB Structure

The custom enterprise MIB (`1.3.6.1.4.1.9999`) includes:

### System Metrics (1.3.6.1.4.1.9999.1.*)
- `1.1.0` - System Name
- `1.2.0` - System Status (UP/DOWN)
- `1.3.0` - CPU Usage (%)
- `1.4.0` - Memory Usage (MB)
- `1.5.0` - Average Latency (ms)
- `1.6.0` - Total Errors
- `1.7.0` - Log Level (INFO/DEBUG/ERROR) - **Writable**
- `1.8.0` - System Uptime
- `1.9.0` - Requests Processed
- `1.10.0` - Network Input (KB/s)
- `1.11.0` - Network Output (KB/s)

### Interface Information (1.3.6.1.4.1.9999.2.*)
- `2.1.0` - Number of Interfaces

### Service Information (1.3.6.1.4.1.9999.3.*)
- `3.1.0` - Total Service Count
- `3.2.0` - Active Service Count

## Configuration

Each service has its own:
- `Dockerfile` - Container configuration
- `snmpd.conf` - SNMP daemon configuration
- `snmp-agent.py` - Custom SNMP agent script
- `start.sh` - Startup script

## Community Strings

- **Read-only**: `public`
- **Read-write**: `private`

## Health Checks

Each service includes health checks that verify SNMP functionality:
```bash
snmpwalk -v2c -c public localhost 1.3.6.1.4.1.9999.1.1.0
```

## Troubleshooting

1. **Check container logs:**
   ```bash
   docker-compose logs auth-service
   ```

2. **Test SNMP connectivity:**
   ```bash
   snmpwalk -v2c -c public localhost:16101 1.3.6.1.4.1.9999
   ```

3. **Verify MIB loading:**
   ```bash
   docker exec -it snmp-auth-service snmpwalk -v2c -c public localhost 1.3.6.1.4.1.9999
   ```

## Development

To add a new service:

1. Create a new directory under `snmp-services/`
2. Copy the template files from an existing service
3. Modify the `snmp-agent.py` script for service-specific metrics
4. Update `docker-compose.yml` to include the new service
5. Test the new service

## Security Notes

- Community strings are set to default values for development
- In production, use strong community strings or SNMPv3
- Consider network isolation for SNMP traffic
- Regularly update SNMP daemon and dependencies
