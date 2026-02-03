import { useTimeTracking } from '@/hooks/useTimeTracking'
import { formatElapsedTime, formatTime } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { Clock, Coffee, Briefcase } from 'lucide-react'

export function CurrentStatus() {
    const { state, loading } = useTimeTracking()

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        )
    }

    // Not working
    if (!state.currentEntry) {
        return (
            <div className="text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted mb-4">
                    <Clock className="w-10 h-10 text-muted-foreground" />
                </div>
                <p className="text-4xl font-bold text-muted-foreground">--:--:--</p>
                <p className="text-sm text-muted-foreground mt-2">Sin jornada activa</p>
            </div>
        )
    }

    // Calculate net worked time (excluding pauses)
    const netWorkedSeconds = state.elapsedTime - state.pausedTime

    // Get status info
    const statusInfo = {
        icon: state.isPaused ? Coffee : Briefcase,
        label: state.isPaused ? 'En pausa' : 'Trabajando',
        color: state.isPaused ? 'text-warning' : 'text-success',
        bgColor: state.isPaused ? 'bg-warning/10' : 'bg-success/10',
    }

    return (
        <div className="text-center">
            {/* Status indicator */}
            <div className={cn(
                'inline-flex items-center justify-center w-20 h-20 rounded-full mb-4',
                statusInfo.bgColor
            )}>
                <statusInfo.icon className={cn('w-10 h-10', statusInfo.color)} />
            </div>

            {/* Main timer */}
            <p className="text-5xl font-bold tracking-tight">
                {formatElapsedTime(Math.max(0, netWorkedSeconds))}
            </p>

            {/* Status label */}
            <p className={cn('text-sm font-medium mt-2 flex items-center justify-center gap-2', statusInfo.color)}>
                <span className={cn(
                    'w-2 h-2 rounded-full',
                    state.isPaused ? 'bg-warning' : 'bg-success animate-pulse'
                )} />
                {statusInfo.label}
            </p>

            {/* Additional info */}
            <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
                <div className="bg-muted/50 rounded-xl p-3">
                    <p className="text-muted-foreground text-xs">Hora entrada</p>
                    <p className="font-semibold">{formatTime(state.currentEntry.clock_in)}</p>
                </div>
                <div className="bg-muted/50 rounded-xl p-3">
                    <p className="text-muted-foreground text-xs">Tiempo pausa</p>
                    <p className="font-semibold">{formatElapsedTime(state.pausedTime)}</p>
                </div>
            </div>
        </div>
    )
}
