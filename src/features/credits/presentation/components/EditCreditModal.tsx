import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/shared/utils/cn'
import { useEffect, useState } from 'react'
import { Credit, UpdateCreditRequest } from '../../domain/models'
import { useCredits } from '../hooks/useCredits'

interface EditCreditModalProps {
  credit: Credit | null
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

// Local interface for calculation fields that the API doesn't accept
interface ExtendedFormData extends Partial<UpdateCreditRequest> {
  start_date?: string
  end_date?: string
}

const containerStyle = 'bg-[#0f171a]/40 border-white/5 backdrop-blur-md shadow-2xl rounded-2xl p-6 transition-all duration-500 hover:border-white/10'
const inputStyle = 'bg-white/[0.03] border-white/5 text-white placeholder:text-muted-foreground/40 focus:ring-primary/50 focus:border-primary/50 transition-all duration-300'
const labelStyle = 'text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mb-2 block'
const sectionTitleStyle = 'text-[11px] font-black uppercase tracking-[0.2em] text-primary/80 mb-6 flex items-center gap-2'

export const EditCreditModal = ({
  credit,
  isOpen,
  onClose,
  onSuccess,
}: EditCreditModalProps) => {
  const { updateCredit } = useCredits()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<ExtendedFormData>({})

  // Formatter for display: 1.026.595,74
  const formatFinancial = (val: number | null | undefined) => {
    if (val === undefined || val === null) return '0,00'
    return new Intl.NumberFormat('es-CO', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(val)
  }

  // Count days excluding Sundays between two dates
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

  useEffect(() => {
    if (credit) {
      const round = (val: number | null | undefined) => 
        val != null ? Math.round((val + Number.EPSILON) * 100) / 100 : 0

      setFormData({
        id: credit.id,
        client_id: credit.client_id,
        document_id: credit.document_id,
        user_number: credit.user_number,
        business_code: credit.business_code,
        total_amount: round(credit.total_amount),
        interest_rate: round(credit.interest_rate),
        total_interest: round(credit.total_interest),
        installment_amount: round(credit.installment_amount),
        total_installments: credit.total_installments,
        paid_installments: credit.paid_installments,
        total_balance: round(credit.total_balance),
        overdue_installments: credit.overdue_installments,
        last_payment_amount: round(credit.last_payment_amount),
        last_payment_date: credit.last_payment_date ? new Date(credit.last_payment_date).toISOString().split('T')[0] : '',
        start_date: credit.created_at ? new Date(credit.created_at).toISOString().split('T')[0] : '',
        end_date: credit.next_due_date ? new Date(credit.next_due_date).toISOString().split('T')[0] : '',
        next_due_date: credit.next_due_date ? new Date(credit.next_due_date).toISOString().split('T')[0] : '',
      })
    }
  }, [credit])

  // Automatic Calculation Logic
  useEffect(() => {
    if (!credit || !formData.total_amount || formData.interest_rate === undefined) return

    const round = (val: number) => Math.round((val + Number.EPSILON) * 100) / 100

    // 1. Calculate Interest Amount
    const calculatedInterestAmount = round(formData.total_amount * (formData.interest_rate! / 100))
    
    // 2. Total Value (Principal + Interest)
    const totalToPay = round(formData.total_amount + calculatedInterestAmount)

    // 3. Calculate Installments based on Start and End dates (Excluding Sundays)
    let calculatedTotalInstallments = formData.total_installments || 1
    if (formData.start_date && formData.end_date) {
      const workingDays = countWorkingDays(new Date(formData.start_date), new Date(formData.end_date))
      if (workingDays > 0) calculatedTotalInstallments = workingDays
    }

    // 4. Calculate Installment Amount
    const calculatedInstallmentAmount = round(totalToPay / calculatedTotalInstallments)

    // 5. Calculate New Balance
    const paidAmount = (formData.paid_installments || 0) * calculatedInstallmentAmount
    const calculatedBalance = round(totalToPay - paidAmount)

    // Update form if values actually changed
    if (
      formData.total_interest !== calculatedInterestAmount ||
      formData.total_installments !== calculatedTotalInstallments ||
      formData.installment_amount !== calculatedInstallmentAmount ||
      formData.total_balance !== calculatedBalance ||
      formData.next_due_date !== formData.end_date
    ) {
      setFormData(prev => ({
        ...prev,
        total_interest: calculatedInterestAmount,
        total_installments: calculatedTotalInstallments,
        installment_amount: calculatedInstallmentAmount,
        total_balance: calculatedBalance,
        next_due_date: prev.end_date // Keep next_due_date synced with end_date for API
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
      // Create a clean payload without local calculation fields that the API doesn't support
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[1100px] bg-[#0A0F11] border-white/10 text-white shadow-[0_0_80px_-20px_rgba(0,0,0,0.9)] overflow-hidden rounded-[3rem] p-0 animate-in fade-in zoom-in-95 duration-500 max-h-[95vh] flex flex-col">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent pointer-events-none" />
        
        <DialogHeader className="p-10 pb-6 relative shrink-0">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <DialogTitle className="text-5xl font-black uppercase tracking-tighter text-white flex items-center gap-5">
                <div className="w-2.5 h-12 bg-primary rounded-full shadow-[0_0_20px_rgba(var(--primary),0.6)]" />
                Planificación Financiera
              </DialogTitle>
              <p className="text-[10px] font-bold uppercase tracking-[0.5em] text-primary/40 ml-8">
                Cálculo de Cuotas por Periodo Operativo
              </p>
            </div>
            <div className="flex flex-col items-end gap-3 text-right">
              <span className="text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-muted-foreground/60 backdrop-blur-sm">
                ID SISTEMA: {credit.id.slice(0, 16)}
              </span>
              <div className="flex gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full bg-primary/20 border border-primary/30 text-primary">
                  {formData.business_code || 'ARG01'}
                </span>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-10 pb-10 space-y-8 relative scrollbar-hide">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* Bloque 1: Configuración de Capital & Fechas */}
              <div className={cn("space-y-6 group", containerStyle)}>
                <h3 className={sectionTitleStyle}>
                  <span className="w-6 h-px bg-primary/40 group-hover:w-10 transition-all duration-500" />
                  Parámetros de Inversión
                </h3>
                
                <div className="space-y-5">
                  <div className="space-y-1.5">
                    <label className={labelStyle}>Capital Principal</label>
                    <input
                      name="total_amount"
                      type="text"
                      inputMode="numeric"
                      value={formatFinancial(formData.total_amount)}
                      onChange={handlePriceChange}
                      className={cn("w-full px-5 py-4 rounded-2xl border focus:outline-none font-mono font-black text-xl", inputStyle)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <label className={labelStyle}>Tasa Interés (%)</label>
                      <input
                        name="interest_rate"
                        type="number"
                        step="0.1"
                        value={formData.interest_rate || 0}
                        onChange={handleSimpleChange}
                        className={cn("w-full px-5 py-4 rounded-2xl border focus:outline-none font-mono font-bold text-success text-center", inputStyle)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className={labelStyle}>Interés Generado</label>
                      <div className={cn("w-full px-5 py-4 rounded-2xl border bg-white/[0.01] border-white/5 font-mono text-xl font-black text-success/60 text-center")}>
                        {formatFinancial(formData.total_interest)}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-5 pt-4 border-t border-white/5">
                    <div className="space-y-1.5">
                      <label className={labelStyle}>Fecha Inicio</label>
                      <input
                        name="start_date"
                        type="date"
                        value={formData.start_date || ''}
                        onChange={handleSimpleChange}
                        className={cn("w-full px-4 py-3 rounded-xl border focus:outline-none font-black text-[11px] uppercase text-center", inputStyle)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className={labelStyle}>Fecha Final</label>
                      <input
                        name="end_date"
                        type="date"
                        value={formData.end_date || ''}
                        onChange={handleSimpleChange}
                        className={cn("w-full px-4 py-3 rounded-xl border focus:outline-none font-black text-[11px] uppercase text-center", inputStyle)}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Bloque 2: Balance & Recaudo */}
              <div className={cn("space-y-6 group", containerStyle)}>
                <h3 className={sectionTitleStyle}>
                  <span className="w-6 h-px bg-primary/40 group-hover:w-10 transition-all duration-500" />
                  Proyección de Recaudo
                </h3>
                
                <div className="space-y-6">
                  <div className="p-8 rounded-[2rem] bg-error/5 border border-error/20 flex flex-col items-center justify-center text-center space-y-2 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-error/5 blur-[50px] -translate-y-1/2 translate-x-1/2" />
                    <label className={cn(labelStyle, "text-error/60")}>Saldo Pendiente Actualizado</label>
                    <div className="text-4xl font-black text-error font-mono tracking-tighter">
                      {formatFinancial(formData.total_balance)}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-5">
                    <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 space-y-1">
                      <label className={labelStyle}>Total a Cobrar</label>
                      <div className="text-lg font-black text-primary font-mono">
                        {formatFinancial((formData.total_amount || 0) + (formData.total_interest || 0))}
                      </div>
                    </div>
                    <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 space-y-1">
                      <label className={labelStyle}>Cuotas Totales</label>
                      <div className="text-2xl font-black text-white font-mono flex items-baseline gap-2">
                        {formData.total_installments}
                        <span className="text-[10px] text-muted-foreground/40 font-bold">DÍAS ÚTILES</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 rounded-2xl bg-info/5 border border-info/20 flex items-center justify-between">
                    <div>
                      <label className={cn(labelStyle, "text-info/60")}>Cuota Diaria Estimada</label>
                      <div className="text-2xl font-black text-info font-mono">
                        {formatFinancial(formData.installment_amount)}
                      </div>
                    </div>
                    <div className="w-12 h-12 bg-info/10 rounded-full flex items-center justify-center border border-info/20">
                      <span className="text-info font-black text-xl">$</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Fila Inferior: Control de Mora & Próximo Pago */}
              <div className={cn("md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-8")}>
                 <div className={cn("p-6 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-between", containerStyle)}>
                    <div className="space-y-1">
                        <label className={labelStyle}>Cuotas Pagadas</label>
                        <input
                          name="paid_installments"
                          type="number"
                          value={formData.paid_installments || 0}
                          onChange={handleSimpleChange}
                          className={cn("bg-transparent border-none p-0 focus:ring-0 font-mono text-3xl text-success font-black w-24", "placeholder:text-success/20")}
                        />
                    </div>
                    <div className="h-12 w-px bg-white/5" />
                    <div className="text-right">
                      <label className={labelStyle}>Vencimiento SIG.</label>
                      <div className="font-mono text-[11px] text-muted-foreground font-black text-right uppercase">
                        {formData.next_due_date ? new Date(formData.next_due_date).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }) : 'PENDIENTE'}
                      </div>
                    </div>
                 </div>

                 <div className={cn("p-6 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-between col-span-1 md:col-span-1", containerStyle)}>
                    <div className="space-y-1">
                        <label className={labelStyle}>Cuotas en Mora</label>
                        <input
                          name="overdue_installments"
                          type="number"
                          value={formData.overdue_installments || 0}
                          onChange={handleSimpleChange}
                          className={cn("bg-transparent border-none p-0 focus:ring-0 font-mono text-3xl text-error font-black w-24")}
                        />
                    </div>
                    <div className={cn("w-10 h-10 rounded-full flex items-center justify-center border font-black", 
                      (formData.overdue_installments || 0) > 0 ? "bg-error/20 border-error/40 text-error animate-pulse" : "bg-white/5 border-white/10 text-white/20")}>
                      !
                    </div>
                 </div>

                 <div className={cn("p-6 rounded-2xl bg-primary/5 border border-primary/20 flex flex-col justify-center", containerStyle)}>
                    <label className={cn(labelStyle, "text-primary/60")}>Resumen de Operación</label>
                    <div className="text-[10px] text-white/60 font-medium leading-relaxed italic">
                      Crédito re-calculado sobre {formData.total_installments} días activos entre {formData.start_date} y {formData.end_date}.
                    </div>
                 </div>
              </div>

            </div>

            <DialogFooter className="gap-6 pt-10 flex items-center justify-between border-t border-white/5 backdrop-blur-3xl px-2">
              <div className="flex items-center gap-4">
                <div className="w-2 h-2 rounded-full bg-success animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                <span className="text-[9px] font-black uppercase tracking-[0.3em] text-success/60">Algoritmo Financiero Escaneando</span>
              </div>
              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={onClose}
                  className="px-10 h-14 text-[10px] font-black uppercase tracking-[0.5em] text-muted-foreground/40 hover:text-white hover:bg-white/5 transition-all rounded-2xl"
                >
                  Descartar
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="h-14 px-16 bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-[0.4em] text-[11px] shadow-[0_20px_50px_-10px_rgba(var(--primary),0.4)] hover:shadow-[0_20px_60px_-10px_rgba(var(--primary),0.5)] transition-all active:scale-[0.97] rounded-2xl border-t border-white/10"
                >
                  {loading ? 'Aplicando Cambios...' : 'Sincronizar Plan Financiero'}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
