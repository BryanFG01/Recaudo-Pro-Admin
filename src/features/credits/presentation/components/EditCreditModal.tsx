import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/shared/utils/cn'
import { Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Credit, CreditSummary, UpdateCreditRequest } from '../../domain/models'
import { useCredits } from '../hooks/useCredits'

interface EditCreditModalProps {
  credit: Credit | null
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

interface ExtendedFormData extends Partial<UpdateCreditRequest> {
  start_date?: string
  end_date?: string
}

const inputStyle = 'bg-background border border-border text-foreground placeholder:text-muted-foreground focus:ring-1 focus:ring-primary/40 focus:border-primary/40 transition-colors duration-200'
const labelStyle = 'text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70 mb-1.5 block'

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  pending: { label: 'Pendiente', className: 'bg-amber-500/10 text-amber-500 border-amber-500/20' },
  up_to_date: { label: 'Al dia', className: 'bg-success/10 text-success border-success/20' },
  overdue: { label: 'En mora', className: 'bg-error/10 text-error border-error/20' },
  paid: { label: 'Pagado', className: 'bg-primary/10 text-primary border-primary/20' },
}

export const EditCreditModal = ({
  credit,
  isOpen,
  onClose,
  onSuccess,
}: EditCreditModalProps) => {
  const { updateCredit, getCreditSummary } = useCredits()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<ExtendedFormData>({})
  const [summary, setSummary] = useState<CreditSummary | null>(null)
  const [summaryLoading, setSummaryLoading] = useState(false)
  const [summaryError, setSummaryError] = useState<string | null>(null)

  const formatFinancial = (val: number | null | undefined) => {
    if (val === undefined || val === null) return '0,00'
    return new Intl.NumberFormat('es-CO', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(val)
  }

  const countWorkingDays = (start: Date, end: Date) => {
    let count = 0
    const curDate = new Date(start.getTime())
    curDate.setHours(0, 0, 0, 0)
    const endDate = new Date(end.getTime())
    endDate.setHours(0, 0, 0, 0)
    if (curDate > endDate) return 0
    while (curDate <= endDate) {
      if (curDate.getDay() !== 0) count++
      curDate.setDate(curDate.getDate() + 1)
    }
    return count
  }

  const round = (val: number) => Math.round((val + Number.EPSILON) * 100) / 100

  const getCalculatedFields = (base: {
    total_amount?: number | null
    interest_rate?: number | null
    start_date?: string
    end_date?: string
    total_installments?: number | null
    paid_installments?: number | null
  }) => {
    const totalAmount = base.total_amount ?? 0
    const interestRate = base.interest_rate ?? 0
    if (!totalAmount && interestRate === undefined) return null
    const totalInterest = round(totalAmount * (interestRate / 100))
    const totalToPay = round(totalAmount + totalInterest)
    let totalInstallments = base.total_installments ?? 1
    if (base.start_date && base.end_date) {
      const workingDays = countWorkingDays(new Date(base.start_date), new Date(base.end_date))
      if (workingDays > 0) totalInstallments = workingDays
    }
    const installmentAmount = round(totalToPay / totalInstallments)
    const paidAmount = (base.paid_installments ?? 0) * installmentAmount
    const totalBalance = round(totalToPay - paidAmount)
    return {
      total_interest: totalInterest,
      total_installments: totalInstallments,
      installment_amount: installmentAmount,
      total_balance: totalBalance,
      next_due_date: base.end_date ?? '',
    }
  }

  useEffect(() => {
    if (!isOpen || !credit?.id) {
      setSummary(null)
      setSummaryError(null)
      return
    }
    let cancelled = false
    setSummaryError(null)
    setSummaryLoading(true)
    getCreditSummary(credit.id)
      .then((data) => {
        if (!cancelled) setSummary(data ?? null)
      })
      .catch((err) => {
        if (!cancelled) setSummaryError(err instanceof Error ? err.message : 'Error al cargar resumen')
      })
      .finally(() => {
        if (!cancelled) setSummaryLoading(false)
      })
    return () => { cancelled = true }
  }, [isOpen, credit?.id, getCreditSummary])

  useEffect(() => {
    if (!credit) return
    const roundSrc = (val: number | null | undefined) =>
      val != null ? Math.round((val + Number.EPSILON) * 100) / 100 : 0
    const source = summary ?? credit

    const base = {
      id: credit.id,
      client_id: credit.client_id,
      document_id: credit.document_id,
      user_number: credit.user_number,
      business_code: credit.business_code,
      total_amount: roundSrc(source.total_amount),
      interest_rate: roundSrc((source as CreditSummary).interest_rate ?? (credit as Credit).interest_rate),
      total_interest: roundSrc(source.total_interest),
      installment_amount: roundSrc(source.installment_amount),
      total_installments: source.total_installments,
      paid_installments: source.paid_installments,
      total_balance: roundSrc(source.total_balance),
      overdue_installments: source.overdue_installments,
      last_payment_amount: roundSrc(source.last_payment_amount),
      last_payment_date: source.last_payment_date ? new Date(source.last_payment_date).toISOString().split('T')[0] : '',
      start_date: credit.created_at ? new Date(credit.created_at).toISOString().split('T')[0] : '',
      end_date: source.next_due_date ? new Date(source.next_due_date).toISOString().split('T')[0] : '',
      next_due_date: source.next_due_date ? new Date(source.next_due_date).toISOString().split('T')[0] : '',
    }
    const calculated = getCalculatedFields(base)
    setFormData(calculated ? { ...base, ...calculated } : base)
  }, [credit, summary])

  useEffect(() => {
    if (!credit || formData.total_amount == null || formData.interest_rate === undefined) return

    const calculated = getCalculatedFields({
      total_amount: formData.total_amount,
      interest_rate: formData.interest_rate,
      start_date: formData.start_date,
      end_date: formData.end_date,
      total_installments: formData.total_installments,
      paid_installments: formData.paid_installments,
    })
    if (!calculated) return

    const changed =
      formData.total_interest !== calculated.total_interest ||
      formData.total_installments !== calculated.total_installments ||
      formData.installment_amount !== calculated.installment_amount ||
      formData.total_balance !== calculated.total_balance ||
      formData.next_due_date !== formData.end_date

    if (changed) {
      setFormData(prev => ({
        ...prev,
        ...calculated,
        next_due_date: prev.end_date ?? calculated.next_due_date,
      }))
    }
  }, [formData.total_amount, formData.interest_rate, formData.start_date, formData.end_date, formData.paid_installments])

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    if (value === '') {
      setFormData(prev => ({ ...prev, [name]: 0 }))
      return
    }
    const raw = value.replace(/[^\d]/g, '')
    const numeric = parseInt(raw || '0', 10) / 100
    setFormData((prev) => ({ ...prev, [name]: numeric }))
  }

  const handleSimpleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? (value === '' ? 0 : Number(value)) : value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!credit) return

    setLoading(true)
    try {
      const { start_date, end_date, ...payload } = formData
      await updateCredit(payload as UpdateCreditRequest)
      onSuccess()
      onClose()
    } catch (error) {
      console.error('Error updating credit:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!credit) return null

  const totalCobro = (formData.total_amount || 0) + (formData.total_interest || 0)
  const paidPct = totalCobro > 0
    ? Math.min(Math.round(((totalCobro - (formData.total_balance || 0)) / totalCobro) * 100), 100)
    : 0

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] sm:max-w-[1000px] bg-card border-border text-card-foreground shadow-2xl overflow-hidden rounded-xl p-0 animate-in fade-in zoom-in-95 duration-300 max-h-[92vh] sm:max-h-[95vh] flex flex-col focus:outline-none">

        {/* Header */}
        <DialogHeader className="px-6 sm:px-8 pt-6 sm:pt-8 pb-4 border-b border-border shrink-0">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <DialogTitle className="text-lg sm:text-xl font-bold text-foreground tracking-tight">
                Detalle del Credito
              </DialogTitle>
              <p className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">
                Planificacion financiera por periodo operativo
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-md bg-muted/50 border border-border text-muted-foreground">
                {credit.id.slice(0, 8)}
              </span>
              <span className="text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-md bg-primary/10 border border-primary/20 text-primary">
                {formData.business_code || 'ARG01'}
              </span>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 sm:px-8 py-6 space-y-6 relative">

          {/* Resumen del credito */}
          {summaryLoading && (
            <div className="rounded-lg border border-border bg-muted/10 p-5 flex items-center justify-center gap-2.5">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span className="text-xs text-muted-foreground">Cargando resumen...</span>
            </div>
          )}
          {!summaryLoading && summaryError && (
            <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-center space-y-1">
              <span className="text-xs text-destructive font-medium block">{summaryError}</span>
              <span className="text-[10px] text-muted-foreground">El formulario usa los datos del credito.</span>
            </div>
          )}
          {!summaryLoading && !summaryError && summary && (
            <div className="rounded-lg border border-border bg-muted/10 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">Resumen actual</h3>
                <span className={cn(
                  "inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold uppercase border",
                  STATUS_LABELS[summary.credit_status]?.className ?? "bg-muted text-muted-foreground border-border"
                )}>
                  {STATUS_LABELS[summary.credit_status]?.label ?? summary.credit_status}
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <span className={labelStyle}>Total pagado</span>
                  <span className="font-mono font-bold text-success text-sm">{formatFinancial(summary.total_paid)}</span>
                </div>
                <div>
                  <span className={labelStyle}>Saldo pendiente</span>
                  <span className="font-mono font-bold text-error text-sm">{formatFinancial(summary.total_balance)}</span>
                </div>
                <div>
                  <span className={labelStyle}>Cuotas pendientes</span>
                  <span className="font-mono font-bold text-foreground text-sm">{summary.pending_installments}</span>
                </div>
                <div>
                  <span className={labelStyle}>Parciales</span>
                  <span className="font-mono font-bold text-muted-foreground text-sm">{summary.partial_installments}</span>
                </div>
              </div>
              {(summary.next_pending_due_date || summary.last_payment_amount != null || summary.last_payment_date) && (
                <div className="flex flex-wrap gap-x-6 gap-y-2 pt-3 border-t border-border/50">
                  {summary.next_pending_due_date && (
                    <div>
                      <span className={labelStyle}>Proximo vencimiento</span>
                      <span className="font-mono text-[11px] text-muted-foreground">
                        {new Date(summary.next_pending_due_date).toLocaleDateString('es-CO', { dateStyle: 'medium' })}
                      </span>
                    </div>
                  )}
                  {(summary.last_payment_amount != null || summary.last_payment_date) && (
                    <div>
                      <span className={labelStyle}>Ultimo pago</span>
                      <span className="font-mono text-[11px] text-muted-foreground">
                        {summary.last_payment_amount != null && formatFinancial(summary.last_payment_amount)}
                        {summary.last_payment_date && (
                          <span className="ml-1">
                            · {new Date(summary.last_payment_date).toLocaleDateString('es-CO', { dateStyle: 'short' })}
                          </span>
                        )}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Saldo pendiente destacado + progreso */}
            <div className="rounded-lg border border-border bg-muted/10 p-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <span className={cn(labelStyle, "text-error/70 mb-0")}>Saldo pendiente</span>
                  <div className="text-2xl sm:text-3xl font-black text-error font-mono tabular-nums mt-1">
                    {formatFinancial(formData.total_balance)}
                  </div>
                </div>
                <div className="text-right">
                  <span className={cn(labelStyle, "text-primary/70 mb-0")}>Total a cobrar</span>
                  <div className="text-lg sm:text-xl font-bold text-foreground font-mono tabular-nums mt-1">
                    {formatFinancial(totalCobro)}
                  </div>
                </div>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60">Progreso de pago</span>
                  <span className="text-[10px] font-bold text-foreground tabular-nums">{paidPct}%</span>
                </div>
                <div className="h-1.5 w-full bg-muted/40 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all duration-700 ease-out',
                      paidPct >= 80 ? 'bg-success' : paidPct >= 40 ? 'bg-primary' : 'bg-warning'
                    )}
                    style={{ width: `${paidPct}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* Columna izquierda: Capital & Fechas */}
              <div className="space-y-5">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70 border-b border-border pb-2">
                  Capital & Periodo
                </h3>

                <div className="space-y-1.5">
                  <label className={labelStyle}>Capital principal</label>
                  <input
                    name="total_amount"
                    type="text"
                    inputMode="numeric"
                    value={formatFinancial(formData.total_amount)}
                    onChange={handlePriceChange}
                    className={cn("w-full px-4 py-3 rounded-lg focus:outline-none font-mono font-bold text-base", inputStyle)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className={labelStyle}>Tasa (%)</label>
                    <input
                      name="interest_rate"
                      type="number"
                      step="0.1"
                      value={formData.interest_rate || 0}
                      onChange={handleSimpleChange}
                      className={cn("w-full px-4 py-3 rounded-lg focus:outline-none font-mono font-bold text-center", inputStyle)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className={labelStyle}>Interes generado</label>
                    <div className="w-full px-4 py-3 rounded-lg border border-border bg-muted/20 font-mono font-bold text-success/70 text-center text-sm">
                      {formatFinancial(formData.total_interest)}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-3 border-t border-border/50">
                  <div className="space-y-1.5">
                    <label className={labelStyle}>Fecha inicio</label>
                    <input
                      name="start_date"
                      type="date"
                      value={formData.start_date || ''}
                      onChange={handleSimpleChange}
                      onClick={(e) => e.currentTarget.showPicker()}
                      className={cn("w-full px-3 py-3 rounded-lg focus:outline-none font-bold text-[11px] text-center cursor-pointer", inputStyle)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className={labelStyle}>Fecha vencimiento</label>
                    <input
                      name="end_date"
                      type="date"
                      value={formData.end_date || ''}
                      onChange={handleSimpleChange}
                      onClick={(e) => e.currentTarget.showPicker()}
                      className={cn("w-full px-3 py-3 rounded-lg focus:outline-none font-bold text-[11px] text-center cursor-pointer", inputStyle)}
                    />
                  </div>
                </div>
              </div>

              {/* Columna derecha: Recaudo */}
              <div className="space-y-5">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70 border-b border-border pb-2">
                  Estado del Recaudo
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-lg border border-border bg-muted/10 p-4 space-y-1">
                    <label className={labelStyle}>Cuotas totales</label>
                    <div className="text-lg font-bold text-foreground font-mono flex items-baseline gap-1.5">
                      {formData.total_installments}
                      <span className="text-[9px] text-muted-foreground font-medium">dias</span>
                    </div>
                  </div>
                  <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-1">
                    <label className={cn(labelStyle, "text-primary/70")}>Cuota diaria</label>
                    <div className="text-lg font-bold text-primary font-mono">
                      {formatFinancial(formData.installment_amount)}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-lg border border-border bg-muted/10 p-4">
                    <label className={labelStyle}>Cuotas pagadas</label>
                    <input
                      name="paid_installments"
                      type="number"
                      value={formData.paid_installments || 0}
                      onChange={handleSimpleChange}
                      className="bg-transparent border-none p-0 focus:ring-0 focus:outline-none font-mono text-xl text-success font-bold w-full"
                    />
                  </div>
                  <div className="rounded-lg border border-border bg-muted/10 p-4">
                    <label className={labelStyle}>Cuotas en mora</label>
                    <div className="flex items-center justify-between">
                      <input
                        name="overdue_installments"
                        type="number"
                        value={formData.overdue_installments || 0}
                        onChange={handleSimpleChange}
                        className="bg-transparent border-none p-0 focus:ring-0 focus:outline-none font-mono text-xl text-error font-bold w-full"
                      />
                      {(formData.overdue_installments || 0) > 0 && (
                        <span className="w-6 h-6 rounded-full bg-error/15 border border-error/30 flex items-center justify-center text-error text-[10px] font-black shrink-0">
                          !
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-border/50 bg-muted/5 p-4">
                  <label className={cn(labelStyle, "text-muted-foreground/50")}>Proximo vencimiento</label>
                  <div className="font-mono text-sm text-foreground font-medium">
                    {formData.next_due_date
                      ? new Date(formData.next_due_date).toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' })
                      : '---'}
                  </div>
                </div>

                <div className="rounded-lg border border-border/30 bg-muted/5 p-3 text-[10px] text-muted-foreground/50 italic">
                  {formData.total_installments} dias habiles entre {formData.start_date || '...'} y {formData.end_date || '...'}
                </div>
              </div>
            </div>

            <DialogFooter className="gap-3 pt-5 flex flex-col sm:flex-row items-center justify-end border-t border-border">
              <Button
                type="button"
                variant="ghost"
                onClick={onClose}
                className="w-full sm:w-auto px-6 h-10 text-xs font-bold uppercase tracking-wider rounded-lg"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto h-10 px-8 font-bold uppercase tracking-wider text-xs rounded-lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
                    Guardando...
                  </>
                ) : 'Guardar Cambios'}
              </Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
