import { LoadingScreen } from '@/shared/components/LoadingScreen/LoadingScreen'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
    Card,
    CardContent,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select'
import { User } from '@/features/auth/domain/models/User'
import { useAuthStore } from '@/features/auth/presentation/store/authStore'
import { apiClient } from '@/shared/config/api'
import { cn } from '@/shared/utils/cn'
import {
    formatCurrency,
    formatDate,
} from '@/shared/utils/date'
import {
    ArrowDownRight,
    ArrowUpRight,
    Calendar,
    Download,
    Filter,
    MoreHorizontal,
    RefreshCw,
    Search,
    TrendingUp,
    User as UserIcon,
    Wallet
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Collection } from '../../../collections/domain/models/Collection'
import { useCollections } from '../../../collections/presentation/hooks/useCollections'
import { DailySummaryItem } from '../../domain/models'
import { useCashSessions } from '../hooks/useCashSessions'
import { DynamicTable, Column } from '@/shared/components/DynamicTable'

// --- Types for Unified Movements ---
type MovementType = 'Ingreso' | 'Egreso' | 'Ajuste'

interface UnifiedMovement {
  id: string
  date: string
  userId: string
  userName: string
  type: MovementType
  concept: string
  amount: number
  balanceBefore: number
  balanceAfter: number
  reference: string
}

const containerStyle = 'bg-card/50 border-border/50 backdrop-blur-xl shadow-2xl rounded-lg'
const labelStyle = 'text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/60 mb-2.5 block'

export default function CashSessionFlowPage() {
  const { user: currentUser } = useAuthStore()
  const businessId = currentUser?.business_id || ''

  // --- States ---
  const [filterUserId, setFilterUserId] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [dateRange, setDateRange] = useState('7d')
  const [movementTypeFilter, setMovementTypeFilter] = useState('all')

  // --- Hooks ---
  const { getDailySummaryByUser } = useCashSessions()
  const { collections } = useCollections()

  // --- Data States ---
  const [businessUsers, setBusinessUsers] = useState<User[]>([])
  const [summaries, setSummaries] = useState<Record<string, DailySummaryItem>>({})
  const [credits, setCredits] = useState<any[]>([])
  const [isLoadingUI, setIsLoadingUI] = useState(true)

  // --- Load Initial Data ---
  useEffect(() => {
    async function init() {
      if (!businessId) return
      setIsLoadingUI(true)
      try {
        const users = await apiClient.get<User[]>(`/api/users/business/${businessId}`)
        setBusinessUsers(users || [])

        const summaryMap: Record<string, DailySummaryItem> = {}
        for (const u of users) {
          if (u.role === 'cobrador' || u.role === 'supervisor') {
            const summary = await getDailySummaryByUser(u.id)
            if (summary && summary.items && summary.items.length > 0) {
              summaryMap[u.id] = summary.items[0]
            }
          }
        }
        setSummaries(summaryMap)

        const creditsData = await apiClient.get<any[]>(`/api/credits?business_id=${businessId}`)
        setCredits(Array.isArray(creditsData) ? creditsData : [])

      } catch (err) {
        console.error('Error initializing dashboard:', err)
      } finally {
        setIsLoadingUI(false)
      }
    }
    init()
  }, [businessId])

  // --- Global Stats ---
  const globalStats = useMemo(() => {
    const items = Object.values(summaries)
    return {
      totalSaldo: items.reduce((acc, curr) => acc + (curr.caja_actual || 0), 0),
      totalIngresos: items.reduce((acc, curr) => acc + (curr.total_ingresos || 0), 0),
      totalEgresos: items.reduce((acc, curr) => acc + (curr.total_retiros || 0) + (curr.total_gastos || 0), 0),
      balanceNeto: items.reduce((acc, curr) => acc + (curr.total_ingresos || 0) - (curr.total_retiros || 0) - (curr.total_gastos || 0), 0)
    }
  }, [summaries])

  // --- Aggregate Movements ---
  const unifiedMovements = useMemo(() => {
    const moves: UnifiedMovement[] = []

    collections.forEach((c: Collection) => {
      const u = businessUsers.find(bu => bu.id === c.user_id)
      moves.push({
        id: c.id,
        date: c.payment_date,
        userId: c.user_id,
        userName: u ? (u.name || (u.first_name || '')) : 'Cobrador',
        type: 'Ingreso',
        concept: c.notes || `Recaudo cliente #${c.client_id.slice(0, 4)}`,
        amount: c.amount,
        balanceBefore: 0,
        balanceAfter: 0,
        reference: c.transaction_reference || `REC-${c.id.slice(0, 8).toUpperCase()}`
      })
    })

    credits.forEach(cr => {
      const u = businessUsers.find(bu => bu.number === cr.user_number)
      moves.push({
        id: cr.id,
        date: cr.created_at,
        userId: u?.id || '',
        userName: u ? (u.name || (u.first_name || '')) : 'Cobrador',
        type: 'Egreso',
        concept: `Crédito otorgado #${cr.id.slice(0, 4)}`,
        amount: cr.total_amount,
        balanceBefore: 0,
        balanceAfter: 0,
        reference: `CRE-${cr.id.slice(0, 8).toUpperCase()}`
      })
    })

    return moves.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [collections, credits, businessUsers])

  const filteredMovements = useMemo(() => {
    return unifiedMovements.filter(m => {
      const matchesSearch = m.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           m.concept.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           m.reference.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesUser = filterUserId === 'all' || m.userId === filterUserId
      const matchesType = movementTypeFilter === 'all' || m.type === movementTypeFilter
      return matchesSearch && matchesUser && matchesType
    })
  }, [unifiedMovements, searchTerm, filterUserId, movementTypeFilter])

  const columns: Column<UnifiedMovement>[] = [
    {
      key: 'date',
      header: 'Fecha/Hora',
      render: (m) => (
        <div className="space-y-0.5">
          <p className="text-xs font-black text-foreground">{formatDate(m.date, 'dd MMM yyyy')}</p>
          <p className="text-[10px] font-bold text-muted-foreground/50 tabular-nums uppercase">{formatDate(m.date, 'HH:mm')}</p>
        </div>
      )
    },
    {
      key: 'userName',
      header: 'Usuario',
      render: (m) => (
        <div className="flex items-center gap-3">
          <div className="size-8 rounded-lg bg-muted/40 flex items-center justify-center text-[10px] font-black uppercase">
            {m.userName.slice(0, 2)}
          </div>
          <span className="text-xs font-black text-foreground/80">{m.userName}</span>
        </div>
      )
    },
    {
      key: 'type',
      header: 'Tipo',
      render: (m) => (
        <Badge variant="outline" className={cn(
          "rounded-lg border px-2 py-0.5 text-[10px] font-black uppercase tracking-tighter",
          m.type === 'Ingreso' ? 'bg-success/10 border-success/30 text-success' :
          m.type === 'Egreso' ? 'bg-error/10 border-error/30 text-error' :
          'bg-warning/10 border-warning/30 text-warning'
        )}>
          {m.type === 'Ingreso' ? <ArrowUpRight className="size-3 mr-1" /> : <ArrowDownRight className="size-3 mr-1" />}
          {m.type}
        </Badge>
      )
    },
    {
      key: 'concept',
      header: 'Concepto',
      className: 'max-w-xs',
      render: (m) => <p className="text-xs font-black text-foreground/70 truncate">{m.concept}</p>
    },
    {
      key: 'amount',
      header: 'Monto',
      isNumeric: true,
      render: (m) => (
        <span className={cn(
          "text-xs font-black tabular-nums tracking-tighter",
          m.type === 'Ingreso' ? 'text-success' : m.type === 'Egreso' ? 'text-error' : 'text-foreground'
        )}>
          {m.type === 'Egreso' ? '-' : '+'}{formatCurrency(m.amount).replace('COP', '')}
        </span>
      )
    },
    {
      key: 'reference',
      header: 'Referencia',
      className: 'text-center',
      render: (m) => <span className="text-[10px] font-black text-muted-foreground/40 tabular-nums uppercase border border-border/30 px-2 py-1 rounded-md">{m.reference}</span>
    },
    {
      key: 'actions',
      header: '',
      className: 'w-10 text-center',
      render: () => (
        <Button variant="ghost" size="icon" className="size-8 rounded-lg opacity-40 hover:opacity-100 transition-opacity">
          <MoreHorizontal className="size-4" />
        </Button>
      )
    }
  ]

  if (isLoadingUI) {
    return <LoadingScreen message="Cargando Tablero de Seguimiento..." />
  }

  return (
    <div className="space-y-10 pb-20 max-w-[1600px] mx-auto animate-in fade-in duration-700">

      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-black text-foreground tracking-tighter uppercase">Seguimiento de Saldo</h1>
          <p className="text-muted-foreground/60 font-medium uppercase text-[11px] tracking-widest">Monitorea los movimientos y saldos de los cobradores en tiempo real.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="h-11 px-5 rounded-lg border-border/50 bg-background/50 backdrop-blur-sm">
            <RefreshCw className="size-4 mr-2" />
            Actualizar
          </Button>
          <Button className="h-11 px-6 rounded-lg font-bold bg-primary text-white shadow-lg shadow-primary/25">
            <Download className="size-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* ── GLOBAL KPI ROW ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          label="Saldo Total"
          value={formatCurrency(globalStats.totalSaldo)}
          icon={<Wallet className="size-5" />}
          accent="info"
          subtitle="+8.2% vs. semana anterior"
        />
        <MetricCard
          label="Total Ingresos"
          value={formatCurrency(globalStats.totalIngresos)}
          icon={<ArrowUpRight className="size-5" />}
          accent="success"
          subtitle={`${unifiedMovements.filter(m => m.type === 'Ingreso').length} movimientos`}
        />
        <MetricCard
          label="Total Egresos"
          value={formatCurrency(globalStats.totalEgresos)}
          icon={<ArrowDownRight className="size-5" />}
          accent="error"
          subtitle={`${unifiedMovements.filter(m => m.type === 'Egreso').length} movimientos`}
        />
        <MetricCard
          label="Balance Neto"
          value={formatCurrency(globalStats.balanceNeto)}
          icon={<TrendingUp className="size-5" />}
          accent="success"
          subtitle="Diferencia ingresos - egresos"
        />
      </div>

      {/* ── SALDOS POR COBRADOR ── */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black tracking-tight flex items-center gap-2 uppercase">
            <UserIcon className="size-5 text-primary" />
            Saldos por Cobrador
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {businessUsers.filter(u => u.role === 'cobrador' || u.role === 'supervisor').map(u => {
            const summary = summaries[u.id]
            const displayName = u.name || (u.first_name || '')
            const initials = displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
            const hasData = !!summary

            return (
              <Card key={u.id} className={cn('border-none transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl overflow-hidden group', containerStyle)}>
                <CardContent className="p-6 space-y-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className="size-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-black text-lg shadow-inner">
                        {initials}
                      </div>
                      <div className="space-y-0.5">
                        <p className="font-black text-base group-hover:text-primary transition-colors">{displayName}</p>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{u.role === 'cobrador' ? 'Cobrador' : 'Supervisor'}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreHorizontal className="size-4" />
                    </Button>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between items-end">
                      <span className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest">Saldo Actual</span>
                      <span className="text-xl font-black tabular-nums">{formatCurrency(summary?.caja_actual || 0)}</span>
                    </div>
                    <div className="h-2 w-full bg-muted/40 rounded-full overflow-hidden border border-border/20">
                      <div
                        className="h-full bg-success rounded-full transition-all duration-1000 shadow-[0_0_8px_rgba(var(--success-rgb),0.5)]"
                        style={{ width: hasData ? `${Math.min(((summary.total_recaudo || 0) / (summary.total_ventas || 1)) * 100, 100)}%` : '0%' }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-8 justify-between pt-2">
                    <div className="space-y-0.5">
                       <p className="text-[9px] font-black text-success/60 uppercase tracking-tighter flex items-center gap-1">
                          <ArrowUpRight className="size-3" /> {formatCurrency(summary?.total_ingresos || 0)}
                       </p>
                    </div>
                    <div className="space-y-0.5">
                       <p className="text-[9px] font-black text-error/60 uppercase tracking-tighter flex items-center gap-1 text-right">
                          <ArrowDownRight className="size-3" /> {formatCurrency(summary?.total_retiros || 0)}
                       </p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-border/30">
                    <p className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-wider">Último movimiento: Hace pocos minutos</p>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* ── MOVEMENT HISTORY SECTION ── */}
      <div className="space-y-6 pt-6 h-[800px] flex flex-col">
        <h2 className="text-xl font-black tracking-tight flex items-center gap-2 uppercase">
          <RefreshCw className="size-5 text-primary" />
          Historial de Movimientos
        </h2>

        {/* Filters */}
        <div className={cn('p-4 flex flex-col lg:flex-row gap-4 mb-2', containerStyle, 'border-none rounded-2xl flex-shrink-0')}>
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
            <Input
              placeholder="Buscar por usuario, concepto o referencia..."
              className="pl-11 h-12 bg-background/40 border-border/30 rounded-lg focus:ring-primary/20"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-4">
            <Select value={filterUserId} onValueChange={setFilterUserId}>
              <SelectTrigger className="w-[200px] h-12 rounded-xl bg-background/40 border-border/30">
                <div className="flex items-center gap-2">
                  <UserIcon className="size-3.5 opacity-40" />
                  <SelectValue placeholder="Usuario" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los usuarios</SelectItem>
                {businessUsers.map(u => (
                  <SelectItem key={u.id} value={u.id}>{u.name || (u.first_name || '')}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={movementTypeFilter} onValueChange={setMovementTypeFilter}>
              <SelectTrigger className="w-[160px] h-12 rounded-xl bg-background/40 border-border/30">
                <div className="flex items-center gap-2">
                  <Filter className="size-3.5 opacity-40" />
                  <SelectValue placeholder="Tipo" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                <SelectItem value="Ingreso">Ingresos</SelectItem>
                <SelectItem value="Egreso">Egresos</SelectItem>
                <SelectItem value="Ajuste">Ajustes</SelectItem>
              </SelectContent>
            </Select>

            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-[160px] h-12 rounded-xl bg-background/40 border-border/30">
                <div className="flex items-center gap-2">
                  <Calendar className="size-3.5 opacity-40" />
                  <SelectValue placeholder="Fecha" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="24h">Hoy</SelectItem>
                <SelectItem value="7d">Últimos 7 días</SelectItem>
                <SelectItem value="30d">Último mes</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Improved Table with DynamicTable */}
        <div className="flex-1 min-h-0">
          <DynamicTable
            data={filteredMovements}
            columns={columns}
            isLoading={false}
            emptyMessage="No se encontraron movimientos con los filtros actuales"
            variant="premium-dark"
            className="rounded-3xl"
            rowsPerPage={10}
          />
        </div>
      </div>
    </div>
  )
}

// --- Local Subcomponents ---

interface MetricCardProps {
  label: string
  value: string
  icon: React.ReactNode
  accent: 'info' | 'success' | 'warning' | 'error'
  subtitle?: string
}

function MetricCard({ label, value, icon, accent, subtitle }: MetricCardProps) {
  const accentStyles = {
    info: 'bg-primary/5 border-primary/20',
    success: 'bg-success/5 border-success/20',
    warning: 'bg-warning/5 border-warning/20',
    error: 'bg-error/5 border-error/20'
  }
  const iconColors = {
    info: 'bg-primary/10 text-primary',
    success: 'bg-success/10 text-success',
    warning: 'bg-warning/10 text-warning',
    error: 'bg-error/10 text-error'
  }

  return (
    <Card className={cn('border-none transition-all duration-500 hover:scale-[1.03] group', containerStyle, accentStyles[accent])}>
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <p className={labelStyle}>{label}</p>
          <div className={cn('p-2.5 rounded-lg shadow-inner transition-transform group-hover:rotate-12 duration-500', iconColors[accent])}>
            {icon}
          </div>
        </div>
        <h3 className="text-2xl font-black tabular-nums tracking-tighter leading-none mb-3">{value}</h3>
        {subtitle && (
          <div className="flex items-center gap-1.5 opacity-60">
             <div className={cn("size-1 rounded-full", iconColors[accent].split(' ')[1].replace('text-', 'bg-'))} />
             <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">{subtitle}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
