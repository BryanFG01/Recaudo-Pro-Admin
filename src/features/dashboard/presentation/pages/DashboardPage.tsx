import { useAuthStore } from '@/features/auth/presentation/store/authStore'
import StatsCard from '@/shared/components/StatsCard/StatsCard'
import { AlertTriangle, ArrowLeftRight, Banknote, CreditCard, DollarSign, Users } from 'lucide-react'
import { useEffect, useState } from 'react'
import { CollectionChart, CreditStatusChart } from '../components'
import { useDashboard } from '../hooks/useDashboard'
import { startOfWeek } from '../../domain/services/period'
import { cn } from '@/shared/utils/cn'
import { LoadingScreen } from '@/shared/components/LoadingScreen/LoadingScreen'

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
      case 1: // Semana: de lunes a hoy
        startDate = startOfWeek(now)
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
    return <LoadingScreen message="Sincronizando Estadísticas" />
  }

  if (error) {
    return (
      <div
        className="bg-destructive/10 border border-destructive/30 rounded-lg p-4"
        role="alert"
        aria-live="assertive"
      >
        <p className="text-destructive">Error al cargar estadísticas: {error.message}</p>
      </div>
    )
  }

  if (!stats) return null


  return (
    <div className="space-y-8 sm:space-y-12 pb-10 animate-in fade-in duration-1000">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-5xl sm:text-6xl text-foreground shrink-0">Panel de control</h1>
            <div className="flex items-center gap-1.5 rounded-full bg-mint px-3 py-1">
              <span className="size-2 rounded-full bg-emerald-600 animate-pulse" />
              <span className="text-xs font-medium text-black">En línea</span>
            </div>
          </div>
          <p className="text-base text-muted-foreground">Así va tu negocio en tiempo real.</p>
        </div>
        
        <div
          className="flex items-center rounded-xl bg-card p-1"
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
                "rounded-lg px-5 py-2 text-sm font-medium transition-colors",
                selectedPeriod === p.id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
              aria-pressed={selectedPeriod === p.id}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Strategic KPIs Section */}
      <section className="space-y-6">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold text-foreground whitespace-nowrap">Resumen</h2>
          <div className="h-px w-full bg-border" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatsCard
            title="Recaudo total"
            value={stats.totalCollected}
            isCurrency
            variant="success"
            icon={<DollarSign />}
          />
          <StatsCard
            title="Créditos otorgados"
            value={stats.totalCredits}
            variant="info"
            icon={<CreditCard />}
          />
          <StatsCard
            title="Clientes"
            value={stats.totalClients}
            variant="default"
            icon={<Users />}
          />
        </div>
      </section>

      {/* Operational & Liquidity Section */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-12">
        <section className="space-y-6">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold text-foreground whitespace-nowrap">Operación y riesgo</h2>
            <div className="h-px w-full bg-border" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <StatsCard
              title="Créditos activos"
              value={stats.activeCredits}
              variant="info"
              icon={<CreditCard />}
              subtitle="Operaciones vigentes"
            />
            <StatsCard
              title="Clientes en mora"
              value={stats.clientsInArrears}
              variant="error"
              icon={<AlertTriangle />}
              subtitle="Requieren seguimiento"
            />
          </div>
        </section>

        <section className="space-y-6">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold text-foreground whitespace-nowrap">Recaudo por método de pago</h2>
            <div className="h-px w-full bg-border" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <StatsCard
              title="Efectivo"
              value={stats.cashCollection}
              isCurrency
              variant="default"
              icon={<Banknote />}
              subtitle={`${stats.cashCount} transacciones`}
            />
            <StatsCard
              title="Transferencias"
              value={stats.transactionCollection}
              isCurrency
              variant="default"
              icon={<ArrowLeftRight />}
              subtitle={`${stats.transactionCount} transacciones`}
            />
          </div>
        </section>
      </div>

      {/* Charts Section */}
      <section className="space-y-6">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold text-foreground whitespace-nowrap">Tendencias</h2>
          <div className="h-px w-full bg-border" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-card bg-card p-8">
            <CollectionChart
              data={stats.weeklyCollectionData}
              period={selectedPeriod === 0 ? 'day' : selectedPeriod === 1 ? 'week' : 'month'}
            />
          </div>
          <div className="rounded-card bg-card p-8">
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
