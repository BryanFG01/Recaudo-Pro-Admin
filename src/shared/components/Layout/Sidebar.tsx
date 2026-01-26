import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useAuthStore } from '@/features/auth/presentation/store/authStore'
import { cn } from '@/shared/utils/cn'
import { CreditCard, DollarSign, LayoutDashboard, LogOut, UserCog, Users } from 'lucide-react'
import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'

const menuItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/admin/users', label: 'Admin Usuarios', icon: UserCog },
  { path: '/clients', label: 'Clientes', icon: Users },
  { path: '/admin/clients', label: 'Admin Clientes', icon: Users },
  { path: '/credits', label: 'Créditos', icon: CreditCard },
  { path: '/collections', label: 'Recaudos', icon: DollarSign }
]

export default function Sidebar() {
  const location = useLocation()
  const { signOut } = useAuthStore()
  const [openLogout, setOpenLogout] = useState(false)

  const handleLogout = () => {
    signOut()
    setOpenLogout(false)
  }

  return (
    <>
    <aside className="w-64 bg-[#0f172a] text-white flex flex-col border-r border-gray-700/50" aria-label="Navegación principal">
      <div className="p-6 border-b border-gray-700/50">
        <h1 className="text-xl font-bold text-white">RecaudoPro</h1>
        <p className="text-sm text-gray-400">Administrador</p>
      </div>

      <nav className="flex-1 p-4" aria-label="Menú de navegación">
        <ul className="space-y-2" role="list">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path
            return (
              <li key={item.path} role="none">
                <Link
                  to={item.path}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors min-h-[44px] focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:ring-offset-2 focus:ring-offset-[#0f172a]',
                    isActive
                      ? 'bg-[#2563EB] text-white'
                      : 'text-gray-300 hover:bg-[#2D3748] hover:text-white'
                  )}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon className="w-5 h-5" aria-hidden="true" />
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
        className="bg-[#2D3748] border-gray-600 text-gray-200 shadow-xl [&>button]:text-gray-400 [&>button]:hover:text-white [&>button]:opacity-100 [&>button]:focus:ring-[#2563EB] [&>button]:focus:ring-offset-[#1a2436]"
        aria-describedby="logout-description"
      >
        <DialogHeader>
          <DialogTitle className="text-white">Cerrar sesión</DialogTitle>
          <DialogDescription id="logout-description" className="text-gray-400">
            ¿Estás seguro de que deseas cerrar sesión?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex flex-row gap-2 sm:justify-end pt-4">
          <Button
            type="button"
            variant="destructive"
            onClick={() => setOpenLogout(false)}
            className="border-gray-600 text-gray-300 hover:bg-white/10 hover:border-gray-500 hover:text-white"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleLogout}
            className="bg-[#2563EB] hover:bg-[#1d4ed8] text-white border-0"
          >
            Cerrar sesión
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  )
}
