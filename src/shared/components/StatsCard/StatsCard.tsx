import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/shared/utils/cn'
import { ReactNode } from 'react'

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
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info'
  loading?: boolean
}

export default function StatsCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  className,
  isCurrency = false,
  variant = 'default',
  loading = false,
}: StatsCardProps) {
  const formatValue = (val: string | number) => {
    if (loading) return '---'
    if (isCurrency && typeof val === 'number') {
      return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0,
      }).format(val)
    }
    return val
  }

  const variants = {
    default: 'border-primary/20 bg-primary/5',
    success: 'border-success/20 bg-success/5',
    warning: 'border-warning/20 bg-warning/5',
    error: 'border-error/20 bg-error/5',
    info: 'border-blue-400/20 bg-blue-400/5',
  }

  const pulseColors = {
    default: 'bg-primary',
    success: 'bg-success',
    warning: 'bg-warning',
    error: 'bg-error',
    info: 'bg-blue-400',
  }

  return (
    <Card
      className={cn(
        'relative overflow-hidden border shadow-sm transition-all duration-300 hover:shadow-xl hover:translate-y-[-4px] group',
        variants[variant],
        className
      )}
      role="article"
      aria-label={`${title}: ${formatValue(value)}`}
    >
      {/* Pulse Signature Line */}
      <div 
        className={cn(
          'absolute left-0 top-0 bottom-0 w-1.5 transition-colors duration-300',
          pulseColors[variant]
        )} 
      />

      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1.5 min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground/70 flex items-center gap-1.5">
              <span className={cn("w-1.5 h-1.5 rounded-full", pulseColors[variant])} />
              {title}
            </p>
            <div className="flex flex-col gap-1">
              <h3 className="text-3xl font-extrabold tracking-tight text-foreground tabular-nums drop-shadow-sm">
                {formatValue(value)}
              </h3>
              {trend && (
                <div className="flex items-center gap-1.5">
                  <span
                    className={cn(
                      'text-[11px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 shadow-sm',
                      trend.isPositive ? 'bg-success/20 text-success' : 'bg-error/20 text-error'
                    )}
                  >
                    {trend.isPositive ? '↗' : '↘'} {Math.abs(trend.value)}%
                  </span>
                  <span className="text-[10px] text-muted-foreground/60 font-medium">vs. período anterior</span>
                </div>
              )}
            </div>
          </div>
          {icon && (
            <div 
              className={cn(
                'flex-shrink-0 p-3 rounded-2xl bg-muted/50 backdrop-blur-md border border-border shadow-xl transition-transform duration-300 group-hover:scale-110',
                variant === 'default' ? 'text-primary' : 
                variant === 'success' ? 'text-success' :
                variant === 'warning' ? 'text-warning' :
                variant === 'error' ? 'text-error' : 'text-blue-400'
              )}
              aria-hidden="true"
            >
              {icon}
            </div>
          )}
        </div>

        {subtitle && (
          <div className="mt-4 flex items-center gap-2 pt-4 border-t border-border">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1.2">
              <span className="opacity-0 group-hover:opacity-100 transition-opacity">→</span> {subtitle}
            </p>
          </div>
        )}
      </CardContent>
      
      {/* Subtle background glow */}
      <div 
        className={cn(
          'absolute -right-6 -bottom-6 w-24 h-24 blur-3xl opacity-20 pointer-events-none rounded-full',
          pulseColors[variant]
        )} 
      />
    </Card>
  )
}


