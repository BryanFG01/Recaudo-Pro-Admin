import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Column, DynamicTable } from '@/shared/components/DynamicTable'
import { formatDate } from '@/shared/utils/date'
import { exportToExcel } from '@/shared/utils/excel'
import { Download, Plus, Trash2, X } from 'lucide-react'
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

  const baseColumns: Column<User>[] = [
    {
      key: 'email',
      header: 'Email',
      className: 'font-medium',
      render: (user) => <span className="text-gray-200">{user.email || '-'}</span>
    },
    {
      // document
      key: 'document_id',
      header: 'Número de documento',
      render: (user) => <span className="text-gray-300">{user.document_number || '-'}</span>
    },
    {
      key: 'name',
      header: 'Nombre',
      render: (user) => <span className="text-gray-200">{user.name || '-'}</span>
    },
    {
      key: 'phone',
      header: 'Teléfono',
      render: (user) => <span className="text-gray-300">{user.phone || '-'}</span>
    },
    {
      key: 'role',
      header: 'Rol',
      render: (user) => (
        <span
          className={`px-2 py-1 rounded text-xs font-medium ${
            user.role === 'admin'
              ? 'bg-purple-900/50 text-purple-200 border border-purple-700/50'
              : user.role === 'supervisor'
              ? 'bg-blue-900/50 text-blue-200 border border-blue-700/50'
              : 'bg-green-900/50 text-green-200 border border-green-700/50'
          }`}
        >
          {user.role}
        </span>
      )
    },
    {
      key: 'number',
      header: 'Código Empleado',
      render: (user) => <span className="text-gray-300">{user.number || '-'}</span>
    },
    {
      key: 'password',
      header: 'Contraseña',
      render: (user) => (
        <span className="text-gray-300 font-mono text-sm">
          {user.password ?? '-'}
        </span>
      )
    },
    {
      key: 'commission_percentage',
      header: 'Comisión %',
      render: (user) => (
        <span className="text-gray-300">
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
          <div className="flex items-center gap-2">
            <Switch
              checked={user.is_active}
              onCheckedChange={(checked) => handleToggleActive(user, checked)}
              disabled={isUpdating || deleteMode}
              aria-label={user.is_active ? 'Activo' : 'Inactivo'}
            />
            <span className="text-sm text-gray-400">{user.is_active ? 'Activo' : 'Inactivo'}</span>
          </div>
        )
      }
    },
    {
      key: 'created_at',
      header: 'Fecha Creación',
      render: (user) => <span className="text-gray-300">{formatDate(user.created_at)}</span>
    }
  ]

  const selectColumn: Column<User> = {
    key: '_select',
    header: 'Sel.',
    render: (user) => (
      <input
        type="checkbox"
        checked={selectedIds.has(user.id)}
        onChange={() => toggleSelect(user.id)}
        onClick={(e) => e.stopPropagation()}
        className="h-4 w-4 rounded border-gray-500 bg-[#2D3748] text-[#2563EB] focus:ring-[#2563EB]"
        aria-label={`Seleccionar ${user.email || user.name || user.id}`}
      />
    )
  }

  const columns: Column<User>[] = deleteMode ? [selectColumn, ...baseColumns] : baseColumns

  if (!businessId) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <p className="text-gray-400">No hay business_id disponible. Por favor, inicia sesión.</p>
        </div>
      </div>
    )
  }

  const btnClass =
    'flex items-center gap-2 min-h-[44px] border-gray-600 text-gray-300 bg-[#2D3748] hover:bg-white/10 hover:border-gray-500 hover:text-white'
  const btnPrimary = 'bg-[#2563EB] hover:bg-[#1d4ed8] text-white border-0'
  const btnDanger = 'bg-red-600 hover:bg-red-700 text-white border-0'

  return (
    <div className="flex flex-col h-full space-y-6">
      <div className="flex-shrink-0 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Administración de Usuarios</h1>
          <p className="text-sm text-gray-400 mt-1">Usuarios encontrados: {users.length}</p>
          {deleteMode && (
            <p className="text-sm text-amber-200/90 mt-1">
              Selecciona uno o más usuarios para eliminar.
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2 sm:gap-3 items-stretch sm:items-center">
          {deleteMode ? (
            <>
              <Button onClick={cancelDeleteMode} variant="outline" className={btnClass}>
                <X className="w-4 h-4 shrink-0" />
                Cancelar
              </Button>
              <Button
                onClick={handleDeleteSelected}
                disabled={selectedIds.size === 0 || isDeleting}
                className={`${btnClass} ${btnDanger}`}
              >
                <Trash2 className="w-4 h-4 shrink-0" />
                Eliminar ({selectedIds.size})
              </Button>
            </>
          ) : (
            <>
              <Button
                onClick={() => navigate('/admin/users/create')}
                className={`${btnClass} ${btnPrimary}`}
              >
                <Plus className="w-4 h-4 shrink-0" />
                Crear Usuario
              </Button>
              <Button onClick={() => setDeleteMode(true)} variant="outline" className={btnClass}>
                <Trash2 className="w-4 h-4 shrink-0" />
                Eliminar usuarios
              </Button>
              <Button
                onClick={handleExport}
                disabled={users.length === 0}
                variant="outline"
                className={btnClass}
              >
                <Download className="w-4 h-4 shrink-0" />
                Exportar Excel
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
          emptyMessage="No se encontraron usuarios para este business_id"
        />
      </div>
    </div>
  )
}
