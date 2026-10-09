import { Card } from '@/components/ui/card'
import { cn } from '@/shared/utils/cn'
import { ReactNode } from 'react'

type StatsVariant = 'default' | 'success' | 'warning' | 'error' | 'info' | 'premium-dark'

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
  variant?: StatsVariant
  loading?: boolean
}

const COP = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 })

const formatStatValue = (value: string | number, isCurrency: boolean, loading: boolean): string | number => {
  if (loading) return '—'
  return isCurrency && typeof value === 'number' ? COP.format(value) : value
}

// Chip del icono: mint por defecto; los estados conservan su color semántico
const ICON_CHIP: Record<StatsVariant, string> = {
  default: 'bg-mint text-black',
  info: 'bg-mint text-black',
  success: 'bg-success/15 text-success',
  warning: 'bg-warning/15 text-warning',
  error: 'bg-error/15 text-error',
  'premium-dark': 'bg-mint text-black',
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
}: Readonly<StatsCardProps>) {
  const displayValue = formatStatValue(value, isCurrency, loading)
  const inverted = variant === 'premium-dark'
  const mutedText = inverted ? 'text-background/60' : 'text-muted-foreground'

  return (
    <Card
      className={cn(
        'flex flex-col gap-6 p-6 transition-colors',
        inverted ? 'bg-foreground text-background' : 'hover:bg-card/80',
        className
      )}
      role="article"
      aria-label={`${title}: ${displayValue}`}
    >
      <div className="flex items-center gap-3">
        {icon && (
          <div
            className={cn('flex size-10 shrink-0 items-center justify-center rounded-xl [&_svg]:size-5', ICON_CHIP[variant])}
            aria-hidden="true"
          >
            {icon}
          </div>
        )}
        <p className={cn('text-sm font-medium', mutedText)}>{title}</p>
      </div>

      <div className="mt-auto space-y-2">
        <p className="break-words text-3xl font-semibold tracking-tight tabular-nums sm:text-[2rem]">
          {displayValue}
        </p>

        {trend && (
          <p className={cn('flex items-center gap-2 text-sm', mutedText)}>
            <span
              className={cn(
                'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
                trend.isPositive ? 'bg-mint text-black' : 'bg-error/15 text-error'
              )}
            >
              {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
            </span>
            frente al período anterior
          </p>
        )}

        {subtitle && <p className={cn('text-sm', mutedText)}>{subtitle}</p>}
      </div>
    </Card>
  )
}
