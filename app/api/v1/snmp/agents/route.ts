import { NextResponse } from "next/server"

// Mock SNMP agents data
const mockAgents = [
  { name: "Authentication Service", ip: "192.168.1.10", status: "UP" },
  { name: "Database Service", ip: "192.168.1.11", status: "UP" },
  { name: "Web Server", ip: "192.168.1.12", status: "DOWN" },
  { name: "Load Balancer", ip: "192.168.1.13", status: "UP" },
  { name: "Cache Service", ip: "192.168.1.14", status: "UP" },
]

export async function GET() {
  try {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 100))

    return NextResponse.json(mockAgents)
  } catch (error) {
    return NextResponse.json({ status: "error", message: "Failed to fetch SNMP agents" }, { status: 500 })
  }
}
