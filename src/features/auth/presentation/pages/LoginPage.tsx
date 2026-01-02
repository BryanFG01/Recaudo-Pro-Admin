import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useAuthStore } from '../store/authStore'

export default function LoginPage() {
  const [businessId, setBusinessId] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const { getUsersByBusinessId } = useAuth()
  const { businessId: storedBusinessId, setBusinessId: setStoredBusinessId } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    if (storedBusinessId) {
      navigate('/admin/users')
    }
  }, [storedBusinessId, navigate])

  const handleBusinessIdSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      const cleanBusinessId = businessId.trim()

      if (!cleanBusinessId) {
        setError('Por favor ingresa un ID de negocio válido')
        setIsLoading(false)
        return
      }

      // Verificar que existan usuarios para este business_id
      const businessUsers = await getUsersByBusinessId(cleanBusinessId)

      if (businessUsers.length === 0) {
        setError(
          `No se encontraron usuarios para el business_id: ${cleanBusinessId}.\n\n` +
            `SOLUCIÓN: Debes crear la función RPC en Supabase.\n` +
            `1. Abre el archivo "EJECUTAR_EN_SUPABASE.sql"\n` +
            `2. Copia y ejecuta el contenido en Supabase SQL Editor`
        )
        setIsLoading(false)
        return
      }

      // Guardar el business_id y redirigir a la página de administración
      setStoredBusinessId(cleanBusinessId)
      navigate('/admin/users')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al obtener usuarios'
      setError(errorMessage)
      console.error('Error al obtener usuarios:', err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-lg">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            RecaudoPro Admin
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Ingresa el ID de tu negocio para acceder
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
            <pre className="whitespace-pre-wrap text-sm">{error}</pre>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleBusinessIdSubmit}>
          <div>
            <label htmlFor="businessId" className="block text-sm font-medium text-gray-700">
              ID de Negocio
            </label>
            <input
              id="businessId"
              name="businessId"
              type="text"
              required
              value={businessId}
              onChange={(e) => setBusinessId(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              placeholder="Ingresa el ID del negocio"
            />
          </div>
          <div>
            <Button
              variant="default"
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-500 text-white hover:bg-blue-600"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Ingresar
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
