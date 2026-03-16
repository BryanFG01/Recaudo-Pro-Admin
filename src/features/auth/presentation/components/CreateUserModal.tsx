import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { apiClient } from '@/shared/config/api'
import {
  ArrowRight,
  Briefcase,
  Building2,
  CheckCircle2,
  CreditCard,
  Globe,
  Loader2,
  Lock,
  Mail,
  MapPinned,
  Percent,
  Smartphone,
  Upload,
  User,
  UserPlus,
  X
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { CreateUserRequest } from '../../domain/models'
import { useAuth } from '../hooks/useAuth'
import { useAuthStore } from '../store/authStore'

interface CreateUserModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function CreateUserModal({ isOpen, onClose, onSuccess }: CreateUserModalProps) {
  const { businessId } = useAuthStore()
  const { createUser } = useAuth()

  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<CreateUserRequest>({
    email: '',
    password: '',
    role: 'cobrador',
    number: '',
    name: '',
    first_name: '',
    second_name: '',
    first_last_name: '',
    second_last_name: '',
    document_type: '',
    document_number: '',
    document_file_url: '',
    phone: '',
    address: '',
    residence_city: '',
    residence_country: '',
    work_country: 'Colombia',
    business_code: '',
    employee_code: '',
    commission_percentage: undefined,
    is_active: true,
  })

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isUploadingImage, setIsUploadingImage] = useState(false)

  // Autogenerate "name" (Display ID) based on names/last names
  useEffect(() => {
    const fn = formData.first_name?.trim().toUpperCase() || 'USR'
    const ln = formData.first_last_name?.trim().toUpperCase() || 'PENDIENTE'
    const newName = `${fn}_${ln}`
    if (formData.name !== newName) {
      setFormData(prev => ({ ...prev, name: newName }))
    }
  }, [formData.first_name, formData.first_last_name])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked

    setFormData((prev: CreateUserRequest) => ({
      ...prev,
      [name]:
        type === 'checkbox'
          ? checked
          : type === 'number'
            ? value === ''
              ? undefined
              : parseFloat(value)
            : value,
    }))
    setError(null)
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }))
    setError(null)
  }

  const handleNext = () => {
    if (currentStep < 4) setCurrentStep(prev => prev + 1)
  }

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(prev => prev - 1)
  }

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (currentStep < 4) {
        handleNext()
        return
    }

    setError(null)
    setSuccess(false)
    if (!businessId) {
      setError('Sesión expirada.')
      return
    }

    setIsLoading(true)
    try {
      const result = await createUser(formData, businessId)
      if (result.success) {
        setSuccess(true)
        setTimeout(() => {
            onSuccess?.()
            onClose()
            setCurrentStep(1)
            setSuccess(false)
            setFormData({
              email: '',
              password: '',
              role: 'cobrador',
              number: '',
              name: '',
              first_name: '',
              second_name: '',
              first_last_name: '',
              second_last_name: '',
              document_type: '',
              document_number: '',
              document_file_url: '',
              phone: '',
              address: '',
              residence_city: '',
              residence_country: '',
              work_country: 'Colombia',
              business_code: '',
              employee_code: '',
              commission_percentage: undefined,
              is_active: true,
            })
        }, 2000)
      } else {
        setError(result.error || 'Error al registrar colaborador.')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error sistémico.')
    } finally {
      setIsLoading(false)
    }
  }

  const progressPercentage = (currentStep / 4) * 100

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[85vh] p-0 overflow-hidden border-border bg-card !rounded-[20px] shadow-2xl backdrop-blur-xl transition-all duration-300">
        <div className="relative flex flex-col h-full max-h-[85vh]">
          {/* Header Section */}
          <div className="px-8 pt-6 pb-6 !border-sm !border-border/50 shrink-0">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-5">
                <div className="p-4 rounded-[4px] bg-primary/10 text-primary shadow-inner">
                  <UserPlus className="w-7 h-7" />
                </div>
                <div>
                  <DialogTitle className="text-2xl font-bold text-foreground tracking-tight uppercase">Alta de Colaborador</DialogTitle>
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.15em] mt-1 opacity-70">Configuración de credenciales y perfil inicial</p>
                </div>
              </div>

            </div>

            {/* Progress Bar Container */}
            <div className="mt-6 space-y-2">
              <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.2em]">
                <span className="text-muted-foreground/60">Paso {currentStep} de 4</span>
                <span className="text-primary font-mono">{Math.round(progressPercentage)}% COMPLETADO</span>
              </div>
              <div className="h-1.5 w-full bg-muted/30 rounded-[4px] overflow-hidden border border-border/20">
                <div
                  className="h-full bg-primary shadow-[0_0_12px_rgba(16,185,129,0.4)] transition-all duration-700 ease-in-out rounded-[4px]"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>
          </div>

          {/* Form Content - Scrollable area */}
          <div className="flex-1 overflow-y-auto custom-scrollbar px-8 py-8 min-h-[300px] bg-card/30">
            <form onSubmit={handleSubmit} id="create-user-modal-form" className="space-y-6">
              {currentStep === 1 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-600 ease-out">
                  <div className="space-y-2">
                    <h3 className="text-lg font-bold text-foreground uppercase tracking-tight">Acceso Corporativo</h3>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest opacity-60">Seguridad y permisos de entrada</p>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                        <Mail className="size-3 text-primary" /> Correo Electrónico Laboral
                      </Label>
                      <Input
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="h-12 bg-muted/40 border-border/50 rounded-[4px] focus-visible:ring-primary/20 focus-visible:bg-card transition-all"
                        placeholder="ejemplo@recaudopro.com"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                        <Lock className="size-3 text-primary" /> Contraseña Temporal
                      </Label>
                      <Input
                        name="password"
                        type="password"
                        value={formData.password}
                        onChange={handleChange}
                        className="h-12 bg-muted/40 border-border/50 rounded-[4px] focus-visible:ring-primary/20 focus-visible:bg-card transition-all"
                        placeholder="••••••••"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                        <Briefcase className="size-3 text-primary" /> Rol del Usuario
                      </Label>
                      <Select value={formData.role} onValueChange={(v) => handleSelectChange('role', v)}>
                        <SelectTrigger className="h-12 bg-muted/40 border-border/50 rounded-[4px] focus:ring-primary/20 outline-none">
                          <SelectValue placeholder="Seleccione un rol" />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-border shadow-2xl rounded-[4px]">
                          <SelectItem value="cobrador" className="py-3 font-bold uppercase tracking-tight text-xs">Cobrador</SelectItem>
                          <SelectItem value="supervisor" className="py-3 font-bold uppercase tracking-tight text-xs">Supervisor</SelectItem>
                          <SelectItem value="admin" className="py-3 font-bold uppercase tracking-tight text-xs text-primary">Administrador</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-600 ease-out">
                  <div className="space-y-2">
                    <h3 className="text-lg font-bold text-foreground uppercase tracking-tight">Datos de Identidad</h3>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest opacity-60">Información legal del colaborador</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Primer Nombre</Label>
                      <Input name="first_name" value={formData.first_name} onChange={handleChange} className="h-12 bg-muted/40 border-border/50 rounded-[4px] focus-visible:ring-primary/20" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Segundo Nombre</Label>
                      <Input name="second_name" value={formData.second_name} onChange={handleChange} className="h-12 bg-muted/40 border-border/50 rounded-[4px] focus-visible:ring-primary/20" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Primer Apellido</Label>
                      <Input name="first_last_name" value={formData.first_last_name} onChange={handleChange} className="h-12 bg-muted/40 border-border/50 rounded-[4px] focus-visible:ring-primary/20" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Segundo Apellido</Label>
                      <Input name="second_last_name" value={formData.second_last_name} onChange={handleChange} className="h-12 bg-muted/40 border-border/50 rounded-[4px] focus-visible:ring-primary/20" />
                    </div>
                  </div>

                  <div className="p-5 rounded-[4px] bg-muted/40 border border-border flex items-center justify-between shadow-inner">
                    <div className="flex items-center gap-4">
                       <div className="size-10 rounded-[4px] bg-primary/10 flex items-center justify-center text-primary">
                        <User className="size-5" />
                       </div>
                       <div>
                         <p className="text-[9px] font-bold uppercase text-muted-foreground tracking-widest mb-0.5">ID interno autogenerado</p>
                         <p className="text-sm font-bold text-foreground tracking-[0.1em] font-mono font-medium">{formData.name}</p>
                       </div>
                    </div>
                    <div className="px-3 py-1 rounded-[4px] bg-primary/20 text-primary text-[8px] font-bold uppercase shadow-sm">
                      SISTEMA
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 3 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-600 ease-out">
                  <div className="space-y-2">
                    <h3 className="text-lg font-bold text-foreground uppercase tracking-tight">Contacto y Residencia</h3>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest opacity-60">Datos de localización y comunicación</p>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                         <Smartphone className="size-3 text-primary" /> Teléfono Móvil
                      </Label>
                      <Input name="phone" placeholder="300 000 0000" value={formData.phone} onChange={handleChange} className="h-12 bg-muted/40 border-border/50 rounded-[4px] focus-visible:ring-primary/20" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                         <MapPinned className="size-3 text-primary" /> Dirección de Residencia
                      </Label>
                      <Input name="address" value={formData.address} onChange={handleChange} className="h-12 bg-muted/40 border-border/50 rounded-[4px] focus-visible:ring-primary/20" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Ciudad</Label>
                        <Input name="residence_city" value={formData.residence_city} onChange={handleChange} className="h-12 bg-muted/40 border-border/50 rounded-[4px] focus-visible:ring-primary/20" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                           <Globe className="size-3 text-primary" /> País
                        </Label>
                        <Input name="residence_country" value={formData.residence_country} onChange={handleChange} className="h-12 bg-muted/40 border-border/50 rounded-[4px] focus-visible:ring-primary/20" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 4 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-600 ease-out">
                  <div className="space-y-2">
                    <h3 className="text-lg font-bold text-foreground uppercase tracking-tight">Configuración ERP</h3>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest opacity-60">Parámetros corporativos finales</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                         <Building2 className="size-3 text-primary" /> Código Negocio
                      </Label>
                      <Input name="business_code" placeholder="ERP01" value={formData.business_code} onChange={handleChange} className="h-12 bg-muted/40 border-border/50 rounded-[4px] focus-visible:ring-primary/20" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                         <Percent className="size-3 text-primary" /> % Comisión
                      </Label>
                      <Input name="commission_percentage" type="number" step="0.01" value={formData.commission_percentage} onChange={handleChange} className="h-12 bg-muted/40 border-border/50 rounded-[4px] focus-visible:ring-primary/20" />
                    </div>
                  </div>

                  <div className="grid grid-cols-5 gap-4">
                    <div className="col-span-2 space-y-2">
                      <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Tipo ID</Label>
                      <Select value={formData.document_type} onValueChange={(v) => handleSelectChange('document_type', v)}>
                        <SelectTrigger className="h-12 bg-muted/40 border-border/50 rounded-[4px] focus:ring-primary/20">
                          <SelectValue placeholder="TIPO" />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-border rounded-[4px]">
                          <SelectItem value="CC" className="py-2 text-xs font-bold">CC</SelectItem>
                          <SelectItem value="CE" className="py-2 text-xs font-bold">CE</SelectItem>
                          <SelectItem value="NIT" className="py-2 text-xs font-bold">NIT</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-3 space-y-2">
                      <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                         <CreditCard className="size-3 text-primary" /> Número Identificación
                      </Label>
                      <Input name="document_number" value={formData.document_number} onChange={handleChange} className="h-12 bg-muted/40 border-border/50 rounded-[4px] focus-visible:ring-primary/20" />
                    </div>
                  </div>

                  <div
                    className="relative p-6 border-2 border-dashed border-border/50 rounded-[4px] bg-muted/20 hover:bg-primary/5 hover:border-primary/30 transition-all cursor-pointer group flex flex-col items-center justify-center gap-2 shadow-inner"
                    onClick={() => document.getElementById('file-upload-dialog')?.click()}
                  >
                        <input id="file-upload-dialog" type="file" className="hidden" onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) {
                                setIsUploadingImage(true)
                                apiClient.uploadImage(file).then(url => {
                                    setFormData(p => ({ ...p, document_file_url: url }))
                                    setIsUploadingImage(false)
                                })
                            }
                        }} />
                        {isUploadingImage ? <Loader2 className="size-8 animate-spin text-primary" /> : <Upload className="size-8 text-muted-foreground group-hover:text-primary transition-colors" />}
                        <div className="flex flex-col items-center space-y-1">
                            <p className="text-[10px] font-bold uppercase text-muted-foreground group-hover:text-primary transition-colors tracking-widest">Adjuntar Documento ID</p>
                            <p className="text-[8px] font-bold text-muted-foreground/40 uppercase tracking-tighter">Formatos sugeridos: JPG, PNG, PDF</p>
                        </div>
                        {formData.document_file_url && (
                            <div className="absolute inset-2 bg-card/95 backdrop-blur-md rounded-[4px] flex items-center justify-center gap-3 border border-primary/20 shadow-2xl animate-in zoom-in-95">
                                 <div className="size-10 rounded-[4px] bg-primary/10 flex items-center justify-center">
                                    <CheckCircle2 className="size-6 text-primary" />
                                 </div>
                                 <span className="text-[10px] font-bold uppercase text-primary tracking-widest">Documento Verificado</span>
                                 <button onClick={(e) => { e.stopPropagation(); setFormData(p => ({ ...p, document_file_url: '' })) }} className="ml-4 p-2 hover:bg-destructive/10 text-destructive rounded-[4px] transition-all">
                                    <X className="size-4" />
                                 </button>
                            </div>
                        )}
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

              {success && (
                <div className="p-5 rounded-[4px] bg-primary/10 border border-primary/20 flex items-center gap-4 animate-in zoom-in-95 duration-500 shadow-lg shadow-primary/5">
                  <div className="p-3 rounded-[4px] bg-primary/20 shadow-inner">
                    <CheckCircle2 className="size-5 text-primary" />
                  </div>
                  <div className="flex flex-col">
                    <p className="text-[10px] font-bold uppercase text-primary tracking-widest">Registro Exitoso</p>
                    <p className="text-[9px] font-medium text-primary/70 uppercase">Colaborador activado en el sistema</p>
                  </div>
                </div>
              )}
            </form>
          </div>

          {/* Footer Section - Fixed */}
          <div className="px-8 py-6 flex items-center justify-between bg-muted/30 border-t border-border/50 shrink-0">
            <Button
                variant="ghost"
                onClick={currentStep === 1 ? onClose : handleBack}
                className="h-11 px-8 text-muted-foreground hover:text-foreground hover:bg-muted font-bold rounded-[4px] text-[10px] uppercase tracking-widest transition-all"
            >
              {currentStep === 1 ? 'Cancelar' : 'Paso Anterior'}
            </Button>

            <div className="flex gap-4">
                <Button
                    onClick={handleSubmit}
                    disabled={isLoading || success}
                    className="h-11 px-10 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 rounded-[4px] font-bold transition-all flex items-center gap-3 text-[10px] uppercase tracking-[0.15em]"
                >
                    {isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <>
                            <span>{currentStep === 4 ? 'Finalizar y Crear' : 'Siguiente Paso'}</span>
                            <ArrowRight className="w-4 h-4 shadow-primary/30" />
                        </>
                    )}
                </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
