import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Mock services data - in real implementation, this would fetch from actual service registry
    const services = [
      {
        name: "Web Server",
        ip: "192.168.1.100",
        status: "UP",
        uptime: "5d 12h 30m",
        port: 80,
        type: "HTTP",
      },
      {
        name: "Database Server",
        ip: "192.168.1.101",
        status: "UP",
        uptime: "12d 8h 15m",
        port: 3306,
        type: "MySQL",
      },
      {
        name: "Cache Server",
        ip: "192.168.1.102",
        status: "DOWN",
        uptime: "0d 0h 0m",
        port: 6379,
        type: "Redis",
      },
      {
        name: "Load Balancer",
        ip: "192.168.1.103",
        status: "UP",
        uptime: "3d 6h 45m",
        port: 443,
        type: "NGINX",
      },
      {
        name: "Message Queue",
        ip: "192.168.1.104",
        status: "UP",
        uptime: "7d 2h 20m",
        port: 5672,
        type: "RabbitMQ",
      },
    ]

    return NextResponse.json(services)
  } catch (error) {
    console.error("Error fetching services:", error)
    return NextResponse.json({ error: "Failed to fetch services" }, { status: 500 })
  }
}
