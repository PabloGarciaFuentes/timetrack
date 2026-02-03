import { useState } from 'react'
import { Play, Square, Coffee, Utensils, Clock } from 'lucide-react'
import { useTimeTracking } from '@/hooks/useTimeTracking'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { PauseType } from '@/types'

export function TimeClockControls() {
    const { state, clockIn, clockOut, startPause, endPause, loading } = useTimeTracking()
    const { toast } = useToast()
    const [isProcessing, setIsProcessing] = useState(false)
    const [showPauseOptions, setShowPauseOptions] = useState(false)

    const handleClockIn = async () => {
        setIsProcessing(true)
        try {
            await clockIn()
            toast({
                title: 'Jornada iniciada',
                description: '¡Buen trabajo! Tu jornada ha comenzado.',
                variant: 'success',
            })
        } catch (error) {
            toast({
                title: 'Error',
                description: 'No se pudo iniciar la jornada',
                variant: 'destructive',
            })
        } finally {
            setIsProcessing(false)
        }
    }

    const handleClockOut = async () => {
        setIsProcessing(true)
        try {
            await clockOut()
            toast({
                title: 'Jornada finalizada',
                description: '¡Buen trabajo! Descansa y hasta mañana.',
                variant: 'success',
            })
        } catch (error) {
            toast({
                title: 'Error',
                description: 'No se pudo finalizar la jornada',
                variant: 'destructive',
            })
        } finally {
            setIsProcessing(false)
        }
    }

    const handleStartPause = async (type: PauseType) => {
        setIsProcessing(true)
        try {
            await startPause(type)
            setShowPauseOptions(false)
            toast({
                title: 'Pausa iniciada',
                description: type === 'meal' ? 'Disfruta tu comida' : 'Tómate un descanso',
            })
        } catch (error) {
            toast({
                title: 'Error',
                description: 'No se pudo iniciar la pausa',
                variant: 'destructive',
            })
        } finally {
            setIsProcessing(false)
        }
    }

    const handleEndPause = async () => {
        setIsProcessing(true)
        try {
            await endPause()
            toast({
                title: 'Pausa finalizada',
                description: '¡De vuelta al trabajo!',
                variant: 'success',
            })
        } catch (error) {
            toast({
                title: 'Error',
                description: 'No se pudo finalizar la pausa',
                variant: 'destructive',
            })
        } finally {
            setIsProcessing(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        )
    }

    // Not working - show Clock In button
    if (!state.currentEntry) {
        return (
            <div className="flex flex-col items-center gap-4">
                <Button
                    onClick={handleClockIn}
                    disabled={isProcessing}
                    size="xl"
                    className="w-full max-w-xs bg-success hover:bg-success/90"
                >
                    <Play className="mr-2 h-5 w-5" />
                    Entrar
                </Button>
                <p className="text-sm text-muted-foreground">
                    Haz clic para iniciar tu jornada
                </p>
            </div>
        )
    }

    // On pause - show Resume button
    if (state.isPaused) {
        return (
            <div className="flex flex-col items-center gap-4">
                <Button
                    onClick={handleEndPause}
                    disabled={isProcessing}
                    size="xl"
                    className="w-full max-w-xs bg-primary hover:bg-primary/90"
                >
                    <Play className="mr-2 h-5 w-5" />
                    Reanudar
                </Button>
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Coffee className="h-4 w-4" />
                    En pausa
                </p>
            </div>
        )
    }

    // Working - show Pause and Clock Out buttons
    return (
        <div className="flex flex-col items-center gap-4">
            <div className="flex gap-3 w-full max-w-sm">
                {/* Clock Out Button */}
                <Button
                    onClick={handleClockOut}
                    disabled={isProcessing}
                    size="lg"
                    variant="destructive"
                    className="flex-1"
                >
                    <Square className="mr-2 h-4 w-4" />
                    Salir
                </Button>

                {/* Pause Button */}
                <div className="relative">
                    <Button
                        onClick={() => setShowPauseOptions(!showPauseOptions)}
                        disabled={isProcessing}
                        size="lg"
                        variant="secondary"
                    >
                        <Coffee className="mr-2 h-4 w-4" />
                        Pausa
                    </Button>

                    {/* Pause options dropdown */}
                    {showPauseOptions && (
                        <div className="absolute top-full mt-2 right-0 bg-card border rounded-xl shadow-lg p-2 min-w-[160px] z-10">
                            <button
                                onClick={() => handleStartPause('meal')}
                                className="flex items-center gap-2 w-full px-3 py-2 text-sm rounded-lg hover:bg-accent transition-colors"
                            >
                                <Utensils className="h-4 w-4" />
                                Comida
                            </button>
                            <button
                                onClick={() => handleStartPause('break')}
                                className="flex items-center gap-2 w-full px-3 py-2 text-sm rounded-lg hover:bg-accent transition-colors"
                            >
                                <Coffee className="h-4 w-4" />
                                Descanso
                            </button>
                            <button
                                onClick={() => handleStartPause('other')}
                                className="flex items-center gap-2 w-full px-3 py-2 text-sm rounded-lg hover:bg-accent transition-colors"
                            >
                                <Clock className="h-4 w-4" />
                                Otra
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <p className="text-sm text-muted-foreground flex items-center gap-2">
                <span className={cn(
                    'w-2 h-2 rounded-full',
                    state.isWorking ? 'bg-success animate-pulse' : 'bg-warning'
                )} />
                Trabajando
            </p>
        </div>
    )
}
