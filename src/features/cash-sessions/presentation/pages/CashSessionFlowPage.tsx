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
import { Download, Loader2, TrendingUp } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { CashSession, CashSessionFlow } from '../../domain/models'
import { useCashSessions } from '../hooks/useCashSessions'

const cardDark = 'bg-[#0f171a] border-gray-600 text-gray-200'
const selectContentDark = 'bg-[#0f171a] border-gray-600 text-gray-200'

function userDisplayName(u: User): string {
  return u.name || u.first_name || u.email || u.employee_code || u.id
}

function downloadFlowCsv(flow: CashSessionFlow, sessionDate: string): void {
  const rows = [
    ['Concepto', 'Valor'],
    // ['Sesión (ID)', flow.cash_session_id],
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

  const selectedSession = sessions.find((s) => s.id === selectedSessionId)
  const handleExport = () => {
    if (flow) downloadFlowCsv(flow, flow.session_date)
  }

  if (!currentBusinessId) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-gray-400">No hay negocio. Inicia sesión.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-2">
        <TrendingUp className="w-8 h-8 text-[#2563EB]" />
        Seguimiento de saldo
      </h1>
      <p className="text-gray-400 text-sm">
        Saldo inicial, total recaudado, retiros aprobados y efectivo en caja por sesión.
      </p>

      {error && (
        <div className="bg-red-900/30 border border-red-700/50 rounded-lg p-3 text-red-200 text-sm">
          {error}
        </div>
      )}

      <Card className={cn('', cardDark)}>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-white">Filtros</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
            <label className="text-sm font-medium text-gray-300 shrink-0">Usuario:</label>
            {isLoadingUsers ? (
              <span className="text-gray-400 text-sm flex items-center gap-1">
                <Loader2 className="w-4 h-4 animate-spin" />
                Cargando…
              </span>
            ) : (
              <Select
                value={filterUserId || 'all'}
                onValueChange={(v) => setFilterUserId(v === 'all' ? '' : v)}
                disabled={isLoadingUsers}
              >
                <SelectTrigger className="w-full sm:w-[260px] bg-[#0f171a] border-gray-600 text-white">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent className={selectContentDark}>
                  <SelectItem
                    value="all"
                    className="text-gray-200 data-[highlighted]:bg-[#2563EB]/40"
                  >
                    Todos
                  </SelectItem>
                  {businessUsers.map((u) => (
                    <SelectItem
                      key={u.id}
                      value={u.id}
                      className="text-gray-200 data-[highlighted]:bg-[#2563EB]/40"
                    >
                      {userDisplayName(u)}
                      {u.id === user?.id && (
                        <span className="ml-1 text-gray-500 text-xs">(tú)</span>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className={cn('lg:col-span-1', cardDark)}>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-white">Sesiones de caja</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingSessions ? (
              <div className="flex items-center justify-center py-8 text-gray-400">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
            ) : sessions.length === 0 ? (
              <p className="text-gray-400 text-sm py-4">No hay sesiones.</p>
            ) : (
              <ul className="space-y-1 max-h-[400px] overflow-y-auto">
                {sessions.map((s) => {
                  const isSelected = s.id === selectedSessionId
                  return (
                    <li key={s.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedSessionId(s.id)}
                        className={cn(
                          'w-full text-left px-3 py-2 rounded-lg border transition-colors',
                          isSelected
                            ? 'bg-[#2563EB]/30 border-[#2563EB] text-white'
                            : 'border-gray-600 text-gray-300 hover:bg-gray-800/50 hover:border-gray-500'
                        )}
                      >
                        <span className="font-medium">{formatDate(s.session_date)}</span>
                        <span className="block text-sm text-gray-400 mt-0.5">
                          {formatCurrency(s.initial_balance ?? 0)}
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className={cn('lg:col-span-2', cardDark)}>
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <CardTitle className="text-lg font-semibold text-white">
              Detalle de sesión
              {selectedSession && (
                <span className="block text-sm font-normal text-gray-400 mt-1">
                  {formatDate(selectedSession.session_date)} · Saldo inicial{' '}
                  {formatCurrency(selectedSession.initial_balance ?? 0)}
                </span>
              )}
            </CardTitle>
            {flow && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleExport}
                className="border-[#2563EB] text-[#2563EB] hover:bg-[#2563EB]/20 shrink-0"
              >
                <Download className="w-4 h-4 mr-1" />
                Exportar CSV
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {!selectedSessionId ? (
              <p className="text-gray-400 text-sm">Selecciona una sesión.</p>
            ) : isLoadingFlow ? (
              <div className="flex items-center justify-center py-12 text-gray-400">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
            ) : !flow ? (
              <p className="text-gray-400 text-sm">No se pudo cargar el flujo de esta sesión.</p>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="rounded-lg border border-gray-600 p-4 bg-black/20">
                    <p className="text-gray-400 text-xs uppercase tracking-wide">Saldo inicial</p>
                    <p className="text-xl font-bold text-white mt-1">
                      {formatCurrency(flow.initial_balance)}
                    </p>
                  </div>
                  <div className="rounded-lg border border-gray-600 p-4 bg-black/20">
                    <p className="text-gray-400 text-xs uppercase tracking-wide">
                      Efectivo en caja
                    </p>
                    <p className="text-xl font-bold text-[#34D399] mt-1">
                      {formatCurrency(flow.efectivo_en_caja)}
                    </p>
                  </div>
                  <div className="rounded-lg border border-gray-600 p-4 bg-black/20">
                    <p className="text-gray-400 text-xs uppercase tracking-wide">Total recaudado</p>
                    <p className="text-lg font-semibold text-white mt-1">
                      {formatCurrency(flow.total_collected)}
                    </p>
                  </div>
                  <div className="rounded-lg border border-gray-600 p-4 bg-black/20">
                    <p className="text-gray-400 text-xs uppercase tracking-wide">
                      Total retiros aprobados
                    </p>
                    <p className="text-lg font-semibold text-amber-300 mt-1">
                      {formatCurrency(flow.total_withdrawals_approved)}
                    </p>
                  </div>
                  <div className="rounded-lg border border-gray-600 p-4 bg-black/20">
                    <p className="text-gray-400 text-xs uppercase tracking-wide">
                      Saldo disponible
                    </p>
                    <p className="text-lg font-semibold text-white mt-1">
                      {formatCurrency(flow.saldo_disponible)}
                    </p>
                  </div>
                  <div className="rounded-lg border border-gray-600 p-4 bg-black/20">
                    <p className="text-gray-400 text-xs uppercase tracking-wide">
                      Caja inicial restante
                    </p>
                    <p className="text-lg font-semibold text-gray-300 mt-1">
                      {formatCurrency(flow.caja_inicial_restante)}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-gray-600">
                  <div>
                    <p className="text-gray-400 text-xs uppercase tracking-wide">Total créditos</p>
                    <p className="text-gray-200 mt-1">{formatCurrency(flow.total_credits)}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs uppercase tracking-wide">
                      Total recaudo mostrado
                    </p>
                    <p className="text-gray-200 mt-1">
                      {formatCurrency(flow.total_recaudo_mostrado)}
                    </p>
                  </div>
                  {flow.session_created_at && (
                    <div>
                      <p className="text-gray-400 text-xs uppercase tracking-wide">Creado</p>
                      <p className="text-gray-300 text-sm mt-1">
                        {formatDateTime(flow.session_created_at)}
                      </p>
                    </div>
                  )}
                  {flow.session_updated_at && (
                    <div>
                      <p className="text-gray-400 text-xs uppercase tracking-wide">Actualizado</p>
                      <p className="text-gray-300 text-sm mt-1">
                        {formatDateTime(flow.session_updated_at)}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
