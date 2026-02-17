"use client"

import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts"

export interface DistanceDataPoint {
    date: string
    distance: number
}

interface DistanceChartProps {
    data: DistanceDataPoint[]
}

export function DistanceChart({ data }: DistanceChartProps) {
    return (
        <ResponsiveContainer width="100%" height={350}>
            <AreaChart data={data}>
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
                    tickLine={false}
                    axisLine={false}
                    unit=" mm"
                    width={40}
                    label={{ value: 'Distance Change (mm)', angle: -90, position: 'insideLeft' }}
                    tick={{ fontSize: 12 }}
                />
                <Tooltip
                    contentStyle={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    labelFormatter={(label) => new Date(label).toLocaleString()}
                    formatter={(value: number) => [`${value} mm`, "Distance Change"]}
                />

                <defs>
                    <linearGradient id="colorDistance" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                </defs>

                <Area
                    type="monotone"
                    dataKey="distance"
                    name="Distance Change"
                    stroke="#8b5cf6" // Violet-500
                    fillOpacity={1}
                    fill="url(#colorDistance)"
                    strokeWidth={2}
                />
            </AreaChart>
        </ResponsiveContainer>
    )
}
