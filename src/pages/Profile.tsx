import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { User, Mail, Lock, Save, Loader2, Eye, EyeOff, Trash2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/use-toast'

const profileSchema = z.object({
    fullName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
})

const passwordSchema = z.object({
    newPassword: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
    confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
})

type ProfileFormData = z.infer<typeof profileSchema>
type PasswordFormData = z.infer<typeof passwordSchema>

export function Profile() {
    const { user, profile, updateProfile, updatePassword } = useAuth()
    const { toast } = useToast()
    const [isUpdatingProfile, setIsUpdatingProfile] = useState(false)
    const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)
    const [showNewPassword, setShowNewPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)

    const profileForm = useForm<ProfileFormData>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            fullName: profile?.full_name || '',
        },
    })

    const passwordForm = useForm<PasswordFormData>({
        resolver: zodResolver(passwordSchema),
    })

    const initials = profile?.full_name
        ?.split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2) || user?.email?.[0].toUpperCase() || 'U'

    const handleUpdateProfile = async (data: ProfileFormData) => {
        setIsUpdatingProfile(true)
        try {
            await updateProfile({ full_name: data.fullName })
            toast({
                title: 'Perfil actualizado',
                description: 'Tus datos han sido guardados correctamente.',
                variant: 'success',
            })
        } catch (error) {
            toast({
                title: 'Error',
                description: 'No se pudo actualizar el perfil',
                variant: 'destructive',
            })
        } finally {
            setIsUpdatingProfile(false)
        }
    }

    const handleUpdatePassword = async (data: PasswordFormData) => {
        setIsUpdatingPassword(true)
        try {
            await updatePassword(data.newPassword)
            passwordForm.reset()
            toast({
                title: 'Contraseña actualizada',
                description: 'Tu contraseña ha sido cambiada correctamente.',
                variant: 'success',
            })
        } catch (error) {
            toast({
                title: 'Error',
                description: 'No se pudo actualizar la contraseña',
                variant: 'destructive',
            })
        } finally {
            setIsUpdatingPassword(false)
        }
    }

    const handleDeleteAccount = async () => {
        if (!confirm('¿Estás seguro de eliminar tu cuenta? Esta acción no se puede deshacer.')) return
        if (!confirm('¿Realmente deseas eliminar todos tus datos? Esto es permanente.')) return

        toast({
            title: 'Función no disponible',
            description: 'Para eliminar tu cuenta, contacta con soporte.',
        })
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            {/* Profile Info */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <User className="h-5 w-5" />
                        Información Personal
                    </CardTitle>
                    <CardDescription>
                        Actualiza tu información de perfil
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Avatar */}
                    <div className="flex items-center gap-4">
                        <Avatar className="h-20 w-20 border-2 border-primary/20">
                            <AvatarImage src={profile?.avatar_url || undefined} />
                            <AvatarFallback className="text-2xl bg-primary text-primary-foreground font-semibold">
                                {initials}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="font-medium">{profile?.full_name || 'Usuario'}</p>
                            <p className="text-sm text-muted-foreground">{user?.email}</p>
                        </div>
                    </div>

                    {/* Profile form */}
                    <form onSubmit={profileForm.handleSubmit(handleUpdateProfile)} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="fullName">Nombre completo</Label>
                            <Input
                                id="fullName"
                                {...profileForm.register('fullName')}
                                disabled={isUpdatingProfile}
                                className={profileForm.formState.errors.fullName ? 'border-destructive' : ''}
                            />
                            {profileForm.formState.errors.fullName && (
                                <p className="text-sm text-destructive">{profileForm.formState.errors.fullName.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="email"
                                    type="email"
                                    value={user?.email || ''}
                                    disabled
                                    className="pl-10 bg-muted"
                                />
                            </div>
                            <p className="text-xs text-muted-foreground">El email no se puede cambiar</p>
                        </div>

                        <Button type="submit" disabled={isUpdatingProfile}>
                            {isUpdatingProfile ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Guardando...
                                </>
                            ) : (
                                <>
                                    <Save className="mr-2 h-4 w-4" />
                                    Guardar cambios
                                </>
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {/* Password change */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Lock className="h-5 w-5" />
                        Cambiar Contraseña
                    </CardTitle>
                    <CardDescription>
                        Actualiza tu contraseña de acceso
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={passwordForm.handleSubmit(handleUpdatePassword)} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="newPassword">Nueva contraseña</Label>
                            <div className="relative">
                                <Input
                                    id="newPassword"
                                    type={showNewPassword ? 'text' : 'password'}
                                    placeholder="••••••••"
                                    {...passwordForm.register('newPassword')}
                                    disabled={isUpdatingPassword}
                                    className={passwordForm.formState.errors.newPassword ? 'border-destructive pr-10' : 'pr-10'}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowNewPassword(!showNewPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                    tabIndex={-1}
                                >
                                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                            {passwordForm.formState.errors.newPassword && (
                                <p className="text-sm text-destructive">{passwordForm.formState.errors.newPassword.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
                            <div className="relative">
                                <Input
                                    id="confirmPassword"
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    placeholder="••••••••"
                                    {...passwordForm.register('confirmPassword')}
                                    disabled={isUpdatingPassword}
                                    className={passwordForm.formState.errors.confirmPassword ? 'border-destructive pr-10' : 'pr-10'}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                    tabIndex={-1}
                                >
                                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                            {passwordForm.formState.errors.confirmPassword && (
                                <p className="text-sm text-destructive">{passwordForm.formState.errors.confirmPassword.message}</p>
                            )}
                        </div>

                        <Button type="submit" disabled={isUpdatingPassword}>
                            {isUpdatingPassword ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Actualizando...
                                </>
                            ) : (
                                'Cambiar contraseña'
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {/* Danger zone */}
            <Card className="border-destructive/50">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-destructive">
                        <Trash2 className="h-5 w-5" />
                        Zona de peligro
                    </CardTitle>
                    <CardDescription>
                        Acciones irreversibles para tu cuenta
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                        Una vez eliminada tu cuenta, todos tus datos serán borrados permanentemente.
                    </p>
                    <Button variant="destructive" onClick={handleDeleteAccount}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Eliminar cuenta
                    </Button>
                </CardContent>
            </Card>
        </div>
    )
}
