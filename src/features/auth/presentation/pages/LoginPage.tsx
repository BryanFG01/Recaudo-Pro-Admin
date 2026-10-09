import { ModeToggle } from '@/components/theme/ModeToggle'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LoadingScreen } from '@/shared/components/LoadingScreen/LoadingScreen'
import { LEGAL_LINKS } from '@/shared/config/site'
import { Eye, EyeOff, HelpCircle, Loader2, Lock, Mail, Search, Wallet } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useSessionNotice } from '../hooks/useSessionNotice'
import { useAuthStore } from '../store/authStore'

const INPUT_CLASS =
  'h-12 pl-11 text-sm rounded-lg border-transparent bg-secondary focus-visible:border-foreground focus-visible:ring-0 focus-visible:ring-offset-0'

const LABEL_CLASS = 'text-sm font-medium text-muted-foreground'

/** Pantalla de inicio del panel tras iniciar sesión */
const ADMIN_HOME = '/admin'

export default function LoginPage() {
  const [businessCode, setBusinessCode] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const { getBusinessByCode, signIn } = useAuth()
  const { setBusinessId, setBusinessCode: setStoreBusinessCode } = useAuthStore()
  const router = useRouter()
  const notice = useSessionNotice()
  const [isOpeningPanel, setIsOpeningPanel] = useState(false)

  if (isOpeningPanel) return <LoadingScreen message="Abriendo el panel..." />

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      const code = businessCode.trim()
      const userEmail = email.trim()

      if (!code || !userEmail || !password) {
        setError('Por favor completa todos los campos para continuar')
        setIsLoading(false)
        return
      }

      // 1. Verificar negocio
      const business = await getBusinessByCode(code)
      if (!business?.id) {
        setError(`No se encontró un negocio con el código: ${code}`)
        setIsLoading(false)
        return
      }

      // 2. Guardar info de negocio en store
      setBusinessId(business.id)
      setStoreBusinessCode(business.code)

      // 3. Iniciar sesión
      const { success, error: signError } = await signIn({
        email: userEmail,
        password,
        businessId: business.id,
        businessCode: business.code
      })

      if (!success) {
        setError(signError || 'Credenciales incorrectas')
        setIsLoading(false)
        return
      }
      // Éxito: se muestra la carga hasta que el panel termine de abrir
      setIsOpeningPanel(true)
      router.replace(ADMIN_HOME)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocurrió un error inesperado')
      setIsLoading(false)
    }
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      {/* Lado izquierdo: bloque invertido con titular editorial */}
      <div className="relative hidden h-full overflow-hidden bg-black text-white lg:flex lg:w-1/2">
        <div className="flex h-full w-full flex-col justify-between p-16">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-mint">
              <Wallet className="size-5 text-black" />
            </div>
            <span className="font-display text-3xl font-bold uppercase leading-none tracking-[-0.03em]">RecaudoPro</span>
          </div>

          <div className="max-w-xl space-y-8">
            <span className="inline-flex rounded-tag bg-mint px-4 py-1.5 text-sm font-medium text-black">
              Sistema de control de cartera
            </span>

            <h2 className="font-display text-[80px] font-bold uppercase leading-[0.9] tracking-[-0.03em] xl:text-[104px]">
              Gestiona tu negocio con precisión real
            </h2>

            <p className="max-w-md text-lg text-white/60">
              La plataforma administrativa para el control de recaudos, créditos y flujos de caja en tiempo real.
            </p>
          </div>

          <div className="flex items-center justify-between text-sm text-white/50">
            <span>© 2026 RecaudoPro</span>
            <div className="flex gap-4">
              <a href={LEGAL_LINKS.terms} target="_blank" rel="noopener noreferrer" className="hover:text-white hover:underline">Términos</a>
              <a href={LEGAL_LINKS.privacy} target="_blank" rel="noopener noreferrer" className="hover:text-white hover:underline">Privacidad</a>
            </div>
          </div>
        </div>
      </div>

      {/* Lado derecho: formulario */}
      <div className="relative flex h-full w-full flex-col overflow-y-auto lg:w-1/2">
        <div className="absolute right-8 top-8 z-30 flex items-center gap-2">
          <button
            type="button"
            className="rounded-lg p-3 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            aria-label="Soporte Técnico"
          >
            <HelpCircle className="h-5 w-5" />
          </button>
          <ModeToggle />
        </div>

        <div className="flex min-h-full items-center justify-center p-6 sm:p-10 lg:p-16">
          <div className="w-full max-w-[420px] py-6">
            {/* Branding móvil */}
            <div className="mb-8 flex items-center gap-3 lg:hidden">
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary">
                <Wallet className="size-5 text-primary-foreground" />
              </div>
              <span className="font-display text-3xl font-bold uppercase leading-none tracking-[-0.03em]">RecaudoPro</span>
            </div>

            <div className="rounded-card bg-card p-8">
              <div className="mb-8 space-y-3">
                <h1 className="text-5xl text-foreground">Acceso administrativo</h1>
                <p className={LABEL_CLASS}>Credenciales empresariales</p>
              </div>

              <form onSubmit={handleLoginSubmit} className="space-y-5">
                {notice && !error && (
                  <div className="flex items-center gap-3 rounded-lg bg-secondary p-3 text-sm text-foreground" role="status">
                    <div className="size-1.5 shrink-0 rounded-full bg-mint" />
                    {notice}
                  </div>
                )}
                {error && (
                  <div
                    className="flex items-center gap-3 rounded-lg bg-destructive/10 p-3 text-sm text-destructive"
                    role="alert"
                  >
                    <div className="size-1.5 shrink-0 rounded-full bg-destructive" />
                    {error}
                  </div>
                )}

                <div className="space-y-4">
                  {/* Código de negocio */}
                  <div className="space-y-2">
                    <Label htmlFor="businessCode" className={LABEL_CLASS}>ID Negocio</Label>
                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="businessCode"
                        type="text"
                        placeholder="NEG-XXXX"
                        className={INPUT_CLASS}
                        value={businessCode}
                        onChange={(e) => setBusinessCode(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <Label htmlFor="email" className={LABEL_CLASS}>Email corporativo</Label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="nombre@empresa.com"
                        className={INPUT_CLASS}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  {/* Contraseña */}
                  <div className="space-y-2">
                    <Label htmlFor="password" className={LABEL_CLASS}>Clave</Label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        className={`${INPUT_CLASS} pr-12`}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                        aria-label={showPassword ? 'Ocultar clave' : 'Mostrar clave'}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                <Button type="submit" disabled={isLoading} className="h-14 w-full text-base">
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Entrando...
                    </span>
                  ) : (
                    'Entrar al panel'
                  )}
                </Button>

                <p className="pt-2 text-center tabular-nums text-xs text-muted-foreground">
                  Conexión cifrada · TLS
                </p>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
