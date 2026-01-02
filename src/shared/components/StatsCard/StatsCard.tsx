import { ReactNode } from 'react'
import { cn } from '@/shared/utils/cn'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface StatsCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon?: ReactNode
  trend?: {
    value: number
    isPositive: boolean
  }
  className?: string
  isCurrency?: boolean
  isWarning?: boolean
}

export default function StatsCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  className,
  isCurrency = false,
  isWarning = false,
}: StatsCardProps) {
  const formatValue = (val: string | number) => {
    if (isCurrency && typeof val === 'number') {
      return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0,
      }).format(val)
    }
    return val
  }

  return (
    <Card
      className={cn(
        'border-l-4',
        isWarning ? 'border-warning' : 'border-primary',
        className
      )}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {icon && <div className="text-primary">{icon}</div>}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{formatValue(value)}</div>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        )}
        {trend && (
          <div className="flex items-center gap-1 mt-2">
            <span
              className={cn(
                'text-xs font-medium',
                trend.isPositive ? 'text-success' : 'text-destructive'
              )}
            >
              {trend.isPositive ? '+' : ''}
              {trend.value}%
            </span>
            <span className="text-xs text-muted-foreground">
              vs período anterior
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}


