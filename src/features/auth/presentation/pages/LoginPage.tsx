import { ModeToggle } from '@/components/theme/ModeToggle'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Eye, EyeOff, HelpCircle, Loader2, Lock, Mail, Search, Wallet } from 'lucide-react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useAuthStore } from '../store/authStore'



export default function LoginPage() {
  const [businessCode, setBusinessCode] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const { getBusinessByCode, signIn } = useAuth()
  const { user, setBusinessId, setBusinessCode: setStoreBusinessCode } = useAuthStore()
  const router = useRouter()
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    const checkHydration = () => {
      if (useAuthStore.persist.hasHydrated()) setHydrated(true)
    }
    checkHydration()
    const unsub = useAuthStore.persist.onFinishHydration(() => setHydrated(true))
    return () => unsub()
  }, [])

  useEffect(() => {
    if (hydrated && user) {
      router.push('/admin/users')
    }
  }, [user, router, hydrated])

  if (hydrated && user) return null

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
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocurrió un error inesperado')
      console.error('Error en el login unificado:', err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="h-screen w-full flex overflow-hidden bg-background">
      {/* Lado Izquierdo: Branding & Experience */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-[#0a0a0b] overflow-hidden h-full border-r border-border/10">
        {/* Capas de gradiente para profundidad y legibilidad */}
        <div className="absolute inset-0 z-10 bg-gradient-to-br from-primary/40 via-transparent to-black/80" />
        <div className="absolute inset-0 z-10 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.15),transparent_50%)]" />

        <Image
          src="/ImagenRecaudoPro"
          alt="RecaudoPro Experience"
          fill
          className="object-cover object-center opacity-70 mix-blend-luminosity grayscale-[20%] brightness-[0.7] transform scale-110"
          priority
        />

        {/* Contenido flotante sobre la imagen */}
        <div className="relative z-20 flex flex-col justify-between h-full p-16">
          {/* Logo superior */}
          <div className="flex items-center gap-4 animate-in fade-in slide-in-from-top-4 duration-1000">
            <div className="p-3.5 bg-white/5 backdrop-blur-2xl rounded-2xl border border-white/10 shadow-2xl">
              <Wallet className="h-7 w-7 text-primary" />
            </div>
            <span className="text-2xl font-black tracking-tighter text-white uppercase italic">RecaudoPro</span>
          </div>

          {/* Texto central con tipografía de impacto */}
          <div className="space-y-6 max-w-lg mb-12 animate-in fade-in slide-in-from-left-8 duration-1000 delay-300">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-md mb-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Sistema de Control ERP</span>
            </div>

            <h2 className="text-6xl font-black leading-[1.1] text-white tracking-tight">
              Gestiona tu negocio <br />
              <span className="bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">con precisión real.</span>
            </h2>

            <p className="text-xl text-zinc-400 font-medium leading-relaxed">
              La plataforma administrativa líder para el control de recaudos, créditos y flujos de caja en tiempo real.
            </p>

            <div className="flex items-center gap-8 pt-4">
              <div className="space-y-1">
                <p className="text-2xl font-black text-white">99.9%</p>
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Uptime</p>
              </div>
              <div className="w-px h-8 bg-zinc-800" />
              <div className="space-y-1">
                <p className="text-2xl font-black text-white">+10k</p>
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Operaciones/día</p>
              </div>
            </div>
          </div>

          {/* Footer inferior */}
          <div className="flex items-center justify-between text-[11px] font-bold text-zinc-600 uppercase tracking-[0.2em]">
            <span>© 2026 RecaudoPro Cloud</span>
            <div className="flex gap-4">
              <span className="hover:text-primary cursor-pointer transition-colors">Términos</span>
              <span className="hover:text-primary cursor-pointer transition-colors">Privacidad</span>
            </div>
          </div>
        </div>
      </div>

      {/* Lado Derecho: Formulario */}
      <div className="w-full lg:w-1/2 flex flex-col relative h-full overflow-y-auto bg-background/50 backdrop-blur-sm">
        {/* Controles superiores */}
        <div className="absolute top-8 right-8 flex items-center gap-3 z-30">
          <button
            type="button"
            className="p-3 rounded-2xl text-muted-foreground hover:text-foreground hover:bg-accent/50 border border-transparent hover:border-border/40 transition-all duration-300"
            aria-label="Soporte Técnico"
          >
            <HelpCircle className="h-5 w-5" />
          </button>
          <div className="p-1 px-1.5 rounded-2xl bg-muted/30 border border-border/40">
            <ModeToggle />
          </div>
        </div>

        <div className="min-h-full flex items-center justify-center p-6 sm:p-10 lg:p-16">
          <div className="w-full max-w-[400px] animate-in fade-in slide-in-from-bottom-4 duration-1000 py-6">
            {/* Branding Mobile */}
            <div className="lg:hidden flex flex-col items-center mb-8">
              <div className="size-16 rounded-[1.5rem] bg-primary flex items-center justify-center shadow-2xl shadow-primary/40 mb-4 rotate-3">
                <Wallet className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-3xl font-black tracking-tighter uppercase italic">RecaudoPro</h1>
            </div>

            <div className="space-y-2 mb-8">
              <h3 className="text-3xl font-black tracking-tight text-foreground uppercase leading-none">Acceso Administrativo</h3>
              <p className="text-xs font-semibold text-muted-foreground/60 uppercase tracking-widest">
                Credenciales empresarial
              </p>
            </div>

            <form onSubmit={handleLoginSubmit} className="space-y-5">
              {error && (
                <div
                  className="p-3 rounded-xl bg-destructive/5 border border-destructive/20 text-destructive text-[10px] font-black uppercase tracking-widest flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300"
                  role="alert"
                >
                  <div className="size-1.5 rounded-full bg-destructive animate-pulse" />
                  {error}
                </div>
              )}

              <div className="space-y-4">
                {/* Código de Negocio */}
                <div className="space-y-2">
                  <Label htmlFor="businessCode" className="text-[9px] uppercase font-black tracking-[0.2em] text-muted-foreground/50 px-1 ml-1 leading-none">ID Negocio</Label>
                  <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-all duration-300" />
                    <Input
                      id="businessCode"
                      type="text"
                      placeholder="NEG-XXXX"
                      className={`pl-11 h-12 text-sm font-bold tracking-tight bg-muted/20 border-border/40 hover:border-primary/20 focus:border-primary focus:bg-background transition-all rounded-xl`}
                      value={businessCode}
                      onChange={(e) => setBusinessCode(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-[9px] uppercase font-black tracking-[0.2em] text-muted-foreground/50 px-1 ml-1 leading-none">Email Corporativo</Label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-all duration-300" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="nombre@empresa.com"
                      className={`pl-11 h-12 text-sm font-bold tracking-tight bg-muted/20 border-border/40 hover:border-primary/20 focus:border-primary focus:bg-background transition-all rounded-xl`}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Contraseña */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between px-1 ml-1">
                    <Label htmlFor="password" className="text-[9px] uppercase font-black tracking-[0.2em] text-muted-foreground/50 leading-none">Clave</Label>
                    {/* <button type="button" className="text-[9px] uppercase font-black tracking-widest text-primary hover:text-primary/70 transition-colors">Recuperar</button> */}
                  </div>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-all duration-300" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      className={`pl-11 pr-12 h-12 text-sm font-bold tracking-tight bg-muted/20 border-border/40 hover:border-primary/20 focus:border-primary focus:bg-background transition-all rounded-xl`}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted/50 transition-all duration-300"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-14 bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-[0.2em] text-[10px] rounded-[1rem] shadow-xl shadow-primary/25 transition-all hover:scale-[1.01] active:scale-[0.98] relative overflow-hidden group"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Verificando...</span>
                    </div>
                  ) : (
                    'Entrar al Panel'
                  )}
                </Button>
              </div>

              <div className="flex flex-col items-center gap-4 pt-6">
                <p className="text-center text-[8px] font-black text-muted-foreground/30 uppercase tracking-[0.3em] max-w-[240px] leading-relaxed">
                  Sistema protegido bajo protocolos de seguridad SSL TLS 1.3
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
