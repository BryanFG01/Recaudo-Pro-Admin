import { useAuthStore } from '@/features/auth/presentation/store/authStore'
import StatsCard from '@/shared/components/StatsCard/StatsCard'
import { AlertTriangle, CreditCard, DollarSign, Users } from 'lucide-react'
import { useEffect, useState } from 'react'
import { CollectionChart, CreditStatusChart } from '../components'
import { useDashboard } from '../hooks/useDashboard'

import { cn } from '@/shared/utils/cn'

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
    userNumber: user?.number ?? undefined
  })

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64" role="status" aria-live="polite">
        <div
          className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0f171a]"
          aria-label="Cargando datos del dashboard"
        />
        <span className="sr-only">Cargando datos del dashboard...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div
        className="bg-red-900/30 border border-red-700/50 rounded-lg p-4"
        role="alert"
        aria-live="assertive"
      >
        <p className="text-red-200">Error al cargar estadísticas: {error.message}</p>
      </div>
    )
  }

  if (!stats) return null


  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white shrink-0">Dashboard</h1>
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-success/10 border border-success/20 animate-pulse">
              <span className="w-2 h-2 rounded-full bg-success" />
              <span className="text-[10px] font-bold text-success uppercase tracking-wider">Vivo</span>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">Bienvenido de nuevo. Aquí tienes un resumen de la actividad hoy.</p>
        </div>
        
        <div
          className="flex flex-wrap items-center bg-background/50 p-1 rounded-xl border border-white/5 backdrop-blur-md"
          role="group"
          aria-label="Filtro de período"
        >
          {[
            { id: 0, label: 'Hoy' },
            { id: 1, label: 'Semana' },
            { id: 2, label: 'Mes' }
          ].map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setSelectedPeriod(p.id as any)}
              className={cn(
                "px-4 py-2 rounded-lg transition-all duration-200 text-sm font-semibold",
                selectedPeriod === p.id 
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" 
                  : "text-muted-foreground hover:text-white hover:bg-white/5"
              )}
              aria-pressed={selectedPeriod === p.id}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Strategic KPIs Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white/90">Resumen Estratégico</h2>
          <span className="text-xs text-muted-foreground/60 italic">Datos actualizados cada 5 min</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <StatsCard
            title="Recaudo Total"
            value={stats.totalCollected}
            isCurrency
            variant="success"
            icon={<DollarSign className="w-5 h-5" />}
            trend={{ value: 12, isPositive: true }}
          />
          <StatsCard
            title="Total Créditos"
            value={stats.totalCredits}
            variant="info"
            icon={<CreditCard className="w-5 h-5" />}
            trend={{ value: 5, isPositive: true }}
          />
          <StatsCard
            title="Total Clientes"
            value={stats.totalClients}
            variant="default"
            icon={<Users className="w-5 h-5" />}
            trend={{ value: 8, isPositive: true }}
          />
        </div>
      </section>

      {/* Operational & Liquidity Section */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <section className="space-y-4">
          <h2 className="text-lg font-bold text-white/90">Operaciones & Riesgo</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <StatsCard
              title="Créditos Activos"
              value={stats.activeCredits}
              variant="info"
              icon={<CreditCard className="w-5 h-5" />}
              subtitle="En circulación"
            />
            <StatsCard
              title="Clientes en Mora"
              value={stats.clientsInArrears}
              variant="error"
              icon={<AlertTriangle className="w-5 h-5" />}
              subtitle="Acción requerida"
            />
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-bold text-white/90">Liquidez por Método</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <StatsCard
              title="Efectivo"
              value={stats.cashCollection}
              isCurrency
              variant="default"
              subtitle={`${stats.cashCount} operaciones`}
            />
            <StatsCard
              title="Transacción"
              value={stats.transactionCollection}
              isCurrency
              variant="default"
              subtitle={`${stats.transactionCount} operaciones`}
            />
          </div>
        </section>
      </div>

      {/* Charts Section */}
      <section className="space-y-4 pt-4">
        <h2 className="text-lg font-bold text-white/90">Tendencias y Estado</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-[#0f171a]/40 border border-white/5 rounded-2xl p-6 backdrop-blur-sm">
            <CollectionChart
              data={stats.weeklyCollectionData}
              period={selectedPeriod === 0 ? 'day' : selectedPeriod === 1 ? 'week' : 'month'}
            />
          </div>
          <div className="bg-[#0f171a]/40 border border-white/5 rounded-2xl p-6 backdrop-blur-sm">
            <CreditStatusChart
              upToDatePercentage={stats.upToDatePercentage}
              overduePercentage={stats.overduePercentage}
              activeCredits={stats.activeCredits}
              clientsInArrears={stats.clientsInArrears}
            />
          </div>
        </div>
      </section>
    </div>
  )
}
