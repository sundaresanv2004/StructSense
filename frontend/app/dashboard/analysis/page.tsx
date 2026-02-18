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
import { format, subDays } from "date-fns"
import { Loader2, RefreshCw, Activity, Ruler, Download } from "lucide-react"
import { DatePickerWithRange } from "@/components/ui/date-range-picker"
import { DateRange } from "react-day-picker"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { AxisChart, AxisDataPoint } from "@/components/dashboard/axis-chart"
import { DistanceChart, DistanceDataPoint } from "@/components/dashboard/distance-chart"
import { PageHeader } from "@/components/dashboard/page-header"

interface Device {
    id: number
    name: string
    device_uid: string
}

interface ProcessedData {
    id: number
    created_at: string
    status: string
    tilt_diff_x: number
    tilt_diff_y: number
    tilt_diff_z: number
    distance_diff_mm: number
    distance_cm?: number // In case we want raw, but schema has diff
}

export default function AnalysisPage() {
    const [devices, setDevices] = useState<Device[]>([])
    const [selectedDeviceId, setSelectedDeviceId] = useState<string>("")
    const [axisData, setAxisData] = useState<AxisDataPoint[]>([])
    const [distanceData, setDistanceData] = useState<DistanceDataPoint[]>([])
    const [loading, setLoading] = useState(false)
    const [loadingDevices, setLoadingDevices] = useState(true)

    // Filters
    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: subDays(new Date(), 7),
        to: new Date(),
    })
    // Live Updates
    const [liveUpdate, setLiveUpdate] = useState(false)
    const intervalRef = useRef<NodeJS.Timeout | null>(null)

    // Fetch devices on mount
    useEffect(() => {
        fetchDevices()
    }, [])

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
    }, [liveUpdate, selectedDeviceId, dateRange])

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



    // Fetch data when device or date changes
    useEffect(() => {
        if (selectedDeviceId) {
            fetchData(parseInt(selectedDeviceId))
        } else {
            setAxisData([])
            setDistanceData([])
        }
    }, [selectedDeviceId, dateRange])

    const fetchData = async (deviceId: number, silent = false) => {
        if (!silent) setLoading(true)
        try {
            // Build query params
            const params = new URLSearchParams()
            params.append("limit", "200") // Get more points for charts

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/sensor/devices/${deviceId}/processed?${params.toString()}`)
            if (response.ok) {
                let result: ProcessedData[] = await response.json()

                // Filter by Date Range (Client-side)
                if (dateRange?.from) {
                    const fromTime = dateRange.from.getTime()
                    const toTime = dateRange.to ? dateRange.to.getTime() + 86400000 : fromTime + 86400000

                    result = result.filter(item => {
                        const itemTime = new Date(item.created_at).getTime()
                        return itemTime >= fromTime && itemTime <= toTime
                    })
                }

                // Prepare Chart Data
                // Reverse to show chronological order
                const sortedResult = [...result].reverse()

                const axisData = sortedResult.map(item => ({
                    date: format(new Date(item.created_at), "MM/dd HH:mm"),
                    x: item.tilt_diff_x,
                    y: item.tilt_diff_y,
                    z: item.tilt_diff_z
                }))

                const distData = sortedResult.map(item => ({
                    date: format(new Date(item.created_at), "MM/dd HH:mm"),
                    distance: parseFloat(item.distance_diff_mm?.toFixed(2) || "0") // mm
                }))

                setAxisData(axisData)
                setDistanceData(distData)
            }
        } catch (error) {
            console.error("Failed to fetch data:", error)
        } finally {
            if (!silent) setLoading(false)
        }
    }

    const handleExport = async (format: 'csv' | 'xlsx') => {
        if (!selectedDeviceId) return

        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/v1/sensor/devices/${selectedDeviceId}/export?format=${format}`
            )

            if (response.ok) {
                // Create a blob from the response
                const blob = await response.blob()
                // Create a link element and trigger download
                const url = window.URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                // Try to get filename from content-disposition
                const contentDisposition = response.headers.get('content-disposition')
                let filename = `sensor_data.${format}`
                if (contentDisposition) {
                    const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/)
                    if (filenameMatch && filenameMatch.length === 2)
                        filename = filenameMatch[1]
                }

                a.download = filename
                document.body.appendChild(a)
                a.click()
                window.URL.revokeObjectURL(url)
                document.body.removeChild(a)
            } else {
                console.error("Failed to export data")
            }
        } catch (error) {
            console.error("Export error:", error)
        }
    }

    return (
        <div className="flex flex-col gap-6 p-6">
            <PageHeader
                title="Sensor Analysis"
                description="Deep dive into sensor metrics"
                icon={Activity}
            >
                <div className="flex items-center gap-4">
                    <div className="flex items-center space-x-2 bg-card p-2 rounded-lg border shadow-sm">
                        <Switch
                            id="live-mode-analysis"
                            checked={liveUpdate}
                            onCheckedChange={setLiveUpdate}
                        />
                        <Label htmlFor="live-mode-analysis" className="flex items-center gap-2 cursor-pointer">
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
            </PageHeader>

            {/* Toolbar for Filters */}
            <div className="flex justify-end items-center gap-4">
                <DatePickerWithRange date={dateRange} setDate={setDateRange} />

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline">
                            <Download className="mr-2 h-4 w-4" />
                            Export
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => handleExport('csv')}>
                            Download CSV
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleExport('xlsx')}>
                            Download Excel
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

                <Button variant="outline" size="icon" onClick={() => fetchData(parseInt(selectedDeviceId))}>
                    <RefreshCw className="h-4 w-4" />
                </Button>
            </div>

            {/* DISTANCE CHART (Moved to Top) */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Ruler className="w-5 h-5 text-primary" />
                        Ultrasonic Distance Deviation
                    </CardTitle>
                    <CardDescription>
                        Visualizing distance changes in centimeters
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {loading && distanceData.length === 0 ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        </div>
                    ) : (
                        <DistanceChart data={distanceData} />
                    )}
                </CardContent>
            </Card>

            {/* TILT AXIS CHART (Moved to Bottom) */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Activity className="w-5 h-5 text-primary" />
                        3-Axis Tilt Deviation
                    </CardTitle>
                    <CardDescription>
                        Visualizing X, Y, and Z axis changes relative to baseline
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {loading && axisData.length === 0 ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        </div>
                    ) : (
                        <AxisChart data={axisData} />
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
