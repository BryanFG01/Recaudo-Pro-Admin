import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatDateTime } from '@/shared/utils/date'
import {
  Calendar,
  Hash,
  Info,
  Loader2,
  Save,
  StickyNote,
  TrendingDown,
  Wallet,
  X
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { Collection, UpdateCollectionRequest } from '../../domain/models'
import { useCollections } from '../hooks/useCollections'

interface EditCollectionModalProps {
  collection: Collection | null
  clientName?: string
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

const PAYMENT_METHODS = [
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'transferencia', label: 'Transferencia' },
]

export const EditCollectionModal = ({
  collection,
  clientName,
  isOpen,
  onClose,
  onSuccess,
}: EditCollectionModalProps) => {
  const { updateCollection } = useCollections()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    amount: 0,
    payment_date: '',
    payment_method: '',
    transaction_reference: '',
    notes: '',
  })

  useEffect(() => {
    if (!collection) return
    setError(null)
    setFormData({
      amount: collection.amount ?? 0,
      payment_date: collection.payment_date
        ? new Date(collection.payment_date).toISOString().split('T')[0]
        : '',
      payment_method: collection.payment_method ?? '',
      transaction_reference: collection.transaction_reference ?? '',
      notes: collection.notes ?? '',
    })
  }, [collection])

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target
    if (value === '') {
      setFormData(prev => ({ ...prev, amount: 0 }))
      return
    }
    const raw = value.replace(/[^\d]/g, '')
    const numeric = parseInt(raw || '0', 10) / 100
    setFormData(prev => ({ ...prev, amount: numeric }))
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!collection) return

    if (formData.amount <= 0) {
      setError('El monto debe ser mayor a cero')
      return
    }

    setLoading(true)
    setError(null)
    try {
      const payload: UpdateCollectionRequest = {
        id: collection.id,
        amount: formData.amount,
        payment_date: formData.payment_date || undefined,
        payment_method: formData.payment_method || null,
        transaction_reference: formData.transaction_reference || null,
        notes: formData.notes || null,
      }
      await updateCollection(payload)
      onSuccess()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar el recaudo')
    } finally {
      setLoading(false)
    }
  }

  if (!collection) return null

  const displayClient = clientName || collection.name || collection.client_id
  const formatFinancial = (val: number) => {
    return new Intl.NumberFormat('es-CO', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(val)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl h-[90vh] p-0 overflow-hidden border-border bg-card !rounded-[20px] shadow-2xl backdrop-blur-xl transition-all duration-300">
        <div className="relative flex flex-col">
          {/* Header Section */}
          <div className="px-10 pt-10 pb-6 !border-sm !border-border/50">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-5">
                <div className="p-4 rounded-[4px] bg-primary/10 text-primary shadow-inner">
                  <TrendingDown className="w-7 h-7" />
                </div>
                <div>
                  <DialogTitle className="text-2xl font-bold text-foreground tracking-tight uppercase">Editar Recaudo</DialogTitle>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mt-1">Gestión de ingresos</p>
                </div>
              </div>

            </div>
          </div>

          {/* Form Content */}
          <div className="px-10 py-10 space-y-10 bg-card/30 max-h-[70vh] overflow-y-auto custom-scrollbar">

            {/* Info Summary Card */}
            <div className="p-6 rounded-[4px] bg-muted/40 border border-border grid grid-cols-2 gap-8 shadow-inner group">
                <div className="space-y-2">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] opacity-60">Cliente</p>
                    <p className="text-xs font-bold text-foreground uppercase tracking-tight truncate">{displayClient}</p>
                </div>
                <div className="space-y-2 text-right">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] opacity-60">Registrado</p>
                    <p className="text-[10px] font-bold text-primary/80 font-mono font-medium uppercase">
                        {formatDateTime(collection.created_at)}
                    </p>
                </div>
            </div>

            {error && (
              <div className="p-5 rounded-[4px] bg-destructive/10 border border-destructive/20 flex items-center gap-4 animate-in shake-2 duration-400">
                 <div className="p-2 rounded-[4px] bg-destructive/20">
                    <X className="size-4 text-destructive" />
                 </div>
                 <p className="text-[10px] font-black uppercase text-destructive tracking-widest flex-1">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} id="edit-collection-form" className="space-y-10">
                <div className="space-y-4">
                    <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Monto del Pago</Label>
                    <div className="relative group/field">
                        <span className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-bold text-muted-foreground/30 group-focus-within/field:text-primary transition-colors">$</span>
                        <Input
                            name="amount"
                            type="text"
                            inputMode="numeric"
                            value={formatFinancial(formData.amount)}
                            onChange={handlePriceChange}
                            className="h-20 pl-14 bg-muted/40 border-border/50 rounded-[4px] focus-visible:ring-primary/20 focus-visible:bg-card font-mono font-medium text-3xl text-foreground transition-all"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                        <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Fecha de pago</Label>
                        <div className="relative group/field">
                            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/30 group-focus-within/field:text-primary transition-colors" />
                            <Input
                                name="payment_date"
                                type="date"
                                value={formData.payment_date}
                                onChange={handleChange}
                                onClick={(e) => e.currentTarget.showPicker()}
                                className="h-12 pl-12 bg-muted/40 border-border/50 rounded-[4px] focus-visible:ring-primary/20 font-bold text-xs uppercase"
                            />
                        </div>
                    </div>
                    <div className="space-y-3">
                        <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Método de Pago</Label>
                        <div className="relative group/field">
                            <Wallet className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/30 group-focus-within/field:text-primary transition-colors z-10" />
                            <select
                                name="payment_method"
                                value={formData.payment_method}
                                onChange={handleChange}
                                className="w-full h-12 pl-12 pr-4 bg-muted/40 border border-border/50 rounded-[4px] focus:ring-2 focus:ring-primary/20 outline-none text-[10px] font-bold uppercase tracking-widest appearance-none cursor-pointer transition-all"
                            >
                                <option value="" className="bg-card">Sin especificar</option>
                                {PAYMENT_METHODS.map((m) => (
                                    <option key={m.value} value={m.value} className="bg-card">{m.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                <div className="space-y-3">
                    <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Referencia / Comprobante</Label>
                    <div className="relative group/field">
                        <Hash className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/30 group-focus-within/field:text-primary transition-colors" />
                        <Input
                            name="transaction_reference"
                            value={formData.transaction_reference}
                            onChange={handleChange}
                            className="h-12 pl-12 bg-muted/40 border-border/50 rounded-[4px] focus-visible:ring-primary/20 font-bold text-xs"
                            placeholder="Número de referencia"
                        />
                    </div>
                </div>

                <div className="space-y-3">
                    <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Notas Adicionales</Label>
                    <div className="relative group/field">
                        <StickyNote className="absolute left-4 top-4 size-4 text-muted-foreground/30 group-focus-within/field:text-primary transition-colors" />
                        <textarea
                            name="notes"
                            value={formData.notes}
                            onChange={handleChange}
                            rows={3}
                            placeholder="Observaciones de la transacción..."
                            className="w-full pl-12 pr-4 pt-3 bg-muted/40 border border-border/50 rounded-[4px] focus:ring-2 focus:ring-primary/20 outline-none text-xs font-bold resize-none transition-all"
                        />
                    </div>
                </div>
            </form>

            <div className="p-6 rounded-[4px] bg-primary/5 border border-primary/10 flex gap-5 shadow-inner backdrop-blur-sm">
                <Info className="size-5 text-primary shrink-0 mt-0.5" />
                <p className="text-[10px] leading-relaxed text-muted-foreground font-bold uppercase tracking-tight opacity-70">
                    Aviso: La actualización del monto impactará el saldo real del crédito. Asegúrese de que la referencia coincida con el registro bancario.
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
                form="edit-collection-form"
                disabled={loading}
                className="h-11 px-10 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 rounded-[4px] font-bold transition-all flex items-center gap-3 text-[10px] uppercase tracking-[0.15em]"
             >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                    <>
                        <span>Actualizar Pago</span>
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
