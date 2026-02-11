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
import { ApiError } from '@/shared/config/api'
import { cn } from '@/shared/utils/cn'
import { formatCurrency, formatDate } from '@/shared/utils/date'
import { Banknote, Loader2, Save, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { CashSession } from '../../domain/models'
import { useCashSessions } from '../hooks/useCashSessions'

const containerStyle = 'bg-card border-border backdrop-blur-md shadow-xl'
const inputStyle = 'bg-background border-border text-foreground placeholder:text-muted-foreground focus:ring-primary/50 focus:border-primary/50 h-11'
const labelStyle = 'text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mb-2 block'

function userLabel(u: User): string {
  const name = u.name || u.first_name || u.email || u.employee_code || u.id
  return name
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
    const isDuplicateResponsableYFecha = sessions.some(
      (s) =>
        s.session_date &&
        s.session_date.slice(0, 10) === sessionDate &&
        s.user_id === selectedUserId
    )
    if (isDuplicateResponsableYFecha) {
      setError('Ya existe una sesión de caja para este responsable en esta fecha. Elige otra fecha o edita la sesión existente.')
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
      const msg = err instanceof Error ? err.message : 'Error al crear sesión'
      const is400Duplicate = err instanceof ApiError && err.status === 400
      const isDuplicateMessage =
        typeof msg === 'string' &&
        (msg.includes('cash_sessions_business_date_unique') || msg.includes('duplicate key'))
      const isDuplicate = is400Duplicate || isDuplicateMessage
      setError(
        isDuplicate
          ? 'Ya existe una sesión de caja para este responsable en esta fecha. Elige otra fecha o edita la sesión existente.'
          : msg
      )
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
      setSuccess('Sesión eliminada.')
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
      className: 'font-mono text-[11px] text-muted-foreground/60',
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
      key: 'allowed_to_withdraw',
      header: 'Retiros',
      className: 'text-center',
      render: (row) => (
        <span className={cn(
          "px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest border",
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
        if (isEditing) return <span className="text-primary font-bold text-[10px] uppercase animate-pulse">Editando</span>
        return (
          <div className="flex items-center justify-end gap-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
              onClick={() => startEdit(row)}
              disabled={!!deletingId}
            >
              <Save className="w-3.5 h-3.5" />
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
          <Banknote className="w-8 h-8 text-primary" />
          Apertura de Caja
        </h1>
        <p className="text-sm text-muted-foreground/60">Define el capital inicial para cada cobrador al iniciar la jornada.</p>
      </div>

      {(error || success) && (
        <div className={cn(
          "rounded-lg p-3 text-[10px] font-black uppercase tracking-widest border",
          error ? "bg-error/10 border-error/20 text-error" : "bg-success/10 border-success/20 text-success"
        )}>
          {error || success}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        <div className="xl:col-span-4 sticky top-0">
          <Card className={cn('border transition-all duration-500 overflow-hidden group', containerStyle)}>
            <CardHeader className="border-b border-border pb-4">
              <CardTitle className="text-sm font-bold text-foreground uppercase tracking-widest text-muted-foreground">
                Nueva Sesión
              </CardTitle>
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
                    <Label htmlFor="initial_balance" className={labelStyle}>Saldo Inicial</Label>
                    <Input
                      id="initial_balance"
                      type="number"
                      min={0}
                      step={0.01}
                      value={editingId ? editInitialBalance : initialBalance}
                      onChange={(e) => editingId ? setEditInitialBalance(e.target.value) : setInitialBalance(e.target.value)}
                      className={inputStyle}
                      placeholder="0.00"
                      required
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border">
                  <Label className="text-[10px] font-bold text-muted-foreground/60 uppercase cursor-pointer mb-0" htmlFor="withdraw_check">
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
                      <Button type="submit" disabled={isSubmitting} className="flex-1 h-11 font-bold uppercase tracking-widest text-[10px]">
                        Actualizar
                      </Button>
                      <Button type="button" variant="outline" onClick={cancelEdit} className="h-11 px-4 font-bold uppercase tracking-widest text-[10px]">
                        X
                      </Button>
                    </>
                  ) : (
                    <Button
                      type="submit"
                      disabled={isSubmitting || !selectedUserId}
                      className="w-full h-11 font-black uppercase tracking-widest text-[10px]"
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
          />
        </div>
      </div>
    </div>
  )
}
