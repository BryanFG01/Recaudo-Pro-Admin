import { useAuthStore } from '@/features/auth/presentation/store/authStore'

export default function Header() {
  const { user } = useAuthStore()

  return (
    <header className="bg-[#1a2436]/95 border-b border-gray-700/50 px-6 py-4 shadow-lg shadow-black/10" role="banner">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-white">Panel de Administración</h2>
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


