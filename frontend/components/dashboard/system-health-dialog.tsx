"use client"

import React, { useEffect, useState } from "react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Activity, Database, Server, RefreshCw, CheckCircle2, XCircle, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface HealthStatus {
    status: string
    database: string
    error?: string
}

interface SystemHealthDialogProps {
    children: React.ReactNode
}

export function SystemHealthDialog({ children }: SystemHealthDialogProps) {
    const [open, setOpen] = useState(false)
    const [health, setHealth] = useState<HealthStatus | null>(null)
    const [loading, setLoading] = useState(true)
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

    const checkHealth = async () => {
        setLoading(true)
        try {
            // Using env var if available, otherwise fallback to localhost as in original file (or relative)
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
            const response = await fetch(`${apiUrl}/api/v1/health`)
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

    // Check health when dialog opens
    useEffect(() => {
        if (open) {
            checkHealth()
            const interval = setInterval(checkHealth, 30000) // Poll every 30s
            return () => clearInterval(interval)
        }
    }, [open])

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
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader className="pb-4 border-b">
                    <div className="flex items-center gap-2">
                        <div className="bg-primary/10 p-2 rounded-full ring-1 ring-primary/20 shadow-sm">
                            <Activity className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <DialogTitle>System Status</DialogTitle>
                            <DialogDescription>
                                Real-time operational metrics
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    {/* Backend Status */}
                    <div className="flex items-center justify-between p-3 border rounded-xl bg-card hover:bg-accent/5 transition-colors shadow-sm">
                        <div className="flex items-center space-x-3">
                            <div className={cn("p-2 rounded-lg", backendStatus.bg)}>
                                <Server className={cn("h-5 w-5", backendStatus.color)} />
                            </div>
                            <div>
                                <p className="font-semibold text-sm">Backend API</p>
                                <p className="text-xs text-muted-foreground">Core Service</p>
                            </div>
                        </div>
                        {loading && !health ? (
                            <Badge variant="outline" className="animate-pulse h-7 px-2 text-xs">Checking...</Badge>
                        ) : (
                            <div className="flex items-center gap-2">
                                <span className={cn("relative flex h-2.5 w-2.5")}>
                                    <span className={cn("animate-ping absolute inline-flex h-full w-full rounded-full opacity-75", backendStatus.color.replace('text-', 'bg-'))}></span>
                                    <span className={cn("relative inline-flex rounded-full h-2.5 w-2.5", backendStatus.color.replace('text-', 'bg-'))}></span>
                                </span>
                                <Badge variant="outline" className={cn("font-medium border-0 bg-transparent text-xs", backendStatus.color)}>
                                    {backendStatus.label}
                                </Badge>
                            </div>
                        )}
                    </div>

                    {/* Database Status */}
                    <div className="flex items-center justify-between p-3 border rounded-xl bg-card hover:bg-accent/5 transition-colors shadow-sm">
                        <div className="flex items-center space-x-3">
                            <div className={cn("p-2 rounded-lg", dbStatus.bg)}>
                                <Database className={cn("h-5 w-5", dbStatus.color)} />
                            </div>
                            <div>
                                <p className="font-semibold text-sm">Database</p>
                                <p className="text-xs text-muted-foreground">TimescaleDB</p>
                            </div>
                        </div>
                        {loading && !health ? (
                            <Badge variant="outline" className="animate-pulse h-7 px-2 text-xs">Checking...</Badge>
                        ) : (
                            <div className="flex items-center gap-2">
                                <span className={cn("relative flex h-2.5 w-2.5")}>
                                    <span className={cn("animate-ping absolute inline-flex h-full w-full rounded-full opacity-75", dbStatus.color.replace('text-', 'bg-'))}></span>
                                    <span className={cn("relative inline-flex rounded-full h-2.5 w-2.5", dbStatus.color.replace('text-', 'bg-'))}></span>
                                </span>
                                <Badge variant="outline" className={cn("font-medium border-0 bg-transparent text-xs", dbStatus.color)}>
                                    {dbStatus.label}
                                </Badge>
                            </div>
                        )}
                    </div>

                    {/* Error Message */}
                    {health?.error && (
                        <div className="flex items-center gap-2 bg-destructive/10 text-destructive p-3 rounded-lg text-xs border border-destructive/20 font-medium">
                            <AlertCircle className="h-4 w-4 shrink-0" />
                            {health.error}
                        </div>
                    )}
                </div>

                <div className="flex justify-between items-center pt-4 border-t">
                    <span className="text-xs text-muted-foreground font-medium">
                        Last Check: {lastUpdated ? lastUpdated.toLocaleTimeString() : "Never"}
                    </span>
                    <Button variant="outline" size="sm" onClick={checkHealth} disabled={loading} className="gap-2 h-8 text-xs">
                        <RefreshCw className={cn("h-3 w-3", loading && "animate-spin")} />
                        Refresh
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
