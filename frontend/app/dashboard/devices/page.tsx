"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Wifi, WifiOff, MapPin, Building, Gauge, Pencil } from "lucide-react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"

interface Device {
    id: number
    device_uid: string
    name: string
    type: string
    building_name: string | null
    location_description: string | null
    tilt_threshold_percent: number
    distance_threshold_percent: number
    notification_email: string | null
    connection_status: boolean
    last_seen_at: string | null
    installed_at: string
    created_at: string
}

export default function DevicesPage() {
    const [devices, setDevices] = useState<Device[]>([])
    const [loading, setLoading] = useState(true)
    const [showDialog, setShowDialog] = useState(false)
    const [showAddDeviceDialog, setShowAddDeviceDialog] = useState(false)
    const [editingDevice, setEditingDevice] = useState<Device | null>(null)
    const [formData, setFormData] = useState({
        name: "",
        building_name: "",
        location_description: "",
        tilt_threshold_percent: 50,
        distance_threshold_percent: 50,
        notification_email: ""
    })

    useEffect(() => {
        fetchDevices()
    }, [])

    const fetchDevices = async () => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/devices`)
            if (response.ok) {
                const data = await response.json()
                setDevices(data)
            }
        } catch (error) {
            console.error("Failed to fetch devices:", error)
            toast.error("Failed to load devices")
        } finally {
            setLoading(false)
        }
    }

    const handleEdit = (device: Device) => {
        setEditingDevice(device)
        setFormData({
            name: device.name,
            building_name: device.building_name || "",
            location_description: device.location_description || "",
            tilt_threshold_percent: device.tilt_threshold_percent,
            distance_threshold_percent: device.distance_threshold_percent,
            notification_email: device.notification_email || ""
        })
        setShowDialog(true)
    }

    const handleUpdate = async () => {
        if (!editingDevice) return

        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/v1/devices/${editingDevice.id}`,
                {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        name: formData.name,
                        building_name: formData.building_name || null,
                        location_description: formData.location_description || null,
                        tilt_threshold_percent: formData.tilt_threshold_percent,
                        distance_threshold_percent: formData.distance_threshold_percent,
                        notification_email: formData.notification_email || null
                    })
                }
            )

            if (response.ok) {
                toast.success("Device updated successfully")
                setShowDialog(false)
                setEditingDevice(null)
                fetchDevices()
            } else {
                const error = await response.json()
                toast.error(error.detail || "Failed to update device")
            }
        } catch (error) {
            console.error("Failed to update device:", error)
            toast.error("Failed to update device")
        }
    }

    const formatDate = (dateString: string | null) => {
        if (!dateString) return "Never"
        return new Date(dateString).toLocaleString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        })
    }

    const getDeviceTypeLabel = (type: string) => {
        return type.split('_').map(word =>
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ')
    }

    return (
        <div className="flex flex-col gap-6 p-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Devices</h1>
                    <p className="text-muted-foreground">Manage your registered ESP32 devices</p>
                </div>
                <Button onClick={() => setShowAddDeviceDialog(true)}>
                    <Plus className="h-4 w-4" />
                    Add New Device
                </Button>
            </div>

            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Devices</CardTitle>
                        <Gauge className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{devices.length}</div>
                        <p className="text-xs text-muted-foreground">Registered devices</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Online</CardTitle>
                        <Wifi className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">
                            {devices.filter(d => d.connection_status).length}
                        </div>
                        <p className="text-xs text-muted-foreground">Connected devices</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Offline</CardTitle>
                        <WifiOff className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">
                            {devices.filter(d => !d.connection_status).length}
                        </div>
                        <p className="text-xs text-muted-foreground">Disconnected devices</p>
                    </CardContent>
                </Card>
            </div>

            {/* Devices Grid */}
            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <p className="text-muted-foreground">Loading devices...</p>
                </div>
            ) : devices.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center h-64">
                        <Gauge className="h-16 w-16 text-muted-foreground/50 mb-4" />
                        <p className="text-lg font-medium">No devices registered</p>
                        <p className="text-sm text-muted-foreground mt-1">
                            Contact your developer to register your first ESP32 device
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {devices.map((device) => (
                        <Card key={device.id} className="hover:shadow-lg transition-shadow relative">
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <CardTitle className="text-lg">{device.name}</CardTitle>
                                        <CardDescription className="font-mono text-xs mt-1">
                                            {device.device_uid}
                                        </CardDescription>
                                    </div>
                                    <div className="flex gap-2">
                                        <Badge variant={device.connection_status ? "default" : "secondary"}>
                                            {device.connection_status ? (
                                                <><Wifi className="h-3 w-3 mr-1" /> Online</>
                                            ) : (
                                                <><WifiOff className="h-3 w-3 mr-1" /> Offline</>
                                            )}
                                        </Badge>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex items-center text-sm">
                                    <span className="text-muted-foreground mr-2">Type:</span>
                                    <Badge variant="outline">{getDeviceTypeLabel(device.type)}</Badge>
                                </div>

                                {device.building_name && (
                                    <div className="flex items-start text-sm">
                                        <Building className="h-4 w-4 mr-2 text-muted-foreground mt-0.5" />
                                        <div>
                                            <p className="font-medium">{device.building_name}</p>
                                            {device.location_description && (
                                                <p className="text-xs text-muted-foreground">
                                                    {device.location_description}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-2 pt-2 border-t">
                                    <div className="flex flex-col">
                                        <span className="text-xs text-muted-foreground">Tilt Threshold</span>
                                        <span className="font-medium text-sm">{device.tilt_threshold_percent}%</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-xs text-muted-foreground">Distance Threshold</span>
                                        <span className="font-medium text-sm">{device.distance_threshold_percent}%</span>
                                    </div>
                                </div>

                                <div className="pt-2 border-t flex justify-between items-center">
                                    <p className="text-xs text-muted-foreground">
                                        Last seen: {formatDate(device.last_seen_at)}
                                    </p>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleEdit(device)}
                                    >
                                        <Pencil className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Edit Device Dialog */}
            <Dialog open={showDialog} onOpenChange={(open) => {
                setShowDialog(open)
                if (!open) setEditingDevice(null)
            }}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Edit Device</DialogTitle>
                        <DialogDescription>
                            Update device details. Device UID and type cannot be changed.
                        </DialogDescription>
                    </DialogHeader>

                    {editingDevice && (
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label className="text-xs text-muted-foreground">Device UID (Read-only)</Label>
                                <Input value={editingDevice.device_uid} disabled className="font-mono text-sm" />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="name">Device Name *</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="e.g., Foundation Sensor A"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="building_name">Building Name</Label>
                                <Input
                                    id="building_name"
                                    value={formData.building_name}
                                    onChange={(e) => setFormData({ ...formData, building_name: e.target.value })}
                                    placeholder="e.g., Block A"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="location_description">Location Description</Label>
                                <Input
                                    id="location_description"
                                    value={formData.location_description}
                                    onChange={(e) => setFormData({ ...formData, location_description: e.target.value })}
                                    placeholder="e.g., Basement pillar north"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="tilt_threshold">Tilt Threshold (%)</Label>
                                    <Input
                                        id="tilt_threshold"
                                        type="number"
                                        step="0.1"
                                        min="0"
                                        max="100"
                                        value={formData.tilt_threshold_percent}
                                        onChange={(e) => setFormData({ ...formData, tilt_threshold_percent: parseFloat(e.target.value) })}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="distance_threshold">Distance Threshold (%)</Label>
                                    <Input
                                        id="distance_threshold"
                                        type="number"
                                        step="0.1"
                                        min="0"
                                        max="100"
                                        value={formData.distance_threshold_percent}
                                        onChange={(e) => setFormData({ ...formData, distance_threshold_percent: parseFloat(e.target.value) })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="notification_email">Notification Email</Label>
                                <Input
                                    id="notification_email"
                                    type="email"
                                    value={formData.notification_email}
                                    onChange={(e) => setFormData({ ...formData, notification_email: e.target.value })}
                                    placeholder="alerts@example.com"
                                />
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDialog(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleUpdate}>
                            Save Changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Add Device Restriction Dialog */}
            <Dialog open={showAddDeviceDialog} onOpenChange={setShowAddDeviceDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add New Device</DialogTitle>
                        <DialogDescription>
                            Device registration is restricted to administrators.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <p className="text-sm text-muted-foreground mb-2">
                            You cannot add a new device directly.
                        </p>
                        <p className="text-sm text-muted-foreground">
                            Contact the developer and add my contact link{" "}
                            <a href="mailto:contact@sundaresan.dev" className="text-primary hover:underline font-medium">
                                contact@sundaresan.dev
                            </a>
                        </p>
                    </div>
                    <DialogFooter>
                        <Button onClick={() => setShowAddDeviceDialog(false)}>
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
