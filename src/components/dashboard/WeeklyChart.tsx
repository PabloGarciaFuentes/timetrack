import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useState } from 'react'

interface WeeklyChartProps {
    data: { date: string; dayName: string; hours: number }[]
    title?: string
}

export function WeeklyChart({ data, title = 'Sleep Analysis' }: WeeklyChartProps) {
    const [view, setView] = useState<'weekly' | 'monthly'>('monthly')

    // Colors matching design
    const barColor = 'hsl(var(--primary))'
    const activeBarColor = 'hsl(var(--success))'

    // Find today's index
    const today = new Date().toISOString().split('T')[0]
    const todayIndex = data.findIndex((d) => d.date === today)

    return (
        <Card className="bg-sidebar text-sidebar-foreground">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg font-semibold">{title}</CardTitle>
                <div className="flex gap-1 bg-sidebar-foreground/10 rounded-lg p-1">
                    <Button
                        variant={view === 'weekly' ? 'secondary' : 'ghost'}
                        size="sm"
                        className="h-7 px-3 text-xs"
                        onClick={() => setView('weekly')}
                    >
                        Weekly
                    </Button>
                    <Button
                        variant={view === 'monthly' ? 'secondary' : 'ghost'}
                        size="sm"
                        className="h-7 px-3 text-xs"
                        onClick={() => setView('monthly')}
                    >
                        Monthly
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                {/* Summary stats */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div>
                        <p className="text-2xl font-bold text-success">
                            85<span className="text-sm font-normal text-muted-foreground">%</span>
                        </p>
                        <p className="text-xs text-muted-foreground">Work Efficiency</p>
                    </div>
                    <div>
                        <p className="text-2xl font-bold">
                            7h 15m
                        </p>
                        <p className="text-xs text-muted-foreground">Work Duration</p>
                    </div>
                </div>

                {/* Chart */}
                <div className="h-[180px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data} barCategoryGap="20%">
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                            <XAxis
                                dataKey="dayName"
                                tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 11 }}
                                axisLine={false}
                                tickLine={false}
                            />
                            <YAxis hide />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'hsl(var(--popover))',
                                    border: 'none',
                                    borderRadius: '8px',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                                }}
                                labelStyle={{ color: 'hsl(var(--popover-foreground))' }}
                                formatter={(value: number) => [`${value.toFixed(1)}h`, 'Horas']}
                            />
                            <Bar dataKey="hours" radius={[6, 6, 6, 6]}>
                                {data.map((_entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={index === todayIndex ? activeBarColor : barColor}
                                        opacity={index === todayIndex ? 1 : 0.7}
                                    />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Month labels */}
                <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                    <span>Jun</span>
                    <span>Jul</span>
                    <span>Aug</span>
                    <span className="text-success font-medium">Sept ▼</span>
                    <span>Oct</span>
                    <span>Nov</span>
                    <span>Dec</span>
                </div>
            </CardContent>
        </Card>
    )
}
