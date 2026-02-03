import {
    differenceInMinutes,
    differenceInSeconds,
    startOfWeek,
    endOfWeek,
    startOfMonth,
    endOfMonth,
    eachDayOfInterval,
    format,
    isAfter,
    isBefore,
    parseISO,
} from 'date-fns'
import { es } from 'date-fns/locale'
import type { TimeEntry, Pause, DailyStats, WeeklyStats, MonthlyStats } from '@/types'

/**
 * Calculate worked hours for a time entry (excluding pauses)
 */
export function calculateWorkedHours(entry: TimeEntry): number {
    if (!entry.clock_out) return 0

    const clockIn = new Date(entry.clock_in)
    const clockOut = new Date(entry.clock_out)
    const totalMinutes = differenceInMinutes(clockOut, clockIn)

    const pauseMinutes = (entry.pauses || [])
        .filter((p) => p.end_time)
        .reduce((sum, p) => {
            return sum + differenceInMinutes(new Date(p.end_time!), new Date(p.start_time))
        }, 0)

    return Math.max(0, (totalMinutes - pauseMinutes) / 60)
}

/**
 * Calculate total pause duration in minutes
 */
export function calculatePauseDuration(pauses: Pause[]): number {
    return pauses
        .filter((p) => p.end_time)
        .reduce((sum, p) => {
            return sum + differenceInMinutes(new Date(p.end_time!), new Date(p.start_time))
        }, 0)
}

/**
 * Calculate total pause duration in seconds
 */
export function calculatePauseSeconds(pauses: Pause[]): number {
    return pauses
        .filter((p) => p.end_time)
        .reduce((sum, p) => {
            return sum + differenceInSeconds(new Date(p.end_time!), new Date(p.start_time))
        }, 0)
}

/**
 * Calculate elapsed time in seconds from a start time
 */
export function calculateElapsedSeconds(startTime: string): number {
    return differenceInSeconds(new Date(), new Date(startTime))
}

/**
 * Get daily stats from time entries
 */
export function getDailyStats(entries: TimeEntry[], date: string): DailyStats {
    const dayEntries = entries.filter((e) => e.date === date)
    const totalWorked = dayEntries.reduce((sum, e) => sum + (e.total_hours || calculateWorkedHours(e)), 0)
    const totalPaused = dayEntries.reduce((sum, e) => {
        const pauseMinutes = calculatePauseDuration(e.pauses || [])
        return sum + pauseMinutes / 60
    }, 0)

    return {
        date,
        totalWorked,
        totalPaused,
        entries: dayEntries.length,
    }
}

/**
 * Get weekly stats from time entries
 */
export function getWeeklyStats(entries: TimeEntry[], referenceDate: Date = new Date()): WeeklyStats {
    const weekStart = startOfWeek(referenceDate, { weekStartsOn: 1 }) // Monday
    const weekEnd = endOfWeek(referenceDate, { weekStartsOn: 1 })

    const weekEntries = entries.filter((e) => {
        const entryDate = parseISO(e.date)
        return !isBefore(entryDate, weekStart) && !isAfter(entryDate, weekEnd)
    })

    const totalHours = weekEntries.reduce((sum, e) => sum + (e.total_hours || calculateWorkedHours(e)), 0)
    const daysWorked = new Set(weekEntries.map((e) => e.date)).size

    const days = eachDayOfInterval({ start: weekStart, end: weekEnd })
    const dailyBreakdown = days.map((day) => {
        const dateStr = format(day, 'yyyy-MM-dd')
        const dayEntries = weekEntries.filter((e) => e.date === dateStr)
        const hours = dayEntries.reduce((sum, e) => sum + (e.total_hours || calculateWorkedHours(e)), 0)

        return {
            date: dateStr,
            dayName: format(day, 'EEE', { locale: es }),
            hours,
        }
    })

    return {
        totalHours,
        averageDaily: daysWorked > 0 ? totalHours / daysWorked : 0,
        daysWorked,
        dailyBreakdown,
    }
}

/**
 * Get monthly stats from time entries
 */
export function getMonthlyStats(entries: TimeEntry[], referenceDate: Date = new Date()): MonthlyStats {
    const monthStart = startOfMonth(referenceDate)
    const monthEnd = endOfMonth(referenceDate)

    const monthEntries = entries.filter((e) => {
        const entryDate = parseISO(e.date)
        return !isBefore(entryDate, monthStart) && !isAfter(entryDate, monthEnd)
    })

    const totalHours = monthEntries.reduce((sum, e) => sum + (e.total_hours || calculateWorkedHours(e)), 0)
    const daysWorked = new Set(monthEntries.map((e) => e.date)).size

    // Group by week
    const weeklyMap = new Map<number, number>()
    monthEntries.forEach((e) => {
        const entryDate = parseISO(e.date)
        const weekNumber = Math.ceil(entryDate.getDate() / 7)
        const hours = e.total_hours || calculateWorkedHours(e)
        weeklyMap.set(weekNumber, (weeklyMap.get(weekNumber) || 0) + hours)
    })

    const weeklyBreakdown = Array.from(weeklyMap.entries())
        .map(([weekNumber, hours]) => ({ weekNumber, hours }))
        .sort((a, b) => a.weekNumber - b.weekNumber)

    return {
        totalHours,
        averageDaily: daysWorked > 0 ? totalHours / daysWorked : 0,
        daysWorked,
        weeklyBreakdown,
    }
}

/**
 * Calculate time distribution (work vs pause)
 */
export function calculateTimeDistribution(entries: TimeEntry[]): {
    workHours: number
    pauseHours: number
    totalHours: number
} {
    let workHours = 0
    let pauseHours = 0

    entries.forEach((entry) => {
        workHours += entry.total_hours || calculateWorkedHours(entry)
        pauseHours += calculatePauseDuration(entry.pauses || []) / 60
    })

    return {
        workHours,
        pauseHours,
        totalHours: workHours + pauseHours,
    }
}

/**
 * Export entries to CSV format
 */
export function exportToCSV(entries: TimeEntry[]): string {
    const headers = ['Fecha', 'Hora Entrada', 'Hora Salida', 'Pausas (min)', 'Total Horas']
    const rows = entries.map((entry) => {
        const pauseMinutes = calculatePauseDuration(entry.pauses || [])
        const totalHours = entry.total_hours || calculateWorkedHours(entry)

        return [
            entry.date,
            format(new Date(entry.clock_in), 'HH:mm'),
            entry.clock_out ? format(new Date(entry.clock_out), 'HH:mm') : '-',
            pauseMinutes.toString(),
            totalHours.toFixed(2),
        ].join(',')
    })

    return [headers.join(','), ...rows].join('\n')
}

/**
 * Download CSV file
 */
export function downloadCSV(content: string, filename: string = 'control-horario.csv') {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)

    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'

    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
}
