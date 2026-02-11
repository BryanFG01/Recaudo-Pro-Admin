import { Button } from '@/components/ui/button'
import { ModeToggle } from '@/components/theme/ModeToggle'
import { useAuthStore } from '@/features/auth/presentation/store/authStore'
import { Menu } from 'lucide-react'

interface HeaderProps {
  onMenuClick?: () => void
}

export default function Header({ onMenuClick }: HeaderProps) {
  const { user } = useAuthStore()

  return (
    <header
      className="bg-background/95 border-b border-border px-3 py-3 sm:px-4 md:px-6 md:py-4 shadow-sm sticky top-0 z-30"
      role="banner"
    >
      <div className="flex items-center justify-between gap-2 sm:gap-4 min-h-[44px]">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onMenuClick}
            className="md:hidden shrink-0 h-11 w-11 min-h-[44px] min-w-[44px] rounded-lg -ml-1"
            aria-label="Abrir menú de navegación"
          >
            <Menu className="w-6 h-6 shrink-0" />
          </Button>
          <h2 className="text-base sm:text-lg md:text-2xl font-semibold text-foreground truncate">
            Panel de Administración
          </h2>
        </div>
        <div
          className="flex items-center gap-2 sm:gap-4 shrink-0 min-w-0"
          aria-label="Información del usuario"
        >
          <ModeToggle />
          <div className="hidden sm:block text-right min-w-0 max-w-[140px] md:max-w-[200px]">
            <p
              className="text-sm font-medium text-foreground truncate"
              title={user?.name ?? undefined}
              aria-label={`Usuario: ${user?.name ?? '-'}`}
            >
              {user?.name ?? '-'}
            </p>
            <p
              className="text-xs text-muted-foreground truncate"
              title={user?.email ?? undefined}
              aria-label={`Email: ${user?.email ?? '-'}`}
            >
              {user?.email ?? '-'}
            </p>
          </div>
          <div
            className="w-10 h-10 sm:w-10 sm:h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold min-w-[40px] min-h-[40px] shrink-0 text-sm"
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
