import type { Profile, TimeEntry, Pause } from '@/types'
import { format, subDays, addHours, addMinutes } from 'date-fns'

// Demo user profile
export const DEMO_USER = {
    id: 'demo-user-123',
    email: 'demo@controlhorario.com',
}

export const DEMO_PROFILE: Profile = {
    id: 'demo-user-123',
    full_name: 'Usuario Demo',
    avatar_url: null,
    created_at: '2024-01-01T00:00:00.000Z',
    updated_at: new Date().toISOString(),
}

// Generate mock time entries for the past 30 days
function generateMockEntries(): TimeEntry[] {
    const entries: TimeEntry[] = []
    const today = new Date()

    for (let i = 0; i < 30; i++) {
        const date = subDays(today, i)
        const dayOfWeek = date.getDay()

        // Skip weekends
        if (dayOfWeek === 0 || dayOfWeek === 6) continue

        // Random start time between 8:00 and 9:30
        const startHour = 8 + Math.random() * 1.5
        const clockIn = new Date(date)
        clockIn.setHours(Math.floor(startHour), Math.floor((startHour % 1) * 60), 0, 0)

        // Random work duration between 7.5 and 9 hours
        const workDuration = 7.5 + Math.random() * 1.5
        const clockOut = addHours(clockIn, workDuration)

        // Generate 1-2 pauses
        const pauses: Pause[] = []
        const numPauses = Math.random() > 0.3 ? 2 : 1

        // Meal pause (around midday)
        const mealStart = addHours(clockIn, 4 + Math.random())
        const mealDuration = 30 + Math.floor(Math.random() * 30) // 30-60 min
        pauses.push({
            id: `pause-meal-${i}`,
            time_entry_id: `entry-${i}`,
            start_time: mealStart.toISOString(),
            end_time: addMinutes(mealStart, mealDuration).toISOString(),
            type: 'meal',
            duration: mealDuration,
            created_at: mealStart.toISOString(),
            updated_at: mealStart.toISOString(),
        })

        // Optional break pause
        if (numPauses === 2) {
            const breakStart = addHours(clockIn, 2 + Math.random())
            const breakDuration = 10 + Math.floor(Math.random() * 10) // 10-20 min
            pauses.push({
                id: `pause-break-${i}`,
                time_entry_id: `entry-${i}`,
                start_time: breakStart.toISOString(),
                end_time: addMinutes(breakStart, breakDuration).toISOString(),
                type: 'break',
                duration: breakDuration,
                created_at: breakStart.toISOString(),
                updated_at: breakStart.toISOString(),
            })
        }

        // Calculate total hours (subtracting pause time)
        const totalPauseMinutes = pauses.reduce((sum, p) => sum + (p.duration || 0), 0)
        const totalHours = workDuration - totalPauseMinutes / 60

        // Today's entry might be active
        const isToday = i === 0
        const status = isToday && Math.random() > 0.5 ? 'active' : 'completed'

        entries.push({
            id: `entry-${i}`,
            user_id: DEMO_USER.id,
            date: format(date, 'yyyy-MM-dd'),
            clock_in: clockIn.toISOString(),
            clock_out: status === 'completed' ? clockOut.toISOString() : null,
            total_hours: status === 'completed' ? Math.round(totalHours * 100) / 100 : null,
            status: status as 'active' | 'completed',
            edited_manually: false,
            notes: null,
            created_at: clockIn.toISOString(),
            updated_at: clockOut.toISOString(),
            pauses,
        })
    }

    return entries
}

export const DEMO_ENTRIES = generateMockEntries()

// Check if demo mode is enabled
export function isDemoMode(): boolean {
    return !import.meta.env.VITE_SUPABASE_URL ||
        import.meta.env.VITE_SUPABASE_URL === 'https://placeholder.supabase.co' ||
        import.meta.env.VITE_SUPABASE_URL.includes('placeholder')
}

// Demo credentials
export const DEMO_CREDENTIALS = {
    email: 'demo@controlhorario.com',
    password: 'demo1234',
}
