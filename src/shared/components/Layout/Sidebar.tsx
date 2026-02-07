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
          'w-64 bg-[#0f171a] text-white flex flex-col border-r border-gray-700/50 rounded-r-3xl shadow-xl shadow-black/10',
          'fixed md:static inset-y-0 left-0 z-50 transform transition-transform duration-200 ease-out',
          'md:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        )}
        aria-label="Navegación principal"
      >
        <div className="p-4 md:p-6 border-b border-gray-700/50 flex items-center justify-between gap-2">
          <div>
            <h1 className="text-xl font-bold text-white">RecaudoPro</h1>
            <p className="text-sm text-gray-400">Administrador</p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={closeSidebar}
            className="md:hidden shrink-0 h-10 w-10 text-gray-400 hover:bg-[#2D3748] hover:text-white rounded-lg"
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
                      'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors min-h-[44px] focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:ring-offset-2 focus:ring-offset-[#0f172a]',
                      isActive
                        ? 'bg-[#2563EB] text-white'
                        : 'text-gray-300 hover:bg-[#2D3748] hover:text-white'
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

        <div className="p-4 border-t border-gray-700/50">
          <button
            onClick={() => setOpenLogout(true)}
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-[#2D3748] hover:text-white w-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:ring-offset-2 focus:ring-offset-[#0f172a] min-h-[44px]"
            aria-label="Cerrar sesión"
          >
            <LogOut className="w-5 h-5" aria-hidden="true" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      <Dialog open={openLogout} onOpenChange={setOpenLogout}>
        <DialogContent
          className="bg-[#0f171a]/95 border-white/5 text-gray-200 shadow-2xl backdrop-blur-xl sm:max-w-[400px] p-0 overflow-hidden rounded-3xl"
          aria-describedby="logout-description"
        >
          <div className="p-8 space-y-6">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-2">
                <LogOut className="w-8 h-8 text-red-500" />
              </div>
              
              <div className="space-y-1">
                <DialogTitle className="text-2xl font-black text-white tracking-tight">Cerrar Sesión</DialogTitle>
                <DialogDescription id="logout-description" className="text-sm text-muted-foreground/60 font-medium">
                   ¿Estás seguro de que deseas finalizar tu sesión actual? Tendrás que volver a ingresar tus credenciales.
                </DialogDescription>
              </div>
            </div>

            <div className="flex flex-col gap-3 pt-2">
              <Button
                type="button"
                onClick={handleLogout}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-widest text-[10px] h-12 rounded-xl shadow-lg shadow-red-600/20 border-0"
              >
                Confirmar Salida
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setOpenLogout(false)}
                className="w-full text-muted-foreground hover:text-white hover:bg-white/5 font-bold uppercase tracking-widest text-[10px] h-12 rounded-xl border border-transparent hover:border-white/5"
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
