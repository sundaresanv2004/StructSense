"use client"

import React, { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Activity, Database, Server, RefreshCw, CheckCircle2, XCircle, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface HealthStatus {
    status: string
    database: string
    error?: string
}

export default function HealthPage() {
    const [health, setHealth] = useState<HealthStatus | null>(null)
    const [loading, setLoading] = useState(true)
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

    const checkHealth = async () => {
        setLoading(true)
        try {
            const response = await fetch("http://localhost:8000/api/v1/health")
            if (response.ok) {
                const data = await response.json()
                setHealth(data)
            } else {
                setHealth({ status: "unhealthy", database: "unknown", error: `HTTP ${response.status}` })
            }
        } catch (error) {
            setHealth({ status: "offline", database: "unknown", error: "Failed to connect to backend" })
        } finally {
            setLoading(false)
            setLastUpdated(new Date())
        }
    }

    useEffect(() => {
        checkHealth()
        const interval = setInterval(checkHealth, 30000) // Poll every 30s
        return () => clearInterval(interval)
    }, [])

    const getStatusInfo = (status: string) => {
        switch (status) {
            case "healthy":
            case "online":
            case "connected":
                return { color: "text-green-500", bg: "bg-green-500/10", icon: CheckCircle2, label: "Operational" }
            case "unhealthy":
            case "disconnected":
            case "offline":
                return { color: "text-red-500", bg: "bg-red-500/10", icon: XCircle, label: "Offline" }
            default:
                return { color: "text-yellow-500", bg: "bg-yellow-500/10", icon: AlertCircle, label: "Unknown" }
        }
    }

    const backendStatus = getStatusInfo(health?.status === "healthy" ? "healthy" : (health?.status || "unknown"))
    const dbStatus = getStatusInfo(health?.database || "unknown")

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-background to-muted/50 p-6">
            <Card className="w-full max-w-lg shadow-xl border-border/60 pt-0 backdrop-blur-sm bg-card/95">
                <CardHeader className="text-center pb-8 border-b pt-4 border-border/40 bg-muted/20">
                    <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit mb-4 ring-1 ring-primary/20 shadow-sm">
                        <Activity className="h-8 w-8 text-primary" />
                    </div>
                    <CardTitle className="text-3xl font-bold tracking-tight">System Status</CardTitle>
                    <CardDescription className="text-base mt-2">
                        Real-time operational metrics
                    </CardDescription>
                </CardHeader>

                <CardContent className="grid gap-6 pt-8">
                    {/* Backend Status */}
                    <div className="flex items-center justify-between p-4 border rounded-xl bg-card hover:bg-accent/5 transition-colors shadow-sm">
                        <div className="flex items-center space-x-4">
                            <div className={cn("p-2.5 rounded-lg", backendStatus.bg)}>
                                <Server className={cn("h-6 w-6", backendStatus.color)} />
                            </div>
                            <div>
                                <p className="font-semibold text-base">Backend API</p>
                                <p className="text-sm text-muted-foreground">Core Application Service</p>
                            </div>
                        </div>
                        {loading && !health ? (
                            <Badge variant="outline" className="animate-pulse h-8 px-3">Checking...</Badge>
                        ) : (
                            <div className="flex items-center gap-2">
                                <span className={cn("relative flex h-2.5 w-2.5")}>
                                    <span className={cn("animate-ping absolute inline-flex h-full w-full rounded-full opacity-75", backendStatus.color.replace('text-', 'bg-'))}></span>
                                    <span className={cn("relative inline-flex rounded-full h-2.5 w-2.5", backendStatus.color.replace('text-', 'bg-'))}></span>
                                </span>
                                <Badge variant="outline" className={cn("font-medium border-0 bg-transparent text-sm", backendStatus.color)}>
                                    {backendStatus.label}
                                </Badge>
                            </div>
                        )}
                    </div>

                    {/* Database Status */}
                    <div className="flex items-center justify-between p-4 border rounded-xl bg-card hover:bg-accent/5 transition-colors shadow-sm">
                        <div className="flex items-center space-x-4">
                            <div className={cn("p-2.5 rounded-lg", dbStatus.bg)}>
                                <Database className={cn("h-6 w-6", dbStatus.color)} />
                            </div>
                            <div>
                                <p className="font-semibold text-base">Database</p>
                                <p className="text-sm text-muted-foreground">TimescaleDB Cluster</p>
                            </div>
                        </div>
                        {loading && !health ? (
                            <Badge variant="outline" className="animate-pulse h-8 px-3">Checking...</Badge>
                        ) : (
                            <div className="flex items-center gap-2">
                                <span className={cn("relative flex h-2.5 w-2.5")}>
                                    <span className={cn("animate-ping absolute inline-flex h-full w-full rounded-full opacity-75", dbStatus.color.replace('text-', 'bg-'))}></span>
                                    <span className={cn("relative inline-flex rounded-full h-2.5 w-2.5", dbStatus.color.replace('text-', 'bg-'))}></span>
                                </span>
                                <Badge variant="outline" className={cn("font-medium border-0 bg-transparent text-sm", dbStatus.color)}>
                                    {dbStatus.label}
                                </Badge>
                            </div>
                        )}
                    </div>

                    {/* Error Message */}
                    {health?.error && (
                        <div className="flex items-center gap-3 bg-destructive/10 text-destructive p-4 rounded-xl text-sm border border-destructive/20 font-medium">
                            <AlertCircle className="h-5 w-5 shrink-0" />
                            {health.error}
                        </div>
                    )}
                </CardContent>

                <CardFooter className="flex justify-between items-center border-t border-border/40 bg-muted/20 py-4 px-6 mt-2">
                    <span className="text-xs text-muted-foreground font-medium">
                        Last Check: {lastUpdated ? lastUpdated.toLocaleTimeString() : "Never"}
                    </span>
                    <Button variant="outline" size="sm" onClick={checkHealth} disabled={loading} className="gap-2 h-9">
                        <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
                        Refresh Status
                    </Button>
                </CardFooter>
            </Card>
        </div>
    )
}
