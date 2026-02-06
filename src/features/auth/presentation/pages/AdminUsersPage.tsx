import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Column, DynamicTable } from '@/shared/components/DynamicTable'
import { cn } from '@/shared/utils/cn'
import { formatDate } from '@/shared/utils/date'
import { exportToExcel } from '@/shared/utils/excel'
import { Download, Eye, EyeOff, Plus, Trash2, X } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { User } from '../../domain/models'
import { useAuth } from '../hooks/useAuth'
import { useAuthStore } from '../store/authStore'

export default function AdminUsersPage() {
  const navigate = useNavigate()
  const { businessId } = useAuthStore()
  const { getUsersByBusinessId, deleteUser, updateUserActive } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleteMode, setDeleteMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isDeleting, setIsDeleting] = useState(false)
  const [updatingIdentifier, setUpdatingIdentifier] = useState<string | null>(null)

  useEffect(() => {
    if (businessId) {
      loadUsers()
    }
  }, [businessId])

  const loadUsers = async () => {
    if (!businessId) return

    setIsLoading(true)
    setError(null)

    try {
      const businessUsers = await getUsersByBusinessId(businessId)
      setUsers(businessUsers)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al obtener usuarios'
      setError(errorMessage)
      console.error('Error al obtener usuarios:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleExport = () => {
    const dataToExport = users.map((user) => ({
      Nombre: user.name || 'N/A',
      Teléfono: user.phone || 'N/A',
      Rol: user.role,
      'Código Empleado': user.employee_code || 'N/A',
      'Comisión %': user.commission_percentage !== null ? `${user.commission_percentage}%` : 'N/A',
      Estado: user.is_active ? 'Activo' : 'Inactivo',
      'Fecha Creación': formatDate(user.created_at)
    }))
    exportToExcel(dataToExport, { filename: 'usuarios_recaudopro', sheetName: 'Usuarios' })
  }

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const cancelDeleteMode = useCallback(() => {
    setDeleteMode(false)
    setSelectedIds(new Set())
  }, [])

  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return
    setIsDeleting(true)
    setError(null)
    try {
      for (const id of selectedIds) {
        const result = await deleteUser(id)
        if (!result.success) {
          setError(result.error ?? 'Error al eliminar usuario')
          return
        }
      }
      await loadUsers()
      setSelectedIds(new Set())
      setDeleteMode(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleToggleActive = useCallback(
    async (user: User, nextActive: boolean) => {
      if (!user.id) return
      setUpdatingIdentifier(user.id)
      setError(null)
      try {
        const result = await updateUserActive(user.id, nextActive)
        if (result.success && result.user) {
          setUsers((prev) => prev.map((u) => (u.id === result.user!.id ? result.user! : u)))
        } else {
          setError(result.error ?? 'Error al actualizar estado')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al actualizar estado')
      } finally {
        setUpdatingIdentifier(null)
      }
    },
    [updateUserActive]
  )

  const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(new Set())

  const togglePasswordVisibility = (userId: string) => {
    setVisiblePasswords((prev) => {
      const next = new Set(prev)
      if (next.has(userId)) next.delete(userId)
      else next.add(userId)
      return next
    })
  }

  const baseColumns: Column<User>[] = [
    {
      key: 'email',
      header: 'Email',
      className: 'font-bold',
      render: (user) => <span className="text-white">{user.email || '-'}</span>
    },
    {
      key: 'document_id',
      header: 'Documento',
      className: 'text-muted-foreground/60',
      render: (user) => <span className="tabular-nums">{user.document_number || '-'}</span>
    },
    {
      key: 'name',
      header: 'Nombre',
      render: (user) => <span className="text-white font-semibold">{user.name || '-'}</span>
    },
    {
      key: 'phone',
      header: 'Teléfono',
      className: 'text-muted-foreground/60 tabular-nums',
      render: (user) => user.phone || '-'
    },
    {
      key: 'role',
      header: 'Rol',
      render: (user) => (
        <span
          className={cn(
            'px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-widest border',
            user.role === 'admin'
              ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
              : user.role === 'supervisor'
              ? 'bg-info/10 text-info border-info/20'
              : 'bg-primary/10 text-primary border-primary/20'
          )}
        >
          {user.role}
        </span>
      )
    },
    {
      key: 'number',
      header: 'Personal',
      className: 'text-center',
      render: (user) => <span className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-tighter">#{user.number || '-'}</span>
    },
    {
      key: 'password',
      header: 'Acceso',
      render: (user) => {
        const isVisible = visiblePasswords.has(user.id)
        return (
          <div className="flex items-center gap-2 group">
            <span className={cn(
              "font-mono text-[11px] transition-colors",
              isVisible ? "text-primary font-bold" : "text-muted-foreground/30"
            )}>
              {user.password ? (isVisible ? user.password : '••••••••') : '-'}
            </span>
            {user.password && (
              <button
                onClick={() => togglePasswordVisibility(user.id)}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:text-white text-muted-foreground/40"
              >
                {isVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            )}
          </div>
        )
      }
    },
    {
      key: 'commission_percentage',
      header: 'Comisión',
      isNumeric: true,
      render: (user) => (
        <span className="text-success font-black tabular-nums">
          {user.commission_percentage !== null ? `${user.commission_percentage}%` : '-'}
        </span>
      )
    },

    {
      key: 'is_active',
      header: 'Estado',
      render: (user) => {
        const isUpdating = user.id != null && updatingIdentifier === user.id
        return (
          <div className="flex items-center gap-3">
            <Switch
              checked={user.is_active}
              onCheckedChange={(checked) => handleToggleActive(user, checked)}
              disabled={isUpdating || deleteMode}
              className="data-[state=checked]:bg-success"
            />
            <span className={cn(
              "text-[10px] font-black uppercase tracking-widest",
              user.is_active ? 'text-success' : 'text-muted-foreground/40'
            )}>
              {user.is_active ? 'Activo' : 'Off'}
            </span>
          </div>
        )
      }
    },
    {
      key: 'created_at',
      header: 'Alta',
      className: 'text-muted-foreground/40 text-[10px]',
      render: (user) => formatDate(user.created_at)
    }
  ]

  const selectColumn: Column<User> = {
    key: '_select',
    header: 'Sel',
    render: (user) => (
      <input
        type="checkbox"
        checked={selectedIds.has(user.id)}
        onChange={() => toggleSelect(user.id)}
        onClick={(e) => e.stopPropagation()}
        className="h-4 w-4 rounded border-white/10 bg-white/5 text-primary focus:ring-primary/50"
      />
    )
  }

  const columns: Column<User>[] = deleteMode ? [selectColumn, ...baseColumns] : baseColumns

  if (!businessId) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-muted-foreground/60 italic font-medium">Esperando identificador de negocio...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">Equipo de Trabajo</h1>
            <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/5 text-[10px] font-black text-muted-foreground/60 uppercase tabular-nums">
              {users.length}
            </span>
          </div>
          <p className="text-sm text-muted-foreground/60">Gestiona roles, permisos y porcentajes de comisión de tus colaboradores.</p>
        </div>
        <div className="flex flex-wrap gap-2 sm:gap-3">
          {deleteMode ? (
            <div className="flex items-center gap-2 p-1 rounded-xl bg-error/5 border border-error/10">
              <Button onClick={cancelDeleteMode} variant="ghost" className="h-9 px-4 text-[10px] font-bold uppercase tracking-widest text-white hover:bg-white/5">
                <X className="w-4 h-4 mr-2" />
                Cancelar
              </Button>
              <Button
                onClick={handleDeleteSelected}
                disabled={selectedIds.size === 0 || isDeleting}
                className="h-9 px-4 bg-error hover:bg-error/90 text-white font-bold text-[10px] uppercase tracking-widest"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Eliminar ({selectedIds.size})
              </Button>
            </div>
          ) : (
            <>
              <Button
                onClick={() => navigate('/admin/users/create')}
                className="h-11 px-6 bg-primary hover:bg-primary/90 text-white border-0 shadow-lg shadow-primary/20 transition-all font-bold uppercase tracking-widest text-[10px]"
              >
                <Plus className="w-4 h-4 mr-2" />
                Alta Usuario
              </Button>
              <Button 
                onClick={() => setDeleteMode(true)} 
                variant="outline" 
                className="h-11 px-6 border-white/5 bg-white/[0.03] text-white hover:bg-white/[0.08] font-bold uppercase tracking-widest text-[10px]"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Modo Borrado
              </Button>
              <Button
                onClick={handleExport}
                disabled={users.length === 0}
                variant="outline"
                className="h-11 px-6 border-white/5 bg-white/[0.03] text-white hover:bg-white/[0.08] font-bold uppercase tracking-widest text-[10px]"
              >
                <Download className="w-4 h-4 mr-2" />
                XLS
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="flex-1 min-h-0">
        <DynamicTable
          data={users}
          columns={columns}
          isLoading={isLoading}
          error={error}
          emptyMessage="No hay colaboradores registrados en este negocio"
        />
      </div>
    </div>
  )
}
