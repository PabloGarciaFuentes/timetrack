import { useEffect, useState, useMemo } from 'react'
import { Zap, Activity, Timer, Coffee } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatsCard } from '@/components/dashboard/StatsCard'
import { DonutChart } from '@/components/dashboard/DonutChart'
import { WeeklyChart } from '@/components/dashboard/WeeklyChart'
import { TimeClockControls } from '@/components/time-tracking/TimeClockControls'
import { CurrentStatus } from '@/components/time-tracking/CurrentStatus'
import { useTimeTracking } from '@/hooks/useTimeTracking'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { getWeeklyStats } from '@/lib/calculations'
import { formatHours } from '@/lib/utils'
import type { TimeEntry } from '@/types'

export function Dashboard() {
    const { user, isDemo } = useAuth()
    const { state, loading: trackingLoading, entries: contextEntries } = useTimeTracking()
    const [entries, setEntries] = useState<TimeEntry[]>([])
    const [isLoading, setLoading] = useState(true)

    // Fetch entries
    useEffect(() => {
        async function fetchEntries() {
            if (!user) return

            // Demo mode: use entries from context
            if (isDemo) {
                setEntries(contextEntries)
                setLoading(false)
                return
            }

            // Production mode: fetch from Supabase
            const thirtyDaysAgo = new Date()
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

            const { data, error } = await supabase
                .from('time_entries')
                .select('*, pauses(*)')
                .eq('user_id', user.id)
                .gte('date', thirtyDaysAgo.toISOString().split('T')[0])
                .order('date', { ascending: false })

            if (!error && data) {
                setEntries(data as TimeEntry[])
            }
            setLoading(false)
        }

        fetchEntries()
    }, [user, isDemo, contextEntries])

    // Calculate stats
    const weeklyStats = useMemo(() => getWeeklyStats(entries), [entries])

    // Get today's date string
    const todayDateStr = new Date().toISOString().split('T')[0]

    // Calculate TODAY's total work time across ALL sessions + current active session
    const todayTotalWorkSeconds = useMemo(() => {
        // Sum completed entries for today
        const completedTodayEntries = entries.filter(
            e => e.date === todayDateStr && e.status === 'completed'
        )

        const completedWorkSeconds = completedTodayEntries.reduce((sum, entry) => {
            const hours = entry.total_hours || 0
            return sum + hours * 3600
        }, 0)

        // Add current session elapsed time (minus pauses)
        const currentSessionWorkSeconds = state.currentEntry
            ? state.elapsedTime - state.pausedTime
            : 0

        return completedWorkSeconds + currentSessionWorkSeconds
    }, [entries, todayDateStr, state.currentEntry, state.elapsedTime, state.pausedTime])

    // Calculate TODAY's total pause time across ALL sessions + current active session
    const todayTotalPauseSeconds = useMemo(() => {
        // Sum completed entries' pauses for today
        const todayEntries = entries.filter(e => e.date === todayDateStr)

        const completedPauseSeconds = todayEntries.reduce((sum, entry) => {
            // Skip current entry pauses (handled separately)
            if (state.currentEntry && entry.id === state.currentEntry.id) return sum

            const pauseSeconds = (entry.pauses || [])
                .filter(p => p.end_time)
                .reduce((pSum, p) => {
                    const start = new Date(p.start_time).getTime()
                    const end = new Date(p.end_time!).getTime()
                    return pSum + (end - start) / 1000
                }, 0)
            return sum + pauseSeconds
        }, 0)

        // Add current session pause time
        return completedPauseSeconds + state.pausedTime
    }, [entries, todayDateStr, state.currentEntry, state.pausedTime])

    // Real-time activity data for DonutChart - Only today's data
    const activityData = useMemo(() => {
        const hoursToday = todayTotalWorkSeconds / 3600
        const pauseHoursToday = todayTotalPauseSeconds / 3600

        return [
            { name: 'Trabajo', value: Math.round(hoursToday * 10) / 10, color: 'hsl(217, 91%, 60%)' },
            { name: 'Pausas', value: Math.round(pauseHoursToday * 10) / 10, color: 'hsl(38, 92%, 50%)' },
        ]
    }, [todayTotalWorkSeconds, todayTotalPauseSeconds])

    // Real-time values for Activity card
    const todayWorkHours = todayTotalWorkSeconds / 3600
    const todayPauseHours = todayTotalPauseSeconds / 3600
    const currentStatus = state.isWorking ? 'Trabajando' : state.isPaused ? 'Pausado' : 'Inactivo'

    // Format helpers
    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600)
        const m = Math.floor((seconds % 3600) / 60)
        return `${h}h ${m}m`
    }

    const startTime = state.currentEntry?.clock_in
        ? new Date(state.currentEntry.clock_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : '--:--'

    if (isLoading || trackingLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Top Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatsCard
                    title="Tiempo Hoy"
                    value={formatTime(todayTotalWorkSeconds)}
                    subtitle="Tiempo activo"
                    icon={<Timer className="w-5 h-5 text-primary" />}
                    variant="primary"
                />
                <StatsCard
                    title="Inicio Jornada"
                    value={startTime}
                    subtitle={state.currentEntry ? 'Entrada registrada' : 'Sin registro actual'}
                    icon={<Zap className="w-5 h-5 text-warning" />}
                    variant="warning"
                />
                <StatsCard
                    title="Descanso Total"
                    value={formatTime(todayTotalPauseSeconds)}
                    subtitle="Pausas tomadas"
                    icon={<Coffee className="w-5 h-5 text-secondary" />}
                    variant="secondary"
                />
                <StatsCard
                    title="Estado Actual"
                    value={currentStatus}
                    subtitle="En tiempo real"
                    icon={<Activity className={`w-5 h-5 ${state.isWorking ? 'text-success' : state.isPaused ? 'text-warning' : 'text-muted-foreground'}`} />}
                    variant={state.isWorking ? 'success' : 'default'}
                />
            </div>

            {/* Main content grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left column - Donut charts */}
                <div className="space-y-6">
                    <DonutChart
                        data={activityData}
                        title="Distribución de Tiempo"
                        centerValue={formatHours(todayWorkHours + todayPauseHours)}
                        centerLabel="Total"
                    />

                    {/* Activity breakdown */}
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg">Actividad</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                        <Timer className="w-4 h-4 text-primary" />
                                    </div>
                                    <span className="text-sm">Trabajando</span>
                                </div>
                                <span className="text-sm font-medium">{formatHours(todayWorkHours)}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-warning/10 flex items-center justify-center">
                                        <Coffee className="w-4 h-4 text-warning" />
                                    </div>
                                    <span className="text-sm">Pausas</span>
                                </div>
                                <span className="text-sm font-medium">{formatHours(todayPauseHours)}</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Center column - Current status and controls */}
                <div className="space-y-6">
                    <Card className="border-0 shadow-lg">
                        <CardContent className="p-8">
                            <CurrentStatus />
                        </CardContent>
                    </Card>

                    <Card className="border-0 shadow-lg">
                        <CardContent className="p-6">
                            <TimeClockControls />
                        </CardContent>
                    </Card>
                </div>

                {/* Right column - Weekly chart */}
                <div>
                    <WeeklyChart
                        data={weeklyStats.dailyBreakdown}
                        title="Análisis Semanal"
                    />
                </div>
            </div>
        </div>
    )
}
