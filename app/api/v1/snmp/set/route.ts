import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { agentIp, oid, value } = body

    if (!agentIp || !oid || value === undefined) {
      return NextResponse.json(
        { status: "error", message: "Missing required parameters: agentIp, oid, and value" },
        { status: 400 },
      )
    }

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 200))

    // Mock validation - only allow certain OIDs to be set
    const writableOids = ["1.3.6.1.4.1.9999.1.7.0"] // Log level OID

    if (!writableOids.includes(oid)) {
      return NextResponse.json({ status: "error", message: `OID ${oid} is read-only` }, { status: 403 })
    }

    // Mock successful set operation
    return NextResponse.json({
      status: "success",
      message: `Successfully set OID ${oid} to ${value} on agent ${agentIp}`,
      oid,
      value,
      agent: agentIp,
    })
  } catch (error) {
    return NextResponse.json({ status: "error", message: "Failed to set OID value" }, { status: 500 })
  }
}
