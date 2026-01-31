import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/features/auth/presentation/store/authStore'
import { Menu } from 'lucide-react'

interface HeaderProps {
  onMenuClick?: () => void
}

export default function Header({ onMenuClick }: HeaderProps) {
  const { user } = useAuthStore()

  return (
    <header
      className="bg-[#0f171a]/95 border-b border-gray-700/50 px-4 md:px-6 py-4 shadow-lg shadow-black/10"
      role="banner"
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onMenuClick}
            className="md:hidden shrink-0 h-10 w-10 text-gray-300 hover:bg-[#2D3748] hover:text-white rounded-lg"
            aria-label="Abrir menú de navegación"
          >
            <Menu className="w-6 h-6" />
          </Button>
          <h2 className="text-lg md:text-2xl font-semibold text-white truncate">
            Panel de Administración
          </h2>
        </div>
        <div className="flex items-center gap-4" aria-label="Información del usuario">
          <div className="text-right">
            <p className="text-sm font-medium text-white" aria-label={`Usuario: ${user?.name}`}>
              {user?.name}
            </p>
            <p className="text-xs text-gray-400" aria-label={`Email: ${user?.email ?? '-'}`}>
              {user?.email ?? '-'}
            </p>
          </div>
          <div
            className="w-10 h-10 rounded-full bg-[#2563EB] flex items-center justify-center text-white font-semibold min-w-[40px] min-h-[40px]"
            aria-label="Avatar del usuario"
            role="img"
          >
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
        </div>
      </div>
    </header>
  )
}
