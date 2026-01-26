import { useState, useEffect } from 'react'
import { useDashboard } from '../hooks/useDashboard'
import { useAuthStore } from '@/features/auth/presentation/store/authStore'
import StatsCard from '@/shared/components/StatsCard/StatsCard'
import { CollectionChart, CreditStatusChart } from '../components'
import { DollarSign, AlertTriangle, CreditCard, Users } from 'lucide-react'

const cardDark = 'bg-[#2D3748] border-gray-600 text-gray-100 [&_.text-muted-foreground]:text-gray-400'

export default function DashboardPage() {
  const { businessId, businessCode, user } = useAuthStore()
  const [selectedPeriod, setSelectedPeriod] = useState<0 | 1 | 2>(1) // 0: Hoy, 1: Semana, 2: Mes
  const [request, setRequest] = useState<{ startDate?: Date; endDate?: Date }>({})

  const currentBusinessId = user?.business_id || businessId

  useEffect(() => {
    const now = new Date()
    let startDate: Date | undefined
    let endDate: Date | undefined

    switch (selectedPeriod) {
      case 0: // Hoy
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        endDate = new Date(startDate.getTime() + 24 * 60 * 60 * 1000)
        break
      case 1: // Semana
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        startDate.setDate(startDate.getDate() - startDate.getDay() + 1)
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        endDate.setDate(endDate.getDate() + 1)
        break
      case 2: // Mes
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1)
        break
    }

    setRequest({ startDate, endDate })
  }, [selectedPeriod])

  const { stats, isLoading, error } = useDashboard({
    ...request,
    businessId: currentBusinessId || undefined,
    businessCode: businessCode ?? undefined,
    userId: user?.id,
    userNumber: user?.number ?? undefined,
  })

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64" role="status" aria-live="polite">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2563EB]" aria-label="Cargando datos del dashboard" />
        <span className="sr-only">Cargando datos del dashboard...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-900/30 border border-red-700/50 rounded-lg p-4" role="alert" aria-live="assertive">
        <p className="text-red-200">Error al cargar estadísticas: {error.message}</p>
      </div>
    )
  }

  if (!stats) return null

  const btnBase = 'px-4 py-2 rounded-lg transition-colors min-h-[44px] focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:ring-offset-2 focus:ring-offset-[#1a2436]'
  const btnActive = 'bg-[#2563EB] text-white'
  const btnInactive = 'bg-[#2D3748] border border-gray-600 text-gray-300 hover:bg-white/10 hover:border-gray-500'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Dashboard</h1>
        <div className="flex gap-2" role="group" aria-label="Filtro de período">
          <button
            onClick={() => setSelectedPeriod(0)}
            className={`${btnBase} ${selectedPeriod === 0 ? btnActive : btnInactive}`}
            aria-pressed={selectedPeriod === 0}
          >
            Hoy
          </button>
          <button
            onClick={() => setSelectedPeriod(1)}
            className={`${btnBase} ${selectedPeriod === 1 ? btnActive : btnInactive}`}
            aria-pressed={selectedPeriod === 1}
          >
            Semana
          </button>
          <button
            onClick={() => setSelectedPeriod(2)}
            className={`${btnBase} ${selectedPeriod === 2 ? btnActive : btnInactive}`}
            aria-pressed={selectedPeriod === 2}
          >
            Mes
          </button>
        </div>
      </div>

      {/* Stats principales: Total clientes, Total créditos, Total recaudo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatsCard title="Total de Clientes" value={stats.totalClients} icon={<Users className="w-8 h-8" />} className={cardDark} />
        <StatsCard title="Total de Créditos" value={stats.totalCredits} icon={<CreditCard className="w-8 h-8" />} className={cardDark} />
        <StatsCard title="Total de Recaudo" value={stats.totalCollected} isCurrency icon={<DollarSign className="w-8 h-8" />} className={cardDark} />
      </div>

      {/* Stats adicionales: Créditos activos, Clientes en mora */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <StatsCard title="Créditos Activos" value={stats.activeCredits} icon={<CreditCard className="w-8 h-8" />} className={cardDark} />
        <StatsCard title="Clientes en Mora" value={stats.clientsInArrears} isWarning icon={<AlertTriangle className="w-8 h-8" />} className={cardDark} />
      </div>

      {/* Efectivo y Transacción */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <StatsCard title="Efectivo" value={stats.cashCollection} isCurrency subtitle={`${stats.cashCount} pagos`} className={cardDark} />
        <StatsCard title="Transacción" value={stats.transactionCollection} isCurrency subtitle={`${stats.transactionCount} pagos`} className={cardDark} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CollectionChart
          data={stats.weeklyCollectionData}
          period={selectedPeriod === 0 ? 'day' : selectedPeriod === 1 ? 'week' : 'month'}
        />
        <CreditStatusChart
          upToDatePercentage={stats.upToDatePercentage}
          overduePercentage={stats.overduePercentage}
          activeCredits={stats.activeCredits}
          clientsInArrears={stats.clientsInArrears}
        />
      </div>
    </div>
  )
}


