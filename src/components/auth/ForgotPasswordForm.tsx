import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link } from 'react-router-dom'
import { Clock, Loader2, ArrowLeft, Mail } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

const forgotPasswordSchema = z.object({
    email: z.string().email('Email inválido'),
})

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>

export function ForgotPasswordForm() {
    const [isLoading, setIsLoading] = useState(false)
    const [isEmailSent, setIsEmailSent] = useState(false)
    const { resetPassword } = useAuth()
    const { toast } = useToast()

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<ForgotPasswordFormData>({
        resolver: zodResolver(forgotPasswordSchema),
    })

    const onSubmit = async (data: ForgotPasswordFormData) => {
        setIsLoading(true)
        try {
            await resetPassword(data.email)
            setIsEmailSent(true)
            toast({
                title: 'Email enviado',
                description: 'Revisa tu bandeja de entrada para restablecer tu contraseña.',
            })
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Error al enviar email'
            toast({
                title: 'Error',
                description: message,
                variant: 'destructive',
            })
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <div className="w-full max-w-md">
                {/* Logo and Branding */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary mb-4">
                        <Clock className="w-8 h-8 text-primary-foreground" />
                    </div>
                    <h1 className="text-3xl font-bold text-gradient">TimeTrack</h1>
                </div>

                <Card className="shadow-xl border-0 bg-card/80 backdrop-blur-sm">
                    <CardHeader className="space-y-1">
                        <CardTitle className="text-2xl text-center">
                            {isEmailSent ? 'Email Enviado' : 'Recuperar Contraseña'}
                        </CardTitle>
                        <CardDescription className="text-center">
                            {isEmailSent
                                ? 'Te hemos enviado un enlace para restablecer tu contraseña'
                                : 'Ingresa tu email para recibir un enlace de recuperación'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isEmailSent ? (
                            <div className="text-center space-y-4">
                                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-success/10 mb-4">
                                    <Mail className="w-8 h-8 text-success" />
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    Revisa tu bandeja de entrada y sigue las instrucciones del email.
                                    Si no lo encuentras, revisa la carpeta de spam.
                                </p>
                                <Button
                                    variant="outline"
                                    className="mt-4"
                                    onClick={() => setIsEmailSent(false)}
                                >
                                    Enviar de nuevo
                                </Button>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="tu@email.com"
                                        {...register('email')}
                                        disabled={isLoading}
                                        className={errors.email ? 'border-destructive' : ''}
                                    />
                                    {errors.email && (
                                        <p className="text-sm text-destructive">{errors.email.message}</p>
                                    )}
                                </div>

                                <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Enviando...
                                        </>
                                    ) : (
                                        'Enviar Email de Recuperación'
                                    )}
                                </Button>
                            </form>
                        )}
                    </CardContent>
                    <CardFooter className="flex justify-center">
                        <Link
                            to="/login"
                            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Volver a iniciar sesión
                        </Link>
                    </CardFooter>
                </Card>
            </div>
        </div>
    )
}
