import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Header } from './Header'

const pageTitles: Record<string, { title: string; subtitle?: string }> = {
    '/dashboard': { title: 'TimeTrack Overview', subtitle: 'Take control of your time today!' },
    '/history': { title: 'Historial', subtitle: 'Consulta tus registros anteriores' },
    '/reports': { title: 'Reportes', subtitle: 'Análisis de tu tiempo trabajado' },
    '/profile': { title: 'Mi Perfil', subtitle: 'Gestiona tu información personal' },
}

export function Layout() {
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const location = useLocation()

    const { title, subtitle } = pageTitles[location.pathname] || { title: 'TimeTrack' }

    return (
        <div className="min-h-screen bg-accent">
            {/* Sidebar */}
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            {/* Main content */}
            <div className="lg:ml-64">
                <Header
                    title={title}
                    subtitle={subtitle}
                    onMenuClick={() => setSidebarOpen(true)}
                />

                <main className="p-4 lg:p-8">
                    <Outlet />
                </main>
            </div>
        </div>
    )
}
