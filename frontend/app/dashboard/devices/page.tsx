"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Wifi, WifiOff, MapPin, Building, Gauge, Pencil, Trash2, RotateCcw } from "lucide-react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { PageHeader } from "@/components/dashboard/page-header"

interface Device {
    id: number
    device_uid: string
    name: string
    type: string
    building_name: string | null
    location_description: string | null
    tilt_warning_threshold: number
    tilt_alert_threshold: number
    distance_warning_threshold: number
    distance_alert_threshold: number
    notification_email: string | null
    connection_status: boolean
    is_online: boolean
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
        tilt_warning_threshold: 30,
        tilt_alert_threshold: 45,
        distance_warning_threshold: 300,
        distance_alert_threshold: 500,
        notification_email: ""
    })

    // Action dialog states
    const [deviceToDelete, setDeviceToDelete] = useState<Device | null>(null)
    const [deviceToReset, setDeviceToReset] = useState<Device | null>(null)
    const [resetConfirmationText, setResetConfirmationText] = useState("")

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
            tilt_warning_threshold: device.tilt_warning_threshold,
            tilt_alert_threshold: device.tilt_alert_threshold,
            distance_warning_threshold: device.distance_warning_threshold,
            distance_alert_threshold: device.distance_alert_threshold,
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
                        tilt_warning_threshold: formData.tilt_warning_threshold,
                        tilt_alert_threshold: formData.tilt_alert_threshold,
                        distance_warning_threshold: formData.distance_warning_threshold,
                        distance_alert_threshold: formData.distance_alert_threshold,
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

    const handleDelete = async () => {
        if (!deviceToDelete) return

        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/v1/devices/${deviceToDelete.id}`,
                {
                    method: "DELETE",
                }
            )

            if (response.ok) {
                toast.success("Device deleted successfully")
                setDeviceToDelete(null)
                fetchDevices()
            } else {
                toast.error("Failed to delete device")
            }
        } catch (error) {
            console.error("Failed to delete device:", error)
            toast.error("Failed to delete device")
        }
    }

    const handleReset = async () => {
        if (!deviceToReset) return

        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/v1/devices/${deviceToReset.id}/reset`,
                {
                    method: "POST",
                }
            )

            if (response.ok) {
                toast.success("Device data reset successfully")
                setDeviceToReset(null)
                setResetConfirmationText("")
                // Optionally refresh devices if stats are shown
                fetchDevices()
            } else {
                toast.error("Failed to reset device data")
            }
        } catch (error) {
            console.error("Failed to reset device data:", error)
            toast.error("Failed to reset device data")
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
            <PageHeader
                title="Devices"
                description="Manage your registered ESP32 devices"
                icon={Gauge}
            >
                <Button onClick={() => setShowAddDeviceDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add New Device
                </Button>
            </PageHeader>

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
                            {devices.filter(d => d.is_online).length}
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
                            {devices.filter(d => !d.is_online).length}
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
                                        <Badge variant={device.is_online ? "default" : "secondary"}>
                                            {device.is_online ? (
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

                                <div className="grid grid-cols-2 gap-2 pt-2 border-t text-xs">
                                    <div className="space-y-1">
                                        <span className="text-muted-foreground block">Tilt Thresholds</span>
                                        <div className="flex gap-2">
                                            <span className="text-orange-500 font-medium">warn: {device.tilt_warning_threshold}%</span>
                                            <span className="text-red-500 font-medium">alert: {device.tilt_alert_threshold}%</span>
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <span className="text-muted-foreground block">Distance (mm)</span>
                                        <div className="flex gap-2">
                                            <span className="text-orange-500 font-medium">warn: {device.distance_warning_threshold}</span>
                                            <span className="text-red-500 font-medium">alert: {device.distance_alert_threshold}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-2 border-t flex justify-between items-center">
                                    <p className="text-xs text-muted-foreground">
                                        Last seen: {formatDate(device.last_seen_at)}
                                    </p>
                                    <div className="flex gap-1">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => setDeviceToReset(device)}
                                            title="Reset Data"
                                        >
                                            <RotateCcw className="h-4 w-4 text-orange-500" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleEdit(device)}
                                            title="Edit Device"
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => setDeviceToDelete(device)}
                                            title="Delete Device"
                                        >
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </div>
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
                                    <Label htmlFor="tilt_warning">Tilt Warning (%)</Label>
                                    <Input
                                        id="tilt_warning"
                                        type="number"
                                        step="0.1"
                                        value={formData.tilt_warning_threshold}
                                        onChange={(e) => setFormData({ ...formData, tilt_warning_threshold: parseFloat(e.target.value) })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="tilt_alert">Tilt Alert (%)</Label>
                                    <Input
                                        id="tilt_alert"
                                        type="number"
                                        step="0.1"
                                        value={formData.tilt_alert_threshold}
                                        onChange={(e) => setFormData({ ...formData, tilt_alert_threshold: parseFloat(e.target.value) })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="dist_warning">Dist Warn (mm)</Label>
                                    <Input
                                        id="dist_warning"
                                        type="number"
                                        step="10"
                                        value={formData.distance_warning_threshold}
                                        onChange={(e) => setFormData({ ...formData, distance_warning_threshold: parseFloat(e.target.value) })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="dist_alert">Dist Alert (mm)</Label>
                                    <Input
                                        id="dist_alert"
                                        type="number"
                                        step="10"
                                        value={formData.distance_alert_threshold}
                                        onChange={(e) => setFormData({ ...formData, distance_alert_threshold: parseFloat(e.target.value) })}
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

            {/* Delete Confirmation Dialog */}
            <Dialog open={!!deviceToDelete} onOpenChange={(open) => !open && setDeviceToDelete(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Device</DialogTitle>
                        <DialogDescription>
                            This action cannot be undone. This will permanently delete the device
                            <span className="font-semibold text-foreground"> {deviceToDelete?.name} </span>
                            and all of its sensor data.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-4 space-y-4">
                        <Label htmlFor="confirm-delete">
                            Please type <span className="font-mono font-bold">delete</span> to confirm.
                        </Label>
                        <Input
                            id="confirm-delete"
                            placeholder="Type 'delete' to confirm"
                            onChange={(e) => {
                                const btn = document.getElementById('btn-delete-confirm') as HTMLButtonElement
                                if (btn) btn.disabled = e.target.value !== 'delete'
                            }}
                        />
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeviceToDelete(null)}>Cancel</Button>
                        <Button
                            id="btn-delete-confirm"
                            variant="destructive"
                            disabled
                            onClick={handleDelete}
                        >
                            Delete Device
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Reset Confirmation Dialog */}
            <Dialog open={!!deviceToReset} onOpenChange={(open) => !open && setDeviceToReset(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Reset Device Data</DialogTitle>
                        <DialogDescription>
                            This will delete ALL historical sensor readings for
                            <span className="font-semibold text-foreground"> {deviceToReset?.name} </span>.
                            The device itself will REMAIN registered.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-4 space-y-4">
                        <Label htmlFor="confirm-reset">
                            Please type <span className="font-mono font-bold">reset</span> to confirm.
                        </Label>
                        <Input
                            id="confirm-reset"
                            placeholder="Type 'reset' to confirm"
                            value={resetConfirmationText}
                            onChange={(e) => setResetConfirmationText(e.target.value)}
                        />
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => {
                            setDeviceToReset(null)
                            setResetConfirmationText("")
                        }}>Cancel</Button>
                        <Button
                            id="btn-reset-confirm"
                            className="bg-orange-500 hover:bg-orange-600"
                            disabled={resetConfirmationText !== 'reset'}
                            onClick={handleReset}
                        >
                            Reset Data
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
