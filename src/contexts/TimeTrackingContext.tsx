import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { isDemoMode, DEMO_ENTRIES, DEMO_USER } from '@/lib/demo-data'
import type { TimeEntry, Pause, TrackingState, PauseType } from '@/types'
import { calculateWorkedHours, calculateElapsedSeconds, calculatePauseSeconds } from '@/lib/calculations'
import { getTodayDate } from '@/lib/utils'

interface TimeTrackingContextType {
    state: TrackingState
    loading: boolean
    entries: TimeEntry[]
    clockIn: () => Promise<void>
    clockOut: () => Promise<void>
    startPause: (type: PauseType) => Promise<void>
    endPause: () => Promise<void>
    refreshState: () => Promise<void>
}

const initialState: TrackingState = {
    isWorking: false,
    isPaused: false,
    currentEntry: null,
    currentPause: null,
    elapsedTime: 0,
    pausedTime: 0,
}

const TimeTrackingContext = createContext<TimeTrackingContextType | undefined>(undefined)

export function TimeTrackingProvider({ children }: { children: ReactNode }) {
    const { user, isDemo } = useAuth()
    const [state, setState] = useState<TrackingState>(initialState)
    const [loading, setLoading] = useState(true)
    const [entries, setEntries] = useState<TimeEntry[]>([])

    // Fetch current active entry
    const fetchActiveEntry = useCallback(async () => {
        if (!user) {
            setState(initialState)
            setEntries([])
            setLoading(false)
            return
        }

        // Demo mode - use mock data
        if (isDemo || isDemoMode()) {
            const demoEntries = [...DEMO_ENTRIES]
            setEntries(demoEntries)

            // Find active entry
            const activeEntry = demoEntries.find(e => e.status === 'active' || e.status === 'paused')

            if (activeEntry) {
                const activePause = activeEntry.pauses?.find((p) => !p.end_time) || null
                const pausedSeconds = calculatePauseSeconds(activeEntry.pauses || [])

                setState({
                    isWorking: activeEntry.status === 'active',
                    isPaused: activeEntry.status === 'paused',
                    currentEntry: activeEntry,
                    currentPause: activePause,
                    elapsedTime: calculateElapsedSeconds(activeEntry.clock_in),
                    pausedTime: pausedSeconds,
                })
            } else {
                setState(initialState)
            }
            setLoading(false)
            return
        }

        try {
            // Get active time entry for today
            const { data: entriesData, error } = await supabase
                .from('time_entries')
                .select('*, pauses(*)')
                .eq('user_id', user.id)
                .in('status', ['active', 'paused'])
                .order('created_at', { ascending: false })
                .limit(1)

            if (error) throw error

            const activeEntry = entriesData?.[0] as TimeEntry | undefined

            if (activeEntry) {
                const activePause = activeEntry.pauses?.find((p) => !p.end_time) || null
                const pausedSeconds = calculatePauseSeconds(activeEntry.pauses || [])

                setState({
                    isWorking: activeEntry.status === 'active',
                    isPaused: activeEntry.status === 'paused',
                    currentEntry: activeEntry,
                    currentPause: activePause,
                    elapsedTime: calculateElapsedSeconds(activeEntry.clock_in),
                    pausedTime: pausedSeconds,
                })
            } else {
                setState(initialState)
            }
        } catch (error) {
            console.error('Error fetching active entry:', error)
        } finally {
            setLoading(false)
        }
    }, [user, isDemo])

    // Update elapsed time every second
    useEffect(() => {
        let interval: NodeJS.Timeout | null = null

        if (state.currentEntry) {
            interval = setInterval(() => {
                setState((prev) => ({
                    ...prev,
                    elapsedTime: calculateElapsedSeconds(prev.currentEntry!.clock_in),
                }))
            }, 1000)
        }

        return () => {
            if (interval) clearInterval(interval)
        }
    }, [state.currentEntry])

    // Update pause time every second when paused
    useEffect(() => {
        let interval: NodeJS.Timeout | null = null

        if (state.isPaused && state.currentPause) {
            interval = setInterval(() => {
                const currentPauseSeconds = calculateElapsedSeconds(state.currentPause!.start_time)
                const previousPauseSeconds = calculatePauseSeconds(
                    state.currentEntry?.pauses?.filter((p) => p.end_time) || []
                )
                setState((prev) => ({
                    ...prev,
                    pausedTime: previousPauseSeconds + currentPauseSeconds,
                }))
            }, 1000)
        }

        return () => {
            if (interval) clearInterval(interval)
        }
    }, [state.isPaused, state.currentPause, state.currentEntry?.pauses])

    // Fetch on mount and user change
    useEffect(() => {
        fetchActiveEntry()
    }, [fetchActiveEntry])

    // Clock in
    const clockIn = async () => {
        if (!user) throw new Error('No user logged in')

        const now = new Date().toISOString()
        const today = getTodayDate()

        // Demo mode - local state only
        if (isDemo || isDemoMode()) {
            const newEntry: TimeEntry = {
                id: `demo-entry-${Date.now()}`,
                user_id: DEMO_USER.id,
                date: today,
                clock_in: now,
                clock_out: null,
                status: 'active',
                total_hours: null,
                edited_manually: false,
                notes: null,
                created_at: now,
                updated_at: now,
                pauses: [],
            }

            setEntries(prev => [newEntry, ...prev])
            setState({
                isWorking: true,
                isPaused: false,
                currentEntry: newEntry,
                currentPause: null,
                elapsedTime: 0,
                pausedTime: 0,
            })
            return
        }

        const { data, error } = await supabase
            .from('time_entries')
            .insert({
                user_id: user.id,
                date: today,
                clock_in: now,
                status: 'active',
                edited_manually: false,
            })
            .select()
            .single()

        if (error) throw error

        setState({
            isWorking: true,
            isPaused: false,
            currentEntry: data as TimeEntry,
            currentPause: null,
            elapsedTime: 0,
            pausedTime: 0,
        })
    }

    // Clock out
    const clockOut = async () => {
        if (!state.currentEntry) throw new Error('No active entry')

        // End any active pause first
        if (state.currentPause) {
            await endPause()
        }

        const now = new Date().toISOString()
        const totalHours = calculateWorkedHours({
            ...state.currentEntry,
            clock_out: now,
        })

        // Demo mode - local state only
        if (isDemo || isDemoMode()) {
            const updatedEntry = {
                ...state.currentEntry,
                clock_out: now,
                status: 'completed' as const,
                total_hours: totalHours,
            }

            setEntries(prev => prev.map(e =>
                e.id === state.currentEntry!.id ? updatedEntry : e
            ))
            setState(initialState)
            return
        }

        const { error } = await supabase
            .from('time_entries')
            .update({
                clock_out: now,
                status: 'completed',
                total_hours: totalHours,
            })
            .eq('id', state.currentEntry.id)

        if (error) throw error

        setState(initialState)
    }

    // Start pause
    const startPause = async (type: PauseType) => {
        if (!state.currentEntry) throw new Error('No active entry')

        const now = new Date().toISOString()

        // Demo mode - local state only
        if (isDemo || isDemoMode()) {
            const newPause: Pause = {
                id: `demo-pause-${Date.now()}`,
                time_entry_id: state.currentEntry.id,
                start_time: now,
                end_time: null,
                type,
                duration: null,
                created_at: now,
                updated_at: now,
            }

            const updatedEntry = {
                ...state.currentEntry,
                status: 'paused' as const,
                pauses: [...(state.currentEntry.pauses || []), newPause],
            }

            setEntries(prev => prev.map(e =>
                e.id === state.currentEntry!.id ? updatedEntry : e
            ))

            setState(prev => ({
                ...prev,
                isWorking: false,
                isPaused: true,
                currentEntry: updatedEntry,
                currentPause: newPause,
            }))
            return
        }

        // Update entry status
        const { error: entryError } = await supabase
            .from('time_entries')
            .update({ status: 'paused' })
            .eq('id', state.currentEntry.id)

        if (entryError) throw entryError

        // Create pause
        const { data, error: pauseError } = await supabase
            .from('pauses')
            .insert({
                time_entry_id: state.currentEntry.id,
                start_time: now,
                type,
            })
            .select()
            .single()

        if (pauseError) throw pauseError

        setState((prev) => ({
            ...prev,
            isWorking: false,
            isPaused: true,
            currentEntry: { ...prev.currentEntry!, status: 'paused' },
            currentPause: data as Pause,
        }))
    }

    // End pause
    const endPause = async () => {
        if (!state.currentPause || !state.currentEntry) throw new Error('No active pause')

        const now = new Date().toISOString()
        const duration = Math.round(calculateElapsedSeconds(state.currentPause.start_time) / 60)

        // Demo mode - local state only
        if (isDemo || isDemoMode()) {
            const updatedPauses = state.currentEntry.pauses?.map(p =>
                p.id === state.currentPause!.id
                    ? { ...p, end_time: now, duration }
                    : p
            ) || []

            const updatedEntry = {
                ...state.currentEntry,
                status: 'active' as const,
                pauses: updatedPauses,
            }

            setEntries(prev => prev.map(e =>
                e.id === state.currentEntry!.id ? updatedEntry : e
            ))

            const pausedSeconds = calculatePauseSeconds(updatedPauses)

            setState({
                isWorking: true,
                isPaused: false,
                currentEntry: updatedEntry,
                currentPause: null,
                elapsedTime: calculateElapsedSeconds(updatedEntry.clock_in),
                pausedTime: pausedSeconds,
            })
            return
        }

        // Update pause
        const { error: pauseError } = await supabase
            .from('pauses')
            .update({
                end_time: now,
                duration,
            })
            .eq('id', state.currentPause.id)

        if (pauseError) throw pauseError

        // Update entry status
        const { error: entryError } = await supabase
            .from('time_entries')
            .update({ status: 'active' })
            .eq('id', state.currentEntry.id)

        if (entryError) throw entryError

        // Refresh to get updated pauses
        await fetchActiveEntry()
    }

    const value = {
        state,
        loading,
        entries,
        clockIn,
        clockOut,
        startPause,
        endPause,
        refreshState: fetchActiveEntry,
    }

    return (
        <TimeTrackingContext.Provider value={value}>
            {children}
        </TimeTrackingContext.Provider>
    )
}

export function useTimeTrackingContext() {
    const context = useContext(TimeTrackingContext)
    if (context === undefined) {
        throw new Error('useTimeTrackingContext must be used within a TimeTrackingProvider')
    }
    return context
}
