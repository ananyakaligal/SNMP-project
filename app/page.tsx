"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Cpu, MemoryStick, Zap, Bug, RefreshCw } from "lucide-react"
import { PerformanceCharts } from "@/components/performance-charts"

interface Agent {
  name: string
  ip: string
  status: "UP" | "DOWN"
}

interface MetricData {
  cpuUsage: number
  memoryUsage: number
  latency: number
  totalErrors: number
}

export default function SNMPDashboard() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)
  const [metrics, setMetrics] = useState<MetricData>({
    cpuUsage: 0,
    memoryUsage: 0,
    latency: 0,
    totalErrors: 0,
  })
  const [logLevel, setLogLevel] = useState("INFO")
  const [loading, setLoading] = useState(true)
  const [alert, setAlert] = useState<string | null>(null)

  // Fetch agents on component mount
  useEffect(() => {
    fetchAgents()
  }, [])

  // Fetch metrics when agent is selected
  useEffect(() => {
    if (selectedAgent) {
      fetchMetrics(selectedAgent.ip)
      fetchLogLevel(selectedAgent.ip)
    }
  }, [selectedAgent])

  const fetchAgents = async () => {
    try {
      const response = await fetch("/api/v1/snmp/agents")
      const data = await response.json()
      setAgents(data)
      if (data.length > 0) {
        setSelectedAgent(data[0])
      }
      setLoading(false)
    } catch (error) {
      console.error("Failed to fetch agents:", error)
      setLoading(false)
    }
  }

  const fetchMetrics = async (agentIp: string) => {
    try {
      // Fetch multiple OIDs for metrics
      const [cpuResponse, memoryResponse, latencyResponse, errorsResponse] = await Promise.all([
        fetch(`/api/v1/snmp/get?agentIp=${agentIp}&oid=1.3.6.1.4.1.9999.1.3.0`),
        fetch(`/api/v1/snmp/get?agentIp=${agentIp}&oid=1.3.6.1.4.1.9999.1.4.0`),
        fetch(`/api/v1/snmp/get?agentIp=${agentIp}&oid=1.3.6.1.4.1.9999.1.5.0`),
        fetch(`/api/v1/snmp/get?agentIp=${agentIp}&oid=1.3.6.1.4.1.9999.1.6.0`),
      ])

      const [cpu, memory, latency, errors] = await Promise.all([
        cpuResponse.json(),
        memoryResponse.json(),
        latencyResponse.json(),
        errorsResponse.json(),
      ])

      setMetrics({
        cpuUsage: cpu.value || 0,
        memoryUsage: memory.value || 0,
        latency: latency.value || 0,
        totalErrors: errors.value || 0,
      })
    } catch (error) {
      console.error("Failed to fetch metrics:", error)
    }
  }

  const fetchLogLevel = async (agentIp: string) => {
    try {
      const response = await fetch(`/api/v1/snmp/get?agentIp=${agentIp}&oid=1.3.6.1.4.1.9999.1.7.0`)
      const data = await response.json()
      setLogLevel(data.value || "INFO")
    } catch (error) {
      console.error("Failed to fetch log level:", error)
    }
  }

  const setLogLevelValue = async (newLevel: string) => {
    if (!selectedAgent) return

    try {
      const response = await fetch("/api/v1/snmp/set", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentIp: selectedAgent.ip,
          oid: "1.3.6.1.4.1.9999.1.7.0",
          value: newLevel,
        }),
      })

      const data = await response.json()
      if (data.status === "success") {
        setLogLevel(newLevel)
        setAlert(`Log level updated to ${newLevel}`)
        setTimeout(() => setAlert(null), 3000)
      }
    } catch (error) {
      console.error("Failed to set log level:", error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">SNMP Dashboard</h1>
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarFallback className="bg-primary text-primary-foreground">T3</AvatarFallback>
            </Avatar>
            <span className="text-sm text-muted-foreground">Team 3</span>
          </div>
        </div>
      </header>

      {/* Alert Banner */}
      {alert && (
        <Alert className="mx-6 mt-4 border-primary bg-primary/10">
          <AlertDescription className="text-primary">{alert}</AlertDescription>
        </Alert>
      )}

      <div className="container mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar - Services */}
          <div className="lg:col-span-1">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-card-foreground">Services</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {agents.map((agent) => (
                  <div
                    key={agent.ip}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedAgent?.ip === agent.ip
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50"
                    }`}
                    onClick={() => setSelectedAgent(agent)}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-card-foreground">{agent.name}</span>
                      <Badge variant={agent.status === "UP" ? "default" : "destructive"}>{agent.status}</Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Right Content Area */}
          <div className="lg:col-span-3 space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-gradient-to-br from-card to-card/80 border-border">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">CPU Usage</p>
                      <p className="text-2xl font-bold text-card-foreground">{metrics.cpuUsage}%</p>
                    </div>
                    <Cpu className="h-8 w-8 text-primary" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-card to-card/80 border-border">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Memory Usage</p>
                      <p className="text-2xl font-bold text-card-foreground">{metrics.memoryUsage} MB</p>
                    </div>
                    <MemoryStick className="h-8 w-8 text-chart-2" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-card to-card/80 border-border">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Latency</p>
                      <p className="text-2xl font-bold text-card-foreground">{metrics.latency} ms</p>
                    </div>
                    <Zap className="h-8 w-8 text-chart-3" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-card to-card/80 border-border">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Errors</p>
                      <p className="text-2xl font-bold text-card-foreground">{metrics.totalErrors}</p>
                    </div>
                    <Bug className="h-8 w-8 text-destructive" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Performance Charts Component */}
            <PerformanceCharts agentIp={selectedAgent?.ip || null} />

            {/* Service Control Panel */}
            {selectedAgent && (
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-card-foreground">Service Control - {selectedAgent.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Current Log Level: {logLevel}</p>
                    <div className="flex gap-2">
                      {["INFO", "DEBUG", "ERROR"].map((level) => (
                        <Button
                          key={level}
                          variant={logLevel === level ? "default" : "outline"}
                          size="sm"
                          onClick={() => setLogLevelValue(level)}
                        >
                          {level}
                        </Button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* MIB Details Panel */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-card-foreground">MIB Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Service Status:</span>
                    <span className="font-mono text-card-foreground">1.3.6.1.4.1.9999.1.2.0</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">CPU Usage:</span>
                    <span className="font-mono text-card-foreground">1.3.6.1.4.1.9999.1.3.0</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Memory Usage:</span>
                    <span className="font-mono text-card-foreground">1.3.6.1.4.1.9999.1.4.0</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Latency:</span>
                    <span className="font-mono text-card-foreground">1.3.6.1.4.1.9999.1.5.0</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Errors:</span>
                    <span className="font-mono text-card-foreground">1.3.6.1.4.1.9999.1.6.0</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Log Level:</span>
                    <span className="font-mono text-card-foreground">1.3.6.1.4.1.9999.1.7.0</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
