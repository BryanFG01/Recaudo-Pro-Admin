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
      className="bg-[#0f171a]/95 border-b border-gray-700/50 px-3 py-3 sm:px-4 md:px-6 md:py-4 shadow-lg shadow-black/10 sticky top-0 z-30"
      role="banner"
    >
      <div className="flex items-center justify-between gap-2 sm:gap-4 min-h-[44px]">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onMenuClick}
            className="md:hidden shrink-0 h-11 w-11 min-h-[44px] min-w-[44px] text-gray-300 hover:bg-[#2D3748] hover:text-white rounded-lg -ml-1"
            aria-label="Abrir menú de navegación"
          >
            <Menu className="w-6 h-6 shrink-0" />
          </Button>
          <h2 className="text-base sm:text-lg md:text-2xl font-semibold text-white truncate">
            Panel de Administración
          </h2>
        </div>
        <div
          className="flex items-center gap-2 sm:gap-4 shrink-0 min-w-0"
          aria-label="Información del usuario"
        >
          <div className="hidden sm:block text-right min-w-0 max-w-[140px] md:max-w-[200px]">
            <p
              className="text-sm font-medium text-white truncate"
              title={user?.name ?? undefined}
              aria-label={`Usuario: ${user?.name ?? '-'}`}
            >
              {user?.name ?? '-'}
            </p>
            <p
              className="text-xs text-gray-400 truncate"
              title={user?.email ?? undefined}
              aria-label={`Email: ${user?.email ?? '-'}`}
            >
              {user?.email ?? '-'}
            </p>
          </div>
          <div
            className="w-10 h-10 sm:w-10 sm:h-10 rounded-full bg-[#2563EB] flex items-center justify-center text-white font-semibold min-w-[40px] min-h-[40px] shrink-0 text-sm"
            aria-label={`Avatar: ${user?.name ?? user?.email ?? 'Usuario'}`}
            role="img"
            title={user?.name ?? user?.email ?? undefined}
          >
            {user?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'}
          </div>
        </div>
      </div>
    </header>
  )
}
