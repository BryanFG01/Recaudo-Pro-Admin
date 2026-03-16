import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  AlertCircle,
  Calendar,
  CreditCard,
  Hash,
  Loader2,
  Percent,
  Save,
  X
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { Credit, UpdateCreditRequest } from '../../domain/models/Credit'
import { useCredits } from '../hooks/useCredits'

interface EditCreditModalProps {
  credit: Credit | null
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export const EditCreditModal = ({
  credit,
  isOpen,
  onClose,
  onSuccess,
}: EditCreditModalProps) => {
  const { updateCredit } = useCredits()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    total_amount: 0,
    interest_rate: 0,
    total_installments: 0,
    next_due_date: '',
  })

  useEffect(() => {
    if (!credit) return
    setError(null)
    setFormData({
      total_amount: credit.total_amount ?? 0,
      interest_rate: credit.interest_rate ?? 0,
      total_installments: credit.total_installments ?? 0,
      next_due_date: credit.next_due_date
        ? new Date(credit.next_due_date).toISOString().split('T')[0]
        : '',
    })
  }, [credit])

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target
    if (value === '') {
      setFormData(prev => ({ ...prev, total_amount: 0 }))
      return
    }
    const raw = value.replace(/[^\d]/g, '')
    const numeric = parseInt(raw || '0', 10) / 100
    setFormData(prev => ({ ...prev, total_amount: numeric }))
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    const val = e.target.type === 'number' ? parseFloat(value) || 0 : value
    setFormData(prev => ({ ...prev, [name]: val }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!credit) return

    if (formData.total_amount <= 0) {
      setError('El monto debe ser mayor a cero')
      return
    }

    setLoading(true)
    setError(null)
    try {
      const payload: UpdateCreditRequest = {
        id: credit.id,
        total_amount: formData.total_amount,
        interest_rate: formData.interest_rate,
        total_installments: formData.total_installments,
        next_due_date: formData.next_due_date || undefined,
      }
      await updateCredit(payload)
      onSuccess()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar el préstamo')
    } finally {
      setLoading(false)
    }
  }

  if (!credit) return null

  const formatFinancial = (val: number) => {
    return new Intl.NumberFormat('es-CO', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(val)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl h-[90vh] p-0 overflow-hidden border-border bg-card !rounded-[20px] shadow-2xl backdrop-blur-xl transition-all duration-300">
        <div className="relative flex flex-col">
          {/* Header Section */}
          <div className="px-10 pt-10 pb-6 !border-sm !border-border/50">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-5">
                <div className="p-4 rounded-[4px] bg-primary/10 text-primary shadow-inner">
                  <CreditCard className="w-7 h-7" />
                </div>
                <div>
                  <DialogTitle className="text-2xl font-bold text-foreground tracking-tight uppercase">Editar Préstamo</DialogTitle>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mt-1">Refinanciación y parámetros</p>
                </div>
              </div>

            </div>
          </div>

          {/* Form Content */}
          <div className="px-10 py-10 space-y-10 bg-card/30 max-h-[70vh] overflow-y-auto custom-scrollbar">

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-[4px] bg-muted/40 border border-border space-y-1">
                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Tasa Actual</p>
                    <p className="text-sm font-bold text-foreground font-mono font-medium">{credit.interest_rate}%</p>
                </div>
                <div className="p-4 rounded-[4px] bg-muted/40 border border-border space-y-1">
                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Cuotas</p>
                    <p className="text-sm font-bold text-foreground font-mono font-medium">{credit.total_installments}</p>
                </div>
                <div className="p-4 rounded-[4px] bg-primary/5 border border-primary/20 space-y-1 col-span-2">
                    <p className="text-[9px] font-bold text-primary uppercase tracking-wider">Capital Original</p>
                    <p className="text-sm font-bold text-primary font-mono font-medium">{formatFinancial(credit.total_amount ?? 0)}</p>
                </div>
            </div>

            {error && (
              <div className="p-5 rounded-[4px] bg-destructive/10 border border-destructive/20 flex items-center gap-4 animate-in shake-2 duration-400">
                 <div className="p-2 rounded-[4px] bg-destructive/20">
                    <X className="size-4 text-destructive" />
                 </div>
                 <p className="text-[10px] font-bold uppercase text-destructive tracking-widest flex-1">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} id="edit-credit-form" className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
                <div className="md:col-span-2 space-y-4">
                    <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Monto del Capital</Label>
                    <div className="relative group/field">
                        <span className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-bold text-muted-foreground/30 group-focus-within/field:text-primary transition-colors">$</span>
                        <Input
                            name="total_amount"
                            type="text"
                            inputMode="numeric"
                            value={formatFinancial(formData.total_amount)}
                            onChange={handlePriceChange}
                            className="h-20 pl-14 bg-muted/40 border-border/50 rounded-[4px] focus-visible:ring-primary/20 focus-visible:bg-card font-mono font-medium text-3xl text-foreground transition-all" 
                        />
                    </div>
                </div>

                <div className="space-y-3">
                    <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Tasa de Interés (%)</Label>
                    <div className="relative group/field">
                        <Percent className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/30 group-focus-within/field:text-primary transition-colors" />
                        <Input
                            name="interest_rate"
                            type="number"
                            step="0.01"
                            value={formData.interest_rate}
                            onChange={handleChange}
                            className="h-12 pl-12 bg-muted/40 border-border/50 rounded-[4px] focus-visible:ring-primary/20 font-bold text-xs"
                        />
                    </div>
                </div>

                <div className="space-y-3">
                    <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Número de Cuotas</Label>
                    <div className="relative group/field">
                        <Hash className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/30 group-focus-within/field:text-primary transition-colors" />
                        <Input
                            name="total_installments"
                            type="number"
                            value={formData.total_installments}
                            onChange={handleChange}
                            className="h-12 pl-12 bg-muted/40 border-border/50 rounded-[4px] focus-visible:ring-primary/20 font-bold text-xs"
                        />
                    </div>
                </div>

                <div className="space-y-3">
                    <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Próximo Vencimiento</Label>
                    <div className="relative group/field">
                        < Calendar className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/30 group-focus-within/field:text-primary transition-colors" />
                        <Input
                            name="next_due_date"
                            type="date"
                            value={formData.next_due_date}
                            onChange={handleChange}
                            onClick={(e) => e.currentTarget.showPicker()}
                            className="h-12 pl-12 bg-muted/40 border-border/50 rounded-[4px] focus-visible:ring-primary/20 font-bold text-xs uppercase"
                        />
                    </div>
                </div>
            </form>

            <div className="p-6 rounded-[4px] bg-amber-500/5 border border-amber-500/10 flex gap-5 shadow-inner">
                <AlertCircle className="size-5 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-[10px] leading-relaxed text-muted-foreground font-medium uppercase tracking-tight opacity-70">
                    Importante: Cambiar el monto o la tasa recalculará automáticamente el valor de las cuotas futuras. Los pagos ya registrados no se verán afectados.
                </p>
            </div>
          </div>

          <div className="h-px bg-border/50 mx-10" />

          {/* Footer Section */}
          <div className="px-10 py-8 flex items-center justify-between bg-muted/20">
             <Button
                variant="ghost"
                onClick={onClose}
                className="h-11 px-8 text-muted-foreground hover:text-foreground hover:bg-muted font-bold rounded-[4px] text-[10px] uppercase tracking-widest transition-all"
             >
                Descartar
             </Button>

             <Button
                type="submit"
                form="edit-credit-form"
                disabled={loading}
                className="h-11 px-10 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 rounded-[4px] font-bold transition-all flex items-center gap-3 text-[10px] uppercase tracking-[0.15em]"
             >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                    <>
                        <span>Actualizar Crédito</span>
                        <Save className="w-4 h-4" />
                    </>
                )}
             </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
