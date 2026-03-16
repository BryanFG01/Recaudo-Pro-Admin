import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/shared/utils/cn'
import { formatCurrency } from '@/shared/utils/date'
import {
  CreditCard,
  Info,
  Loader2,
  MapPinned,
  Save,
  Smartphone,
  User,
  X
} from 'lucide-react'
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
      <DialogContent className="max-w-xl h-[90vh] p-0 overflow-hidden border-border bg-card !rounded-[20px] shadow-2xl backdrop-blur-xl transition-all duration-300">
        <div className="relative flex flex-col">
          {/* Header Section */}
          <div className="px-10 pt-10 pb-6 !border-sm !border-border/50">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-5">
                <div className="p-4 rounded-[4px] bg-primary/10 text-primary shadow-inner">
                  <User className="w-7 h-7" />
                </div>
                <div>
                  <DialogTitle className="text-2xl font-bold text-foreground tracking-tight uppercase">Editar Cliente</DialogTitle>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mt-1">Actualización de datos maestros</p>
                </div>
              </div>

            </div>
          </div>

          {/* Form Content */}
          <div className="px-10 py-10 space-y-10 bg-card/30 max-h-[70vh] overflow-y-auto custom-scrollbar">

            {/* Financial Summary Card */}
            {(totalAmount != null || totalBalance != null) && (
                <div className="p-6 rounded-[4px] bg-muted/40 border border-border flex items-center justify-between shadow-inner group">
                    <div className="space-y-2">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] opacity-60">Saldo Pendiente</p>
                        <p className={cn(
                            "text-2xl font-bold tracking-tighter font-mono font-medium",
                            (totalBalance ?? 0) > 0 ? 'text-destructive shadow-destructive/10' : 'text-primary'
                        )}>
                            {formatCurrency(totalBalance ?? 0)}
                        </p>
                    </div>
                    <div className="text-right space-y-2">
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] opacity-60">Inversión Total</p>
                          <p className="text-lg font-bold text-foreground font-mono font-medium opacity-80 group-hover:opacity-100 transition-opacity">
                             {formatCurrency(totalAmount ?? 0)}
                          </p>
                    </div>
                </div>
            )}

            {error && (
              <div className="p-5 rounded-[4px] bg-destructive/10 border border-destructive/20 flex items-center gap-4 animate-in shake-2 duration-400">
                 <div className="p-2 rounded-[4px] bg-destructive/20">
                    <X className="size-4 text-destructive" />
                 </div>
                 <p className="text-[10px] font-bold uppercase text-destructive tracking-widest flex-1">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} id="edit-client-form" className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="md:col-span-2 space-y-3">
                    <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Nombre Completo</Label>
                    <div className="relative group/field">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/40 group-focus-within/field:text-primary transition-colors" />
                        <Input
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            className="h-12 pl-12 bg-muted/40 border-border/50 rounded-[4px] focus-visible:ring-primary/20 focus-visible:bg-card transition-all font-bold uppercase text-xs tracking-tight"
                            placeholder="Ej. Juan Pérez"
                        />
                    </div>
                </div>

                <div className="space-y-3">
                    <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Teléfono Móvil</Label>
                    <div className="relative group/field">
                        <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/40 group-focus-within/field:text-primary transition-colors" />
                        <Input
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            className="h-12 pl-12 bg-muted/40 border-border/50 rounded-[4px] focus-visible:ring-primary/20 focus-visible:bg-card transition-all font-bold text-xs"
                            placeholder="300 000 0000"
                        />
                    </div>
                </div>

                <div className="space-y-3">
                    <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Documento ID</Label>
                    <div className="relative group/field">
                        <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/40 group-focus-within/field:text-primary transition-colors" />
                        <Input
                            name="document_id"
                            value={formData.document_id}
                            onChange={handleChange}
                            className="h-12 pl-12 bg-muted/40 border-border/50 rounded-[4px] focus-visible:ring-primary/20 focus-visible:bg-card transition-all font-bold text-xs"
                            placeholder="NIT / CC"
                        />
                    </div>
                </div>

                <div className="md:col-span-2 space-y-3">
                    <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Dirección de Residencia</Label>
                    <div className="relative group/field">
                        <MapPinned className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/40 group-focus-within/field:text-primary transition-colors" />
                        <Input
                            name="address"
                            value={formData.address}
                            onChange={handleChange}
                            className="h-12 pl-12 bg-muted/40 border-border/50 rounded-[4px] focus-visible:ring-primary/20 focus-visible:bg-card transition-all font-bold text-xs"
                            placeholder="Ej. Calle 123 # 45 - 67"
                        />
                    </div>
                </div>
            </form>

            <div className="p-5 rounded-[4px] bg-primary/5 border border-primary/10 flex gap-4 shadow-inner">
                <Info className="size-5 text-primary shrink-0 mt-0.5" />
                <p className="text-[10px] leading-relaxed text-muted-foreground font-bold uppercase tracking-tight opacity-70">
                    Las actualizaciones en la dirección sincronizarán automáticamente con las rutas de cobro asignadas para el día de mañana.
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
                form="edit-client-form"
                disabled={loading}
                className="h-11 px-10 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 rounded-[4px] font-bold transition-all flex items-center gap-3 text-[10px] uppercase tracking-[0.15em]"
             >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                    <>
                        <span>Guardar Cambios</span>
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
