"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Activity, Cpu, Server, Users, Zap, ArrowUpRight, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function DashboardPage() {
    return (
        <div className="flex flex-col gap-6 p-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                    <p className="text-muted-foreground">Overview of your IoT infrastructure.</p>
                </div>
                <div className="flex gap-2">
                    <Button asChild variant="outline">
                        <Link href="/health">
                            <Activity className="mr-2 h-4 w-4" />
                            System Health
                        </Link>
                    </Button>
                    <Button>
                        <Zap className="mr-2 h-4 w-4" />
                        Add Device
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Devices</CardTitle>
                        <Cpu className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">128</div>
                        <p className="text-xs text-muted-foreground">+4 from last month</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Now</CardTitle>
                        <Activity className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">112</div>
                        <p className="text-xs text-muted-foreground">87.5% uptime</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">3</div>
                        <p className="text-xs text-muted-foreground">2 warnings, 1 critical</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Data Points</CardTitle>
                        <Server className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">2.4M</div>
                        <p className="text-xs text-muted-foreground">+12% from last week</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                {/* Main Chart Area (Placeholder) */}
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Network Traffic</CardTitle>
                        <CardDescription>Real-time data transmission rates.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px] flex items-center justify-center bg-muted/20 rounded-md border border-dashed">
                        <p className="text-muted-foreground text-sm">Chart visualization will go here</p>
                        {/* Note: We'll implement Recharts or similar later */}
                    </CardContent>
                </Card>

                {/* Recent Activity */}
                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Recent Activity</CardTitle>
                        <CardDescription>Latest system events and logs.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-8">
                            {[
                                { status: "connected", device: "Sensor-A1", time: "2 mins ago", msg: "Device connected" },
                                { status: "warning", device: "Temp-Sensor-04", time: "15 mins ago", msg: "High temperature alert" },
                                { status: "error", device: "Gateway-North", time: "1 hour ago", msg: "Connection lost" },
                                { status: "connected", device: "Sensor-B2", time: "2 hours ago", msg: "Firmware updated" },
                            ].map((item, i) => (
                                <div key={i} className="flex items-center">
                                    <div className={`space-y-1 ${item.status === 'error' ? 'text-red-500' : item.status === 'warning' ? 'text-yellow-500' : 'text-green-500'}`}>
                                        {item.status === 'error' ? <AlertTriangle className="h-4 w-4" /> : item.status === 'warning' ? <AlertTriangle className="h-4 w-4" /> : <Activity className="h-4 w-4" />}
                                    </div>
                                    <div className="ml-4 space-y-1">
                                        <p className="text-sm font-medium leading-none">{item.msg}</p>
                                        <p className="text-xs text-muted-foreground">{item.device} • {item.time}</p>
                                    </div>
                                    <div className="ml-auto font-medium">
                                        <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
