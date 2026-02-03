import { NavLink, useLocation } from 'react-router-dom'
import {
    LayoutDashboard,
    History,
    FileBarChart,
    User,
    Clock,
    Rocket,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Historial', href: '/history', icon: History },
    { name: 'Reportes', href: '/reports', icon: FileBarChart },
    { name: 'Perfil', href: '/profile', icon: User },
]

interface SidebarProps {
    isOpen?: boolean
    onClose?: () => void
}

export function Sidebar({ isOpen = true, onClose }: SidebarProps) {
    const location = useLocation()

    return (
        <>
            {/* Mobile overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={onClose}
                />
            )}

            {/* Sidebar */}
            <aside
                className={cn(
                    'fixed top-0 left-0 z-50 h-full w-64 bg-sidebar text-sidebar-foreground transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:z-auto',
                    isOpen ? 'translate-x-0' : '-translate-x-full'
                )}
            >
                <div className="flex flex-col h-full p-4">
                    {/* Logo */}
                    <div className="flex items-center gap-3 px-3 py-4 mb-6">
                        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-sidebar-accent">
                            <Clock className="w-5 h-5 text-sidebar" />
                        </div>
                        <span className="text-xl font-bold">TimeTrack</span>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 space-y-1">
                        {navigation.map((item) => {
                            const isActive = location.pathname === item.href
                            return (
                                <NavLink
                                    key={item.name}
                                    to={item.href}
                                    onClick={onClose}
                                    className={cn(
                                        'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200',
                                        isActive
                                            ? 'bg-sidebar-accent text-sidebar'
                                            : 'text-sidebar-foreground/70 hover:bg-sidebar-foreground/10 hover:text-sidebar-foreground'
                                    )}
                                >
                                    <item.icon className="w-5 h-5" />
                                    {item.name}
                                    {isActive && (
                                        <span className="ml-auto w-2 h-2 rounded-full bg-sidebar" />
                                    )}
                                </NavLink>
                            )
                        })}
                    </nav>

                    {/* Upgrade Card */}
                    <div className="mt-auto">
                        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-600 to-purple-700 p-4">
                            <div className="absolute top-2 right-2">
                                <Rocket className="w-20 h-20 text-purple-400/30 rotate-45" />
                            </div>
                            <div className="relative z-10">
                                <h4 className="font-semibold text-white mb-1">
                                    Upgrade to Pro
                                </h4>
                                <p className="text-xs text-purple-200 mb-3">
                                    Upgrade your account for a fuller experience.
                                </p>
                                <button className="w-full py-2 px-4 bg-purple-500 hover:bg-purple-400 text-white text-sm font-medium rounded-xl transition-colors">
                                    Upgrade Now
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </aside>
        </>
    )
}
