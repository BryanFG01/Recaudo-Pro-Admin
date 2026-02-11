import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle
} from '@/components/ui/dialog'
import { useAuthStore } from '@/features/auth/presentation/store/authStore'
import { cn } from '@/shared/utils/cn'
import { Banknote, CreditCard, DollarSign, LayoutDashboard, LogOut, Navigation, TrendingUp, UserCog, Users, Wallet, X } from 'lucide-react'
import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'

const menuItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/admin/users', label: 'Admin Usuarios', icon: UserCog },
  { path: '/clients', label: 'Clientes', icon: Users },
  { path: '/clients/map', label: 'Mapa de Clientes', icon: Navigation },
  { path: '/credits', label: 'Créditos', icon: CreditCard },
  { path: '/collections', label: 'Recaudos', icon: DollarSign },
  { path: '/cash-sessions', label: 'Saldo inicial', icon: Banknote },
  { path: '/cash-sessions/flow', label: 'Seguimiento de saldo', icon: TrendingUp },
  { path: '/withdrawals', label: 'Retiros', icon: Wallet }
]

interface SidebarProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export default function Sidebar({ open = false, onOpenChange }: SidebarProps) {
  const location = useLocation()
  const { signOut } = useAuthStore()
  const [openLogout, setOpenLogout] = useState(false)

  const handleLogout = () => {
    signOut()
    setOpenLogout(false)
  }

  const closeSidebar = () => onOpenChange?.(false)

  return (
    <>
      {/* Backdrop móvil: solo visible cuando sidebar abierto en pantallas pequeñas */}
      <div
        role="button"
        tabIndex={0}
        aria-label="Cerrar menú"
        onClick={closeSidebar}
        onKeyDown={(e) => e.key === 'Enter' && closeSidebar()}
        className={cn(
          'fixed inset-0 z-40 bg-black/60 transition-opacity md:hidden',
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        )}
      />

      <aside
        className={cn(
          'w-64 bg-card text-card-foreground flex flex-col border-r border-border rounded-r-3xl shadow-xl',
          'fixed md:static inset-y-0 left-0 z-50 transform transition-transform duration-200 ease-out',
          'md:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        )}
        aria-label="Navegación principal"
      >
        <div className="p-4 md:p-6 border-b border-border flex items-center justify-between gap-2">
          <div>
            <h1 className="text-xl font-bold text-foreground">RecaudoPro</h1>
            <p className="text-sm text-muted-foreground">Administrador</p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={closeSidebar}
            className="md:hidden shrink-0 h-10 w-10 rounded-lg"
            aria-label="Cerrar menú"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        <nav className="flex-1 p-4 overflow-y-auto" aria-label="Menú de navegación">
          <ul className="space-y-2" role="list">
            {menuItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.path
              return (
                <li key={item.path} role="none">
                  <Link
                    to={item.path}
                    onClick={closeSidebar}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors min-h-[44px] focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-card',
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                    )}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <Icon className="w-5 h-5 shrink-0" aria-hidden="true" />
                    <span>{item.label}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        <div className="p-4 border-t border-border">
          <button
            onClick={() => setOpenLogout(true)}
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:bg-accent hover:text-accent-foreground w-full transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-card min-h-[44px]"
            aria-label="Cerrar sesión"
          >
            <LogOut className="w-5 h-5" aria-hidden="true" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      <Dialog open={openLogout} onOpenChange={setOpenLogout}>
        <DialogContent
          className="bg-card border-border shadow-2xl backdrop-blur-xl sm:max-w-[400px] p-0 overflow-hidden rounded-3xl"
          aria-describedby="logout-description"
        >
          <div className="p-8 space-y-6">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-destructive/10 border border-destructive/20 flex items-center justify-center mb-2">
                <LogOut className="w-8 h-8 text-destructive" />
              </div>
              
              <div className="space-y-1">
                <DialogTitle className="text-2xl font-black text-foreground tracking-tight">Cerrar Sesión</DialogTitle>
                <DialogDescription id="logout-description" className="text-sm text-muted-foreground font-medium">
                   ¿Estás seguro de que deseas finalizar tu sesión actual? Tendrás que volver a ingresar tus credenciales.
                </DialogDescription>
              </div>
            </div>

            <div className="flex flex-col gap-3 pt-2">
              <Button
                type="button"
                onClick={handleLogout}
                className="w-full bg-destructive hover:bg-destructive/90 text-destructive-foreground font-black uppercase tracking-widest text-[10px] h-12 rounded-xl shadow-lg border-0"
              >
                Confirmar Salida
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpenLogout(false)}
                className="w-full font-bold uppercase tracking-widest text-[10px] h-12 rounded-xl"
              >
                Mantener Sesión
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
