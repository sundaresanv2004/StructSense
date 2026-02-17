"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Activity, Cpu, AlertTriangle, CheckCircle2, WifiOff, Database } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { SystemHealthDialog } from "@/components/dashboard/system-health-dialog"
import { format } from "date-fns"
import { Skeleton } from "@/components/ui/skeleton"

interface Device {
    id: number
    name: string
    device_uid: string
    is_online: boolean
    last_seen_at: string | null
}

interface ProcessedData {
    id: number
    device_id: number
    created_at: string
    status: string
    tilt_change_percent: number
    distance_change_percent: number
}

export default function DashboardPage() {
    const [devices, setDevices] = useState<Device[]>([])
    const [recentActivity, setRecentActivity] = useState<ProcessedData[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        fetchDashboardData()
    }, [])

    const fetchDashboardData = async () => {
        try {
            setLoading(true)
            setError(null)

            // Fetch devices
            const devicesResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/devices`)
            if (!devicesResponse.ok) throw new Error("Failed to fetch devices")
            const devicesData = await devicesResponse.json()
            setDevices(devicesData)

            // Fetch recent activity from all devices
            if (devicesData.length > 0) {
                const activityPromises = devicesData.slice(0, 5).map(async (device: Device) => {
                    try {
                        const response = await fetch(
                            `${process.env.NEXT_PUBLIC_API_URL}/api/v1/sensor/devices/${device.id}/processed?limit=5`
                        )
                        if (response.ok) {
                            const data = await response.json()
                            return data
                        }
                        return []
                    } catch {
                        return []
                    }
                })

                const activityResults = await Promise.all(activityPromises)
                const allActivity = activityResults.flat()
                // Sort by timestamp and take latest 10
                const sortedActivity = allActivity
                    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                    .slice(0, 10)
                setRecentActivity(sortedActivity)
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load dashboard data")
        } finally {
            setLoading(false)
        }
    }

    // Calculate stats
    const totalDevices = devices.length
    const onlineDevices = devices.filter(d => d.is_online).length
    const offlineDevices = totalDevices - onlineDevices

    // Calculate alert counts from recent activity
    const alertCount = recentActivity.filter(a => a.status === "ALERT").length
    const warningCount = recentActivity.filter(a => a.status === "WARNING").length

    // Get device name helper
    const getDeviceName = (deviceId: number) => {
        const device = devices.find(d => d.id === deviceId)
        return device?.name || `Device ${deviceId}`
    }

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "ALERT":
                return <AlertTriangle className="h-4 w-4 text-red-500" />
            case "WARNING":
                return <AlertTriangle className="h-4 w-4 text-yellow-500" />
            default:
                return <CheckCircle2 className="h-4 w-4 text-green-500" />
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case "ALERT":
                return "text-red-500"
            case "WARNING":
                return "text-yellow-500"
            default:
                return "text-green-500"
        }
    }

    return (
        <div className="flex flex-col gap-6 p-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                    <p className="text-muted-foreground">Overview of your IoT infrastructure.</p>
                </div>
                <div className="flex gap-2">
                    <SystemHealthDialog>
                        <Button variant="outline">
                            <Activity className="h-4 w-4" />
                            System Health
                        </Button>
                    </SystemHealthDialog>
                    <Button asChild>
                        <Link href="/dashboard/devices">
                            <Cpu className="h-4 w-4" />
                            View Devices
                        </Link>
                    </Button>
                </div>
            </div>

            {error && (
                <Card className="border-destructive">
                    <CardContent className="pt-6">
                        <p className="text-sm text-destructive">Error: {error}</p>
                    </CardContent>
                </Card>
            )}

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Devices</CardTitle>
                        <Cpu className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <Skeleton className="h-8 w-20" />
                        ) : (
                            <>
                                <div className="text-2xl font-bold">{totalDevices}</div>
                                <p className="text-xs text-muted-foreground">Registered devices</p>
                            </>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Online</CardTitle>
                        <Activity className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <Skeleton className="h-8 w-20" />
                        ) : (
                            <>
                                <div className="text-2xl font-bold text-green-600">{onlineDevices}</div>
                                <p className="text-xs text-muted-foreground">
                                    {totalDevices > 0 ? `${((onlineDevices / totalDevices) * 100).toFixed(1)}% uptime` : "No devices"}
                                </p>
                            </>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Offline</CardTitle>
                        <WifiOff className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <Skeleton className="h-8 w-20" />
                        ) : (
                            <>
                                <div className="text-2xl font-bold text-red-600">{offlineDevices}</div>
                                <p className="text-xs text-muted-foreground">Disconnected devices</p>
                            </>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <Skeleton className="h-8 w-20" />
                        ) : (
                            <>
                                <div className="text-2xl font-bold">{alertCount}</div>
                                <p className="text-xs text-muted-foreground">
                                    {warningCount} warnings, {alertCount} critical
                                </p>
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Activity Section */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Database className="w-5 h-5 text-primary" />
                        Recent Sensor Activity
                    </CardTitle>
                    <CardDescription>Latest sensor readings across all devices</CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="space-y-4">
                            {[1, 2, 3, 4].map(i => (
                                <Skeleton key={i} className="h-12 w-full" />
                            ))}
                        </div>
                    ) : recentActivity.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-8">No recent activity</p>
                    ) : (
                        <div className="space-y-4">
                            {recentActivity.map((item) => (
                                <div key={item.id} className="flex items-center gap-4 p-3 rounded-lg border">
                                    <div className={getStatusColor(item.status)}>
                                        {getStatusIcon(item.status)}
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        <p className="text-sm font-medium leading-none">
                                            {getDeviceName(item.device_id)}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            Tilt: {item.tilt_change_percent.toFixed(2)}% • Distance: {item.distance_change_percent.toFixed(2)}%
                                        </p>
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                        <span className={`text-xs font-medium px-2 py-1 rounded ${item.status === "ALERT" ? "bg-red-100 text-red-700" :
                                                item.status === "WARNING" ? "bg-yellow-100 text-yellow-700" :
                                                    "bg-green-100 text-green-700"
                                            }`}>
                                            {item.status}
                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                            {format(new Date(item.created_at), "MMM d, HH:mm")}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
