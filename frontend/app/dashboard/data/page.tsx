"use client"

import { useEffect, useState, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { format, subDays } from "date-fns"
import { Loader2, Database, AlertCircle, CheckCircle2, AlertTriangle, RefreshCw, ArrowUpDown } from "lucide-react"
import { DataTable } from "@/components/ui/data-table"
import { ColumnDef } from "@tanstack/react-table"
import { DatePickerWithRange } from "@/components/ui/date-range-picker"
import { DateRange } from "react-day-picker"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
// SensorChart removed as per request



interface Device {
    id: number
    name: string
    device_uid: string
    tilt_warning_threshold: number
    tilt_alert_threshold: number
    distance_warning_threshold: number
    distance_alert_threshold: number
}

interface ProcessedData {
    id: number
    created_at: string
    status: string
    tilt_change_percent: number
    distance_change_percent: number
    tilt_diff_x: number
    tilt_diff_y: number
    tilt_diff_z: number
    distance_diff_mm: number
    raw_data_id: number
}

export default function DataPage() {
    const [devices, setDevices] = useState<Device[]>([])
    const [selectedDeviceId, setSelectedDeviceId] = useState<string>("")
    const [selectedDevice, setSelectedDevice] = useState<Device | null>(null)
    const [data, setData] = useState<ProcessedData[]>([])
    // const [chartData, setChartData] = useState<SensorDataPoint[]>([]) // Removed
    const [loading, setLoading] = useState(false)
    const [loadingDevices, setLoadingDevices] = useState(true)

    // Filters
    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: subDays(new Date(), 7),
        to: new Date(),
    })
    const [statusFilter, setStatusFilter] = useState<string>("ALL")

    // Live Updates
    const [liveUpdate, setLiveUpdate] = useState(false)
    const intervalRef = useRef<NodeJS.Timeout | null>(null)

    // Fetch devices on mount
    useEffect(() => {
        fetchDevices()
    }, [])

    // Update selected device object when ID changes
    useEffect(() => {
        if (selectedDeviceId && devices.length > 0) {
            const device = devices.find(d => d.id.toString() === selectedDeviceId) || null
            setSelectedDevice(device)
        }
    }, [selectedDeviceId, devices])

    // Fetch data when dependencies change
    useEffect(() => {
        if (selectedDeviceId) {
            fetchData(parseInt(selectedDeviceId))
        } else {
            setData([])
            // setChartData([]) // Removed
        }
    }, [selectedDeviceId, dateRange, statusFilter])

    // Handle Live Update
    useEffect(() => {
        if (liveUpdate && selectedDeviceId) {
            intervalRef.current = setInterval(() => {
                fetchData(parseInt(selectedDeviceId), true) // Silent update
            }, 5000)
        } else {
            if (intervalRef.current) {
                clearInterval(intervalRef.current)
            }
        }
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current)
        }
    }, [liveUpdate, selectedDeviceId, dateRange, statusFilter])

    const fetchDevices = async () => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/devices`)
            if (response.ok) {
                const result = await response.json()
                setDevices(result)
                // Select first device by default if available
                if (result.length > 0) {
                    setSelectedDeviceId(result[0].id.toString())
                }
            }
        } catch (error) {
            console.error("Failed to fetch devices:", error)
        } finally {
            setLoadingDevices(false)
        }
    }

    const fetchData = async (deviceId: number, silent = false) => {
        if (!silent) setLoading(true)
        try {
            // Build query params
            const params = new URLSearchParams()
            params.append("limit", "100") // Always get latest 100 for now

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/sensor/devices/${deviceId}/processed?${params.toString()}`)
            if (response.ok) {
                let result: ProcessedData[] = await response.json()

                // Client-side filtering (API currently supports basic retrieval)

                // Filter by Status
                if (statusFilter !== "ALL") {
                    result = result.filter(item => item.status === statusFilter)
                }

                // Filter by Date Range
                if (dateRange?.from) {
                    const fromTime = dateRange.from.getTime()
                    const toTime = dateRange.to ? dateRange.to.getTime() + 86400000 : fromTime + 86400000 // Add 1 day to include end date

                    result = result.filter(item => {
                        const itemTime = new Date(item.created_at).getTime()
                        return itemTime >= fromTime && itemTime <= toTime
                    })
                }

                setData(result)

                // Prepare Chart Data (Removed)
                // const chartData = [...result].reverse().map(item => ({ ... }))
                // setChartData(chartData)
            }
        } catch (error) {
            console.error("Failed to fetch data:", error)
        } finally {
            if (!silent) setLoading(false)
        }
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "SAFE":
                return <Badge className="bg-green-500 hover:bg-green-600"><CheckCircle2 className="w-3 h-3 mr-1" /> Safe</Badge>
            case "WARNING":
                return <Badge className="bg-yellow-500 hover:bg-yellow-600"><AlertTriangle className="w-3 h-3 mr-1" /> Warning</Badge>
            case "ALERT":
                return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" /> Alert</Badge>
            default:
                return <Badge variant="outline">{status}</Badge>
        }
    }

    const columns: ColumnDef<ProcessedData>[] = [
        {
            accessorKey: "created_at",
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        className="p-0 hover:bg-transparent"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    >
                        Timestamp
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                )
            },
            cell: ({ row }) => <div className="font-mono text-xs">{format(new Date(row.getValue("created_at")), "MMM d, HH:mm:ss")}</div>,
        },
        {
            accessorKey: "status",
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        className="p-0 hover:bg-transparent"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    >
                        Status
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                )
            },
            cell: ({ row }) => getStatusBadge(row.getValue("status")),
        },
        {
            accessorKey: "tilt_change_percent",
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        className="p-0 hover:bg-transparent"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    >
                        Tilt Change
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                )
            },
            cell: ({ row }) => {
                const val = parseFloat(row.getValue("tilt_change_percent"))
                const isWarning = selectedDevice && val >= selectedDevice.tilt_warning_threshold

                return (
                    <div className="flex items-center gap-2">
                        <span className={`font-medium ${val > 0 ? "text-orange-600" : ""}`}>{val.toFixed(2)}%</span>
                        {isWarning && (
                            <AlertTriangle className="w-4 h-4 text-orange-500" />
                        )}
                    </div>
                )
            },
        },
        {
            accessorKey: "distance_change_percent",
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        className="p-0 hover:bg-transparent"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    >
                        Dist Change
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                )
            },
            cell: ({ row }) => {
                const val = parseFloat(row.getValue("distance_change_percent"))
                const isWarning = selectedDevice && val >= selectedDevice.distance_warning_threshold

                return (
                    <div className="flex items-center gap-2">
                        <span className={`font-medium ${val > 0 ? "text-blue-600" : ""}`}>{val.toFixed(2)}%</span>
                        {isWarning && (
                            <AlertTriangle className="w-4 h-4 text-blue-500" />
                        )}
                    </div>
                )
            },
        },
        {
            accessorKey: "tilt_diff_x",
            header: "X Diff",
            cell: ({ row }) => <div className="font-mono text-xs text-muted-foreground">{parseFloat(row.getValue("tilt_diff_x")).toFixed(2)}</div>,
        },
        {
            accessorKey: "tilt_diff_y",
            header: "Y Diff",
            cell: ({ row }) => <div className="font-mono text-xs text-muted-foreground">{parseFloat(row.getValue("tilt_diff_y")).toFixed(2)}</div>,
        },
        {
            accessorKey: "tilt_diff_z",
            header: "Z Diff",
            cell: ({ row }) => <div className="font-mono text-xs text-muted-foreground">{parseFloat(row.getValue("tilt_diff_z")).toFixed(2)}</div>,
        },
        {
            accessorKey: "distance_diff_mm",
            header: "Dist Diff",
            cell: ({ row }) => <div className="font-mono text-xs text-muted-foreground">{parseFloat(row.getValue("distance_diff_mm")).toFixed(2)} mm</div>,
        },
    ]

    return (
        <div className="flex flex-col gap-6 p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Sensor Data</h1>
                    <p className="text-muted-foreground">Detailed view with advanced filtering</p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center space-x-2 bg-card p-2 rounded-lg border shadow-sm">
                        <Switch
                            id="live-mode"
                            checked={liveUpdate}
                            onCheckedChange={setLiveUpdate}
                        />
                        <Label htmlFor="live-mode" className="flex items-center gap-2 cursor-pointer">
                            <RefreshCw className={`w-4 h-4 ${liveUpdate ? "animate-spin text-green-500" : "text-muted-foreground"}`} />
                            <span className={liveUpdate ? "text-green-600 font-medium" : "text-muted-foreground"}>Live Updates</span>
                        </Label>
                    </div>

                    <div className="w-[200px]">
                        <Select value={selectedDeviceId} onValueChange={setSelectedDeviceId} disabled={loadingDevices}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select Device" />
                            </SelectTrigger>
                            <SelectContent>
                                {devices.map((device) => (
                                    <SelectItem key={device.id} value={device.id.toString()}>
                                        {device.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>

            {/* CHART SECTION */}
            {/* CHART SECTION REMOVED */}

            {/* DATA TABLE SECTION */}
            <Card>
                <CardHeader className="pb-3">
                    <div className="flex flex-col md:flex-row gap-4 justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Database className="w-5 h-5 text-primary" />
                                Historical Data
                            </CardTitle>
                            <CardDescription>
                                View and analyze sensor readings over time
                            </CardDescription>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            <DatePickerWithRange date={dateRange} setDate={setDateRange} />

                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-[150px]">
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ALL">All Statuses</SelectItem>
                                    <SelectItem value="SAFE">Safe</SelectItem>
                                    <SelectItem value="WARNING">Warning</SelectItem>
                                    <SelectItem value="ALERT">Alert</SelectItem>
                                </SelectContent>
                            </Select>

                            <Button variant="outline" size="icon" onClick={() => fetchData(parseInt(selectedDeviceId))}>
                                <RefreshCw className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {loading && data.length === 0 ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        </div>
                    ) : (
                        <DataTable columns={columns} data={data} />
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
