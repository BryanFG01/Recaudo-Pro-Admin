import { LoadingScreen } from '@/shared/components/LoadingScreen/LoadingScreen'
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
import { Switch } from '@/components/ui/switch'
import { User } from '@/features/auth/domain/models'
import { useAuth } from '@/features/auth/presentation/hooks/useAuth'
import { useAuthStore } from '@/features/auth/presentation/store/authStore'
import { Column, DynamicTable } from '@/shared/components/DynamicTable'
import { ConfirmDialog } from '@/shared/components/ConfirmDialog/ConfirmDialog'
import { useConfirm } from '@/shared/hooks/useConfirm'
import { cn } from '@/shared/utils/cn'
import { formatCurrency, formatDate } from '@/shared/utils/date'
import { Banknote, History, Loader2, Lock, Pencil, Plus, Unlock, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { CashSession, CashSessionEvent } from '../../domain/models'
import { canOpen, findOpenSession, lastClosingBalance, localDateISO } from '../../domain/services/cashSessionRules'
import { MoneyInput } from '@/shared/components/MoneyInput/MoneyInput'
import { CashSessionHistory } from '../components/CashSessionHistory'
import { TopUpDialog } from '../components/TopUpDialog'
import { useCashSessions } from '../hooks/useCashSessions'
import { useRefreshOnNotification } from '@/features/notifications/presentation/hooks/useRefreshOnNotification'

const containerStyle = 'bg-card border-border backdrop-blur-md shadow-xl'
const inputStyle = 'bg-background border-border text-foreground placeholder:text-muted-foreground focus:ring-primary/50 focus:border-primary/50 h-11'
const labelStyle = 'text-xs font-semibold text-muted-foreground/60 mb-2 block'

function userLabel(u: User): string {
  const name = u.name || u.first_name || u.email || u.employee_code || u.id
  return name
}

function userLabelById(users: User[], id: string): string | null {
  const u = users.find((x) => x.id === id)
  return u ? userLabel(u) : null
}

export default function CashSessionsPage() {
  const { businessId, businessCode, user } = useAuthStore()
  const { getUsersByBusinessId } = useAuth()
  const {
    createCashSession,
    updateCashSession,
    getCashSessionsByBusinessId,
    deleteCashSession,
    openCashSession,
    closeCashSession,
    getCashSessionEvents,
    topUpCashSession
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

  const [sessionDate, setSessionDate] = useState(() => localDateISO())
  const [initialBalance, setInitialBalance] = useState<string>('0')
  const [allowedToWithdraw, setAllowedToWithdraw] = useState(true)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [actingId, setActingId] = useState<string | null>(null)
  const [topUpSession, setTopUpSession] = useState<CashSession | null>(null)
  const formCardRef = useRef<HTMLDivElement>(null)
  const { confirm, dialogProps } = useConfirm()
  const [historySession, setHistorySession] = useState<CashSession | null>(null)
  const [history, setHistory] = useState<CashSessionEvent[] | null>(null)
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

  // Un cobrador abrió o cerró su caja: la tabla se actualiza sola
  useRefreshOnNotification('cash', () => void loadSessions())

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentBusinessId) {
      setError('Negocio no identificado.')
      return
    }
    if (!selectedUserId) {
      setError('Selecciona un usuario.')
      return
    }
    const amount = Number(initialBalance)
    if (Number.isNaN(amount) || amount < 0) {
      setError('Saldo inválido.')
      return
    }
    if (findOpenSession(sessions, selectedUserId)) {
      setError('Este cobrador ya tiene una caja abierta. Ciérrala antes de abrir otra.')
      return
    }

    setIsSubmitting(true)
    setError(null)
    setSuccess(null)
    const businessIdForCreate = businessId || currentBusinessId
    try {
      await createCashSession({
        business_id: businessIdForCreate,
        business_code: businessCode ?? undefined,
        user_id: selectedUserId,
        session_date: sessionDate,
        initial_balance: amount,
        allowed_to_withdraw: allowedToWithdraw
      })
      setSuccess('Sesión de caja aperturada.')
      setInitialBalance('0')
      loadSessions()
    } catch (err) {
      // La API explica el motivo (ej. "El cobrador ya tiene una caja abierta (del 2026-10-12)...")
      setError(err instanceof Error ? err.message : 'Error al crear sesión')
    } finally {
      setIsSubmitting(false)
    }
  }

  const startEdit = async (session: CashSession) => {
    setEditingId(session.id)
    // En pantallas angostas el formulario queda arriba de la tabla: llevar la vista hasta él
    formCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    setEditSessionDate((session.session_date || '').slice(0, 10))
    setEditInitialBalance(String(session.initial_balance ?? 0))
    setEditAllowedToWithdraw(session.allowed_to_withdraw ?? true)
  }

  const cancelEdit = () => {
    setEditingId(null)
  }

  const handleDelete = async (session: CashSession) => {
    const confirmed = await confirm({
      title: 'Eliminar sesión de caja',
      description: 'Se borrará la caja y sus recaudos asociados. Esta acción no se puede deshacer.',
      confirmLabel: 'Eliminar',
      destructive: true
    })
    if (!confirmed) return
    setDeletingId(session.id)
    setError(null)
    setSuccess(null)
    try {
      await deleteCashSession(session.id)
      setSuccess('Sesión eliminada.')
      setEditingId((prev) => (prev === session.id ? null : prev))
      loadSessions()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar sesión')
    } finally {
      setDeletingId(null)
    }
  }

  /** Abrir o cerrar una caja desde el panel (queda en su historial con el administrador). */
  const runSessionAction = async (session: CashSession, action: 'open' | 'close') => {
    const confirmed = await confirm(action === 'close'
      ? {
          title: 'Cerrar caja',
          description: 'La caja actual quedará guardada como caja final y no se podrán registrar más movimientos hasta volver a abrirla.',
          confirmLabel: 'Cerrar caja'
        }
      : {
          title: 'Abrir caja',
          description: 'Se abre una caja nueva con la caja final del cobrador como caja inicial. Para enviarle dinero, usa "Recargar" después de abrir.',
          confirmLabel: 'Abrir caja'
        })
    if (!confirmed) return
    setActingId(session.id)
    setError(null)
    setSuccess(null)
    try {
      if (action === 'close') await closeCashSession(session.id)
      else await openCashSession(session.user_id)
      setSuccess(action === 'close' ? 'Caja cerrada.' : 'Caja abierta.')
      await loadSessions()
      if (historySession?.id === session.id) await showHistory(session)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo completar la acción')
    } finally {
      setActingId(null)
    }
  }

  /** Recarga: el monto se suma a la caja inicial y al cobrador le llega el aviso. */
  const handleTopUp = async (amount: number) => {
    if (!topUpSession) return
    const session = topUpSession
    setActingId(session.id)
    setError(null)
    setSuccess(null)
    try {
      const updated = await topUpCashSession(session.id, amount)
      setSuccess(`Recarga enviada. Nueva caja inicial: ${formatCurrency(updated.initial_balance)}`)
      setTopUpSession(null)
      await loadSessions()
      if (historySession?.id === session.id) await showHistory(session)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo recargar la caja')
    } finally {
      setActingId(null)
    }
  }

  const showHistory = async (session: CashSession) => {
    setHistorySession(session)
    setHistory(null)
    try {
      setHistory(await getCashSessionEvents(session.id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar el historial')
      setHistory([])
    }
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingId) return
    const amount = Number(editInitialBalance)
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
      className: 'font-mono text-xs text-muted-foreground/60',
      render: (row) => formatDate(row.session_date || '')
    },
    {
      key: 'user_id',
      header: 'Responsable',
      className: 'font-bold',
      render: (row) => {
        const u = businessUsers.find((x) => x.id === row.user_id)
        const displayName = u
          ? (u.name || u.first_name || u.email || u.employee_code || '-')
          : (row.user_id || '-')
        return <span className="text-info">{displayName}</span>
      }
    },
    {
      key: 'initial_balance',
      header: 'Saldo inicial',
      isNumeric: true,
      render: (row) => formatCurrency(row.initial_balance ?? 0)
    },
    {
      key: 'status',
      header: 'Estado',
      render: (row) => row.status === 'open'
        ? <span className="px-2 py-0.5 rounded text-xs font-semibold border bg-success/10 text-success border-success/20">Abierta</span>
        : (
          <span className="text-xs text-muted-foreground">
            Cerrada · caja final <span className="font-semibold text-foreground">{formatCurrency(row.closing_balance ?? 0)}</span>
          </span>
        )
    },
    {
      key: 'allowed_to_withdraw',
      header: 'Retiros',
      className: 'text-center',
      render: (row) => (
        <span className={cn(
          "px-2 py-0.5 rounded text-xs font-semibold border",
          row.allowed_to_withdraw ? 'bg-success/10 text-success border-success/20' : 'bg-error/10 text-error border-error/20'
        )}>
          {row.allowed_to_withdraw ? 'Autorizado' : 'Bloqueado'}
        </span>
      )
    },
    {
      key: 'actions',
      header: 'Acciones',
      className: 'text-right',
      render: (row) => {
        const isEditing = editingId === row.id
        const isDeleting = deletingId === row.id
        if (isEditing) {
          return (
            <div className="flex items-center justify-end gap-2">
              <span className="text-xs font-semibold text-primary">Editando en el formulario ←</span>
              <Button type="button" variant="outline" size="sm" className="h-8 text-xs font-semibold" onClick={cancelEdit}>
                Cancelar edición
              </Button>
            </div>
          )
        }
        const isActing = actingId === row.id
        return (
          <div className="flex items-center justify-end gap-1">
            {row.status === 'open' && (
              <Button type="button" size="sm" className="h-8 text-xs font-semibold"
                disabled={isActing} onClick={() => setTopUpSession(row)}>
                <Plus className="w-3.5 h-3.5 mr-1" />Recargar
              </Button>
            )}
            {row.status === 'open' && (
              <Button type="button" variant="outline" size="sm" className="h-8 text-xs font-semibold"
                disabled={isActing} onClick={() => runSessionAction(row, 'close')}>
                {isActing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><Lock className="w-3.5 h-3.5 mr-1" />Cerrar</>}
              </Button>
            )}
            {canOpen(sessions, row) && (
              <Button type="button" variant="outline" size="sm" className="h-8 text-xs font-semibold"
                disabled={isActing} onClick={() => runSessionAction(row, 'open')}>
                {isActing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><Unlock className="w-3.5 h-3.5 mr-1" />Abrir</>}
              </Button>
            )}
            <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
              title="Historial de apertura y cierre" onClick={() => showHistory(row)}>
              <History className="w-3.5 h-3.5" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
              title="Editar sesión (fecha, saldo inicial, permiso de retiros)"
              aria-label="Editar sesión"
              onClick={() => startEdit(row)}
              disabled={!!deletingId}
            >
              <Pencil className="w-3.5 h-3.5" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-muted-foreground hover:text-error"
              onClick={() => handleDelete(row)}
              disabled={!!deletingId}
            >
              {isDeleting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Trash2 className="w-3.5 h-3.5" />
              )}
            </Button>
          </div>
        )
      }
    }
  ]

  if (!currentBusinessId || isLoadingList) {
    return <LoadingScreen message="Sincronizando Módulo de Apertura" />
  }

  return (
    <div className="flex flex-col h-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <ConfirmDialog {...dialogProps} />
      <TopUpDialog
        session={topUpSession}
        collectorName={topUpSession ? userLabelById(businessUsers, topUpSession.user_id) ?? 'el cobrador' : ''}
        isSubmitting={actingId !== null && actingId === topUpSession?.id}
        onConfirm={handleTopUp}
        onClose={() => setTopUpSession(null)}
      />
      <div className="space-y-1">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground flex items-center gap-3">
          <Banknote className="w-8 h-8 text-primary" />
          Apertura de Caja
        </h1>
        <p className="text-sm text-muted-foreground/60">Define el capital inicial para cada cobrador al iniciar la jornada.</p>
      </div>

      {(error || success) && (
        <div className={cn(
          "rounded-lg p-3 text-xs font-semibold border",
          error ? "bg-error/10 border-error/20 text-error" : "bg-success/10 border-success/20 text-success"
        )}>
          {error || success}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        <div className="xl:col-span-4 sticky top-0">
          {/* El mismo formulario sirve para crear y para editar: en edición se resalta y cambia el título */}
          <Card
            ref={formCardRef}
            className={cn('border transition-all duration-500 overflow-hidden group', containerStyle, editingId && 'ring-2 ring-primary')}
          >
            <CardHeader className="border-b border-border pb-4">
              <CardTitle className="text-sm font-bold text-foreground text-muted-foreground">
                {editingId ? 'Editar sesión' : 'Nueva Sesión'}
              </CardTitle>
              {editingId && (
                <p className="text-xs text-muted-foreground pt-1">
                  Cambia la fecha, corrige el saldo inicial o el permiso de retiros y presiona “Actualizar”.
                </p>
              )}
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={editingId ? handleUpdate : handleCreate} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="assign_user" className={labelStyle}>Responsable</Label>
                  {isLoadingUsers ? (
                    <div className={cn(inputStyle, "flex items-center opacity-50")}>Cargando...</div>
                  ) : (
                    <Select
                      value={editingId ? '' : selectedUserId}
                      onValueChange={setSelectedUserId}
                      disabled={!!editingId}
                    >
                      <SelectTrigger id="assign_user" className={inputStyle}>
                        <SelectValue placeholder="Seleccionar cobrador" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border text-popover-foreground">
                        {businessUsers.map((u) => (
                          <SelectItem key={u.id} value={u.id} className="focus:bg-primary/20">{userLabel(u)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="session_date" className={labelStyle}>Fecha</Label>
                    <Input
                      id="session_date"
                      type="date"
                      value={editingId ? editSessionDate : sessionDate}
                      onChange={(e) => editingId ? setEditSessionDate(e.target.value) : setSessionDate(e.target.value)}
                      className={inputStyle}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    {/* Al crear se SUMA a la caja final anterior; al editar se corrige el valor */}
                    <Label htmlFor="initial_balance" className={labelStyle}>
                      {editingId ? 'Saldo inicial (corregir)' : 'Monto a enviar'}
                    </Label>
                    <MoneyInput
                      id="initial_balance"
                      value={Number(editingId ? editInitialBalance : initialBalance) || 0}
                      onValueChange={(n) => (editingId ? setEditInitialBalance(String(n)) : setInitialBalance(String(n)))}
                      className={inputStyle}
                      placeholder="0"
                    />
                  </div>
                </div>
                {!editingId && selectedUserId && findOpenSession(sessions, selectedUserId) && (
                  <p className="text-xs text-warning -mt-2">
                    Este cobrador ya tiene una caja abierta. Para enviarle dinero usa “Recargar” en su caja.
                  </p>
                )}
                {!editingId && selectedUserId && !findOpenSession(sessions, selectedUserId) && (
                  <p className="text-xs text-muted-foreground -mt-2">
                    Caja inicial: {formatCurrency(lastClosingBalance(sessions, selectedUserId))} (caja final anterior)
                    {' + '}{formatCurrency(Number(initialBalance) || 0)} = {' '}
                    <span className="font-semibold text-foreground">
                      {formatCurrency(lastClosingBalance(sessions, selectedUserId) + (Number(initialBalance) || 0))}
                    </span>
                  </p>
                )}

                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border">
                  <Label className="text-xs font-bold text-muted-foreground/60 cursor-pointer mb-0" htmlFor="withdraw_check">
                    Permitir Retiros
                  </Label>
                  <Switch
                    id="withdraw_check"
                    checked={editingId ? editAllowedToWithdraw : allowedToWithdraw}
                    onCheckedChange={(checked) => editingId ? setEditAllowedToWithdraw(checked) : setAllowedToWithdraw(checked)}
                    className="data-[state=checked]:bg-success"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  {editingId ? (
                    <>
                      <Button type="submit" disabled={isSubmitting} className="flex-1 h-11 font-bold text-xs">
                        Actualizar
                      </Button>
                      <Button type="button" variant="outline" onClick={cancelEdit} className="h-11 px-4 font-bold text-xs">
                        Cancelar
                      </Button>
                    </>
                  ) : (
                    <Button
                      type="submit"
                      disabled={isSubmitting || !selectedUserId}
                      className="w-full h-11 font-semibold text-xs"
                    >
                      {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Abrir Caja'}
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="xl:col-span-8">
          <DynamicTable
            data={sessions}
            columns={columns}
            isLoading={isLoadingList}
            error={error}
            emptyMessage="No se registran sesiones de caja activas"
            variant="premium-dark"
            className="rounded-3xl"
          />
          {historySession && (
            <CashSessionHistory
              session={historySession}
              events={history}
              userName={(id) => userLabelById(businessUsers, id)}
              onClose={() => setHistorySession(null)}
            />
          )}
        </div>
      </div>
    </div>
  )
}
