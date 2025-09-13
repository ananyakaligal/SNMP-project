"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts"

interface ChartDataPoint {
  time: string
  timestamp: number
  cpuUsage: number
  memoryUsage: number
  networkIn: number
  networkOut: number
  latency: number
}

interface PerformanceChartsProps {
  agentIp: string | null
}

export function PerformanceCharts({ agentIp }: PerformanceChartsProps) {
  const [chartData, setChartData] = useState<ChartDataPoint[]>([])
  const [historicalData, setHistoricalData] = useState<ChartDataPoint[]>([])
  const [loading, setLoading] = useState(false)

  const fetchChartData = async (ip: string) => {
    try {
      const [cpuResponse, memoryResponse, networkInResponse, networkOutResponse, latencyResponse] = await Promise.all([
        fetch(`/api/v1/snmp/get?agentIp=${ip}&oid=1.3.6.1.4.1.9999.1.3.0`),
        fetch(`/api/v1/snmp/get?agentIp=${ip}&oid=1.3.6.1.4.1.9999.1.4.0`),
        fetch(`/api/v1/snmp/get?agentIp=${ip}&oid=1.3.6.1.4.1.9999.1.10.0`),
        fetch(`/api/v1/snmp/get?agentIp=${ip}&oid=1.3.6.1.4.1.9999.1.11.0`),
        fetch(`/api/v1/snmp/get?agentIp=${ip}&oid=1.3.6.1.4.1.9999.1.5.0`),
      ])

      const [cpu, memory, networkIn, networkOut, latency] = await Promise.all([
        cpuResponse.json(),
        memoryResponse.json(),
        networkInResponse.json(),
        networkOutResponse.json(),
        latencyResponse.json(),
      ])

      const now = new Date()
      const newDataPoint: ChartDataPoint = {
        time: now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        timestamp: now.getTime(),
        cpuUsage: cpu.value || Math.floor(Math.random() * 80) + 10,
        memoryUsage: memory.value || Math.floor(Math.random() * 4000) + 1000,
        networkIn: networkIn.value || Math.floor(Math.random() * 1000) + 100,
        networkOut: networkOut.value || Math.floor(Math.random() * 800) + 50,
        latency: latency.value || Math.floor(Math.random() * 30) + 5,
      }

      setChartData((prevData) => {
        const newData = [...prevData.slice(-59), newDataPoint] // Keep last 60 points (30 minutes)
        return newData
      })
    } catch (error) {
      console.error("Failed to fetch chart data:", error)
    }
  }

  const fetchHistoricalData = async (ip: string) => {
    setLoading(true)
    try {
      const historicalPoints: ChartDataPoint[] = []
      const now = new Date()

      for (let i = 24 * 60; i >= 0; i -= 30) {
        // Every 30 minutes for 24 hours
        const timestamp = new Date(now.getTime() - i * 60 * 1000)
        historicalPoints.push({
          time: timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          timestamp: timestamp.getTime(),
          cpuUsage: Math.floor(Math.random() * 80) + 10,
          memoryUsage: Math.floor(Math.random() * 4000) + 1000,
          networkIn: Math.floor(Math.random() * 1000) + 100,
          networkOut: Math.floor(Math.random() * 800) + 50,
          latency: Math.floor(Math.random() * 30) + 5,
        })
      }

      setHistoricalData(historicalPoints)
    } catch (error) {
      console.error("Failed to fetch historical data:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!agentIp) return

    fetchChartData(agentIp)
    fetchHistoricalData(agentIp)

    const interval = setInterval(() => {
      fetchChartData(agentIp)
    }, 30000)

    return () => clearInterval(interval)
  }, [agentIp])

  if (!agentIp) {
    return (
      <Card className="bg-card border-border shadow-sm hover:shadow-md transition-shadow duration-200">
        <CardHeader>
          <CardTitle className="text-card-foreground">Performance Charts</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Select a service to view performance metrics</p>
        </CardContent>
      </Card>
    )
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="text-sm font-medium text-gray-900">{`Time: ${label}`}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {`${entry.name}: ${entry.value}${
                entry.dataKey.includes("Usage")
                  ? "%"
                  : entry.dataKey.includes("memory")
                    ? " MB"
                    : entry.dataKey.includes("network")
                      ? " KB/s"
                      : " ms"
              }`}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <Card className="bg-card border-border shadow-sm hover:shadow-md transition-shadow duration-200">
      <CardHeader>
        <CardTitle className="text-card-foreground">Performance Charts</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="realtime" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="realtime">Real-time (30 min)</TabsTrigger>
            <TabsTrigger value="historical">Historical (24 hours)</TabsTrigger>
          </TabsList>

          <TabsContent value="realtime" className="space-y-8 mt-6">
            {/* CPU Usage Chart */}
            <div>
              <h3 className="text-sm font-medium text-card-foreground mb-4 flex items-center gap-2">
                CPU Usage (%)
                <span className="text-xs text-muted-foreground">• Live updates every 30s</span>
              </h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="cpuGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="time" stroke="#6b7280" fontSize={12} />
                    <YAxis stroke="#6b7280" fontSize={12} domain={[0, 100]} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="cpuUsage"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      fill="url(#cpuGradient)"
                      name="CPU Usage"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Memory Usage Chart */}
            <div>
              <h3 className="text-sm font-medium text-card-foreground mb-4">Memory Usage (MB)</h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="memoryGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="time" stroke="#6b7280" fontSize={12} />
                    <YAxis stroke="#6b7280" fontSize={12} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="memoryUsage"
                      stroke="#10b981"
                      strokeWidth={2}
                      fill="url(#memoryGradient)"
                      name="Memory Usage"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Network I/O Chart */}
            <div>
              <h3 className="text-sm font-medium text-card-foreground mb-4">Network I/O (KB/s)</h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="time" stroke="#6b7280" fontSize={12} />
                    <YAxis stroke="#6b7280" fontSize={12} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line
                      type="monotone"
                      dataKey="networkIn"
                      stroke="#8b5cf6"
                      strokeWidth={2}
                      dot={false}
                      name="Network In"
                    />
                    <Line
                      type="monotone"
                      dataKey="networkOut"
                      stroke="#f59e0b"
                      strokeWidth={2}
                      dot={false}
                      name="Network Out"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Latency Chart */}
            <div>
              <h3 className="text-sm font-medium text-card-foreground mb-4">Average Latency (ms)</h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="time" stroke="#6b7280" fontSize={12} />
                    <YAxis stroke="#6b7280" fontSize={12} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line
                      type="monotone"
                      dataKey="latency"
                      stroke="#ef4444"
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4, fill: "#ef4444" }}
                      name="Latency"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="historical" className="space-y-8 mt-6">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <>
                {/* Historical CPU and Memory Combined */}
                <div>
                  <h3 className="text-sm font-medium text-card-foreground mb-4">CPU & Memory Trends (24h)</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={historicalData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="time" stroke="#6b7280" fontSize={12} interval="preserveStartEnd" />
                        <YAxis yAxisId="cpu" stroke="#6b7280" fontSize={12} domain={[0, 100]} />
                        <YAxis yAxisId="memory" orientation="right" stroke="#6b7280" fontSize={12} />
                        <Tooltip content={<CustomTooltip />} />
                        <Line
                          yAxisId="cpu"
                          type="monotone"
                          dataKey="cpuUsage"
                          stroke="#3b82f6"
                          strokeWidth={2}
                          dot={false}
                          name="CPU Usage"
                        />
                        <Line
                          yAxisId="memory"
                          type="monotone"
                          dataKey="memoryUsage"
                          stroke="#10b981"
                          strokeWidth={2}
                          dot={false}
                          name="Memory Usage"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Historical Network I/O */}
                <div>
                  <h3 className="text-sm font-medium text-card-foreground mb-4">Network I/O Trends (24h)</h3>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={historicalData}>
                        <defs>
                          <linearGradient id="networkInGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="networkOutGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="time" stroke="#6b7280" fontSize={12} interval="preserveStartEnd" />
                        <YAxis stroke="#6b7280" fontSize={12} />
                        <Tooltip content={<CustomTooltip />} />
                        <Area
                          type="monotone"
                          dataKey="networkIn"
                          stackId="1"
                          stroke="#8b5cf6"
                          fill="url(#networkInGradient)"
                          name="Network In"
                        />
                        <Area
                          type="monotone"
                          dataKey="networkOut"
                          stackId="2"
                          stroke="#f59e0b"
                          fill="url(#networkOutGradient)"
                          name="Network Out"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
