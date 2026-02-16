import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/shared/utils/cn'
import { formatCurrency, formatDateTime } from '@/shared/utils/date'
import { Loader2 } from 'lucide-react'
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

const inputStyle = 'bg-background border border-border text-foreground placeholder:text-muted-foreground focus:ring-1 focus:ring-primary/40 focus:border-primary/40 transition-colors duration-200'
const labelStyle = 'text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70 mb-1.5 block'

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

  const formatFinancial = (val: number | null | undefined) => {
    if (val === undefined || val === null) return '0,00'
    return new Intl.NumberFormat('es-CO', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(val)
  }

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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] sm:max-w-[550px] bg-card border-border text-card-foreground shadow-2xl overflow-hidden rounded-xl p-0 animate-in fade-in zoom-in-95 duration-300 max-h-[92vh] flex flex-col focus:outline-none">

        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border shrink-0">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <DialogTitle className="text-lg font-bold text-foreground tracking-tight">
                Editar Recaudo
              </DialogTitle>
              <p className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">
                Modificar datos del pago registrado
              </p>
            </div>
            <span className="text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-md bg-muted/50 border border-border text-muted-foreground">
              {collection.id.slice(0, 8)}
            </span>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          {/* Info de contexto (solo lectura) */}
          <div className="rounded-lg border border-border bg-muted/10 p-4 space-y-3">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">Datos del recaudo</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className={labelStyle}>Cliente</span>
                <span className="text-sm font-bold text-foreground block truncate">{displayClient}</span>
              </div>
              <div>
                <span className={labelStyle}>Monto original</span>
                <span className="text-sm font-bold text-success font-mono block">{formatCurrency(collection.amount)}</span>
              </div>
              <div>
                <span className={labelStyle}>Fecha registro</span>
                <span className="text-[11px] text-muted-foreground font-mono block">{formatDateTime(collection.created_at)}</span>
              </div>
              <div>
                <span className={labelStyle}>Credito</span>
                <span className="text-[11px] text-muted-foreground font-mono block truncate">{collection.credit_id.slice(0, 12)}</span>
              </div>
            </div>
          </div>

          {error && (
            <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-center">
              <span className="text-xs text-destructive font-medium">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} id="edit-collection-form" className="space-y-5">

            {/* Monto */}
            <div className="space-y-1.5">
              <label className={labelStyle}>Monto del pago</label>
              <input
                name="amount"
                type="text"
                inputMode="numeric"
                value={formatFinancial(formData.amount)}
                onChange={handlePriceChange}
                className={cn("w-full px-4 py-3 rounded-lg focus:outline-none font-mono font-bold text-lg", inputStyle)}
              />
            </div>

            {/* Fecha y metodo */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className={labelStyle}>Fecha de pago</label>
                <input
                  name="payment_date"
                  type="date"
                  value={formData.payment_date}
                  onChange={handleChange}
                  onClick={(e) => e.currentTarget.showPicker()}
                  className={cn("w-full px-3 py-3 rounded-lg focus:outline-none font-bold text-[11px] text-center cursor-pointer", inputStyle)}
                />
              </div>
              <div className="space-y-1.5">
                <label className={labelStyle}>Metodo de pago</label>
                <select
                  name="payment_method"
                  value={formData.payment_method}
                  onChange={handleChange}
                  className={cn("w-full px-3 py-3 rounded-lg focus:outline-none font-bold text-[11px] cursor-pointer appearance-none", inputStyle)}
                >
                  <option value="">Sin especificar</option>
                  {PAYMENT_METHODS.map((m) => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Referencia */}
            <div className="space-y-1.5">
              <label className={labelStyle}>Referencia de transaccion</label>
              <input
                name="transaction_reference"
                type="text"
                value={formData.transaction_reference}
                onChange={handleChange}
                placeholder="Numero de referencia o comprobante"
                className={cn("w-full px-4 py-3 rounded-lg focus:outline-none text-sm", inputStyle)}
              />
            </div>

            {/* Notas */}
            <div className="space-y-1.5">
              <label className={labelStyle}>Notas</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={2}
                placeholder="Observaciones adicionales"
                className={cn("w-full px-4 py-3 rounded-lg focus:outline-none text-sm resize-none", inputStyle)}
              />
            </div>
          </form>
        </div>

        <DialogFooter className="px-6 py-4 border-t border-border flex flex-col sm:flex-row gap-3 items-center justify-end">
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
            form="edit-collection-form"
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
      </DialogContent>
    </Dialog>
  )
}
