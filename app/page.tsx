"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  Cpu,
  MemoryStick,
  Zap,
  Bug,
  RefreshCw,
  Play,
  Square,
  RotateCcw,
  AlertTriangle,
  Clock,
  Activity,
  TrendingUp,
} from "lucide-react"
import { PerformanceCharts } from "@/components/performance-charts"
import { MIBExplorer } from "@/components/mib-explorer"

interface Agent {
  name: string
  ip: string
  status: "UP" | "DOWN"
  uptime?: string
}

interface MetricData {
  cpuUsage: number
  memoryUsage: number
  latency: number
  totalErrors: number
  uptime: string
  requestsProcessed: number
  errorRate: number
}

interface LiveAlert {
  id: string
  message: string
  severity: "high" | "medium" | "low"
  timestamp: Date
}

export default function SNMPDashboard() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)
  const [metrics, setMetrics] = useState<MetricData>({
    cpuUsage: 0,
    memoryUsage: 0,
    latency: 0,
    totalErrors: 0,
    uptime: "0d 0h 0m",
    requestsProcessed: 0,
    errorRate: 0,
  })
  const [logLevel, setLogLevel] = useState("INFO")
  const [loading, setLoading] = useState(true)
  const [alert, setAlert] = useState<string | null>(null)
  const [liveAlerts, setLiveAlerts] = useState<LiveAlert[]>([])

  useEffect(() => {
    fetchAgents()
    fetchServices()

    // Set up live alerts polling
    const alertInterval = setInterval(fetchLiveAlerts, 10000) // Check for alerts every 10s

    return () => clearInterval(alertInterval)
  }, [])

  useEffect(() => {
    if (selectedAgent) {
      fetchMetrics(selectedAgent.ip)
      fetchLogLevel(selectedAgent.ip)

      // Set up real-time updates every 30 seconds
      const interval = setInterval(() => {
        fetchMetrics(selectedAgent.ip)
        fetchLogLevel(selectedAgent.ip)
      }, 30000)

      return () => clearInterval(interval)
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

  const fetchServices = async () => {
    try {
      const response = await fetch("/api/services")
      const data = await response.json()
      // Update agents with service data if available
      if (data && data.length > 0) {
        setAgents((prev) =>
          prev.map((agent) => ({
            ...agent,
            uptime: data.find((s: any) => s.ip === agent.ip)?.uptime || agent.uptime,
          })),
        )
      }
    } catch (error) {
      console.error("Failed to fetch services:", error)
    }
  }

  const fetchLiveAlerts = async () => {
    try {
      const response = await fetch("/api/v1/snmp/traps")
      const data = await response.json()
      if (data && data.length > 0) {
        setLiveAlerts(data.slice(0, 3)) // Show only latest 3 alerts
      }
    } catch (error) {
      console.error("Failed to fetch live alerts:", error)
    }
  }

  const fetchMetrics = async (agentIp: string) => {
    try {
      const [cpuResponse, memoryResponse, latencyResponse, errorsResponse, uptimeResponse, requestsResponse] =
        await Promise.all([
          fetch(`/api/v1/snmp/get?agentIp=${agentIp}&oid=1.3.6.1.4.1.9999.1.3.0`),
          fetch(`/api/v1/snmp/get?agentIp=${agentIp}&oid=1.3.6.1.4.1.9999.1.4.0`),
          fetch(`/api/v1/snmp/get?agentIp=${agentIp}&oid=1.3.6.1.4.1.9999.1.5.0`),
          fetch(`/api/v1/snmp/get?agentIp=${agentIp}&oid=1.3.6.1.4.1.9999.1.6.0`),
          fetch(`/api/v1/snmp/get?agentIp=${agentIp}&oid=1.3.6.1.4.1.9999.1.8.0`),
          fetch(`/api/v1/snmp/get?agentIp=${agentIp}&oid=1.3.6.1.4.1.9999.1.9.0`),
        ])

      const [cpu, memory, latency, errors, uptime, requests] = await Promise.all([
        cpuResponse.json(),
        memoryResponse.json(),
        latencyResponse.json(),
        errorsResponse.json(),
        uptimeResponse.json(),
        requestsResponse.json(),
      ])

      const totalRequests = requests.value || 0
      const errorRate = totalRequests > 0 ? ((errors.value || 0) / totalRequests) * 100 : 0

      setMetrics({
        cpuUsage: cpu.value || 0,
        memoryUsage: memory.value || 0,
        latency: latency.value || 0,
        totalErrors: errors.value || 0,
        uptime: uptime.value || "0d 0h 0m",
        requestsProcessed: totalRequests,
        errorRate: Math.round(errorRate * 100) / 100,
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

  const controlService = async (action: "start" | "stop" | "restart") => {
    if (!selectedAgent) return

    try {
      const response = await fetch("/api/v1/snmp/control", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentIp: selectedAgent.ip,
          action,
        }),
      })

      const data = await response.json()
      if (data.status === "success") {
        setAlert(`Service ${action} successful`)
        setTimeout(() => setAlert(null), 3000)
        // Refresh agent status
        fetchAgents()
      }
    } catch (error) {
      console.error(`Failed to ${action} service:`, error)
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
    <TooltipProvider>
      <div className="min-h-screen bg-background transition-all duration-300">
        {/* Header */}
        <header className="border-b border-border bg-card shadow-sm sticky top-0 z-50">
          <div className="container mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">Network Monitoring System</h1>
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 sm:h-10 sm:w-10 bg-primary rounded-full flex items-center justify-center">
                <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-primary-foreground" />
              </div>
            </div>
          </div>
        </header>

        {/* Live Alerts Banner */}
        {liveAlerts.length > 0 && (
          <div className="mx-4 sm:mx-6 mt-4">
            {liveAlerts.map((alert) => (
              <Alert key={alert.id} className="mb-2 border-red-200 bg-red-50 animate-pulse">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800 flex items-center justify-between">
                  <span>{alert.message}</span>
                  <span className="text-xs text-red-600">{new Date(alert.timestamp).toLocaleTimeString()}</span>
                </AlertDescription>
              </Alert>
            ))}
          </div>
        )}

        {/* Success Alert */}
        {alert && (
          <Alert className="mx-4 sm:mx-6 mt-4 border-green-200 bg-green-50">
            <AlertDescription className="text-green-800">{alert}</AlertDescription>
          </Alert>
        )}

        <div className="container mx-auto px-4 sm:px-6 py-6">
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
            {/* Left Sidebar - Services */}
            <div className="xl:col-span-1">
              <Card className="bg-card border-border shadow-sm hover:shadow-md transition-shadow duration-200">
                <CardHeader>
                  <CardTitle className="text-card-foreground flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Services
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {agents.map((agent) => (
                    <div
                      key={agent.ip}
                      className={`p-3 rounded-lg border cursor-pointer transition-all duration-200 hover:scale-[1.02] ${
                        selectedAgent?.ip === agent.ip
                          ? "border-primary bg-primary/10 shadow-sm"
                          : "border-border hover:border-primary/50 hover:bg-gray-50"
                      }`}
                      onClick={() => setSelectedAgent(agent)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-card-foreground">{agent.name}</span>
                        <Badge variant={agent.status === "UP" ? "default" : "destructive"} className="animate-pulse">
                          {agent.status}
                        </Badge>
                      </div>
                      {agent.uptime && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {agent.uptime}
                        </div>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Right Content Area */}
            <div className="xl:col-span-3 space-y-6">
              {/* Enhanced Stats Cards with Tooltips */}
              <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-sm hover:shadow-md transition-all duration-200 hover:scale-[1.02] col-span-1">
                      <CardContent className="p-4 sm:p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs sm:text-sm text-blue-700">CPU Usage</p>
                            <p className="text-lg sm:text-2xl font-bold text-blue-900">{metrics.cpuUsage}%</p>
                          </div>
                          <Cpu className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
                        </div>
                      </CardContent>
                    </Card>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Current CPU utilization percentage</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 shadow-sm hover:shadow-md transition-all duration-200 hover:scale-[1.02] col-span-1">
                      <CardContent className="p-4 sm:p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs sm:text-sm text-green-700">Memory</p>
                            <p className="text-lg sm:text-2xl font-bold text-green-900">{metrics.memoryUsage} MB</p>
                          </div>
                          <MemoryStick className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
                        </div>
                      </CardContent>
                    </Card>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Current memory usage in megabytes</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200 shadow-sm hover:shadow-md transition-all duration-200 hover:scale-[1.02] col-span-1">
                      <CardContent className="p-4 sm:p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs sm:text-sm text-yellow-700">Latency</p>
                            <p className="text-lg sm:text-2xl font-bold text-yellow-900">{metrics.latency} ms</p>
                          </div>
                          <Zap className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-600" />
                        </div>
                      </CardContent>
                    </Card>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Average response latency in milliseconds</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200 shadow-sm hover:shadow-md transition-all duration-200 hover:scale-[1.02] col-span-1">
                      <CardContent className="p-4 sm:p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs sm:text-sm text-red-700">Errors</p>
                            <p className="text-lg sm:text-2xl font-bold text-red-900">{metrics.totalErrors}</p>
                          </div>
                          <Bug className="h-6 w-6 sm:h-8 sm:w-8 text-red-600" />
                        </div>
                      </CardContent>
                    </Card>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Total error count</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 shadow-sm hover:shadow-md transition-all duration-200 hover:scale-[1.02] col-span-1">
                      <CardContent className="p-4 sm:p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs sm:text-sm text-purple-700">Uptime</p>
                            <p className="text-sm sm:text-lg font-bold text-purple-900">{metrics.uptime}</p>
                          </div>
                          <Clock className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600" />
                        </div>
                      </CardContent>
                    </Card>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>System uptime duration</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200 shadow-sm hover:shadow-md transition-all duration-200 hover:scale-[1.02] col-span-1">
                      <CardContent className="p-4 sm:p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs sm:text-sm text-indigo-700">Requests</p>
                            <p className="text-lg sm:text-2xl font-bold text-indigo-900">
                              {metrics.requestsProcessed.toLocaleString()}
                            </p>
                          </div>
                          <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-indigo-600" />
                        </div>
                      </CardContent>
                    </Card>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Total requests processed</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 shadow-sm hover:shadow-md transition-all duration-200 hover:scale-[1.02] col-span-1">
                      <CardContent className="p-4 sm:p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs sm:text-sm text-orange-700">Error Rate</p>
                            <p className="text-lg sm:text-2xl font-bold text-orange-900">{metrics.errorRate}%</p>
                          </div>
                          <AlertTriangle className="h-6 w-6 sm:h-8 sm:w-8 text-orange-600" />
                        </div>
                      </CardContent>
                    </Card>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Current error rate percentage</p>
                  </TooltipContent>
                </Tooltip>
              </div>

              {/* Performance Charts Component */}
              <PerformanceCharts agentIp={selectedAgent?.ip || null} />

              {/* Enhanced Service Control Panel */}
              {selectedAgent && (
                <Card className="bg-card border-border shadow-sm hover:shadow-md transition-shadow duration-200">
                  <CardHeader>
                    <CardTitle className="text-card-foreground flex items-center gap-2">
                      <Activity className="h-5 w-5" />
                      Service Control - {selectedAgent.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <p className="text-sm text-muted-foreground mb-3">Service Actions</p>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => controlService("start")}
                          className="hover:bg-green-50 hover:border-green-300 transition-colors"
                        >
                          <Play className="h-4 w-4 mr-1" />
                          Start
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => controlService("stop")}
                          className="hover:bg-red-50 hover:border-red-300 transition-colors"
                        >
                          <Square className="h-4 w-4 mr-1" />
                          Stop
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => controlService("restart")}
                          className="hover:bg-blue-50 hover:border-blue-300 transition-colors"
                        >
                          <RotateCcw className="h-4 w-4 mr-1" />
                          Restart
                        </Button>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground mb-2">
                        Current Log Level:
                        <Badge variant="outline" className="ml-2">
                          {logLevel}
                        </Badge>
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {["INFO", "DEBUG", "ERROR"].map((level) => (
                          <Button
                            key={level}
                            variant={logLevel === level ? "default" : "outline"}
                            size="sm"
                            onClick={() => setLogLevelValue(level)}
                            className="transition-all duration-200"
                          >
                            {level}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* MIB Explorer Component */}
              <MIBExplorer agentIp={selectedAgent?.ip || null} />
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}
