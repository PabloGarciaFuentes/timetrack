import { useEffect, useState, useMemo } from 'react'
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns'
import { es } from 'date-fns/locale'
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    LineChart,
    Line,
} from 'recharts'
import { Download, Calendar, TrendingUp, Clock, ChevronLeft, ChevronRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase'
import { getMonthlyStats, getWeeklyStats, exportToCSV, downloadCSV } from '@/lib/calculations'
import { formatHours } from '@/lib/utils'
import { DEMO_ENTRIES } from '@/lib/demo-data'
import type { TimeEntry } from '@/types'

export function Reports() {
    const { user, isDemo } = useAuth()
    const { toast } = useToast()
    const [entries, setEntries] = useState<TimeEntry[]>([])
    const [loading, setLoading] = useState(true)
    const [currentMonth, setCurrentMonth] = useState(new Date())

    // Fetch entries for current month
    useEffect(() => {
        async function fetchEntries() {
            if (!user) return
            setLoading(true)

            if (isDemo) {
                // Demo mode logic
                const start = startOfMonth(currentMonth)
                start.setHours(0, 0, 0, 0)
                const end = endOfMonth(currentMonth)
                end.setHours(23, 59, 59, 999)

                const filtered = DEMO_ENTRIES.filter(entry => {
                    const entryDate = new Date(entry.date)
                    return entryDate >= start && entryDate <= end
                }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

                setEntries(filtered)
                setLoading(false)
                return
            }

            const start = startOfMonth(currentMonth)
            const end = endOfMonth(currentMonth)

            const { data, error } = await supabase
                .from('time_entries')
                .select('*, pauses(*)')
                .eq('user_id', user.id)
                .gte('date', format(start, 'yyyy-MM-dd'))
                .lte('date', format(end, 'yyyy-MM-dd'))
                .order('date', { ascending: true })

            if (!error && data) {
                setEntries(data as TimeEntry[])
            }
            setLoading(false)
        }

        fetchEntries()
    }, [user, currentMonth, isDemo])

    // Calculate stats
    const monthlyStats = useMemo(() => getMonthlyStats(entries, currentMonth), [entries, currentMonth])
    const weeklyStats = useMemo(() => getWeeklyStats(entries, currentMonth), [entries, currentMonth])

    // Chart data
    const dailyChartData = useMemo(() => {
        const data: { day: number; hours: number }[] = []
        entries.forEach((entry) => {
            const day = parseInt(format(new Date(entry.date), 'd'))
            const existing = data.find((d) => d.day === day)
            const hours = entry.total_hours || 0
            if (existing) {
                existing.hours += hours
            } else {
                data.push({ day, hours })
            }
        })
        return data.sort((a, b) => a.day - b.day)
    }, [entries])

    // Export handler
    const handleExport = async () => {
        if (!user) {
            toast({
                title: 'Error',
                description: 'Debes iniciar sesión para exportar',
                variant: 'destructive',
            })
            return
        }

        try {
            if (isDemo) {
                // Export demo entries
                const csvContent = exportToCSV(DEMO_ENTRIES)
                downloadCSV(csvContent, `control-horario-demo-${format(new Date(), 'yyyy-MM-dd')}.csv`)

                toast({
                    title: 'Exportación exitosa',
                    description: 'El archivo CSV ha sido descargado (Modo Demo).',
                    variant: 'success',
                })
                return
            }

            // Fetch all entries for export
            const { data, error } = await supabase
                .from('time_entries')
                .select('*, pauses(*)')
                .eq('user_id', user.id)
                .order('date', { ascending: false })

            if (error) throw error

            const csvContent = exportToCSV(data as TimeEntry[])
            downloadCSV(csvContent, `control-horario-${format(new Date(), 'yyyy-MM-dd')}.csv`)

            toast({
                title: 'Exportación exitosa',
                description: 'El archivo CSV ha sido descargado.',
                variant: 'success',
            })
        } catch (error) {
            toast({
                title: 'Error',
                description: 'No se pudo exportar los datos',
                variant: 'destructive',
            })
        }
    }

    // Navigate months
    const navigateMonth = (direction: 'prev' | 'next') => {
        setCurrentMonth((prev) =>
            direction === 'prev' ? subMonths(prev, 1) : new Date(prev.setMonth(prev.getMonth() + 1))
        )
    }

    return (
        <div className="space-y-6">
            {/* Header with navigation and export */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={() => navigateMonth('prev')}>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-lg font-medium min-w-[160px] text-center capitalize">
                        {format(currentMonth, 'MMMM yyyy', { locale: es })}
                    </span>
                    <Button variant="ghost" size="icon" onClick={() => navigateMonth('next')}>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>

                <Button onClick={handleExport}>
                    <Download className="mr-2 h-4 w-4" />
                    Exportar CSV
                </Button>
            </div>

            {/* Summary stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-primary/10">
                                <Clock className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Total del mes</p>
                                <p className="text-2xl font-bold">{formatHours(monthlyStats.totalHours)}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-success/10">
                                <TrendingUp className="h-5 w-5 text-success" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Promedio diario</p>
                                <p className="text-2xl font-bold">{formatHours(monthlyStats.averageDaily)}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-secondary/10">
                                <Calendar className="h-5 w-5 text-secondary" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Días trabajados</p>
                                <p className="text-2xl font-bold">{monthlyStats.daysWorked}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-warning/10">
                                <Clock className="h-5 w-5 text-warning" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Esta semana</p>
                                <p className="text-2xl font-bold">{formatHours(weeklyStats.totalHours)}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Daily hours bar chart */}
                <Card>
                    <CardHeader>
                        <CardTitle>Horas por día</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex justify-center py-8">
                                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                            </div>
                        ) : dailyChartData.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                No hay datos para este mes
                            </div>
                        ) : (
                            <div className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={dailyChartData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                        <XAxis
                                            dataKey="day"
                                            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                                            axisLine={{ stroke: 'hsl(var(--border))' }}
                                        />
                                        <YAxis
                                            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                                            axisLine={{ stroke: 'hsl(var(--border))' }}
                                            tickFormatter={(value) => `${value}h`}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: 'hsl(var(--popover))',
                                                border: '1px solid hsl(var(--border))',
                                                borderRadius: '8px',
                                            }}
                                            formatter={(value: number) => [`${value.toFixed(1)}h`, 'Horas']}
                                            labelFormatter={(label) => `Día ${label}`}
                                        />
                                        <Bar dataKey="hours" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Weekly breakdown line chart */}
                <Card>
                    <CardHeader>
                        <CardTitle>Horas por semana</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex justify-center py-8">
                                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                            </div>
                        ) : monthlyStats.weeklyBreakdown.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                No hay datos para este mes
                            </div>
                        ) : (
                            <div className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={monthlyStats.weeklyBreakdown}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                        <XAxis
                                            dataKey="weekNumber"
                                            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                                            axisLine={{ stroke: 'hsl(var(--border))' }}
                                            tickFormatter={(value) => `Sem ${value}`}
                                        />
                                        <YAxis
                                            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                                            axisLine={{ stroke: 'hsl(var(--border))' }}
                                            tickFormatter={(value) => `${value}h`}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: 'hsl(var(--popover))',
                                                border: '1px solid hsl(var(--border))',
                                                borderRadius: '8px',
                                            }}
                                            formatter={(value: number) => [`${value.toFixed(1)}h`, 'Horas']}
                                            labelFormatter={(label) => `Semana ${label}`}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="hours"
                                            stroke="hsl(var(--success))"
                                            strokeWidth={2}
                                            dot={{ fill: 'hsl(var(--success))', strokeWidth: 2 }}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
