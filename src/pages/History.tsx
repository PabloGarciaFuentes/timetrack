import { useEffect, useState, useMemo } from 'react'
import { format, parseISO, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns'
import { es } from 'date-fns/locale'
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, Coffee, Edit2, Trash2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase'
import { formatTime, formatHours, cn } from '@/lib/utils'
import { calculateWorkedHours, calculatePauseDuration } from '@/lib/calculations'
import { DEMO_ENTRIES } from '@/lib/demo-data'
import type { TimeEntry } from '@/types'

type FilterPeriod = 'week' | 'month' | 'all'

export function History() {
    const { user, isDemo } = useAuth()
    const { toast } = useToast()
    const [entries, setEntries] = useState<TimeEntry[]>([])
    const [loading, setLoading] = useState(true)
    const [filterPeriod, setFilterPeriod] = useState<FilterPeriod>('week')
    const [currentDate, setCurrentDate] = useState(new Date())

    // Calculate date range based on filter
    const dateRange = useMemo(() => {
        switch (filterPeriod) {
            case 'week':
                return {
                    start: startOfWeek(currentDate, { weekStartsOn: 1 }),
                    end: endOfWeek(currentDate, { weekStartsOn: 1 }),
                }
            case 'month':
                return {
                    start: startOfMonth(currentDate),
                    end: endOfMonth(currentDate),
                }
            default:
                return null
        }
    }, [filterPeriod, currentDate])

    // Fetch entries
    useEffect(() => {
        let mounted = true

        async function fetchEntries() {
            if (!user) {
                if (mounted) setLoading(false)
                return
            }

            try {
                if (mounted) setLoading(true)

                if (isDemo) {
                    // Filter demo entries based on date range
                    let filtered = DEMO_ENTRIES

                    if (dateRange) {
                        filtered = DEMO_ENTRIES.filter(entry => {
                            const entryDate = new Date(entry.date)
                            // Add some buffer to ensure inclusive matching
                            const start = new Date(dateRange.start)
                            start.setHours(0, 0, 0, 0)
                            const end = new Date(dateRange.end)
                            end.setHours(23, 59, 59, 999)

                            return entryDate >= start && entryDate <= end
                        })
                    }

                    // Sort by date descending
                    if (mounted) {
                        setEntries(filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()))
                        setLoading(false)
                    }
                    return
                }

                let query = supabase
                    .from('time_entries')
                    .select('*, pauses(*)')
                    .eq('user_id', user.id)
                    .order('date', { ascending: false })

                if (dateRange) {
                    query = query
                        .gte('date', format(dateRange.start, 'yyyy-MM-dd'))
                        .lte('date', format(dateRange.end, 'yyyy-MM-dd'))
                }

                const { data, error } = await query.limit(100)

                if (error) throw error

                if (mounted) {
                    setEntries(data as TimeEntry[])
                }
            } catch (error) {
                console.error('Error fetching history:', error)
                if (mounted) {
                    toast({
                        title: 'Error',
                        description: 'No se pudieron cargar los registros históricos',
                        variant: 'destructive',
                    })
                }
            } finally {
                if (mounted) setLoading(false)
            }
        }

        fetchEntries()

        return () => {
            mounted = false
        }
    }, [user, dateRange, isDemo, toast])

    // Group entries by date
    const groupedEntries = useMemo(() => {
        const groups: Record<string, TimeEntry[]> = {}
        entries.forEach((entry) => {
            if (!groups[entry.date]) {
                groups[entry.date] = []
            }
            groups[entry.date].push(entry)
        })
        return groups
    }, [entries])

    // Calculate totals
    const totals = useMemo(() => {
        let totalHours = 0
        let totalPauseMinutes = 0
        entries.forEach((entry) => {
            totalHours += entry.total_hours || calculateWorkedHours(entry)
            totalPauseMinutes += calculatePauseDuration(entry.pauses || [])
        })
        return { totalHours, totalPauseHours: totalPauseMinutes / 60 }
    }, [entries])

    // Navigation
    const navigatePeriod = (direction: 'prev' | 'next') => {
        const newDate = new Date(currentDate)
        if (filterPeriod === 'week') {
            newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7))
        } else if (filterPeriod === 'month') {
            newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1))
        }
        setCurrentDate(newDate)
    }

    // Delete entry
    const handleDelete = async (entryId: string) => {
        if (!confirm('¿Estás seguro de eliminar este registro?')) return

        try {
            if (isDemo) {
                // Simulate deletion in demo mode
                setEntries((prev) => prev.filter((e) => e.id !== entryId))
                toast({
                    title: 'Registro eliminado',
                    description: 'El registro ha sido eliminado correctamente (Modo Demo).',
                })
                return
            }

            const { error } = await supabase
                .from('time_entries')
                .delete()
                .eq('id', entryId)

            if (error) throw error

            setEntries((prev) => prev.filter((e) => e.id !== entryId))
            toast({
                title: 'Registro eliminado',
                description: 'El registro ha sido eliminado correctamente.',
            })
        } catch (error) {
            toast({
                title: 'Error',
                description: 'No se pudo eliminar el registro',
                variant: 'destructive',
            })
        }
    }

    const periodLabel = useMemo(() => {
        if (filterPeriod === 'week' && dateRange) {
            return `${format(dateRange.start, 'd MMM', { locale: es })} - ${format(dateRange.end, 'd MMM, yyyy', { locale: es })}`
        }
        if (filterPeriod === 'month') {
            return format(currentDate, 'MMMM yyyy', { locale: es })
        }
        return 'Todo el historial'
    }, [filterPeriod, dateRange, currentDate])

    return (
        <div className="space-y-6">
            {/* Filters and navigation */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                    {filterPeriod !== 'all' && (
                        <>
                            <Button variant="ghost" size="icon" onClick={() => navigatePeriod('prev')}>
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <span className="text-sm font-medium min-w-[180px] text-center capitalize">
                                {periodLabel}
                            </span>
                            <Button variant="ghost" size="icon" onClick={() => navigatePeriod('next')}>
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </>
                    )}
                </div>

                <div className="flex gap-2">
                    {(['week', 'month', 'all'] as FilterPeriod[]).map((period) => (
                        <Button
                            key={period}
                            variant={filterPeriod === period ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setFilterPeriod(period)}
                        >
                            {period === 'week' ? 'Semana' : period === 'month' ? 'Mes' : 'Todo'}
                        </Button>
                    ))}
                </div>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-primary/10">
                                <Clock className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Total trabajado</p>
                                <p className="text-xl font-bold">{formatHours(totals.totalHours)}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-warning/10">
                                <Coffee className="h-5 w-5 text-warning" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Total pausas</p>
                                <p className="text-xl font-bold">{formatHours(totals.totalPauseHours)}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-success/10">
                                <CalendarIcon className="h-5 w-5 text-success" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Días registrados</p>
                                <p className="text-xl font-bold">{Object.keys(groupedEntries).length}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Entries list */}
            <Card>
                <CardHeader>
                    <CardTitle>Registros</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex justify-center py-8">
                            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : Object.keys(groupedEntries).length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            No hay registros para este período
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {Object.entries(groupedEntries).map(([date, dayEntries]) => (
                                <div key={date}>
                                    <h3 className="text-sm font-medium text-muted-foreground mb-3 capitalize">
                                        {format(parseISO(date), "EEEE, d 'de' MMMM", { locale: es })}
                                    </h3>
                                    <div className="space-y-2">
                                        {dayEntries.map((entry) => {
                                            const hours = entry.total_hours || calculateWorkedHours(entry)
                                            const pauseMinutes = calculatePauseDuration(entry.pauses || [])

                                            return (
                                                <div
                                                    key={entry.id}
                                                    className={cn(
                                                        'flex items-center justify-between p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors',
                                                        entry.status === 'active' && 'border-l-4 border-success'
                                                    )}
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <div className="flex flex-col items-center text-sm">
                                                            <span className="font-medium">{formatTime(entry.clock_in)}</span>
                                                            <span className="text-muted-foreground text-xs">entrada</span>
                                                        </div>
                                                        <div className="w-8 h-px bg-border" />
                                                        <div className="flex flex-col items-center text-sm">
                                                            <span className="font-medium">
                                                                {entry.clock_out ? formatTime(entry.clock_out) : '--:--'}
                                                            </span>
                                                            <span className="text-muted-foreground text-xs">salida</span>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-6">
                                                        {pauseMinutes > 0 && (
                                                            <div className="flex items-center gap-1 text-sm text-warning">
                                                                <Coffee className="h-4 w-4" />
                                                                {Math.round(pauseMinutes)}min
                                                            </div>
                                                        )}
                                                        <div className="text-right">
                                                            <p className="font-semibold">{formatHours(hours)}</p>
                                                            <p className="text-xs text-muted-foreground">
                                                                {entry.edited_manually && 'Editado'}
                                                            </p>
                                                        </div>
                                                        <div className="flex gap-1">
                                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                                <Edit2 className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 text-destructive hover:text-destructive"
                                                                onClick={() => handleDelete(entry.id)}
                                                                disabled={entry.status === 'active'}
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
