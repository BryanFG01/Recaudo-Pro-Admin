import { Button } from '@/components/ui/button'
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

function userLabel(u: User): string {
  const name = u.name || u.first_name || u.email || u.employee_code || u.id
  const extra = u.email && name !== u.email ? ` (${u.email})` : ''
  return `${name}${extra}`
}

export default function WithdrawalsPage() {
  const { user, businessId } = useAuthStore()
  const { getUsersByBusinessId } = useAuth()
  const { getWithdrawalsByUserId, updateWithdrawalApproval } = useWithdrawals()

  const businessIdForUsers = (user?.business_id || businessId) ?? ''
  const prevBusinessIdRef = useRef<string | null>(null)

  const [businessUsers, setBusinessUsers] = useState<User[]>([])
  const [isLoadingUsers, setIsLoadingUsers] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState<string>(user?.id ?? '')
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  // Cargar usuarios del negocio y sincronizar selectedUserId con el usuario actual
  useEffect(() => {
    if (!businessIdForUsers) {
      setBusinessUsers([])
      setSelectedUserId((prev) => (prev || user?.id) ?? '')
      return
    }
    if (prevBusinessIdRef.current !== businessIdForUsers) {
      prevBusinessIdRef.current = businessIdForUsers
      setBusinessUsers([])
      setSelectedUserId(user?.id ?? '')
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
      const data = await getWithdrawalsByUserId(selectedUserId)
      setWithdrawals(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar retiros')
      setWithdrawals([])
    } finally {
      setIsLoading(false)
    }
  }, [selectedUserId, getWithdrawalsByUserId])

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
      key: 'cash_session_id',
      header: 'Sesión de caja',
      render: (row) => (
        <span className="text-gray-300 font-mono text-xs truncate max-w-[120px] block">
          {/* mostrar el nombre  */}
          {businessUsers.find((x) => x.id === row.user_id)?.name || '-'}
        </span>
      )
    },
    {
      key: 'amount',
      header: 'Monto',
      render: (row) => (
        <span className="font-semibold text-white">{formatCurrency(row.amount ?? 0)}</span>
      )
    },
    {
      key: 'reason',
      header: 'Motivo',
      render: (row) => <span className="text-gray-300">{row.reason || '-'}</span>
    },
    {
      key: 'is_approved',
      header: 'Estado',
      render: (row) => (
        <span
          className={cn(
            'px-2 py-1 rounded text-xs font-medium',
            row.is_approved
              ? 'bg-green-900/50 text-green-300 border border-green-700/50'
              : 'bg-amber-900/50 text-amber-300 border border-amber-700/50'
          )}
        >
          {row.is_approved ? 'Aprobado' : 'Pendiente'}
        </span>
      )
    },
    {
      key: 'created_at',
      header: 'Fecha',
      render: (row) => (
        <span className="text-gray-400 text-sm">
          {row.created_at ? formatDateTime(row.created_at) : '-'}
        </span>
      )
    },
    {
      key: 'actions',
      header: 'Acciones',
      render: (row) => {
        const busy = updatingId === row.id
        const approved = row.is_approved === true
        return (
          <div className="flex flex-wrap items-center gap-2">
            {!approved && (
              <Button
                type="button"
                size="sm"
                disabled={busy}
                onClick={() => handleApprove(row)}
                className="bg-green-600 hover:bg-green-700 text-white border-0 min-h-[36px]"
                aria-label="Aprobar"
              >
                {busy ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-1 shrink-0" />
                    Aprobar
                  </>
                )}
              </Button>
            )}
            {!approved && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={busy}
                onClick={() => handleReject(row)}
                className="min-h-[36px] border-red-600 text-red-300 hover:bg-red-900/30"
                aria-label="Rechazar"
              >
                {busy ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <X className="w-4 h-4 mr-1 shrink-0" />
                    Rechazar
                  </>
                )}
              </Button>
            )}
            {approved && (
              <span className="text-green-400 text-sm">Aprobado</span>
            )}
          </div>
        )
      }
    }
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-2">
          <Wallet className="w-8 h-8 text-[#2563EB]" />
          Retiros
        </h1>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-700/50 rounded-lg p-3 text-red-200 text-sm">
          {error}
        </div>
      )}

      <p className="text-gray-400 text-sm">
        Retiros del usuario. Aprobar o rechazar cada solicitud.
      </p>

      {!businessIdForUsers && !isLoading && (
        <p className="text-amber-200/90 text-sm bg-amber-900/20 border border-amber-700/40 rounded-lg p-3">
          Inicia sesión para ver los retiros.
        </p>
      )}

      {businessIdForUsers && (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
          <label className="text-sm font-medium text-gray-300 shrink-0">Usuario:</label>
          {isLoadingUsers ? (
            <span className="text-gray-400 text-sm flex items-center gap-1">
              <Loader2 className="w-4 h-4 animate-spin" />
              Cargando usuarios…
            </span>
          ) : businessUsers.length === 0 ? (
            <span className="text-amber-300 text-sm">No hay usuarios del negocio.</span>
          ) : (
            <Select
              value={selectedUserId || undefined}
              onValueChange={(value) => setSelectedUserId(value)}
              disabled={isLoadingUsers}
            >
              <SelectTrigger className="w-full sm:w-[280px] bg-[#0f171a] border-gray-600 text-white">
                <SelectValue placeholder="Elegir usuario" />
              </SelectTrigger>
              <SelectContent className="bg-[#0f171a] border-gray-600">
                {businessUsers.map((u) => (
                  <SelectItem
                    key={u.id}
                    value={u.id}
                    className="text-gray-200 data-[highlighted]:bg-[#2563EB]/40"
                  >
                    {userLabel(u)}
                    {u.id === user?.id && <span className="ml-1 text-gray-500 text-xs">(tú)</span>}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      )}

      {selectedUserId && !isLoading && withdrawals.length === 0 && !error && (
        <p className="text-amber-200/90 text-sm bg-amber-900/20 border border-amber-700/40 rounded-lg p-3">
          No hay retiros para este usuario{' '}
          {userLabel(businessUsers.find((x) => x.id === selectedUserId) ?? user ?? ({} as User))}.
        </p>
      )}

      <DynamicTable
        data={withdrawals}
        columns={columns}
        isLoading={isLoading}
        error={error}
        emptyMessage="No hay retiros para mostrar"
      />
    </div>
  )
}
