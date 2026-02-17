"use client"

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Legend, ReferenceLine } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export interface SensorDataPoint {
    date: string
    tiltChange: number
    distanceChange: number
}

interface SensorChartProps {
    data: SensorDataPoint[]
    tiltWarningThreshold?: number
    tiltAlertThreshold?: number
    distanceWarningThreshold?: number
    distanceAlertThreshold?: number
}

export function SensorChart({
    data,
    tiltWarningThreshold,
    tiltAlertThreshold,
    distanceWarningThreshold,
    distanceAlertThreshold
}: SensorChartProps) {
    return (
        <ResponsiveContainer width="100%" height={350}>
            <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis
                    dataKey="date"
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    minTickGap={30}
                />
                <YAxis
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    unit="%"
                />
                <Tooltip
                    contentStyle={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend />

                {/* Tilt Line (Orange) */}
                <Line
                    type="monotone"
                    dataKey="tiltChange"
                    name="Tilt Change %"
                    stroke="#f97316" // Orange-500
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4 }}
                />

                {/* Distance Line (Blue) */}
                <Line
                    type="monotone"
                    dataKey="distanceChange"
                    name="Distance Change %"
                    stroke="#3b82f6" // Blue-500
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4 }}
                />

                {/* Threshold Lines - Optional visualization */}
                {tiltWarningThreshold && (
                    <ReferenceLine y={tiltWarningThreshold} stroke="#fdba74" strokeDasharray="3 3" label="Tilt Warn" />
                )}
                {distanceWarningThreshold && (
                    <ReferenceLine y={distanceWarningThreshold} stroke="#93c5fd" strokeDasharray="3 3" label="Dist Warn" />
                )}
            </LineChart>
        </ResponsiveContainer>
    )
}
