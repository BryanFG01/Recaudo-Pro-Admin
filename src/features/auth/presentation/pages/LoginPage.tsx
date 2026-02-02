import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Eye, EyeOff, HelpCircle, Loader2, Lock, Mail, Search, Wallet } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useAuthStore } from '../store/authStore'

type Step = 'business-code' | 'super-login'

const inputDark =
  'bg-[#2D3748] border-gray-600 text-white placeholder:text-gray-400 focus-visible:ring-blue-500 focus-visible:border-blue-500'

export default function LoginPage() {
  const [step, setStep] = useState<Step>('business-code')
  const [businessCode, setBusinessCode] = useState('')
  const [verifiedBusinessCode, setVerifiedBusinessCode] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showLoading, setShowLoading] = useState(false)

  const { getUsersByBusinessId, getBusinessByCode, signIn } = useAuth()
  const { user, businessId, setBusinessId, setBusinessCode: setStoreBusinessCode } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    if (user) navigate('/admin/users')
  }, [user, navigate])

  const handleBusinessCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)
    const loadingTimeout = setTimeout(() => setShowLoading(true), 150)
    const startTime = Date.now()
    const minVisibilityTime = 300

    try {
      const code = businessCode.trim()
      if (!code) {
        setError('Por favor ingresa un código de negocio válido')
        clearTimeout(loadingTimeout)
        setIsLoading(false)
        setShowLoading(false)
        return
      }

      const business = await getBusinessByCode(code)
      if (!business?.id) {
        setError(`No se encontró un negocio con el código: ${code}`)
        clearTimeout(loadingTimeout)
        setIsLoading(false)
        setShowLoading(false)
        return
      }

      // No bloquear si no hay usuarios o falla la lista: el super admin se crea en BD y crea los usuarios
      try {
        await getUsersByBusinessId(business.id)
      } catch {
        // Ignorar: permitir continuar al login (super admin entra con email/password)
      }

      setVerifiedBusinessCode(business.code)
      setBusinessId(business.id)
      setStoreBusinessCode(business.code)
      setStep('super-login')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al buscar negocio')
      // No registrar el objeto de error para evitar filtración de datos sensibles
      console.error('Error al buscar negocio.')
    } finally {
      clearTimeout(loadingTimeout)
      const remaining = Math.max(0, minVisibilityTime - (Date.now() - startTime))
      setTimeout(() => {
        setIsLoading(false)
        setShowLoading(false)
      }, remaining)
    }
  }

  const handleSuperLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!businessId) {
      setError('Sesión de negocio perdida. Volvé a ingresar el código.')
      return
    }
    setIsLoading(true)
    const loadingTimeout = setTimeout(() => setShowLoading(true), 150)

    try {
      const { success, error: signError } = await signIn({
        email: email.trim(),
        password,
        businessId: businessId ?? undefined,
        businessCode: verifiedBusinessCode || undefined
      })
      if (!success) {
        setError(signError || 'Credenciales incorrectas')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al iniciar sesión')
    } finally {
      clearTimeout(loadingTimeout)
      setIsLoading(false)
      setShowLoading(false)
    }
  }

  const handleVolver = () => {
    setBusinessId(null)
    setStoreBusinessCode(null)
    setStep('business-code')
    setError(null)
    setEmail('')
    setPassword('')
  }

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center px-4 py-6 sm:px-6 lg:px-8">
      {/* Fondo: gradiente sutil en web, sólido en móvil */}
      <div
        className="fixed inset-0 bg-gradient-to-br from-[#1a2436] via-[#1a2436] to-[#0f172a] -z-10"
        aria-hidden
      />

      {/* Ayuda (esquina superior derecha) */}
      <button
        type="button"
        className="absolute top-4 right-4 p-2 rounded-full text-gray-400 hover:text-gray-300 hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1a2436] transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
        aria-label="Ayuda"
      >
        <HelpCircle className="h-5 w-5" />
      </button>

      <div className="w-full max-w-md">
        {/* Logo + marca */}
        <div className="flex flex-col items-center mb-8">
          <div
            className="flex items-center justify-center w-14 h-14 rounded-xl bg-[#2563EB] text-white mb-4"
            aria-hidden
          >
            <Wallet className="h-8 w-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">RecaudoPro</h1>
          <p className="text-sm text-gray-400 mt-0.5">Admin</p>
        </div>

        {/* Títulos según paso */}
        <div className="text-center mb-6">
          {step === 'business-code' ? (
            <>
              <p className="text-sm text-gray-300">Buscar negocio por código</p>
              <p className="text-xs text-gray-500 mt-1">
                Ingresá el código de tu negocio para continuar
              </p>
            </>
          ) : (
            <>
              <h2 className="text-xl font-semibold text-white">Bienvenido de nuevo</h2>
              <p className="text-sm text-gray-400 mt-1">
                Iniciá sesión para continuar con tu cuenta.
              </p>
              {verifiedBusinessCode && (
                <p className="text-xs text-gray-500 mt-1">Negocio: {verifiedBusinessCode}</p>
              )}
            </>
          )}
        </div>

        {error && (
          <div
            id="login-error"
            className="mb-6 rounded-lg bg-red-900/50 border border-red-700/60 text-red-200 px-4 py-3 text-sm"
            role="alert"
            aria-live="polite"
          >
            <pre className="whitespace-pre-wrap">{error}</pre>
          </div>
        )}

        {step === 'business-code' && (
          <form className="space-y-6" onSubmit={handleBusinessCodeSubmit}>
            <div className="space-y-2">
              <Label htmlFor="businessCode" className="text-gray-200">
                Código de negocio
              </Label>
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none"
                  aria-hidden
                />
                <Input
                  id="businessCode"
                  name="businessCode"
                  type="text"
                  required
                  value={businessCode}
                  onChange={(e) => setBusinessCode(e.target.value)}
                  placeholder="Buscar o ingresar código"
                  className={`pl-10 min-h-[44px] ${inputDark}`}
                  aria-describedby={error ? 'login-error' : undefined}
                  aria-invalid={!!error}
                  autoComplete="organization"
                />
              </div>
            </div>
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full min-h-[44px] bg-[#2563EB] hover:bg-[#1d4ed8] text-white font-medium rounded-lg transition-colors"
              aria-busy={isLoading}
            >
              {showLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />}
              {isLoading ? 'Verificando...' : 'Entrar'}
            </Button>
          </form>
        )}

        {step === 'super-login' && (
          <form className="space-y-5" onSubmit={handleSuperLoginSubmit}>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-200">
                Correo electrónico
              </Label>
              <div className="relative">
                <Mail
                  className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none"
                  aria-hidden
                />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  // placeholder="admin@admin.com"
                  className={`pl-10 min-h-[44px] ${inputDark}`}
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-gray-200">
                  Contraseña
                </Label>
                <a
                  href="#"
                  className="text-sm text-[#2563EB] hover:text-[#3b82f6] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1a2436] rounded"
                  onClick={(e) => e.preventDefault()}
                >
                  ¿Olvidaste tu contraseña?
                </a>
              </div>
              <div className="relative">
                <Lock
                  className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none"
                  aria-hidden
                />
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Ingresá tu contraseña"
                  className={`pl-10 pr-10 min-h-[44px] ${inputDark}`}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-300 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div className="flex gap-3 pt-1">
              <Button
                type="button"
                onClick={handleVolver}
                disabled={isLoading}
                className="flex-1 min-h-[44px] border-gray-600 text-gray-300 bg-[#2D3748] hover:bg-white/10 hover:border-gray-500 hover:text-white rounded-lg"
              >
                Volver
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="flex-1 min-h-[44px] bg-[#2563EB] hover:bg-[#1d4ed8] text-white font-medium rounded-lg transition-colors"
                aria-busy={isLoading}
              >
                {showLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />}
                {isLoading ? 'Entrando...' : 'Iniciar sesión'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
