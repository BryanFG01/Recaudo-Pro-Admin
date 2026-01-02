import { Button } from '@/components/ui/button'
import { Column, DynamicTable } from '@/shared/components/DynamicTable'
import { formatDate } from '@/shared/utils/date'
import { exportToExcel } from '@/shared/utils/excel'
import { Download, Plus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { User } from '../../domain/models'
import { useAuth } from '../hooks/useAuth'
import { useAuthStore } from '../store/authStore'

export default function AdminUsersPage() {
  const navigate = useNavigate()
  const { businessId } = useAuthStore()
  const { getUsersByBusinessId } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
      Email: user.email,
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

  const columns: Column<User>[] = [
    {
      key: 'email',
      header: 'Email',
      className: 'font-medium'
    },
    {
      key: 'name',
      header: 'Nombre',
      render: (user) => user.name || '-'
    },
    {
      key: 'phone',
      header: 'Teléfono',
      render: (user) => user.phone || '-'
    },
    {
      key: 'role',
      header: 'Rol',
      render: (user) => (
        <span
          className={`px-2 py-1 rounded text-xs font-medium ${
            user.role === 'admin'
              ? 'bg-purple-100 text-purple-800'
              : user.role === 'supervisor'
              ? 'bg-blue-100 text-blue-800'
              : 'bg-green-100 text-green-800'
          }`}
        >
          {user.role}
        </span>
      )
    },
    {
      key: 'employee_code',
      header: 'Código Empleado',
      render: (user) => user.employee_code || '-'
    },
    {
      key: 'commission_percentage',
      header: 'Comisión %',
      render: (user) =>
        user.commission_percentage !== null ? `${user.commission_percentage}%` : '-'
    },
    {
      key: 'is_active',
      header: 'Estado',
      render: (user) => (
        <span
          className={`px-2 py-1 rounded text-xs font-medium ${
            user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}
        >
          {user.is_active ? 'Activo' : 'Inactivo'}
        </span>
      )
    },
    {
      key: 'created_at',
      header: 'Fecha Creación',
      render: (user) => formatDate(user.created_at)
    }
  ]

  if (!businessId) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <p className="text-gray-600">No hay business_id disponible. Por favor, inicia sesión.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full space-y-6">
      <div className="flex-shrink-0 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Administración de Usuarios</h1>
          <p className="text-sm text-gray-500 mt-1">
            Business ID: <span className="font-mono">{businessId}</span>
          </p>
          <p className="text-sm text-gray-600 mt-2">Usuarios encontrados: {users.length}</p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={() => navigate('/admin/users/create')}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Crear Usuario
          </Button>
          <Button
            onClick={handleExport}
            disabled={users.length === 0}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Exportar a Excel
          </Button>
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
