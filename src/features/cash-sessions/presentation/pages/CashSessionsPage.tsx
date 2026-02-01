import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Column, DynamicTable } from '@/shared/components/DynamicTable'
import { useAuthStore } from '@/features/auth/presentation/store/authStore'
import { User } from '@/features/auth/domain/models'
import { useAuth } from '@/features/auth/presentation/hooks/useAuth'
import { formatCurrency, formatDate } from '@/shared/utils/date'
import { cn } from '@/shared/utils/cn'
import { Banknote, Loader2, Save, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { CashSession } from '../../domain/models'
import { useCashSessions } from '../hooks/useCashSessions'

const cardDark = 'bg-[#0f171a] border-gray-600 text-gray-200'
const inputDark =
  'bg-[#0f171a] border-gray-600 text-white placeholder:text-gray-400 focus-visible:ring-2 focus-visible:ring-[#2563EB]'
const selectContentDark = 'bg-[#0f171a] border-gray-600 text-gray-200'
const selectItemDark = 'data-[highlighted]:bg-[#2563EB]/40 text-blue-200'

function userLabel(u: User): string {
  const name = u.name || u.first_name || u.email || u.employee_code || u.id
  const extra = u.email && name !== u.email ? ` (${u.email})` : ''
  return `${name}${extra}`
}

export default function CashSessionsPage() {
  const { businessId, businessCode, user } = useAuthStore()
  const { getUsersByBusinessId } = useAuth()
  const {
    createCashSession,
    updateCashSession,
    getCashSessionsByBusinessId,
    deleteCashSession
  } = useCashSessions()

  const currentBusinessId = user?.business_id || businessId
  const currentUserId = user?.id ?? ''
  const prevBusinessIdRef = useRef<string | null>(null)

  const [sessions, setSessions] = useState<CashSession[]>([])
  const [businessUsers, setBusinessUsers] = useState<User[]>([])
  const [isLoadingUsers, setIsLoadingUsers] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState<string>('')
  const [isLoadingList, setIsLoadingList] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [sessionDate, setSessionDate] = useState(() =>
    new Date().toISOString().slice(0, 10)
  )
  const [initialBalance, setInitialBalance] = useState<string>('0')
  const [allowedToWithdraw, setAllowedToWithdraw] = useState(true)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [editSessionDate, setEditSessionDate] = useState('')
  const [editInitialBalance, setEditInitialBalance] = useState('')
  const [editAllowedToWithdraw, setEditAllowedToWithdraw] = useState(true)

  const loadSessions = useCallback(async () => {
    if (!currentBusinessId) return
    setIsLoadingList(true)
    setError(null)
    try {
      const data = await getCashSessionsByBusinessId(currentBusinessId)
      setSessions(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar sesiones')
    } finally {
      setIsLoadingList(false)
    }
  }, [currentBusinessId, getCashSessionsByBusinessId])

  const loadUsers = useCallback(async () => {
    if (!currentBusinessId) return
    setIsLoadingUsers(true)
    setError(null)
    try {
      const list = await getUsersByBusinessId(currentBusinessId)
      setBusinessUsers(Array.isArray(list) ? list : [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar usuarios')
    } finally {
      setIsLoadingUsers(false)
    }
  }, [currentBusinessId, getUsersByBusinessId])

  // Al cambiar de negocio, limpiar lista y selección para no mostrar datos del negocio anterior
  useEffect(() => {
    if (currentBusinessId !== prevBusinessIdRef.current) {
      prevBusinessIdRef.current = currentBusinessId
      setBusinessUsers([])
      setSelectedUserId('')
    }
  }, [currentBusinessId])

  useEffect(() => {
    if (currentBusinessId) loadUsers()
  }, [currentBusinessId, loadUsers])

  // Valor por defecto del selector cuando hay lista; si la selección ya no está en la lista, corregir
  useEffect(() => {
    if (businessUsers.length === 0) return
    const firstId = businessUsers[0]?.id ?? ''
    const selectedStillValid = selectedUserId && businessUsers.some((u) => u.id === selectedUserId)
    if (selectedStillValid) return
    const inList = businessUsers.some((u) => u.id === currentUserId)
    setSelectedUserId(inList ? currentUserId : firstId)
  }, [businessUsers, currentUserId, selectedUserId])

  useEffect(() => {
    if (currentBusinessId) loadSessions()
  }, [currentBusinessId, loadSessions])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentBusinessId) {
      setError('Falta el negocio (business_id). Inicia sesión con un negocio.')
      return
    }
    if (!selectedUserId) {
      setError('Selecciona el usuario al que se asignará el saldo inicial (user_id).')
      return
    }
    const amount = Number(initialBalance)
    if (Number.isNaN(amount) || amount < 0) {
      setError('Saldo inicial debe ser un número mayor o igual a 0.')
      return
    }
    setIsSubmitting(true)
    setError(null)
    setSuccess(null)
    // Backend espera business_id (UUID) y opcionalmente business_code (ej. ARG01)
    const businessIdForCreate = businessId || currentBusinessId
    if (!businessIdForCreate) {
      setError('No hay negocio seleccionado. Iniciá sesión con un código de negocio.')
      setIsSubmitting(false)
      return
    }
    try {
      await createCashSession({
        business_id: businessIdForCreate,
        business_code: businessCode ?? undefined,
        user_id: selectedUserId,
        session_date: sessionDate,
        initial_balance: amount,
        allowed_to_withdraw: allowedToWithdraw
      })
      setSuccess('Sesión de caja creada correctamente.')
      setInitialBalance('0')
      loadSessions()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear sesión')
    } finally {
      setIsSubmitting(false)
    }
  }

  const startEdit = async (session: CashSession) => {
    setEditingId(session.id)
    setEditSessionDate((session.session_date || '').slice(0, 10))
    setEditInitialBalance(String(session.initial_balance ?? 0))
    setEditAllowedToWithdraw(session.allowed_to_withdraw ?? true)
  }

  const cancelEdit = () => {
    setEditingId(null)
  }

  const handleDelete = async (session: CashSession) => {
    if (!window.confirm('¿Eliminar esta sesión de caja?')) return
    setDeletingId(session.id)
    setError(null)
    setSuccess(null)
    try {
      await deleteCashSession(session.id)
      setSuccess('Sesión de caja eliminada.')
      setEditingId((prev) => (prev === session.id ? null : prev))
      loadSessions()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar sesión')
    } finally {
      setDeletingId(null)
    }
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingId) return
    const amount = Number(editInitialBalance)
    if (Number.isNaN(amount) || amount < 0) {
      setError('Saldo inicial debe ser un número mayor o igual a 0.')
      return
    }
    setIsSubmitting(true)
    setError(null)
    setSuccess(null)
    try {
      await updateCashSession(editingId, {
        session_date: editSessionDate,
        initial_balance: amount,
        allowed_to_withdraw: editAllowedToWithdraw
      })
      setSuccess('Sesión actualizada.')
      setEditingId(null)
      loadSessions()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar')
    } finally {
      setIsSubmitting(false)
    }
  }

  const columns: Column<CashSession>[] = [
    {
      key: 'session_date',
      header: 'Fecha',
      render: (row) => formatDate(row.session_date || '')
    },
    {
      key: 'user_id',
      header: 'A nombre de',
      render: (row) => {
        const u = businessUsers.find((x) => x.id === row.user_id)
        const displayName = u
          ? (u.name || u.first_name || u.email || u.employee_code || '-')
          : (row.user_id || '-')
        return <span className="text-gray-300">{displayName}</span>
      }
    },
    {
      key: 'initial_balance',
      header: 'Saldo inicial',
      render: (row) => formatCurrency(row.initial_balance ?? 0)
    },
    {
      key: 'allowed_to_withdraw',
      header: 'Permitir retiros',
      render: (row) => (row.allowed_to_withdraw ? 'Sí' : 'No')
    },
    {
      key: 'actions',
      header: 'Acciones',
      render: (row) => {
        const isEditing = editingId === row.id
        const isDeleting = deletingId === row.id
        if (isEditing) return <span className="text-gray-400 text-sm">Editando...</span>
        return (
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-[#2563EB] hover:bg-[#2563EB]/20"
              onClick={() => startEdit(row)}
              disabled={!!deletingId}
            >
              Editar
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-red-400 hover:bg-red-500/20 hover:text-red-300"
              onClick={() => handleDelete(row)}
              disabled={!!deletingId}
              aria-label="Eliminar sesión"
            >
              {isDeleting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
            </Button>
          </div>
        )
      }
    }
  ]

  if (!currentBusinessId) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-gray-400">No hay business_id disponible. Inicia sesión.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-2">
        <Banknote className="w-8 h-8 text-[#2563EB]" />
        Saldo inicial (Sesión de caja)
      </h1>

      {error && (
        <div className="bg-red-900/30 border border-red-700/50 rounded-lg p-3 text-red-200 text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-900/30 border border-green-700/50 rounded-lg p-3 text-green-200 text-sm">
          {success}
        </div>
      )}

      <Card className={cn('mb-6', cardDark)}>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-white">
            Crear nueva sesión de caja
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2 md:col-span-2 min-h-[72px]">
              <Label htmlFor="assign_user" className="text-gray-200 block">
                Asignar saldo inicial a (user_id)
              </Label>
              {isLoadingUsers ? (
                <div className={cn(inputDark, 'min-h-[40px] rounded-md border flex items-center px-3 text-gray-400 text-sm')}>
                  Cargando usuarios…
                </div>
              ) : businessUsers.length === 0 && currentBusinessId ? (
                <p className="text-amber-200/90 text-xs bg-amber-900/20 border border-amber-700/40 rounded-lg p-3">
                  No hay usuarios del negocio. Revisa que el backend exponga /api/users/business/{'{businessId}'}.
                </p>
              ) : businessUsers.length > 0 && selectedUserId ? (
                <Select
                  value={selectedUserId}
                  onValueChange={setSelectedUserId}
                  disabled={false}
                >
                  <SelectTrigger id="assign_user" className={cn(inputDark, 'min-h-[40px]')}>
                    <SelectValue placeholder="Selecciona un usuario" />
                  </SelectTrigger>
                  <SelectContent className={selectContentDark}>
                    {businessUsers.map((u) => (
                      <SelectItem key={u.id} value={u.id} className={selectItemDark}>
                        {userLabel(u)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className={cn(inputDark, 'min-h-[40px] rounded-md border flex items-center px-3 text-gray-400 text-sm')}>
                  Preparando…
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="session_date" className="text-gray-200">
                Fecha de sesión
              </Label>
              <Input
                id="session_date"
                type="date"
                value={sessionDate}
                onChange={(e) => setSessionDate(e.target.value)}
                className={inputDark}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="initial_balance" className="text-gray-200">
                Saldo inicial
              </Label>
              <Input
                id="initial_balance"
                type="number"
                min={0}
                step={0.01}
                value={initialBalance}
                onChange={(e) => setInitialBalance(e.target.value)}
                className={inputDark}
                placeholder="0"
                required
              />
            </div>
            <div className="space-y-2 flex flex-col justify-end">
              <Label className="text-gray-200 flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={allowedToWithdraw}
                  onChange={(e) => setAllowedToWithdraw(e.target.checked)}
                  className="rounded border-gray-600 bg-[#0f171a] text-[#2563EB] focus:ring-[#2563EB]"
                />
                Permitir retiros
              </Label>
            </div>
            <div className="flex items-end">
              <Button
                type="submit"
                disabled={isSubmitting || !selectedUserId}
                className="bg-[#2563EB] hover:bg-[#1d4ed8] text-white min-h-[44px] disabled:opacity-50"
                title={!selectedUserId ? 'Selecciona el usuario al que se asignará el saldo inicial' : undefined}
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Crear sesión
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {editingId && (
        <Card className={cn('mb-6 border-[#2563EB]/50', cardDark)}>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-white">
              Editar sesión
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdate} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-200">Fecha</Label>
                <Input
                  type="date"
                  value={editSessionDate}
                  onChange={(e) => setEditSessionDate(e.target.value)}
                  className={inputDark}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-200">Saldo inicial</Label>
                <Input
                  type="number"
                  min={0}
                  step={0.01}
                  value={editInitialBalance}
                  onChange={(e) => setEditInitialBalance(e.target.value)}
                  className={inputDark}
                />
              </div>
              <div className="space-y-2 flex flex-col justify-end">
                <Label className="text-gray-200 flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editAllowedToWithdraw}
                    onChange={(e) => setEditAllowedToWithdraw(e.target.checked)}
                    className="rounded border-gray-600 bg-[#0f171a] text-[#2563EB] focus:ring-[#2563EB]"
                  />
                  Permitir retiros
                </Label>
              </div>
              <div className="flex items-end gap-2">
                <Button type="submit" disabled={isSubmitting} className="bg-[#2563EB] hover:bg-[#1d4ed8] text-white min-h-[44px]">
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Guardar'}
                </Button>
                <Button type="button" variant="outline" onClick={cancelEdit} className="border-gray-600 text-gray-300 min-h-[44px]">
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card className={cn(cardDark)}>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-white">
            Sesiones de caja
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!isLoadingList && sessions.length === 0 && !error && (
            <p className="text-amber-200/90 text-sm mb-3 bg-amber-900/20 border border-amber-700/40 rounded-lg p-3">
              No hay sesiones. Si el backend no tiene la ruta <code className="text-xs bg-black/30 px-1 rounded">/api/cash-sessions</code> aún, la lista estará vacía.
            </p>
          )}
          <DynamicTable
            data={sessions}
            columns={columns}
            isLoading={isLoadingList}
            error={error}
            emptyMessage="No hay sesiones de caja"
          />
        </CardContent>
      </Card>
    </div>
  )
}
