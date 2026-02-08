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
import { CollectionRepository } from '@/features/collections/infrastructure/repositories/CollectionRepository'
import { CollectionService } from '@/features/collections/domain/services/CollectionService'
import { CreditRepository } from '@/features/credits/infrastructure/repositories/CreditRepository'
import { CreditService } from '@/features/credits/domain/services/CreditService'
import { cn } from '@/shared/utils/cn'
import { formatCurrency, formatDate, formatDateTime } from '@/shared/utils/date'
import { DollarSign, Download, Loader2, TrendingUp } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { CashSession, CashSessionFlow } from '../../domain/models'
import { useCashSessions } from '../hooks/useCashSessions'

/** Flujo por defecto para pintar siempre la Trazabilidad (haya o no saldo inicial / sesión). */
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

const containerStyle = 'bg-[#0f171a]/40 border-white/5 backdrop-blur-md shadow-2xl'
const inputStyle = 'bg-white/[0.03] border-white/5 text-white placeholder:text-muted-foreground/40 focus:ring-primary/50 focus:border-primary/50 h-11'
const labelStyle = 'text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mb-2 block'

function userDisplayName(u: User): string {
  return u.name || u.first_name || u.email || u.employee_code || u.id
}

function downloadFlowCsv(flow: CashSessionFlow, sessionDate: string): void {
  const rows = [
    ['Concepto', 'Valor'],
    ['Fecha sesión', sessionDate],
    ['Saldo inicial', String(flow.initial_balance)],
    ['Total créditos', String(flow.total_credits)],
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

export default function CashSessionFlowPage() {
  const { user, businessId } = useAuthStore()
  const { getUsersByBusinessId } = useAuth()
  const { getCashSessionsByBusinessId, getCashSessionsByUserId, getCashSessionFlow } =
    useCashSessions()

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
  /** Total Recaudado desde GET /api/collections?business_id=&user_id= (por usuario). */
  const [userTotalRecaudo, setUserTotalRecaudo] = useState<number | null>(null)
  /** Ventas (Capital Prestado) desde créditos por business_id + user_id. */
  const [userTotalVentas, setUserTotalVentas] = useState<number | null>(null)
  const [isLoadingUserTotals, setIsLoadingUserTotals] = useState(false)

  const collectionService = useMemo(() => {
    const repo = new CollectionRepository()
    return new CollectionService(repo)
  }, [])
  const creditService = useMemo(() => {
    const repo = new CreditRepository()
    return new CreditService(repo)
  }, [])

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
  /** Solo cobrador seleccionado: esta vista es cobrador por cobrador. No usa totales globales (esos están en el Dashboard). */
  const effectiveUserId = filterUserId || undefined

  useEffect(() => {
    if (!currentBusinessId || !effectiveUserId) {
      setUserTotalRecaudo(null)
      setUserTotalVentas(null)
      return
    }
    let cancelled = false
    setIsLoadingUserTotals(true)
    const loadUserTotals = async () => {
      try {
        const [collections, summaries] = await Promise.all([
          collectionService.getCollectionsWithFilters({
            businessId: currentBusinessId,
            userId: effectiveUserId
          }),
          creditService.getCreditSummariesByBusinessAndUser(currentBusinessId, effectiveUserId)
        ])
        if (cancelled) return
        const totalRecaudo = (collections || []).reduce((s, c) => s + (Number(c.amount) || 0), 0)
        const totalVentas = (summaries || []).reduce((s, c) => s + (Number(c.total_amount) || 0), 0)
        setUserTotalRecaudo(totalRecaudo)
        setUserTotalVentas(totalVentas)
      } catch {
        if (!cancelled) {
          setUserTotalRecaudo(null)
          setUserTotalVentas(null)
        }
      } finally {
        if (!cancelled) setIsLoadingUserTotals(false)
      }
    }
    loadUserTotals()
    return () => { cancelled = true }
  }, [currentBusinessId, effectiveUserId, collectionService, creditService])

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

  /** Siempre hay un flujo a pintar: el real o el por defecto (trazabilidad visible con o sin caja inicial). */
  const displayFlow: CashSessionFlow = flow ?? DEFAULT_FLOW
  const hasRealFlow = flow != null
  /** Solo se muestran cuando hay cobrador seleccionado; con "Todos" no se pintan totales (eso va en dashboard). */
  const displayTotalRecaudo = effectiveUserId ? (userTotalRecaudo != null ? userTotalRecaudo : 0) : null
  const displayTotalVentas = effectiveUserId ? (userTotalVentas != null ? userTotalVentas : 0) : null
  const showCobradorTotals = !!effectiveUserId
  /** Mismo valor que mostramos en "Efectivo Restante de Caja": con cobrador = inicial − ventas (no el del API, que puede ser caja inicial). */
  const efectivoRestanteDeCaja = showCobradorTotals
    ? Math.max(0, displayFlow.initial_balance - (displayTotalVentas ?? 0))
    : (displayFlow.caja_inicial_restante ?? 0)
  /** Efectivo que queda en caja = Efectivo Restante de Caja + recaudo (nunca Caja Inicial + recaudo). */
  const efectivoQueQuedaEnCaja = showCobradorTotals
    ? (displayTotalRecaudo ?? 0) + efectivoRestanteDeCaja
    : displayFlow.efectivo_en_caja
  const handleExport = () => {
    if (flow) downloadFlowCsv(flow, flow.session_date)
  }

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
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white flex items-center gap-3">
          <TrendingUp className="w-8 h-8 text-primary" />
          Trazabilidad de Flujo
        </h1>
        <p className="text-sm text-muted-foreground/60">Análisis detallado de movimientos, recaudos y retiros por sesión de caja.</p>
      </div>

      {error && (
        <div className="bg-error/10 border border-error/20 rounded-lg p-3 text-error text-[10px] font-bold uppercase tracking-widest">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        <div className="xl:col-span-4 space-y-6">
          <Card className={cn('border transition-all duration-500 overflow-hidden group', containerStyle)}>
            <CardHeader className="border-b border-white/5 pb-4">
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
                  <SelectContent className="bg-[#0f171a] border-white/10 text-white">
                    <SelectItem value="all" className="focus:bg-primary/20">Todos los usuarios</SelectItem>
                    {businessUsers.map((u) => (
                      <SelectItem key={u.id} value={u.id} className="focus:bg-primary/20">
                        {userDisplayName(u)} {u.id === user?.id && '(Tú)'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </CardContent>
          </Card>

          <Card className={cn('border transition-all duration-500 overflow-hidden group', containerStyle)}>
            <CardHeader className="border-b border-white/5 pb-4 flex flex-row items-center justify-between">
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
              <span className="text-[10px] font-black text-muted-foreground/40 tabular-nums">{sessions.length}</span>
            </CardHeader>
            <CardContent className="pt-6 px-2">
              {isLoadingSessions ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : sessions.length === 0 ? (
                <div className="text-center py-8 space-y-2">
                  <p className="text-muted-foreground/40 text-[11px] font-bold uppercase tracking-widest">Sin sesiones de caja</p>
                  {filterUserId ? (
                    <p className="text-muted-foreground/30 text-[10px] max-w-[240px] mx-auto">
                      Este cobrador aún no tiene sesiones. Los totales (recaudado y ventas) se muestran a la derecha para este cobrador.
                    </p>
                  ) : (
                    <p className="text-muted-foreground/30 text-[10px]">Selecciona un cobrador arriba para ver sus sesiones.</p>
                  )}
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
                            : 'border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/10'
                        )}
                      >
                        <div className="flex justify-between items-start mb-1">
                          <span className={cn(
                            "text-xs font-black tracking-tight",
                            isSelected ? 'text-white' : 'text-muted-foreground'
                          )}>{formatDate(s.session_date)}</span>
                          <span className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded bg-white/5 border border-white/5 text-muted-foreground/40">ID:{s.id.slice(0,4)}</span>
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

        <div className="xl:col-span-8">
          <Card className={cn('border transition-all duration-500 overflow-hidden group min-h-[600px]', containerStyle)}>
            <CardHeader className="border-b border-white/5 flex flex-row items-center justify-between p-6">
              <div className="space-y-1">
                <CardTitle className="text-sm font-bold text-white uppercase tracking-widest">
                  Análisis Operativo
                </CardTitle>
                {effectiveUserId && (
                  <p className="text-[10px] font-bold text-primary/70 uppercase tracking-tighter">
                    Datos del cobrador: {businessUsers.find((u) => u.id === effectiveUserId) ? userDisplayName(businessUsers.find((u) => u.id === effectiveUserId)!) : 'Seleccionado'}
                  </p>
                )}
                {selectedSession && !effectiveUserId && (
                  <p className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-tighter">
                    {formatDate(selectedSession.session_date)} · Sesión
                  </p>
                )}
                {selectedSession && effectiveUserId && (
                  <p className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-tighter">
                    {formatDate(selectedSession.session_date)} · Sesión del cobrador
                  </p>
                )}
              </div>
              {flow && (
                <Button
                  onClick={handleExport}
                  className="h-9 px-4 border-white/5 bg-white/[0.03] text-white hover:bg-white/[0.08] font-bold uppercase tracking-widest text-[10px]"
                >
                  <Download className="w-3.5 h-3.5 mr-2" />
                  XLS
                </Button>
              )}
            </CardHeader>
            <CardContent className="p-8">
              {isLoadingFlow && selectedSessionId ? (
                <div className="flex items-center justify-center h-[400px]">
                  <Loader2 className="w-12 h-12 animate-spin text-primary/20" />
                </div>
              ) : (
                <div className="space-y-10">
                  {!showCobradorTotals && (
                    <div className="rounded-xl border border-primary/20 bg-primary/5 py-4 px-4 text-center text-[10px] font-bold uppercase tracking-widest text-primary/80">
                      Selecciona un cobrador arriba para ver su recaudo y ventas (cobrador por cobrador). Los totales generales están en el dashboard.
                    </div>
                  )}
                  {showCobradorTotals && (!selectedSessionId || !hasRealFlow) && (
                    <div className="rounded-xl border border-primary/20 bg-primary/5 py-3 px-4 text-center text-[10px] font-bold uppercase tracking-widest text-primary/70">
                      Totales del cobrador seleccionado. Sin sesión de caja: si ingresa caja inicial, aparecerá abajo.
                    </div>
                  )}
                  {/* Bloque 1: Caja Inicial → Ventas (lo que se presta) → Efectivo restante = inicial − ventas */}
                  <div className="space-y-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/60 border-b border-primary/10 pb-2">
                      Gestión de Caja Inicial & Ventas
                    </p>
                    <p className="text-[9px] text-muted-foreground/50 normal-case">
                      Caja inicial recibida; ventas = lo que se presta (sale de caja); efectivo restante = inicial − ventas (negativo de lo prestado).
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
                      <div className="space-y-1 group/val relative">
                        <p className={labelStyle}>Caja Inicial Recibida</p>
                        <p className="text-2xl font-black tracking-tight text-white tabular-nums">
                          {formatCurrency(displayFlow.initial_balance)}
                        </p>
                        {displayFlow.initial_balance === 0 && effectiveUserId && (
                          <p className="text-[9px] text-muted-foreground/40 italic">Si el cobrador recibe caja inicial, se mostrará aquí.</p>
                        )}
                      </div>
                      <div className="space-y-1 group/val relative">
                        <p className={cn(labelStyle, "text-error/60")}>Ventas (Lo que se presta)</p>
                        <p className="text-2xl font-black tracking-tight text-error/80 tabular-nums">
                          {showCobradorTotals ? `-${formatCurrency(displayTotalVentas ?? 0)}` : '—'}
                        </p>
                        <p className="text-[9px] text-muted-foreground/40 italic">Salida de caja por préstamos.</p>
                      </div>
                      <div className="space-y-1 group/val relative">
                        <p className={cn(labelStyle, "text-success/60")}>Efectivo Restante de Caja</p>
                        <p className="text-2xl font-black tracking-tight text-success tabular-nums">
                          {formatCurrency(efectivoRestanteDeCaja)}
                        </p>
                        <p className="text-[9px] text-muted-foreground/40 italic">
                          {showCobradorTotals ? 'Inicial − ventas (negativo de lo prestado).' : 'Caja inicial − lo prestado.'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Bloque 2: Recaudo, Retiros, Margen */}
                  <div className="space-y-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-info/60 border-b border-info/10 pb-2">Flujo de Movimientos (Operatividad)</p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
                      <div className="space-y-1">
                        <p className={labelStyle}>Total Recaudado {showCobradorTotals && isLoadingUserTotals && <span className="text-muted-foreground/40 font-normal">(cargando…)</span>}</p>
                        <p className="text-xl font-bold text-white tabular-nums">
                          {showCobradorTotals ? `+${formatCurrency(displayTotalRecaudo ?? 0)}` : '—'}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className={labelStyle}>Retiros Autorizados</p>
                        <p className="text-xl font-bold text-error/60 tabular-nums">
                          -{formatCurrency(displayFlow.total_withdrawals_approved)}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className={cn(labelStyle, displayFlow.total_recaudo_mostrado >= 0 ? "text-success/60" : "text-error/60")}>Margen de Sesión</p>
                        <p className={cn(
                          "text-xl font-bold tabular-nums",
                          displayFlow.total_recaudo_mostrado >= 0 ? "text-success" : "text-error"
                        )}>
                          {displayFlow.total_recaudo_mostrado >= 0 ? '+' : ''}{formatCurrency(displayFlow.total_recaudo_mostrado)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Bloque 3: Margen de sesión + Saldo neto + Efectivo en caja (organizado) */}
                  <div className="space-y-6">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/60 border-b border-primary/10 pb-2">Resultado Final & Arqueo de Caja</p>

                    {/* Margen de sesión destacado */}
                    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 flex flex-row items-center justify-between">
                      <div>
                        <p className={cn(labelStyle, displayFlow.total_recaudo_mostrado >= 0 ? "text-success/60" : "text-error/60")}>Margen de Sesión</p>
                        <p className={cn(
                          "text-2xl font-black tabular-nums",
                          displayFlow.total_recaudo_mostrado >= 0 ? "text-success" : "text-error"
                        )}>
                          {displayFlow.total_recaudo_mostrado >= 0 ? '+' : ''}{formatCurrency(displayFlow.total_recaudo_mostrado)}
                        </p>
                      </div>
                      <span className="text-[9px] text-muted-foreground/50 uppercase">Recaudo − retiros</span>
                    </div>
                    
                    {/* Saldo neto y Efectivo en caja — ordenados */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="relative p-6 rounded-3xl bg-primary/5 border border-primary/10 overflow-hidden group/result">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover/result:opacity-20 transition-opacity">
                          <DollarSign className="w-12 h-12" />
                        </div>
                        <div className="relative z-10 space-y-2">
                          <p className={cn(labelStyle, "text-primary/60 mb-0")}>Saldo Neto Liquidado</p>
                          <p className="text-4xl font-black tracking-tighter text-white tabular-nums">
                            {formatCurrency(displayFlow.saldo_disponible)}
                          </p>
                          <p className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-widest italic">Balance después de préstamos</p>
                        </div>
                      </div>

                      <div className="relative p-6 rounded-3xl bg-success/5 border border-success/10 overflow-hidden group/cash">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover/cash:opacity-20 transition-opacity">
                          <TrendingUp className="w-12 h-12" />
                        </div>
                        <div className="relative z-10 space-y-2">
                          <p className={cn(labelStyle, "text-success/60 mb-0")}>Efectivo que queda en caja</p>
                          <p className="text-4xl font-black tracking-tighter text-success tabular-nums">
                            {formatCurrency(efectivoQueQuedaEnCaja)}
                          </p>
                          <p className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-widest italic">Efectivo Restante de Caja + recaudo</p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 p-6 rounded-2xl bg-white/[0.01] border border-white/5 items-center">
                      <div className="w-full space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">Progreso Operativo (Ventas vs Recaudos)</span>
                          <span className="text-[10px] font-black text-white tabular-nums">
                            {showCobradorTotals
                              ? `${Math.round(((displayTotalRecaudo ?? 0) / ((displayTotalVentas ?? 0) || 1)) * 100)}%`
                              : '—'}
                          </span>
                        </div>
                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary transition-all duration-1000 ease-out" 
                            style={{ width: showCobradorTotals ? `${Math.min(((displayTotalRecaudo ?? 0) / ((displayTotalVentas ?? 0) || 1)) * 100, 100)}%` : '0%' }}
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-6 opacity-40">
                        <div className="text-right">
                          <p className={labelStyle}>Creación Registro</p>
                          <p className="text-[10px] font-bold text-white">{displayFlow.session_created_at ? formatDateTime(displayFlow.session_created_at) : '-'}</p>
                        </div>
                        <div className="text-right">
                          <p className={labelStyle}>Último Sync</p>
                          <p className="text-[10px] font-bold text-white">{displayFlow.session_updated_at ? formatDateTime(displayFlow.session_updated_at) : '-'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
