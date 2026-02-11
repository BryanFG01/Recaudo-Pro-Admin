import { ModeToggle } from '@/components/theme/ModeToggle'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Eye, EyeOff, HelpCircle, Loader2, Lock, Mail, Search, Wallet } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useAuthStore } from '../store/authStore'

type Step = 'business-code' | 'super-login'

const inputStyle =
  'min-h-[44px] border border-input bg-background text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'

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
    <div className="relative min-h-screen flex flex-col items-center justify-center px-4 py-6 sm:px-6 lg:px-8 bg-gradient-to-br from-background via-background to-muted/30">
      {/* Barra superior: Ayuda + cambio de tema */}
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <button
          type="button"
          className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label="Ayuda"
        >
          <HelpCircle className="h-5 w-5" />
        </button>
        <ModeToggle />
      </div>

      <div className="w-full max-w-md space-y-6">
        {/* Logo + marca */}
        <div className="flex flex-col items-center">
          <div
            className="flex items-center justify-center w-16 h-16 rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/25 mb-4"
            aria-hidden
          >
            <Wallet className="h-9 w-9" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            RecaudoPro
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Admin</p>
        </div>

        <Card className="border-border/80 shadow-xl bg-card/95 backdrop-blur-sm">
          <CardHeader className="space-y-1 text-center pb-4">
            {step === 'business-code' ? (
              <>
                <CardTitle className="text-lg">Buscar negocio</CardTitle>
                <CardDescription>Ingresá el código de tu negocio para continuar</CardDescription>
              </>
            ) : (
              <>
                <CardTitle className="text-xl">Bienvenido de nuevo</CardTitle>
                <CardDescription>Iniciá sesión para continuar con tu cuenta.</CardDescription>
                {verifiedBusinessCode && (
                  <span className="inline-block mt-2 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                    Negocio: {verifiedBusinessCode}
                  </span>
                )}
              </>
            )}
          </CardHeader>
          <CardContent className="space-y-6">
            {error && (
              <div
                id="login-error"
                className="rounded-lg bg-destructive/10 border border-destructive/30 text-destructive px-4 py-3 text-sm"
                role="alert"
                aria-live="polite"
              >
                <pre className="whitespace-pre-wrap font-sans">{error}</pre>
              </div>
            )}

            {step === 'business-code' && (
              <form className="space-y-6" onSubmit={handleBusinessCodeSubmit}>
                <div className="space-y-2">
                  <Label htmlFor="businessCode">Código de negocio</Label>
                  <div className="relative">
                    <Search
                      className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none"
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
                      className={`pl-10 ${inputStyle}`}
                      aria-describedby={error ? 'login-error' : undefined}
                      aria-invalid={!!error}
                      autoComplete="organization"
                    />
                  </div>
                </div>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full min-h-[44px] font-medium"
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
                  <Label htmlFor="email">Correo electrónico</Label>
                  <div className="relative">
                    <Mail
                      className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none"
                      aria-hidden
                    />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="tu@correo.com"
                      className={`pl-10 ${inputStyle}`}
                      autoComplete="email"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Contraseña</Label>
                    <a
                      href="#"
                      className="text-sm text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                      onClick={(e) => e.preventDefault()}
                    >
                      ¿Olvidaste tu contraseña?
                    </a>
                  </div>
                  <div className="relative">
                    <Lock
                      className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none"
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
                      className={`pl-10 pr-10 ${inputStyle}`}
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <div className="flex gap-3 pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleVolver}
                    disabled={isLoading}
                    className="flex-1 min-h-[44px]"
                  >
                    Volver
                  </Button>
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 min-h-[44px] font-medium"
                    aria-busy={isLoading}
                  >
                    {showLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />}
                    {isLoading ? 'Entrando...' : 'Iniciar sesión'}
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
