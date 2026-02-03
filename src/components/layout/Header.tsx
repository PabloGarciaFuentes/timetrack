import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Menu, Search, LogOut, User, Settings, Bell, ChevronDown } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/use-toast'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface HeaderProps {
    title: string
    subtitle?: string
    onMenuClick?: () => void
}

export function Header({ title, subtitle, onMenuClick }: HeaderProps) {
    const { user, profile, signOut } = useAuth()
    const { toast } = useToast()
    const navigate = useNavigate()
    const [isLoggingOut, setIsLoggingOut] = useState(false)

    const handleLogout = async () => {
        setIsLoggingOut(true)
        try {
            await signOut()
            toast({
                title: 'Sesión cerrada',
                description: 'Has cerrado sesión correctamente.',
            })
            navigate('/login')
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Error al cerrar sesión',
                variant: 'destructive',
            })
        } finally {
            setIsLoggingOut(false)
        }
    }

    const initials = profile?.full_name
        ?.split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2) || user?.email?.[0].toUpperCase() || 'U'

    const todayDate = format(new Date(), "d MMMM, yyyy", { locale: es })

    return (
        <header className="flex flex-col gap-8 px-6 py-6 md:px-10 pb-2">
            {/* Top Bar: User & Search */}
            <div className="flex items-center justify-between">
                {/* Left: Hamburger & User Profile */}
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="lg:hidden"
                        onClick={onMenuClick}
                    >
                        <Menu className="h-6 w-6" />
                    </Button>

                    {/* User Menu Dropdown */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className="flex items-center gap-3 hover:bg-muted/50 p-2 rounded-xl transition-colors outline-none">
                                <Avatar className="h-10 w-10 md:h-12 md:w-12 border border-border shadow-sm">
                                    <AvatarImage src={profile?.avatar_url || undefined} />
                                    <AvatarFallback className="bg-primary/10 text-primary font-bold">
                                        {initials}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col items-start text-left">
                                    <span className="text-sm font-bold text-foreground leading-none">
                                        {profile?.full_name || 'Usuario'}
                                    </span>
                                    <span className="text-xs text-muted-foreground mt-1">
                                        {user?.email}
                                    </span>
                                </div>
                                <ChevronDown className="h-4 w-4 text-muted-foreground hidden md:block" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-56">
                            <DropdownMenuLabel>Cuenta</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => navigate('/profile')}>
                                <User className="mr-2 h-4 w-4" />
                                Mi Perfil
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => navigate('/profile')}>
                                <Settings className="mr-2 h-4 w-4" />
                                Configuración
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onClick={handleLogout}
                                disabled={isLoggingOut}
                                className="text-destructive focus:text-destructive"
                            >
                                <LogOut className="mr-2 h-4 w-4" />
                                {isLoggingOut ? 'Cerrando...' : 'Cerrar Sesión'}
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                {/* Right: Search & Notifications */}
                <div className="flex items-center gap-3">
                    <div className="relative hidden md:block">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar..."
                            className="pl-10 w-[200px] lg:w-[300px] rounded-full bg-background border shadow-sm focus-visible:ring-1"
                        />
                    </div>
                    <Button variant="outline" size="icon" className="rounded-full h-10 w-10 relative bg-background shadow-sm border">
                        <Bell className="h-5 w-5 text-foreground/70" />
                        <span className="absolute top-2 right-2.5 h-2 w-2 bg-red-500 rounded-full border border-background" />
                    </Button>
                </div>
            </div>

            {/* Bottom Bar: Title & Date */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
                        {title}
                    </h1>
                    {subtitle && (
                        <p className="text-muted-foreground mt-2 text-sm md:text-base">
                            {subtitle}
                        </p>
                    )}
                </div>

                {/* Date Display */}
                <div className="flex items-center self-start md:self-center gap-3 bg-background border shadow-sm rounded-full px-4 py-2">
                    <span className="text-sm font-medium capitalize text-muted-foreground">
                        {todayDate}
                    </span>
                    <div className="h-4 w-px bg-border" />
                    <span className="text-sm font-semibold text-foreground">Hoy</span>
                    <ChevronDown className="h-3 w-3 text-muted-foreground ml-1" />
                </div>
            </div>
        </header>
    )
}
