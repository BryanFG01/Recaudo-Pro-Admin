import { formatCurrency, formatDate, formatDateTime } from '@/shared/utils/date'
import { DailySummaryItem } from '../../domain/models'
import { initialBreakdown, nextInitialBalance } from '../../domain/services/cashSessionRules'

/**
 * Caja actual de un cobrador en el Flujo: saldo, de dónde salió la caja inicial y el desglose que
 * cuadra con el saldo. Cerrada: muestra la caja final y con cuánto arranca la próxima.
 */
export function CollectorCashSummary({ summary }: { summary?: DailySummaryItem }) {
  if (!summary) {
    return <p className="text-sm text-muted-foreground border-t border-border pt-3">Sin caja registrada</p>
  }
  const isClosed = summary.status === 'closed'
  const { fromPrevious, sentByAdmin } = initialBreakdown(summary)
  const progress = Math.min(((summary.total_recaudo || 0) / (summary.total_ventas || 1)) * 100, 100)

  return (
    <>
      <div className="space-y-1.5">
        <div className="flex justify-between items-end">
          <span className="text-sm text-muted-foreground">{isClosed ? 'Caja final' : 'Saldo actual'}</span>
          <span className="text-2xl font-semibold tracking-tight tabular-nums">{formatCurrency(summary.caja_actual)}</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
          <div className="h-full bg-success rounded-full transition-all duration-1000" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* Desglose: cuadra con el saldo de arriba */}
      <dl className="grid grid-cols-2 gap-x-4 gap-y-1 pt-2 text-sm">
        <dt className="font-medium">Caja inicial</dt>
        <dd className="text-right tabular-nums font-medium">{formatCurrency(summary.initial_balance)}</dd>
        {fromPrevious > 0 && (
          <>
            <dt className="pl-3 text-xs text-muted-foreground">De la caja anterior</dt>
            <dd className="text-right tabular-nums text-xs text-muted-foreground">{formatCurrency(fromPrevious)}</dd>
          </>
        )}
        {sentByAdmin > 0 && (
          <>
            <dt className="pl-3 text-xs text-muted-foreground">Enviado por el admin</dt>
            <dd className="text-right tabular-nums text-xs text-muted-foreground">{formatCurrency(sentByAdmin)}</dd>
          </>
        )}
        <dt className="text-muted-foreground">+ Recaudo</dt>
        <dd className="text-right tabular-nums text-success">{formatCurrency(summary.total_recaudo)}</dd>
        <dt className="text-muted-foreground">− Ventas</dt>
        <dd className="text-right tabular-nums">{formatCurrency(summary.total_ventas)}</dd>
        <dt className="text-muted-foreground">− Retiros</dt>
        <dd className="text-right tabular-nums text-error">{formatCurrency(summary.total_retiros)}</dd>
        <dt className="text-muted-foreground">− Gastos</dt>
        <dd className="text-right tabular-nums text-error">{formatCurrency(summary.total_gastos)}</dd>
      </dl>

      <div className="border-t border-border pt-3 space-y-1">
        <p className="text-xs text-muted-foreground">
          {isClosed
            ? `Caja cerrada${summary.closed_at ? ` el ${formatDateTime(summary.closed_at)}` : ''}`
            : `Caja abierta · del ${formatDate(summary.session_date)}`}
          {summary.total_retiros_pendientes > 0 && ` · ${formatCurrency(summary.total_retiros_pendientes)} en retiros por aprobar`}
        </p>
        {isClosed && (
          <p className="text-xs font-semibold">Inicia su próxima caja con {formatCurrency(nextInitialBalance(summary))}</p>
        )}
      </div>
    </>
  )
}
