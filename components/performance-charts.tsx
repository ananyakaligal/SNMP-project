"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

interface ChartDataPoint {
  time: string
  cpuUsage: number
  latency: number
}

interface PerformanceChartsProps {
  agentIp: string | null
}

export function PerformanceCharts({ agentIp }: PerformanceChartsProps) {
  const [chartData, setChartData] = useState<ChartDataPoint[]>([])

  useEffect(() => {
    if (!agentIp) return

    // Generate initial mock data
    const generateMockData = () => {
      const data: ChartDataPoint[] = []
      const now = new Date()

      for (let i = 29; i >= 0; i--) {
        const time = new Date(now.getTime() - i * 60000) // 1 minute intervals
        data.push({
          time: time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          cpuUsage: Math.random() * 30 + 30, // 30-60% range
          latency: Math.random() * 20 + 5, // 5-25ms range
        })
      }
      return data
    }

    setChartData(generateMockData())

    // Update data every 30 seconds
    const interval = setInterval(() => {
      setChartData((prevData) => {
        const newData = [...prevData.slice(1)] // Remove first element
        const now = new Date()
        newData.push({
          time: now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          cpuUsage: Math.random() * 30 + 30,
          latency: Math.random() * 20 + 5,
        })
        return newData
      })
    }, 30000)

    return () => clearInterval(interval)
  }, [agentIp])

  if (!agentIp) {
    return (
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-card-foreground">Performance Charts</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Select a service to view performance metrics</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-card-foreground">Performance Charts</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-8">
          {/* CPU Usage Chart */}
          <div>
            <h3 className="text-sm font-medium text-card-foreground mb-4">CPU Usage (%)</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#3a3a3a" />
                  <XAxis dataKey="time" stroke="#b0b0b0" fontSize={12} />
                  <YAxis stroke="#b0b0b0" fontSize={12} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1a1a1a",
                      border: "1px solid #3a3a3a",
                      borderRadius: "8px",
                      color: "#ffffff",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="cpuUsage"
                    stroke="#ff6f61"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, fill: "#ff6f61" }}
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
                  <CartesianGrid strokeDasharray="3 3" stroke="#3a3a3a" />
                  <XAxis dataKey="time" stroke="#b0b0b0" fontSize={12} />
                  <YAxis stroke="#b0b0b0" fontSize={12} domain={[0, 50]} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1a1a1a",
                      border: "1px solid #3a3a3a",
                      borderRadius: "8px",
                      color: "#ffffff",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="latency"
                    stroke="#2196f3"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, fill: "#2196f3" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
