import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select'
import { User } from '@/features/auth/domain/models'
import { useAuth } from '@/features/auth/presentation/hooks/useAuth'
import { useAuthStore } from '@/features/auth/presentation/store/authStore'
import { cn } from '@/shared/utils/cn'
import { formatCurrency, formatDate, formatDateTime } from '@/shared/utils/date'
import {
  ArrowDownRight,
  ArrowUpRight,
  Banknote,
  Download,
  Loader2,
  Receipt,
  ShoppingCart,
  TrendingUp,
  Wallet,
  MinusCircle
} from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { CashSession, CashSessionFlow, DailySummaryTotals } from '../../domain/models'
import { useCashSessions } from '../hooks/useCashSessions'

const DEFAULT_FLOW: CashSessionFlow = {
  cash_session_id: '',
  business_id: '',
  user_id: '',
  session_date: '',
  initial_balance: 0,
  allowed_to_withdraw: false,
  total_credits: 0,
  total_collected: 0,
  total_withdrawals_approved: 0,
  caja_inicial_restante: 0,
  total_recaudo_mostrado: 0,
  saldo_disponible: 0,
  efectivo_en_caja: 0
}

const containerStyle = 'bg-card border-border backdrop-blur-md shadow-xl'
const inputStyle = 'bg-background border-border text-foreground placeholder:text-muted-foreground focus:ring-primary/50 focus:border-primary/50 h-11'
const labelStyle = 'text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mb-2 block'

function userDisplayName(u: User): string {
  return u.name || u.first_name || u.email || u.employee_code || u.id
}

function downloadFlowCsv(flow: CashSessionFlow, sessionDate: string): void {
  const rows = [
    ['Concepto', 'Valor'],
    ['Fecha sesion', sessionDate],
    ['Saldo inicial', String(flow.initial_balance)],
    ['Total creditos', String(flow.total_credits)],
    ['Total recaudado', String(flow.total_collected)],
    ['Total retiros aprobados', String(flow.total_withdrawals_approved)],
    ['Caja inicial restante', String(flow.caja_inicial_restante)],
    ['Total recaudo mostrado', String(flow.total_recaudo_mostrado)],
    ['Saldo disponible', String(flow.saldo_disponible)],
    ['Efectivo en caja', String(flow.efectivo_en_caja)],
    ['Creado', flow.session_created_at ?? ''],
    ['Actualizado', flow.session_updated_at ?? '']
  ]
  const csv = rows
    .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))
    .join('\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `seguimiento-saldo-${flow.session_date}-${flow.cash_session_id.slice(0, 8)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

interface MetricCardProps {
  label: string
  value: string
  icon: React.ReactNode
  accent?: 'default' | 'success' | 'error' | 'warning' | 'info'
  subtitle?: string
  large?: boolean
}

function MetricCard({ label, value, icon, accent = 'default', subtitle, large }: MetricCardProps) {
  const accentStyles = {
    default: 'border-border bg-muted/20',
    success: 'border-success/20 bg-success/5',
    error: 'border-error/20 bg-error/5',
    warning: 'border-warning/20 bg-warning/5',
    info: 'border-primary/20 bg-primary/5'
  }
  const valueColors = {
    default: 'text-foreground',
    success: 'text-success',
    error: 'text-error',
    warning: 'text-warning',
    info: 'text-primary'
  }
  const iconColors = {
    default: 'text-muted-foreground/40',
    success: 'text-success/30',
    error: 'text-error/30',
    warning: 'text-warning/30',
    info: 'text-primary/30'
  }

  return (
    <div className={cn(
      'relative rounded-2xl border p-5 transition-all duration-300 hover:shadow-md overflow-hidden group',
      accentStyles[accent]
    )}>
      <div className={cn('absolute top-3 right-3 transition-opacity group-hover:opacity-40', iconColors[accent])}>
        {icon}
      </div>
      <div className="relative z-10 space-y-1.5">
        <p className={labelStyle}>{label}</p>
        <p className={cn(
          'font-black tabular-nums tracking-tight',
          large ? 'text-3xl' : 'text-xl',
          valueColors[accent]
        )}>
          {value}
        </p>
        {subtitle && (
          <p className="text-[9px] text-muted-foreground/50 uppercase tracking-wide">{subtitle}</p>
        )}
      </div>
    </div>
  )
}

export default function CashSessionFlowPage() {
  const { user, businessId } = useAuthStore()
  const { getUsersByBusinessId } = useAuth()
  const {
    getCashSessionsByBusinessId,
    getCashSessionsByUserId,
    getCashSessionFlow,
    getDailySummaryByUser
  } = useCashSessions()

  const currentBusinessId = (user?.business_id || businessId) ?? ''
  const prevBusinessIdRef = useRef<string | null>(null)

  const [businessUsers, setBusinessUsers] = useState<User[]>([])
  const [isLoadingUsers, setIsLoadingUsers] = useState(false)
  const [filterUserId, setFilterUserId] = useState<string>('')
  const [sessions, setSessions] = useState<CashSession[]>([])
  const [isLoadingSessions, setIsLoadingSessions] = useState(true)
  const [selectedSessionId, setSelectedSessionId] = useState<string>('')
  const [flow, setFlow] = useState<CashSessionFlow | null>(null)
  const [isLoadingFlow, setIsLoadingFlow] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dailyTotals, setDailyTotals] = useState<DailySummaryTotals | null>(null)
  const [isLoadingDailyTotals, setIsLoadingDailyTotals] = useState(false)

  useEffect(() => {
    if (!currentBusinessId) {
      setBusinessUsers([])
      setFilterUserId('')
      return
    }
    if (prevBusinessIdRef.current !== currentBusinessId) {
      prevBusinessIdRef.current = currentBusinessId
      setFilterUserId('')
    }
    let cancelled = false
    setIsLoadingUsers(true)
    getUsersByBusinessId(currentBusinessId)
      .then((list) => {
        if (!cancelled) setBusinessUsers(Array.isArray(list) ? list : [])
      })
      .finally(() => {
        if (!cancelled) setIsLoadingUsers(false)
      })
    return () => {
      cancelled = true
    }
  }, [currentBusinessId, getUsersByBusinessId])

  const loadSessions = useCallback(async () => {
    if (!currentBusinessId) return
    setIsLoadingSessions(true)
    setError(null)
    try {
      let data: CashSession[]
      if (filterUserId) {
        data = await getCashSessionsByUserId(filterUserId)
      } else {
        data = await getCashSessionsByBusinessId(currentBusinessId)
      }
      const list = Array.isArray(data) ? data : []
      setSessions(list)
      const stillInList = list.some((s) => s.id === selectedSessionId)
      if (list.length === 0) {
        setSelectedSessionId('')
        setFlow(null)
      } else if (!selectedSessionId || !stillInList) {
        setSelectedSessionId(list[0].id)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar sesiones')
      setSessions([])
    } finally {
      setIsLoadingSessions(false)
    }
  }, [currentBusinessId, filterUserId, getCashSessionsByBusinessId, getCashSessionsByUserId])

  useEffect(() => {
    loadSessions()
  }, [loadSessions])

  const selectedSession = sessions.find((s) => s.id === selectedSessionId)
  const effectiveUserId = filterUserId || undefined

  useEffect(() => {
    if (!effectiveUserId) {
      setDailyTotals(null)
      return
    }
    let cancelled = false
    setIsLoadingDailyTotals(true)
    getDailySummaryByUser(effectiveUserId)
      .then((res) => {
        if (!cancelled && res) setDailyTotals(res.totals)
      })
      .catch(() => {
        if (!cancelled) setDailyTotals(null)
      })
      .finally(() => {
        if (!cancelled) setIsLoadingDailyTotals(false)
      })
    return () => { cancelled = true }
  }, [effectiveUserId, getDailySummaryByUser])

  useEffect(() => {
    if (!selectedSessionId) {
      setFlow(null)
      return
    }
    let cancelled = false
    setIsLoadingFlow(true)
    setFlow(null)
    getCashSessionFlow(selectedSessionId)
      .then((f) => {
        if (!cancelled && f) setFlow(f)
      })
      .finally(() => {
        if (!cancelled) setIsLoadingFlow(false)
      })
    return () => {
      cancelled = true
    }
  }, [selectedSessionId, getCashSessionFlow])

  const displayFlow: CashSessionFlow = flow ?? DEFAULT_FLOW
  const showCobradorTotals = !!effectiveUserId
  const totals = dailyTotals

  const recaudoVsVentasPct = totals && totals.total_ventas > 0
    ? Math.round((totals.total_recaudo / totals.total_ventas) * 100)
    : 0

  const handleExport = () => {
    if (flow) downloadFlowCsv(flow, flow.session_date)
  }

  const selectedUserName = effectiveUserId
    ? (businessUsers.find((u) => u.id === effectiveUserId)
      ? userDisplayName(businessUsers.find((u) => u.id === effectiveUserId)!)
      : 'Seleccionado')
    : null

  if (!currentBusinessId) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-muted-foreground/60 italic font-medium">Esperando identificador de negocio...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="space-y-1">
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground flex items-center gap-3">
          <TrendingUp className="w-8 h-8 text-primary" />
          Seguimiento de Caja
        </h1>
        <p className="text-sm text-muted-foreground/60">Panel de control operativo por colaborador. Seguimiento de flujos, recaudos y movimientos.</p>
      </div>

      {error && (
        <div className="bg-error/10 border border-error/20 rounded-lg p-3 text-error text-[10px] font-bold uppercase tracking-widest">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        {/* ── SIDEBAR ── */}
        <div className="xl:col-span-4 space-y-6">
          <Card className={cn('border transition-all duration-500 overflow-hidden group', containerStyle)}>
            <CardHeader className="border-b border-border pb-4">
              <CardTitle className={labelStyle}>Filtrar Colaborador</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {isLoadingUsers ? (
                <div className={cn(inputStyle, "flex items-center opacity-50")}>Cargando equipo...</div>
              ) : (
                <Select
                  value={filterUserId || 'all'}
                  onValueChange={(v) => setFilterUserId(v === 'all' ? '' : v)}
                >
                  <SelectTrigger className={inputStyle}>
                    <SelectValue placeholder="Todos los usuarios" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border text-popover-foreground">
                    <SelectItem value="all" className="focus:bg-primary/20">Todos los usuarios</SelectItem>
                    {businessUsers.map((u) => (
                      <SelectItem key={u.id} value={u.id} className="focus:bg-primary/20">
                        {userDisplayName(u)} {u.id === user?.id && '(Tu)'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </CardContent>
          </Card>

          <Card className={cn('border transition-all duration-500 overflow-hidden group', containerStyle)}>
            <CardHeader className="border-b border-border pb-4 flex flex-row items-center justify-between">
              <div className="space-y-0.5">
                <CardTitle className={labelStyle}>
                  Historial de Sesiones
                  {filterUserId && (
                    <span className="ml-2 font-normal text-muted-foreground/70">
                      · {businessUsers.find((u) => u.id === filterUserId) ? userDisplayName(businessUsers.find((u) => u.id === filterUserId)!) : 'Cobrador'}
                    </span>
                  )}
                </CardTitle>
              </div>
              <span className="text-[10px] font-black text-muted-foreground tabular-nums">{sessions.length}</span>
            </CardHeader>
            <CardContent className="pt-6 px-2">
              {isLoadingSessions ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : sessions.length === 0 ? (
                <div className="text-center py-8 space-y-2">
                  <p className="text-muted-foreground text-[11px] font-bold uppercase tracking-widest">Sin sesiones de caja</p>
                  <p className="text-muted-foreground/30 text-[10px] max-w-[240px] mx-auto">
                    {filterUserId
                      ? 'Este cobrador aun no tiene sesiones. Los totales se muestran en el panel derecho.'
                      : 'Selecciona un cobrador arriba para ver sus sesiones.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[500px] overflow-y-auto px-4 custom-scrollbar">
                  {sessions.map((s) => {
                    const isSelected = s.id === selectedSessionId
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setSelectedSessionId(s.id)}
                        className={cn(
                          'w-full text-left p-4 rounded-xl border transition-all duration-300',
                          isSelected
                            ? 'bg-primary/10 border-primary shadow-lg shadow-primary/5'
                            : 'border-border bg-muted/30 hover:bg-muted/50 hover:border-border'
                        )}
                      >
                        <div className="flex justify-between items-start mb-1">
                          <span className={cn(
                            "text-xs font-black tracking-tight",
                            isSelected ? 'text-primary-foreground' : 'text-muted-foreground'
                          )}>{formatDate(s.session_date)}</span>
                          <span className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded bg-muted/50 border border-border text-muted-foreground">ID:{s.id.slice(0,4)}</span>
                        </div>
                        <span className={cn(
                          "block text-sm font-black tabular-nums",
                          isSelected ? 'text-primary' : 'text-muted-foreground/60'
                        )}>
                          {formatCurrency(s.initial_balance ?? 0)}
                        </span>
                      </button>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── PANEL PRINCIPAL ── */}
        <div className="xl:col-span-8 space-y-6">

          {/* ── TOTALES DEL COBRADOR (daily-summary) ── */}
          {showCobradorTotals && (
            <Card className={cn('border transition-all duration-500 overflow-hidden', containerStyle)}>
              <CardHeader className="border-b border-border flex flex-row items-center justify-between p-5">
                <div className="space-y-0.5">
                  <CardTitle className="text-sm font-bold text-foreground uppercase tracking-widest">
                    Resumen Acumulado
                  </CardTitle>
                  {selectedUserName && (
                    <p className="text-[10px] font-bold text-primary/70 uppercase tracking-wider">
                      {selectedUserName}
                    </p>
                  )}
                </div>
                {isLoadingDailyTotals && <Loader2 className="w-4 h-4 animate-spin text-primary/40" />}
              </CardHeader>
              <CardContent className="p-5">
                {isLoadingDailyTotals && !totals ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary/20" />
                  </div>
                ) : totals ? (
                  <div className="space-y-5">
                    {/* KPIs principales */}
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                      <MetricCard
                        label="Total Recaudo"
                        value={`+${formatCurrency(totals.total_recaudo)}`}
                        icon={<Receipt className="w-7 h-7" />}
                        accent="success"
                        subtitle="Cobros realizados"
                      />
                      <MetricCard
                        label="Total Ventas"
                        value={formatCurrency(totals.total_ventas)}
                        icon={<ShoppingCart className="w-7 h-7" />}
                        accent="info"
                        subtitle="Capital prestado"
                      />
                      <MetricCard
                        label="Caja Actual"
                        value={formatCurrency(totals.caja_actual)}
                        icon={<Wallet className="w-7 h-7" />}
                        accent="success"
                        subtitle="Saldo en caja hoy"
                        large
                      />
                    </div>

                    {/* KPIs secundarios */}
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                      <MetricCard
                        label="Total Ingresos"
                        value={formatCurrency(totals.total_ingresos)}
                        icon={<ArrowUpRight className="w-6 h-6" />}
                        accent="default"
                        subtitle="Entradas adicionales"
                      />
                      <MetricCard
                        label="Total Retiros"
                        value={totals.total_retiros > 0 ? `-${formatCurrency(totals.total_retiros)}` : formatCurrency(0)}
                        icon={<ArrowDownRight className="w-6 h-6" />}
                        accent={totals.total_retiros > 0 ? 'error' : 'default'}
                        subtitle="Salidas autorizadas"
                      />
                      <MetricCard
                        label="Total Gastos"
                        value={totals.total_gastos > 0 ? `-${formatCurrency(totals.total_gastos)}` : formatCurrency(0)}
                        icon={<MinusCircle className="w-6 h-6" />}
                        accent={totals.total_gastos > 0 ? 'warning' : 'default'}
                        subtitle="Gastos operativos"
                      />
                    </div>

                    {/* Barra de progreso recaudo vs ventas */}
                    {totals.total_ventas > 0 && (
                      <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Recuperacion (Recaudo vs Ventas)</span>
                          <span className="text-[10px] font-black text-foreground tabular-nums">
                            {recaudoVsVentasPct}%
                          </span>
                        </div>
                        <div className="h-2 w-full bg-muted/50 rounded-full overflow-hidden">
                          <div
                            className={cn(
                              'h-full rounded-full transition-all duration-1000 ease-out',
                              recaudoVsVentasPct >= 80 ? 'bg-success' : recaudoVsVentasPct >= 50 ? 'bg-primary' : 'bg-warning'
                            )}
                            style={{ width: `${Math.min(recaudoVsVentasPct, 100)}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground/40 text-[10px] font-bold uppercase tracking-widest">Sin datos de resumen disponibles</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* ── DETALLE DE SESION SELECCIONADA ── */}
          <Card className={cn('border transition-all duration-500 overflow-hidden group', containerStyle, !showCobradorTotals && 'min-h-[600px]')}>
            <CardHeader className="border-b border-border flex flex-row items-center justify-between p-5">
              <div className="space-y-0.5">
                <CardTitle className="text-sm font-bold text-foreground uppercase tracking-widest">
                  Detalle de Sesion
                </CardTitle>
                {selectedSession && (
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    {formatDate(selectedSession.session_date)}
                    {selectedUserName && ` · ${selectedUserName}`}
                  </p>
                )}
              </div>
              {flow && (
                <Button
                  onClick={handleExport}
                  className="h-9 px-4 font-bold uppercase tracking-widest text-[10px]"
                >
                  <Download className="w-3.5 h-3.5 mr-2" />
                  CSV
                </Button>
              )}
            </CardHeader>
            <CardContent className="p-5">
              {!showCobradorTotals && !selectedSessionId && (
                <div className="flex flex-col items-center justify-center py-16 space-y-3">
                  <Banknote className="w-12 h-12 text-muted-foreground/20" />
                  <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/50">
                    Selecciona un cobrador para ver su seguimiento
                  </p>
                </div>
              )}

              {isLoadingFlow && selectedSessionId ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="w-10 h-10 animate-spin text-primary/20" />
                </div>
              ) : selectedSessionId ? (
                <div className="space-y-6">
                  {/* Saldo inicial de la sesion */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <MetricCard
                      label="Saldo Inicial"
                      value={formatCurrency(displayFlow.initial_balance)}
                      icon={<Banknote className="w-6 h-6" />}
                      accent="info"
                    />
                    <MetricCard
                      label="Total Recaudado"
                      value={`+${formatCurrency(displayFlow.total_collected)}`}
                      icon={<Receipt className="w-6 h-6" />}
                      accent="success"
                    />
                    <MetricCard
                      label="Retiros Aprobados"
                      value={displayFlow.total_withdrawals_approved > 0 ? `-${formatCurrency(displayFlow.total_withdrawals_approved)}` : formatCurrency(0)}
                      icon={<ArrowDownRight className="w-6 h-6" />}
                      accent={displayFlow.total_withdrawals_approved > 0 ? 'error' : 'default'}
                    />
                    <MetricCard
                      label="Margen de Sesion"
                      value={`${displayFlow.total_recaudo_mostrado >= 0 ? '+' : ''}${formatCurrency(displayFlow.total_recaudo_mostrado)}`}
                      icon={<TrendingUp className="w-6 h-6" />}
                      accent={displayFlow.total_recaudo_mostrado >= 0 ? 'success' : 'error'}
                    />
                  </div>

                  {/* Resultado final */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <MetricCard
                      label="Saldo Disponible"
                      value={formatCurrency(displayFlow.saldo_disponible)}
                      icon={<Wallet className="w-8 h-8" />}
                      accent="info"
                      subtitle="Balance neto de la sesion"
                      large
                    />
                    <MetricCard
                      label="Efectivo en Caja"
                      value={formatCurrency(displayFlow.efectivo_en_caja)}
                      icon={<TrendingUp className="w-8 h-8" />}
                      accent="success"
                      subtitle="Disponible fisicamente"
                      large
                    />
                  </div>

                  {/* Timestamps */}
                  <div className="flex items-center justify-end gap-6 pt-2 border-t border-border/50">
                    <div className="text-right">
                      <p className={labelStyle}>Creado</p>
                      <p className="text-[10px] font-bold text-muted-foreground/60">{displayFlow.session_created_at ? formatDateTime(displayFlow.session_created_at) : '-'}</p>
                    </div>
                    <div className="text-right">
                      <p className={labelStyle}>Actualizado</p>
                      <p className="text-[10px] font-bold text-muted-foreground/60">{displayFlow.session_updated_at ? formatDateTime(displayFlow.session_updated_at) : '-'}</p>
                    </div>
                  </div>
                </div>
              ) : showCobradorTotals ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-3">
                  <Banknote className="w-10 h-10 text-muted-foreground/20" />
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40">
                    Selecciona una sesion del historial para ver su detalle
                  </p>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
