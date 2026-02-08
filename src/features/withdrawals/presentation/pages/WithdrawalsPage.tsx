import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
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
import { Column, DynamicTable } from '@/shared/components/DynamicTable'
import { cn } from '@/shared/utils/cn'
import { formatCurrency, formatDateTime } from '@/shared/utils/date'
import { Check, Loader2, Wallet, X } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Withdrawal } from '../../domain/models'
import { useWithdrawals } from '../hooks/useWithdrawals'

const containerStyle = 'bg-[#0f171a]/40 border-white/5 backdrop-blur-md shadow-2xl'
const inputStyle = 'bg-white/[0.03] border-white/5 text-white placeholder:text-muted-foreground/40 focus:ring-primary/50 focus:border-primary/50 h-11'
const labelStyle = 'text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mb-2 block'

function userLabel(u: User): string {
  const name = u.name || u.first_name || u.email || u.employee_code || u.id
  return name
}

export default function WithdrawalsPage() {
  const { user, businessId } = useAuthStore()
  const { getUsersByBusinessId } = useAuth()
  const { getWithdrawalsByUserId, getAllWithdrawals, updateWithdrawalApproval } = useWithdrawals()

  const FILTER_ALL = '__all__'

  const businessIdForUsers = (user?.business_id || businessId) ?? ''
  const prevBusinessIdRef = useRef<string | null>(null)

  const [businessUsers, setBusinessUsers] = useState<User[]>([])
  const [isLoadingUsers, setIsLoadingUsers] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState<string>(user?.id ?? '')
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  useEffect(() => {
    if (!businessIdForUsers) {
      setBusinessUsers([])
      setSelectedUserId((prev) => (prev || FILTER_ALL) || '')
      return
    }
    if (prevBusinessIdRef.current !== businessIdForUsers) {
      prevBusinessIdRef.current = businessIdForUsers
      setBusinessUsers([])
      setSelectedUserId(FILTER_ALL)
    }
    let cancelled = false
    setIsLoadingUsers(true)
    getUsersByBusinessId(businessIdForUsers)
      .then((list) => {
        if (!cancelled) {
          setBusinessUsers(list)
          setSelectedUserId((prev) => {
            if (prev) return prev
            return user?.id ?? list[0]?.id ?? ''
          })
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoadingUsers(false)
      })
    return () => {
      cancelled = true
    }
  }, [businessIdForUsers, user?.id, getUsersByBusinessId])

  const loadWithdrawals = useCallback(async () => {
    if (!selectedUserId) {
      setWithdrawals([])
      setIsLoading(false)
      setError(null)
      return
    }
    setIsLoading(true)
    setError(null)
    try {
      const data =
        selectedUserId === FILTER_ALL
          ? await getAllWithdrawals()
          : await getWithdrawalsByUserId(selectedUserId)
      setWithdrawals(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar retiros')
      setWithdrawals([])
    } finally {
      setIsLoading(false)
    }
  }, [selectedUserId, getWithdrawalsByUserId, getAllWithdrawals])

  useEffect(() => {
    loadWithdrawals()
  }, [loadWithdrawals])

  const handleApprove = async (w: Withdrawal) => {
    if (w.is_approved) return
    setUpdatingId(w.id)
    setError(null)
    try {
      await updateWithdrawalApproval(w.id, { is_approved: true })
      setWithdrawals((prev) => prev.map((x) => (x.id === w.id ? { ...x, is_approved: true } : x)))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al aprobar')
    } finally {
      setUpdatingId(null)
    }
  }

  const handleReject = async (w: Withdrawal) => {
    if (w.is_approved) return
    setUpdatingId(w.id)
    setError(null)
    try {
      await updateWithdrawalApproval(w.id, { is_approved: false })
      setWithdrawals((prev) => prev.map((x) => (x.id === w.id ? { ...x, is_approved: false } : x)))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al rechazar')
    } finally {
      setUpdatingId(null)
    }
  }

  const columns: Column<Withdrawal>[] = [
    {
      key: 'created_at',
      header: 'Fecha Solicitud',
      className: 'font-mono text-[11px] text-muted-foreground/60',
      render: (row) => (row.created_at ? formatDateTime(row.created_at) : '-')
    },
    {
      key: 'cash_session_id',
      header: 'Responsable',
      className: 'font-bold text-info',
      render: (row) => businessUsers.find((x) => x.id === row.user_id)?.name || '-'
    },
    {
      key: 'amount',
      header: 'Monto Solicitado',
      isNumeric: true,
      render: (row) => formatCurrency(row.amount ?? 0)
    },
    {
      key: 'reason',
      header: 'Justificación',
      className: 'italic text-muted-foreground/60 max-w-[200px] truncate',
      render: (row) => row.reason || '-'
    },
    {
      key: 'is_approved',
      header: 'Estado',
      className: 'text-center',
      render: (row) => (
        <span
          className={cn(
            'px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest border transition-all duration-300',
            row.is_approved
              ? 'bg-success/10 text-success border-success/20'
              : 'bg-error/10 text-error border-error/20'
          )}
        >
          {row.is_approved ? 'Autorizado' : 'Pendiente'}
        </span>
      )
    },
    {
      key: 'actions',
      header: 'Control',
      className: 'text-right',
      render: (row) => {
        const busy = updatingId === row.id
        const approved = row.is_approved === true
        if (approved) return <span className="text-success font-bold text-[10px] uppercase">Finalizado</span>
        return (
          <div className="flex items-center justify-end gap-2">
            <Button
              type="button"
              size="sm"
              disabled={busy}
              onClick={() => handleApprove(row)}
              className="h-8 bg-success hover:bg-success/90 text-white border-0 font-bold uppercase tracking-widest text-[9px] px-3 transition-transform active:scale-95"
            >
              {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3 mr-1" />}
              {!busy && 'Autorizar'}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={busy}
              onClick={() => handleReject(row)}
              className="h-8 border-white/5 bg-white/[0.03] text-white hover:bg-white/[0.08] font-bold uppercase tracking-widest text-[9px] px-3"
            >
              {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : <X className="w-3 h-3 mr-1" />}
              {!busy && 'Denegar'}
            </Button>
          </div>
        )
      }
    }
  ]

  return (
    <div className="flex flex-col h-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white flex items-center gap-3">
            <Wallet className="w-8 h-8 text-primary" />
            Control de Egresos
          </h1>
          <p className="text-sm text-muted-foreground/60">Supervisa y valida las solicitudes de retiro de capital en tiempo real.</p>
        </div>
      </div>

      <Card className={cn('border overflow-hidden', containerStyle)}>
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
             <div className="space-y-1.5 flex-1 max-w-sm">
              <Label className={labelStyle}>Filtrar Colaborador</Label>
               {isLoadingUsers ? (
                <div className={cn(inputStyle, "flex items-center opacity-50")}>Sincronizando equipo...</div>
              ) : (
                <Select
                  value={selectedUserId || undefined}
                  onValueChange={(value) => setSelectedUserId(value)}
                  disabled={isLoadingUsers}
                >
                  <SelectTrigger className={inputStyle}>
                    <SelectValue placeholder="Seleccionar usuario" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0f171a] border-white/10 text-white">
                    <SelectItem value={FILTER_ALL} className="focus:bg-primary/20 font-bold">
                      Todos
                    </SelectItem>
                    {businessUsers.map((u) => (
                      <SelectItem key={u.id} value={u.id} className="focus:bg-primary/20">
                        {userLabel(u)} {u.id === user?.id && <span className="text-primary/40 font-bold ml-2">(Tú)</span>}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            
            <div className="flex items-center gap-6 px-6 border-l border-white/5 h-16 self-end">
              <div>
                <p className={labelStyle}>Solicitudes</p>
                <p className="text-xl font-black tabular-nums text-white">{withdrawals.length}</p>
              </div>
              <div>
                <p className={labelStyle}>Pendientes</p>
                <p className="text-xl font-black tabular-nums text-error">{withdrawals.filter(w => !w.is_approved).length}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="bg-error/10 border border-error/20 rounded-lg p-3 text-error text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
          <X className="w-4 h-4" />
          {error}
        </div>
      )}

      <div className="flex-1 min-h-0">
        <DynamicTable
          data={withdrawals}
          columns={columns}
          isLoading={isLoading}
          error={error}
          emptyMessage="No se han registrado solicitudes de egreso"
        />
      </div>
    </div>
  )
}
