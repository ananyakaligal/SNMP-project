import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Mock SNMP traps/alerts - in real implementation, this would fetch from trap receiver
    const currentTime = new Date()

    const traps = [
      {
        id: "trap-001",
        message: "High CPU usage detected on Web Server (85%)",
        severity: "high" as const,
        timestamp: new Date(currentTime.getTime() - 2 * 60 * 1000), // 2 minutes ago
        agentIp: "192.168.1.100",
        oid: "1.3.6.1.4.1.9999.1.3.0",
      },
      {
        id: "trap-002",
        message: "Memory usage approaching threshold on Database Server (90%)",
        severity: "medium" as const,
        timestamp: new Date(currentTime.getTime() - 5 * 60 * 1000), // 5 minutes ago
        agentIp: "192.168.1.101",
        oid: "1.3.6.1.4.1.9999.1.4.0",
      },
      {
        id: "trap-003",
        message: "Cache Server connection lost",
        severity: "high" as const,
        timestamp: new Date(currentTime.getTime() - 10 * 60 * 1000), // 10 minutes ago
        agentIp: "192.168.1.102",
        oid: "1.3.6.1.4.1.9999.1.2.0",
      },
    ]

    // Only return recent traps (last 30 minutes)
    const recentTraps = traps.filter((trap) => currentTime.getTime() - trap.timestamp.getTime() < 30 * 60 * 1000)

    return NextResponse.json(recentTraps)
  } catch (error) {
    console.error("Error fetching SNMP traps:", error)
    return NextResponse.json({ error: "Failed to fetch SNMP traps" }, { status: 500 })
  }
}
