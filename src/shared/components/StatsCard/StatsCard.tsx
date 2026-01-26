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
        isWarning ? 'border-l-warning' : 'border-l-primary',
        className
      )}
      role="article"
      aria-label={`${title}: ${formatValue(value)}`}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {icon && <div className={cn(isWarning ? 'text-warning' : 'text-primary')} aria-hidden="true">{icon}</div>}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold" aria-label={`Valor: ${formatValue(value)}`}>
          {formatValue(value)}
        </div>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1" aria-label={subtitle}>
            {subtitle}
          </p>
        )}
        {trend && (
          <div className="flex items-center gap-1 mt-2" aria-label={`Tendencia: ${trend.isPositive ? 'positiva' : 'negativa'} ${trend.value}%`}>
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


