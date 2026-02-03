import { ReactNode } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface StatsCardProps {
    title: string
    value: string
    subtitle?: string
    icon?: ReactNode
    trend?: number
    trendLabel?: string
    className?: string
    variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning'
}

export function StatsCard({
    title,
    value,
    subtitle,
    icon,
    trend,
    trendLabel,
    className,
    variant = 'default',
}: StatsCardProps) {
    const variantStyles = {
        default: 'bg-card',
        primary: 'bg-primary/5 border-primary/10',
        secondary: 'bg-secondary/5 border-secondary/10',
        success: 'bg-success/5 border-success/10',
        warning: 'bg-warning/5 border-warning/10',
    }

    const trendColor = trend && trend > 0 ? 'text-success' : 'text-destructive'
    const TrendIcon = trend && trend > 0 ? TrendingUp : TrendingDown

    return (
        <Card className={cn('overflow-hidden', variantStyles[variant], className)}>
            <CardContent className="p-6">
                <div className="flex items-start justify-between">
                    <div className="space-y-2">
                        <p className="text-sm font-medium text-muted-foreground">{title}</p>
                        <div className="flex items-baseline gap-2">
                            <p className="text-3xl font-bold">{value}</p>
                            {trend !== undefined && (
                                <span className={cn('inline-flex items-center text-xs font-medium', trendColor)}>
                                    <TrendIcon className="w-3 h-3 mr-0.5" />
                                    {Math.abs(trend)}%
                                </span>
                            )}
                        </div>
                        {subtitle && (
                            <p className="text-xs text-muted-foreground">{subtitle}</p>
                        )}
                        {trendLabel && (
                            <p className="text-xs text-muted-foreground">{trendLabel}</p>
                        )}
                    </div>
                    {icon && (
                        <div className="p-2.5 rounded-xl bg-muted/50">
                            {icon}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
