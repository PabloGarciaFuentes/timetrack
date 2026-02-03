// User profile linked to Supabase auth
export interface Profile {
    id: string
    full_name: string | null
    avatar_url?: string | null
    created_at: string
    updated_at: string
}

// Time entry status
export type TimeEntryStatus = 'active' | 'paused' | 'completed'

// Pause types
export type PauseType = 'meal' | 'break' | 'other'

// Time entry record
export interface TimeEntry {
    id: string
    user_id: string
    date: string
    clock_in: string
    clock_out: string | null
    total_hours: number | null
    status: TimeEntryStatus
    edited_manually: boolean
    notes?: string | null
    created_at: string
    updated_at: string
    pauses?: Pause[]
}

// Pause record
export interface Pause {
    id: string
    time_entry_id: string
    start_time: string
    end_time: string | null
    type: PauseType
    duration: number | null // in minutes
    created_at: string
    updated_at: string
}

// Daily statistics
export interface DailyStats {
    date: string
    totalWorked: number // in hours
    totalPaused: number // in hours
    entries: number
}

// Weekly statistics
export interface WeeklyStats {
    totalHours: number
    averageDaily: number
    daysWorked: number
    dailyBreakdown: {
        date: string
        dayName: string
        hours: number
    }[]
}

// Monthly statistics
export interface MonthlyStats {
    totalHours: number
    averageDaily: number
    daysWorked: number
    weeklyBreakdown: {
        weekNumber: number
        hours: number
    }[]
}

// Current tracking state
export interface TrackingState {
    isWorking: boolean
    isPaused: boolean
    currentEntry: TimeEntry | null
    currentPause: Pause | null
    elapsedTime: number // in seconds
    pausedTime: number // in seconds
}

// Time calculations
export interface TimeCalculation {
    hours: number
    minutes: number
    seconds: number
    formatted: string
}

// Export data format
export interface ExportRow {
    fecha: string
    horaEntrada: string
    horaSalida: string
    pausas: string
    totalHoras: string
}

// Supabase database types
export interface Database {
    public: {
        Tables: {
            profiles: {
                Row: Profile
                Insert: Omit<Profile, 'created_at' | 'updated_at'>
                Update: Partial<Omit<Profile, 'id' | 'created_at'>>
            }
            time_entries: {
                Row: TimeEntry
                Insert: Omit<TimeEntry, 'id' | 'created_at' | 'updated_at' | 'pauses'>
                Update: Partial<Omit<TimeEntry, 'id' | 'user_id' | 'created_at' | 'pauses'>>
            }
            pauses: {
                Row: Pause
                Insert: Omit<Pause, 'id' | 'created_at' | 'updated_at'>
                Update: Partial<Omit<Pause, 'id' | 'time_entry_id' | 'created_at'>>
            }
        }
    }
}
