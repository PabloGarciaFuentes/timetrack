import { useMemo } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface DonutChartProps {
    data: { name: string; value: number; color: string }[]
    title?: string
    centerValue?: string
    centerLabel?: string
}

export function DonutChart({
    data,
    title,
    centerValue,
    centerLabel,
}: DonutChartProps) {
    const total = useMemo(() => data.reduce((sum, item) => sum + item.value, 0), [data])

    return (
        <Card>
            <CardHeader className="pb-2">
                {title && <CardTitle className="text-lg font-semibold">{title}</CardTitle>}
            </CardHeader>
            <CardContent>
                <div className="relative h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={data}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={3}
                                dataKey="value"
                                strokeWidth={0}
                            >
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                        </PieChart>
                    </ResponsiveContainer>

                    {/* Center text */}
                    {(centerValue || centerLabel) && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            {centerValue && (
                                <span className="text-2xl font-bold">{centerValue}</span>
                            )}
                            {centerLabel && (
                                <span className="text-xs text-muted-foreground">{centerLabel}</span>
                            )}
                        </div>
                    )}
                </div>

                {/* Legend */}
                <div className="mt-4 grid grid-cols-2 gap-2">
                    {data.map((entry, index) => (
                        <div key={index} className="flex items-center gap-2">
                            <span
                                className="w-3 h-3 rounded-full shrink-0"
                                style={{ backgroundColor: entry.color }}
                            />
                            <span className="text-xs text-muted-foreground truncate">
                                {entry.name}
                            </span>
                            <span className="text-xs font-medium ml-auto">
                                {total > 0 ? Math.round((entry.value / total) * 100) : 0}%
                            </span>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}
