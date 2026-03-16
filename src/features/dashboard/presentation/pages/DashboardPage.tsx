import { useAuthStore } from '@/features/auth/presentation/store/authStore'
import StatsCard from '@/shared/components/StatsCard/StatsCard'
import { AlertTriangle, CreditCard, DollarSign, Users } from 'lucide-react'
import { useEffect, useState } from 'react'
import { CollectionChart, CreditStatusChart } from '../components'
import { useDashboard } from '../hooks/useDashboard'
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
            <h1 className="text-4xl sm:text-5xl font-black tracking-tighter text-foreground shrink-0">Panel de Control</h1>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-success/10 border border-success/20 shadow-[0_0_15px_-5px_theme(colors.success.DEFAULT)]">
              <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
              <span className="text-[10px] font-black text-success uppercase tracking-[0.2em]">En Línea</span>
            </div>
          </div>
          <p className="text-base text-muted-foreground/60 font-medium">Visualización en tiempo real del rendimiento de tu negocio.</p>
        </div>
        
        <div
          className="flex items-center glass-card p-1.5 rounded-2xl transition-all"
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
                "px-8 py-2.5 rounded-xl transition-all duration-500 text-[10px] font-black uppercase tracking-[0.25em]",
                selectedPeriod === p.id 
                  ? "bg-primary text-primary-foreground shadow-[0_10px_25px_-8px_rgba(var(--primary),0.6)] scale-105 border border-white/10" 
                  : "text-muted-foreground/60 hover:text-foreground hover:bg-accent/40"
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
          <h2 className="text-xs font-black text-muted-foreground uppercase tracking-[0.3em] whitespace-nowrap">Resumen Estratégico</h2>
          <div className="h-px bg-border/40 w-full" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <StatsCard
            title="Recaudo Total"
            value={stats.totalCollected}
            isCurrency
            variant="success"
            icon={<DollarSign className="w-5 h-5" />}
            trend={{ value: 12, isPositive: true }}
            className="hover:scale-[1.02] transition-transform duration-500"
          />
          <StatsCard
            title="Total Créditos"
            value={stats.totalCredits}
            variant="info"
            icon={<CreditCard className="w-5 h-5" />}
            trend={{ value: 5, isPositive: true }}
            className="hover:scale-[1.02] transition-transform duration-500"
          />
          <StatsCard
            title="Total Clientes"
            value={stats.totalClients}
            variant="default"
            icon={<Users className="w-5 h-5" />}
            trend={{ value: 8, isPositive: true }}
            className="hover:scale-[1.02] transition-transform duration-500"
          />
        </div>
      </section>

      {/* Operational & Liquidity Section */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-12">
        <section className="space-y-6">
          <div className="flex items-center gap-4">
            <h2 className="text-xs font-black text-muted-foreground uppercase tracking-[0.3em] whitespace-nowrap">Operaciones & Riesgo</h2>
            <div className="h-px bg-border/40 w-full" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <StatsCard
              title="Créditos Activos"
              value={stats.activeCredits}
              variant="info"
              icon={<CreditCard className="w-5 h-5" />}
              subtitle="Operaciones vigentes"
              className="bg-card/20"
            />
            <StatsCard
              title="Clientes en Mora"
              value={stats.clientsInArrears}
              variant="error"
              icon={<AlertTriangle className="w-5 h-5" />}
              subtitle="Requiere atención inmediata"
              className="bg-card/20 shadow-error/5"
            />
          </div>
        </section>

        <section className="space-y-6">
          <div className="flex items-center gap-4">
            <h2 className="text-xs font-black text-muted-foreground uppercase tracking-[0.3em] whitespace-nowrap">Liquidez por Método</h2>
            <div className="h-px bg-border/40 w-full" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <StatsCard
              title="Efectivo"
              value={stats.cashCollection}
              isCurrency
              variant="default"
              subtitle={`${stats.cashCount} transacciones`}
              className="bg-card/20"
            />
            <StatsCard
              title="Transacción"
              value={stats.transactionCollection}
              isCurrency
              variant="default"
              subtitle={`${stats.transactionCount} transacciones`}
              className="bg-card/20"
            />
          </div>
        </section>
      </div>

      {/* Charts Section */}
      <section className="space-y-6">
        <div className="flex items-center gap-4">
          <h2 className="text-xs font-black text-muted-foreground uppercase tracking-[0.3em] whitespace-nowrap">Tendencias de Rendimiento</h2>
          <div className="h-px bg-border/40 w-full" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div className="glass-card p-10 group hover:bg-card/60 transition-all duration-700 rounded-[32px]">
            <CollectionChart
              data={stats.weeklyCollectionData}
              period={selectedPeriod === 0 ? 'day' : selectedPeriod === 1 ? 'week' : 'month'}
            />
          </div>
          <div className="glass-card p-10 group hover:bg-card/60 transition-all duration-700 rounded-[32px]">
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
