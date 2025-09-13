import { type NextRequest, NextResponse } from "next/server"

// Mock OID data
const mockOidData: Record<string, { value: string | number; type: string }> = {
  "1.3.6.1.4.1.9999.1.2.0": { value: "UP", type: "string" },
  "1.3.6.1.4.1.9999.1.3.0": { value: 45.2, type: "float" },
  "1.3.6.1.4.1.9999.1.4.0": { value: 2048, type: "integer" },
  "1.3.6.1.4.1.9999.1.5.0": { value: 12.5, type: "float" },
  "1.3.6.1.4.1.9999.1.6.0": { value: 3, type: "integer" },
  "1.3.6.1.4.1.9999.1.7.0": { value: "INFO", type: "string" },
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const agentIp = searchParams.get("agentIp")
    const oid = searchParams.get("oid")

    if (!agentIp || !oid) {
      return NextResponse.json(
        { status: "error", message: "Missing required parameters: agentIp and oid" },
        { status: 400 },
      )
    }

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 150))

    const oidData = mockOidData[oid]
    if (!oidData) {
      return NextResponse.json({ status: "error", message: `OID ${oid} not found` }, { status: 404 })
    }

    return NextResponse.json({
      oid,
      value: oidData.value,
      type: oidData.type,
      agent: agentIp,
    })
  } catch (error) {
    return NextResponse.json({ status: "error", message: "Failed to fetch OID data" }, { status: 500 })
  }
}
