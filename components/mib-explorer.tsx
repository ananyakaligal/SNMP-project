"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { ChevronRight, ChevronDown, Search, Folder, FileText, RefreshCw } from "lucide-react"

interface MIBNode {
  oid: string
  name: string
  description: string
  type: "branch" | "leaf"
  value?: string | number
  children?: MIBNode[]
  expanded?: boolean
}

interface MIBExplorerProps {
  agentIp: string | null
}

export function MIBExplorer({ agentIp }: MIBExplorerProps) {
  const [mibTree, setMibTree] = useState<MIBNode[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(false)
  const [selectedNode, setSelectedNode] = useState<MIBNode | null>(null)

  // Mock MIB tree structure
  const mockMibTree: MIBNode[] = [
    {
      oid: "1.3.6.1.4.1.9999",
      name: "enterprise",
      description: "Enterprise MIB root",
      type: "branch",
      expanded: true,
      children: [
        {
          oid: "1.3.6.1.4.1.9999.1",
          name: "system",
          description: "System information and metrics",
          type: "branch",
          expanded: true,
          children: [
            {
              oid: "1.3.6.1.4.1.9999.1.1.0",
              name: "sysName",
              description: "System name identifier",
              type: "leaf",
              value: "SNMP-Agent-01",
            },
            {
              oid: "1.3.6.1.4.1.9999.1.2.0",
              name: "sysStatus",
              description: "Current system status",
              type: "leaf",
              value: "UP",
            },
            {
              oid: "1.3.6.1.4.1.9999.1.3.0",
              name: "cpuUsage",
              description: "Current CPU utilization percentage",
              type: "leaf",
              value: 45,
            },
            {
              oid: "1.3.6.1.4.1.9999.1.4.0",
              name: "memoryUsage",
              description: "Current memory usage in MB",
              type: "leaf",
              value: 2048,
            },
            {
              oid: "1.3.6.1.4.1.9999.1.5.0",
              name: "avgLatency",
              description: "Average response latency in milliseconds",
              type: "leaf",
              value: 12,
            },
            {
              oid: "1.3.6.1.4.1.9999.1.6.0",
              name: "totalErrors",
              description: "Total error count since startup",
              type: "leaf",
              value: 3,
            },
            {
              oid: "1.3.6.1.4.1.9999.1.7.0",
              name: "logLevel",
              description: "Current logging level",
              type: "leaf",
              value: "INFO",
            },
            {
              oid: "1.3.6.1.4.1.9999.1.8.0",
              name: "uptime",
              description: "System uptime",
              type: "leaf",
              value: "5d 12h 30m",
            },
            {
              oid: "1.3.6.1.4.1.9999.1.9.0",
              name: "requestsProcessed",
              description: "Total requests processed",
              type: "leaf",
              value: 15420,
            },
            {
              oid: "1.3.6.1.4.1.9999.1.10.0",
              name: "networkInBytes",
              description: "Network input bytes per second",
              type: "leaf",
              value: 1024,
            },
            {
              oid: "1.3.6.1.4.1.9999.1.11.0",
              name: "networkOutBytes",
              description: "Network output bytes per second",
              type: "leaf",
              value: 768,
            },
          ],
        },
        {
          oid: "1.3.6.1.4.1.9999.2",
          name: "interfaces",
          description: "Network interface information",
          type: "branch",
          children: [
            {
              oid: "1.3.6.1.4.1.9999.2.1.0",
              name: "ifNumber",
              description: "Number of network interfaces",
              type: "leaf",
              value: 2,
            },
            {
              oid: "1.3.6.1.4.1.9999.2.2",
              name: "ifTable",
              description: "Interface table",
              type: "branch",
              children: [
                {
                  oid: "1.3.6.1.4.1.9999.2.2.1.1.1",
                  name: "ifIndex.1",
                  description: "Interface index for eth0",
                  type: "leaf",
                  value: 1,
                },
                {
                  oid: "1.3.6.1.4.1.9999.2.2.1.2.1",
                  name: "ifDescr.1",
                  description: "Interface description for eth0",
                  type: "leaf",
                  value: "Ethernet Interface",
                },
              ],
            },
          ],
        },
        {
          oid: "1.3.6.1.4.1.9999.3",
          name: "services",
          description: "Service monitoring and control",
          type: "branch",
          children: [
            {
              oid: "1.3.6.1.4.1.9999.3.1.0",
              name: "serviceCount",
              description: "Number of monitored services",
              type: "leaf",
              value: 5,
            },
            {
              oid: "1.3.6.1.4.1.9999.3.2.0",
              name: "activeServices",
              description: "Number of active services",
              type: "leaf",
              value: 4,
            },
          ],
        },
      ],
    },
  ]

  useEffect(() => {
    if (agentIp) {
      setMibTree(mockMibTree)
    }
  }, [agentIp])

  const fetchOidValue = async (oid: string) => {
    if (!agentIp) return

    setLoading(true)
    try {
      const response = await fetch(`/api/v1/snmp/get?agentIp=${agentIp}&oid=${oid}`)
      const data = await response.json()

      // Update the node value in the tree
      const updateNodeValue = (nodes: MIBNode[]): MIBNode[] => {
        return nodes.map((node) => {
          if (node.oid === oid) {
            return { ...node, value: data.value }
          }
          if (node.children) {
            return { ...node, children: updateNodeValue(node.children) }
          }
          return node
        })
      }

      setMibTree((prev) => updateNodeValue(prev))

      // Update selected node if it matches
      if (selectedNode?.oid === oid) {
        setSelectedNode({ ...selectedNode, value: data.value })
      }
    } catch (error) {
      console.error("Failed to fetch OID value:", error)
    } finally {
      setLoading(false)
    }
  }

  const toggleNode = (oid: string) => {
    const updateNodeExpansion = (nodes: MIBNode[]): MIBNode[] => {
      return nodes.map((node) => {
        if (node.oid === oid) {
          return { ...node, expanded: !node.expanded }
        }
        if (node.children) {
          return { ...node, children: updateNodeExpansion(node.children) }
        }
        return node
      })
    }

    setMibTree((prev) => updateNodeExpansion(prev))
  }

  const filterNodes = (nodes: MIBNode[], term: string): MIBNode[] => {
    if (!term) return nodes

    return nodes
      .filter((node) => {
        const matchesSearch =
          node.name.toLowerCase().includes(term.toLowerCase()) ||
          node.description.toLowerCase().includes(term.toLowerCase()) ||
          node.oid.includes(term)

        const hasMatchingChildren = node.children && filterNodes(node.children, term).length > 0

        return matchesSearch || hasMatchingChildren
      })
      .map((node) => ({
        ...node,
        children: node.children ? filterNodes(node.children, term) : undefined,
      }))
  }

  const renderMIBNode = (node: MIBNode, level = 0) => {
    const hasChildren = node.children && node.children.length > 0
    const isExpanded = node.expanded

    return (
      <div key={node.oid} className="w-full">
        <div
          className={`flex items-center gap-2 p-2 rounded-md cursor-pointer transition-colors hover:bg-gray-50 ${
            selectedNode?.oid === node.oid ? "bg-blue-50 border border-blue-200" : ""
          }`}
          style={{ paddingLeft: `${level * 20 + 8}px` }}
          onClick={() => setSelectedNode(node)}
        >
          {hasChildren ? (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={(e) => {
                e.stopPropagation()
                toggleNode(node.oid)
              }}
            >
              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </Button>
          ) : (
            <div className="w-6" />
          )}

          {node.type === "branch" ? (
            <Folder className="h-4 w-4 text-blue-600" />
          ) : (
            <FileText className="h-4 w-4 text-green-600" />
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-900 truncate">{node.name}</span>
              <Badge variant="outline" className="text-xs">
                {node.type}
              </Badge>
              {node.type === "leaf" && node.value !== undefined && (
                <Badge variant="secondary" className="text-xs">
                  {node.value}
                </Badge>
              )}
            </div>
            <p className="text-xs text-gray-500 truncate">{node.oid}</p>
          </div>

          {node.type === "leaf" && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={(e) => {
                e.stopPropagation()
                fetchOidValue(node.oid)
              }}
              disabled={loading}
            >
              <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
            </Button>
          )}
        </div>

        {hasChildren && isExpanded && (
          <div className="ml-2">{node.children!.map((child) => renderMIBNode(child, level + 1))}</div>
        )}
      </div>
    )
  }

  const filteredTree = filterNodes(mibTree, searchTerm)

  if (!agentIp) {
    return (
      <Card className="bg-card border-border shadow-sm hover:shadow-md transition-shadow duration-200">
        <CardHeader>
          <CardTitle className="text-card-foreground">MIB Explorer</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Select a service to explore MIB structure</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* MIB Tree */}
      <Card className="lg:col-span-2 bg-card border-border shadow-sm hover:shadow-md transition-shadow duration-200">
        <CardHeader>
          <CardTitle className="text-card-foreground flex items-center gap-2">
            <Folder className="h-5 w-5" />
            MIB Explorer
          </CardTitle>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search MIB nodes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="max-h-96 overflow-y-auto space-y-1">
            {filteredTree.length > 0 ? (
              filteredTree.map((node) => renderMIBNode(node))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">No MIB nodes found matching your search.</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Node Details */}
      <Card className="bg-card border-border shadow-sm hover:shadow-md transition-shadow duration-200">
        <CardHeader>
          <CardTitle className="text-card-foreground flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Node Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          {selectedNode ? (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Name</label>
                <p className="text-sm text-gray-900 mt-1">{selectedNode.name}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">OID</label>
                <p className="text-sm font-mono text-gray-900 mt-1 bg-gray-50 p-2 rounded">{selectedNode.oid}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Type</label>
                <div className="mt-1">
                  <Badge variant={selectedNode.type === "branch" ? "default" : "secondary"}>{selectedNode.type}</Badge>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Description</label>
                <p className="text-sm text-gray-600 mt-1">{selectedNode.description}</p>
              </div>

              {selectedNode.type === "leaf" && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Current Value</label>
                  <div className="mt-1 flex items-center gap-2">
                    <p className="text-sm font-mono text-gray-900 bg-gray-50 p-2 rounded flex-1">
                      {selectedNode.value !== undefined ? selectedNode.value : "Not fetched"}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fetchOidValue(selectedNode.oid)}
                      disabled={loading}
                    >
                      <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">Select a MIB node to view details</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
