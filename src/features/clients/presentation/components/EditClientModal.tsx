import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/shared/utils/cn'
import { formatCurrency } from '@/shared/utils/date'
import { Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Client, UpdateClientRequest } from '../../domain/models'
import { useClients } from '../hooks/useClients'

interface EditClientModalProps {
  client: Client | null
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  /** Totales enriquecidos desde la página */
  totalAmount?: number
  totalBalance?: number
}

const inputStyle = 'bg-background border border-border text-foreground placeholder:text-muted-foreground focus:ring-1 focus:ring-primary/40 focus:border-primary/40 transition-colors duration-200'
const labelStyle = 'text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70 mb-1.5 block'

export const EditClientModal = ({
  client,
  isOpen,
  onClose,
  onSuccess,
  totalAmount,
  totalBalance,
}: EditClientModalProps) => {
  const { updateClient } = useClients()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    document_id: '',
    address: '',
  })

  useEffect(() => {
    if (!client) return
    setError(null)
    setFormData({
      name: client.name ?? '',
      phone: client.phone ?? '',
      document_id: client.document_id ?? '',
      address: client.address ?? '',
    })
  }, [client])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!client) return

    if (!formData.name.trim()) {
      setError('El nombre es obligatorio')
      return
    }

    setLoading(true)
    setError(null)
    try {
      const payload: UpdateClientRequest = {
        id: client.id,
        name: formData.name.trim(),
        phone: formData.phone.trim() || undefined,
        document_id: formData.document_id.trim() || null,
        address: formData.address.trim() || null,
      }
      await updateClient(payload)
      onSuccess()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar el cliente')
    } finally {
      setLoading(false)
    }
  }

  if (!client) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] sm:max-w-[550px] bg-card border-border text-card-foreground shadow-2xl overflow-hidden rounded-xl p-0 animate-in fade-in zoom-in-95 duration-300 max-h-[92vh] flex flex-col focus:outline-none">

        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border shrink-0">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <DialogTitle className="text-lg font-bold text-foreground tracking-tight">
                Editar Cliente
              </DialogTitle>
              <p className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">
                Modificar datos del cliente
              </p>
            </div>
            <span className="text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-md bg-muted/50 border border-border text-muted-foreground">
              {client.id.slice(0, 8)}
            </span>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          {/* Info financiera (solo lectura) */}
          {(totalAmount != null || totalBalance != null) && (
            <div className="rounded-lg border border-border bg-muted/10 p-4 space-y-3">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">Resumen financiero</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className={labelStyle}>Monto total prestamos</span>
                  <span className="text-sm font-bold text-foreground font-mono block">{formatCurrency(totalAmount ?? 0)}</span>
                </div>
                <div>
                  <span className={labelStyle}>Saldo pendiente</span>
                  <span className={cn("text-sm font-bold font-mono block", (totalBalance ?? 0) > 0 ? 'text-error' : 'text-success')}>
                    {formatCurrency(totalBalance ?? 0)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-center">
              <span className="text-xs text-destructive font-medium">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} id="edit-client-form" className="space-y-5">

            {/* Nombre */}
            <div className="space-y-1.5">
              <label className={labelStyle}>Nombre</label>
              <input
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                placeholder="Nombre completo del cliente"
                className={cn("w-full px-4 py-3 rounded-lg focus:outline-none text-sm font-bold", inputStyle)}
              />
            </div>

            {/* Telefono y Documento */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className={labelStyle}>Telefono</label>
                <input
                  name="phone"
                  type="text"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Numero de telefono"
                  className={cn("w-full px-3 py-3 rounded-lg focus:outline-none text-sm", inputStyle)}
                />
              </div>
              <div className="space-y-1.5">
                <label className={labelStyle}>Documento</label>
                <input
                  name="document_id"
                  type="text"
                  value={formData.document_id}
                  onChange={handleChange}
                  placeholder="Cedula o NIT"
                  className={cn("w-full px-3 py-3 rounded-lg focus:outline-none text-sm", inputStyle)}
                />
              </div>
            </div>

            {/* Direccion */}
            <div className="space-y-1.5">
              <label className={labelStyle}>Direccion</label>
              <input
                name="address"
                type="text"
                value={formData.address}
                onChange={handleChange}
                placeholder="Direccion del cliente"
                className={cn("w-full px-4 py-3 rounded-lg focus:outline-none text-sm", inputStyle)}
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
            form="edit-client-form"
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
