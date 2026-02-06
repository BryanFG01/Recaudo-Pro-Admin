import { Button } from '@/components/ui/button'
import { apiClient } from '@/shared/config/api'
import { cn } from '@/shared/utils/cn'
import { ArrowLeft, CheckCircle2, Loader2, Save, Upload, X } from 'lucide-react'
import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CreateUserRequest } from '../../domain/models'
import { useAuth } from '../hooks/useAuth'
import { useAuthStore } from '../store/authStore'

const containerStyle = 'bg-[#0f171a]/40 border-white/5 backdrop-blur-md shadow-2xl'
const inputStyle = 'bg-white/[0.03] border-white/5 text-white placeholder:text-muted-foreground/40 focus:ring-primary/50 focus:border-primary/50 transition-all duration-300'
const labelStyle = 'text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mb-2 block'
const sectionTitleStyle = 'text-[11px] font-black uppercase tracking-[0.2em] text-primary/80 mb-6 flex items-center gap-2'

export default function CreateUserPage() {
  const navigate = useNavigate()
  const { businessId } = useAuthStore()
  const { createUser } = useAuth()

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
    residence_country: '',
    residence_city: '',
    work_country: '',
    business_code: '',
    employee_code: '',
    commission_percentage: undefined,
    is_active: true,
  })

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const processDocumentImageFile = async (file: File) => {
    const allowed = ['image/jpeg', 'image/jpg', 'image/png']
    if (!allowed.includes(file.type)) {
      setError('Formato no válido. Use JPG o PNG.')
      return
    }
    const maxMb = 5
    if (file.size > maxMb * 1024 * 1024) {
      setError(`Límite de tamaño superado (${maxMb}MB).`)
      return
    }
    setError(null)
    setIsUploadingImage(true)
    try {
      const url = await apiClient.uploadImage(file)
      setFormData((prev: CreateUserRequest) => ({ ...prev, document_file_url: url }))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al procesar archivo.')
    } finally {
      setIsUploadingImage(false)
    }
  }

  const handleDocumentImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) void processDocumentImageFile(file)
    e.target.value = ''
  }

  const handleDocumentDrop = (e: React.DragEvent) => {
    e.preventDefault()
    if (isUploadingImage) return
    const file = e.dataTransfer.files?.[0]
    if (file) void processDocumentImageFile(file)
  }

  const handleDocumentDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleRemoveDocumentImage = () => {
    setFormData((prev: CreateUserRequest) => ({ ...prev, document_file_url: '' }))
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    if (!businessId) {
      setError('Sesión expirada o negocio no identificado.')
      return
    }

    setIsLoading(true)

    try {
      const result = await createUser(formData, businessId)

      if (result.success) {
        setSuccess(true)
        setTimeout(() => {
          navigate('/admin/users')
        }, 1500)
      } else {
        setError(result.error || 'Fallo en el registro del colaborador.')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error sistémico al crear usuario.')
    } finally {
      setIsLoading(false)
    }
  }

  if (!businessId) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4 animate-in fade-in duration-500">
        <p className="text-muted-foreground/60 italic font-medium">Autenticación requerida...</p>
        <Button onClick={() => navigate('/login')} className="h-11 px-8 bg-primary hover:bg-primary/90 text-white font-bold uppercase tracking-widest text-[10px]">
          Ir al Login
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-6">
          <Button
            variant="outline"
            onClick={() => navigate('/admin/users')}
            className="h-11 w-11 p-0 rounded-xl border-white/5 bg-white/[0.03] text-white hover:bg-white/[0.08] hover:border-white/10 shadow-xl"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="space-y-1">
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">Alta de Colaborador</h1>
            <p className="text-sm text-muted-foreground/60">Registra un nuevo integrante en tu equipo de trabajo.</p>
          </div>
        </div>
      </div>

      {(error || success) && (
        <div className={cn(
          "p-4 rounded-xl border text-[10px] font-black uppercase tracking-widest flex items-center gap-3 animate-in zoom-in-95 duration-300",
          error ? "bg-error/10 border-error/20 text-error" : "bg-success/10 border-success/20 text-success"
        )}>
          {error ? <X className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
          {error || "Usuario registrado con éxito. Redirigiendo..."}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex-1 space-y-8 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          <div className="lg:col-span-8 space-y-8">
            <div className={cn("rounded-2xl p-8 border", containerStyle)}>
              <h3 className={sectionTitleStyle}>
                <span className="w-4 h-px bg-primary/40" />
                Credenciales de Acceso
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-1.5">
                  <label htmlFor="email" className={labelStyle}>Correo Electrónico *</label>
                  <input id="email" name="email" type="email"  value={formData.email} onChange={handleChange}
                    className={cn("w-full px-4 py-3 rounded-xl border focus:outline-none", inputStyle)} placeholder="ejemplo@correo.com" />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="password" className={labelStyle}>Contraseña Temporal *</label>
                  <input id="password" name="password" type="password" required value={formData.password} onChange={handleChange}
                    className={cn("w-full px-4 py-3 rounded-xl border focus:outline-none", inputStyle)} placeholder="••••••••" />
                </div>
              </div>
            </div>

            <div className={cn("rounded-2xl p-8 border", containerStyle)}>
              <h3 className={sectionTitleStyle}>
                <span className="w-4 h-px bg-primary/40" />
                Información Identitaria
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <div className="space-y-1.5">
                  <label htmlFor="first_name" className={labelStyle}>Primer Nombre</label>
                  <input id="first_name" name="first_name" type="text" value={formData.first_name ?? ''} onChange={handleChange}
                    className={cn("w-full px-4 py-3 rounded-xl border focus:outline-none text-white font-bold", inputStyle)} />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="second_name" className={labelStyle}>Segundo Nombre</label>
                  <input id="second_name" name="second_name" type="text" value={formData.second_name ?? ''} onChange={handleChange}
                    className={cn("w-full px-4 py-3 rounded-xl border focus:outline-none opacity-80", inputStyle)} />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="first_last_name" className={labelStyle}>Primer Apellido</label>
                  <input id="first_last_name" name="first_last_name" type="text" value={formData.first_last_name ?? ''} onChange={handleChange}
                    className={cn("w-full px-4 py-3 rounded-xl border focus:outline-none text-white font-bold", inputStyle)} />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="second_last_name" className={labelStyle}>Segundo Apellido</label>
                  <input id="second_last_name" name="second_last_name" type="text" value={formData.second_last_name ?? ''} onChange={handleChange}
                    className={cn("w-full px-4 py-3 rounded-xl border focus:outline-none opacity-80", inputStyle)} />
                </div>
                <div className="space-y-1.5 lg:col-span-2">
                  <label htmlFor="name" className={labelStyle}>Identificador de Pantalla (Login)</label>
                  <input id="name" name="name" type="text" value={formData.name ?? ''} onChange={handleChange}
                    className={cn("w-full px-4 py-3 rounded-xl border focus:outline-none text-primary font-black uppercase tracking-widest", inputStyle)} placeholder="NOMBRE.APELLIDO" />
                </div>
              </div>
            </div>

            <div className={cn("rounded-2xl p-8 border", containerStyle)}>
              <h3 className={sectionTitleStyle}>
                <span className="w-4 h-px bg-primary/40" />
                Ubicación y Contacto
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-1.5">
                  <label htmlFor="phone" className={labelStyle}>Línea Telefónica</label>
                  <input id="phone" name="phone" type="tel" value={formData.phone ?? ''} onChange={handleChange}
                    className={cn("w-full px-4 py-3 rounded-xl border focus:outline-none tabular-nums font-bold", inputStyle)} placeholder="+57 --- ----" />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="address" className={labelStyle}>Dirección Domiciliaria</label>
                  <input id="address" name="address" type="text" value={formData.address ?? ''} onChange={handleChange}
                    className={cn("w-full px-4 py-3 rounded-xl border focus:outline-none", inputStyle)} />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="residence_city" className={labelStyle}>Ciudad</label>
                  <input id="residence_city" name="residence_city" type="text" value={formData.residence_city ?? ''} onChange={handleChange}
                    className={cn("w-full px-4 py-3 rounded-xl border focus:outline-none", inputStyle)} />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="residence_country" className={labelStyle}>País de Residencia</label>
                  <input id="residence_country" name="residence_country" type="text" value={formData.residence_country ?? ''} onChange={handleChange}
                    className={cn("w-full px-4 py-3 rounded-xl border focus:outline-none", inputStyle)} />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="work_country" className={labelStyle}>País de Trabajo</label>
                  <input id="work_country" name="work_country" type="text" value={formData.work_country ?? ''} onChange={handleChange}
                    className={cn("w-full px-4 py-3 rounded-xl border focus:outline-none border-primary/20", inputStyle)} placeholder="Colombia" />
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 space-y-8">
            <div className={cn("rounded-2xl p-8 border", containerStyle)}>
              <h3 className={sectionTitleStyle}>Identificación Administrativa</h3>
              <div className="space-y-6">
                <div className="space-y-1.5">
                  <label htmlFor="business_code" className={labelStyle}>Código de Negocio</label>
                  <input id="business_code" name="business_code" type="text" value={formData.business_code ?? ''} onChange={handleChange}
                    className={cn("w-full px-4 py-3 rounded-xl border focus:outline-none font-bold text-info", inputStyle)} placeholder="ARG01" />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="number" className={labelStyle}>Número de Usuario</label>
                  <input id="number" name="number" type="text" value={formData.number ?? ''} onChange={handleChange}
                    className={cn("w-full px-4 py-3 rounded-xl border focus:outline-none font-bold text-white", inputStyle)} placeholder="USR001" />
                </div>
              </div>
            </div>

            <div className={cn("rounded-2xl p-8 border", containerStyle)}>
               <h3 className={sectionTitleStyle}>Configuración Operativa</h3>
               <div className="space-y-6">
                 <div className="space-y-1.5">
                    <label htmlFor="role" className={labelStyle}>Rol del Usuario</label>
                    <select id="role" name="role" required value={formData.role} onChange={handleChange}
                      className={cn("w-full px-4 py-3 rounded-xl border focus:outline-none appearance-none cursor-pointer", inputStyle)}>
                      <option value="cobrador" className="bg-[#0f171a]">Cobrador</option>
                      <option value="supervisor" className="bg-[#0f171a]">Supervisor</option>
                    </select>
                 </div>
                 <div className="space-y-1.5">
                    <label htmlFor="commission_percentage" className={labelStyle}>% Gestión de Comisión</label>
                    <div className="relative">
                      <input id="commission_percentage" name="commission_percentage" type="number" min="0" max="100" step="0.01"
                        value={formData.commission_percentage ?? ''} onChange={handleChange}
                        className={cn("w-full px-4 py-3 rounded-xl border focus:outline-none tabular-nums font-black text-success pr-12", inputStyle)} placeholder="0.00" />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-success/40 font-bold">%</span>
                    </div>
                 </div>
                 <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/5">
                    <label htmlFor="is_active" className="text-[10px] font-black uppercase tracking-widest text-white">Estado Activo</label>
                    <input id="is_active" name="is_active" type="checkbox" checked={formData.is_active ?? true} onChange={handleChange}
                      className="h-5 w-5 rounded-md border-white/10 bg-white/5 text-primary focus:ring-primary/50 cursor-pointer" />
                 </div>
               </div>
            </div>

            <div className={cn("rounded-2xl p-8 border", containerStyle)}>
              <h3 className={sectionTitleStyle}>Validación Documental</h3>
              <div className="space-y-6">
                <div className="space-y-1.5">
                  <label htmlFor="document_type" className={labelStyle}>Tipo ID</label>
                  <select id="document_type" name="document_type" value={formData.document_type ?? ''} onChange={handleChange}
                    className={cn("w-full px-4 py-3 rounded-xl border focus:outline-none appearance-none cursor-pointer", inputStyle)}>
                    <option value="" className="bg-[#0f171a]">Elegir...</option>
                    <option value="CC" className="bg-[#0f171a]">Cédula de ciudadanía</option>
                    <option value="CE" className="bg-[#0f171a]">Cédula de extranjería</option>
                    <option value="TI" className="bg-[#0f171a]">Tarjeta de identidad</option>
                    <option value="NIT" className="bg-[#0f171a]">NIT</option>
                    <option value="Pasaporte" className="bg-[#0f171a]">Pasaporte</option>
                    <option value="Otro" className="bg-[#0f171a]">Otro</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="document_number" className={labelStyle}>Número ID</label>
                  <input id="document_number" name="document_number" type="text" value={formData.document_number ?? ''} onChange={handleChange}
                    className={cn("w-full px-4 py-3 rounded-xl border focus:outline-none tabular-nums font-bold", inputStyle)} />
                </div>
                <div className="space-y-1.5">
                  <label className={labelStyle}>Adjunto Probatorio</label>
                  <input ref={fileInputRef} type="file" accept="image/jpeg,image/jpg,image/png" onChange={handleDocumentImage} disabled={isUploadingImage} className="hidden" id="document_file_upload" />
                  {formData.document_file_url ? (
                    <div className="rounded-xl border border-success/20 bg-success/5 p-4 flex items-center justify-between gap-3 animate-in fade-in duration-300">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-success/20 flex items-center justify-center shrink-0">
                          <CheckCircle2 className="w-4 h-4 text-success" />
                        </div>
                        <span className="text-[10px] font-black uppercase text-success/80 truncate">Expediente Cargado</span>
                      </div>
                      <Button type="button" variant="ghost" size="sm" onClick={handleRemoveDocumentImage} className="h-8 w-8 p-0 text-error hover:bg-error/10 rounded-lg">
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <label htmlFor="document_file_upload" onDrop={handleDocumentDrop} onDragOver={handleDocumentDragOver}
                      className={cn(
                        "flex flex-col items-center justify-center gap-3 w-full min-h-[140px] p-6 rounded-2xl border-2 border-dashed transition-all duration-300 text-center cursor-pointer",
                        isUploadingImage ? "opacity-30 pointer-events-none" : "border-white/10 bg-white/[0.02] hover:border-primary/40 hover:bg-primary/5 text-muted-foreground/40 hover:text-primary/60"
                      )}>
                      {isUploadingImage ? <Loader2 className="w-6 h-6 animate-spin text-primary" /> : <Upload className="w-6 h-6" />}
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest leading-tight">Click para Vincular</p>
                        <p className="text-[9px] mt-1 opacity-60">Formatos JPG / PNG <br/> Máximo 5MB</p>
                      </div>
                    </label>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-4 p-8 rounded-2xl border border-white/5 bg-white/[0.03] backdrop-blur-sm">
          <Button type="button" onClick={() => navigate('/admin/users')} disabled={isLoading} variant="ghost"
            className="h-12 px-8 text-[10px] font-black uppercase tracking-[0.2em] text-white hover:bg-white/5 transition-all">
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoading} 
            className="h-12 px-10 bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-[0.2em] text-[10px] shadow-2xl shadow-primary/20 transition-all active:scale-95 disabled:opacity-50">
            {isLoading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            {isLoading ? 'Sincronizando...' : 'Finalizar Registro'}
          </Button>
        </div>
      </form>
    </div>
  )
}
