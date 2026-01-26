import { Button } from '@/components/ui/button'
import { apiClient } from '@/shared/config/api'
import { ArrowLeft, CheckCircle2, Loader2, Save, Upload, X } from 'lucide-react'
import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CreateUserRequest } from '../../domain/models'
import { useAuth } from '../hooks/useAuth'
import { useAuthStore } from '../store/authStore'

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
      setError('Seleccione una imagen en formato JPG o PNG.')
      return
    }
    const maxMb = 5
    if (file.size > maxMb * 1024 * 1024) {
      setError(`La imagen no debe superar ${maxMb} MB.`)
      return
    }
    setError(null)
    setIsUploadingImage(true)
    try {
      const url = await apiClient.uploadImage(file)
      setFormData((prev) => ({ ...prev, document_file_url: url }))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al subir la imagen.')
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
    setFormData((prev) => ({ ...prev, document_file_url: '' }))
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked

    setFormData((prev) => ({
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
      setError('No hay business_id disponible. Por favor, inicia sesión.')
      return
    }

    setIsLoading(true)

    try {
      const result = await createUser(formData, businessId)

      if (result.success) {
        setSuccess(true)
        setTimeout(() => {
          navigate('/admin/users')
        }, 2000)
      } else {
        setError(result.error || 'Error al crear usuario')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido al crear usuario')
    } finally {
      setIsLoading(false)
    }
  }

  if (!businessId) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <p className="text-gray-600">No hay business_id disponible. Por favor, inicia sesión.</p>
          <Button onClick={() => navigate('/login')} className="mt-4">
            Ir al Login
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          onClick={() => navigate('/admin/users')}
          className="flex items-center gap-2 border-gray-600 text-gray-300 bg-[#2D3748] hover:bg-white/10 hover:border-gray-500 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver
        </Button>
        <h1 className="text-3xl font-bold text-white">Crear Nuevo Usuario</h1>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded">
          Usuario creado exitosamente. Redirigiendo...
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-[#2D3748] rounded-lg shadow p-6 space-y-8">
        {/* Datos de acceso */}
        <div>
          <h3 className="text-base font-semibold text-white mb-4">Datos de acceso</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-white mb-1">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-600 rounded-md bg-[#2D3748] text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent"
                placeholder="juan@ejemplo.com"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-white mb-1">
                Contraseña <span className="text-red-500">*</span>
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-600 rounded-md bg-[#2D3748] text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent"
                placeholder="••••••••"
              />
            </div>
          </div>
        </div>

        {/* Número y rol */}
        <div>
          <h3 className="text-base font-semibold text-white mb-4">Identificación y rol</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="number" className="block text-sm font-medium text-white mb-1">
                Número de usuario
              </label>
              <input
                id="number"
                name="number"
                type="text"
                value={formData.number ?? ''}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-600 rounded-md bg-[#2D3748] text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent"
                placeholder="USR001"
              />
            </div>
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-white mb-1">
                Rol <span className="text-red-500">*</span>
              </label>
              <select
                id="role"
                name="role"
                required
                value={formData.role}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-600 rounded-md bg-[#2D3748] text-white focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent"
              >
                <option value="cobrador">Cobrador</option>
                <option value="supervisor">Supervisor</option>
                {/* <option value="admin">Administrador</option> */}
              </select>
            </div>
            <div>
              <label htmlFor="business_code" className="block text-sm font-medium text-white mb-1">
                Código de negocio
              </label>
              <input
                id="business_code"
                name="business_code"
                type="text"
                value={formData.business_code ?? ''}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-600 rounded-md bg-[#2D3748] text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent"
                placeholder="ARG01"
              />
            </div>
          </div>
        </div>

        {/* Nombres */}
        <div>
          <h3 className="text-base font-semibold text-white mb-4">Nombres</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <label htmlFor="first_name" className="block text-sm font-medium text-white mb-1">Primer nombre</label>
              <input id="first_name" name="first_name" type="text" value={formData.first_name ?? ''} onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-600 rounded-md bg-[#2D3748] text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent" placeholder="Juan" />
            </div>
            <div>
              <label htmlFor="second_name" className="block text-sm font-medium text-white mb-1">Segundo nombre</label>
              <input id="second_name" name="second_name" type="text" value={formData.second_name ?? ''} onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-600 rounded-md bg-[#2D3748] text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent" placeholder="Carlos" />
            </div>
            <div>
              <label htmlFor="first_last_name" className="block text-sm font-medium text-white mb-1">Primer apellido</label>
              <input id="first_last_name" name="first_last_name" type="text" value={formData.first_last_name ?? ''} onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-600 rounded-md bg-[#2D3748] text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent" placeholder="Pérez" />
            </div>
            <div>
              <label htmlFor="second_last_name" className="block text-sm font-medium text-white mb-1">Segundo apellido</label>
              <input id="second_last_name" name="second_last_name" type="text" value={formData.second_last_name ?? ''} onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-600 rounded-md bg-[#2D3748] text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent" placeholder="García" />
            </div>
            <div className="md:col-span-2">
              <label htmlFor="name" className="block text-sm font-medium text-white mb-1">Nombre o Codigo (Login)</label>
              <input id="name" name="name" type="text" value={formData.name ?? ''} onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-600 rounded-md bg-[#2D3748] text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent" placeholder="Juan Pérez" />
            </div>
          </div>
        </div>

        {/* Documento */}
        <div>
          <h3 className="text-base font-semibold text-white mb-4">Documento</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <label htmlFor="document_type" className="block text-sm font-medium text-white mb-1">Tipo de documento</label>
              <select id="document_type" name="document_type" value={formData.document_type ?? ''} onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-600 rounded-md bg-[#2D3748] text-white focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent">
                <option value="">Seleccionar</option>
                <option value="CC">Cédula de ciudadanía</option>
                <option value="CE">Cédula de extranjería</option>
                <option value="TI">Tarjeta de identidad</option>
                <option value="NIT">NIT</option>
                <option value="Pasaporte">Pasaporte</option>
                <option value="Otro">Otro</option>
              </select>
            </div>
            <div>
              <label htmlFor="document_number" className="block text-sm font-medium text-white mb-1">Número de documento</label>
              <input id="document_number" name="document_number" type="text" value={formData.document_number ?? ''} onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-600 rounded-md bg-[#2D3748] text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent" placeholder="123456789" />
            </div>
            <div className="md:col-span-2 lg:col-span-1">
              <label className="block text-sm font-medium text-white mb-1">Imagen del documento</label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png"
                onChange={handleDocumentImage}
                disabled={isUploadingImage}
                className="hidden"
                id="document_file_upload"
                aria-label="Subir imagen del documento"
              />
              {formData.document_file_url ? (
                <div className="rounded-md border border-gray-600 bg-[#1a202c] px-3 py-2.5 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-500" />
                    <span className="text-sm text-gray-300 truncate">Imagen cargada</span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleRemoveDocumentImage}
                    className="shrink-0 text-red-400 hover:text-red-300 hover:bg-red-900/20 h-8 w-8 p-0"
                    aria-label="Quitar imagen"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <label
                  htmlFor="document_file_upload"
                  onDrop={handleDocumentDrop}
                  onDragOver={handleDocumentDragOver}
                  className={`flex flex-col items-center justify-center gap-2 w-full min-h-[120px] px-4 py-4 rounded-md border-2 border-dashed border-gray-600 bg-[#1a202c] text-gray-400 transition-colors ${isUploadingImage ? 'cursor-not-allowed opacity-70' : 'hover:border-[#2563EB] hover:bg-[#2563EB]/5 hover:text-gray-300 cursor-pointer'}`}
                >
                  {isUploadingImage ? (
                    <Loader2 className="w-8 h-8 animate-spin" />
                  ) : (
                    <Upload className="w-8 h-8" />
                  )}
                  <span className="text-sm text-center">
                    {isUploadingImage ? 'Subiendo imagen...' : 'Seleccionar o arrastrar imagen'}
                  </span>
                  <span className="text-xs">JPG o PNG (máx. 5 MB)</span>
                </label>
              )}
            </div>
          </div>
        </div>

        {/* Contacto y ubicación */}
        <div>
          <h3 className="text-base font-semibold text-white mb-4">Contacto y ubicación</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-white mb-1">Teléfono</label>
              <input id="phone" name="phone" type="tel" value={formData.phone ?? ''} onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-600 rounded-md bg-[#2D3748] text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent" placeholder="+573001234567" />
            </div>
            <div className="md:col-span-2">
              <label htmlFor="address" className="block text-sm font-medium text-white mb-1">Dirección</label>
              <input id="address" name="address" type="text" value={formData.address ?? ''} onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-600 rounded-md bg-[#2D3748] text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent" placeholder="Calle 123 #45-67" />
            </div>
            <div>
              <label htmlFor="residence_country" className="block text-sm font-medium text-white mb-1">País de residencia</label>
              <input id="residence_country" name="residence_country" type="text" value={formData.residence_country ?? ''} onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-600 rounded-md bg-[#2D3748] text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent" placeholder="Colombia" />
            </div>
            <div>
              <label htmlFor="residence_city" className="block text-sm font-medium text-white mb-1">Ciudad de residencia</label>
              <input id="residence_city" name="residence_city" type="text" value={formData.residence_city ?? ''} onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-600 rounded-md bg-[#2D3748] text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent" placeholder="Bogotá" />
            </div>
            <div>
              <label htmlFor="work_country" className="block text-sm font-medium text-white mb-1">País de trabajo</label>
              <input id="work_country" name="work_country" type="text" value={formData.work_country ?? ''} onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-600 rounded-md bg-[#2D3748] text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent" placeholder="Colombia" />
            </div>
          </div>
        </div>

        {/* Comisión y estado */}
        <div>
          <h3 className="text-base font-semibold text-white mb-4">Comisión y estado</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="commission_percentage" className="block text-sm font-medium text-white mb-1">Porcentaje de comisión (%)</label>
              <input
                id="commission_percentage"
                name="commission_percentage"
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={formData.commission_percentage ?? ''}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-600 rounded-md bg-[#2D3748] text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent"
                placeholder="0.00"
              />
            </div>
            <div className="flex items-center">
              <input
                id="is_active"
                name="is_active"
                type="checkbox"
                checked={formData.is_active ?? true}
                onChange={handleChange}
                className="h-4 w-4 rounded border-gray-600 bg-[#2D3748] text-[#2563EB] focus:ring-[#2563EB]"
              />
              <label htmlFor="is_active" className="ml-2 block text-sm text-white">Usuario activo</label>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-4 pt-4 border-t border-gray-600">
          <Button
            type="button"
            variant="destructive"
            onClick={() => navigate('/admin/users')}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoading} className="bg-[#2563EB] hover:bg-[#1d4ed8] border-0">
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin text-white bg-[#2563EB] hover:bg-[#1d4ed8] border-0" />
                Creando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2 text-white bg-[#2563EB] hover:bg-[#1d4ed8] border-0" />
                Crear Usuario
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}

