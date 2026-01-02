import { useAuth } from '@/features/auth/presentation/hooks/useAuth'
import { useAuthStore } from '@/features/auth/presentation/store/authStore'
import { Button } from '@/components/ui/button'
import { Column, DynamicTable } from '@/shared/components/DynamicTable'
import FiltersBar, { FilterValues } from '@/shared/components/Filters/FiltersBar'
import { ClientFilters } from '@/shared/types/filters'
import { formatCurrency, formatDate } from '@/shared/utils/date'
import { exportToExcel } from '@/shared/utils/excel'
import { Download, Plus } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { ClientWithCredits } from '../../domain/models'
import { ClientService } from '../../domain/services/ClientService'
import { ClientRepository } from '../../infrastructure/repositories/ClientRepository'

export default function ClientsPage() {
  const { businessId, user } = useAuthStore()
  const { getUsersByBusinessId } = useAuth()
  const [clients, setClients] = useState<ClientWithCredits[]>([])
  const [filteredClients, setFilteredClients] = useState<ClientWithCredits[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [availableEmails, setAvailableEmails] = useState<string[]>([])
  const [filters, setFilters] = useState<FilterValues>({})

  const currentBusinessId = user?.business_id || businessId

  const clientService = useMemo(() => {
    const repository = new ClientRepository()
    return new ClientService(repository)
  }, [])

  useEffect(() => {
    if (currentBusinessId) {
      loadUsers()
      loadClients()
    }
  }, [currentBusinessId])

  useEffect(() => {
    if (currentBusinessId) {
      loadClients()
    }
  }, [filters, currentBusinessId])

  const loadUsers = async () => {
    if (!currentBusinessId) return
    try {
      const users = await getUsersByBusinessId(currentBusinessId)
      const emails = users.map((u) => u.email).filter(Boolean) as string[]
      setAvailableEmails(emails)
    } catch (err) {
      console.error('Error al cargar usuarios:', err)
    }
  }

  const loadClients = async () => {
    if (!currentBusinessId) return

    setIsLoading(true)
    setError(null)

    try {
      const clientFilters: ClientFilters = {
        businessId: currentBusinessId,
        startDate: filters.startDate,
        endDate: filters.endDate,
        userEmail: filters.userEmail || undefined,
        clientId: filters.clientId || undefined
      }

      const data = await clientService.getClientsWithFilters(clientFilters)
      setClients(data)
      setFilteredClients(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar clientes')
    } finally {
      setIsLoading(false)
    }
  }

  const handleFilterChange = (newFilters: FilterValues) => {
    setFilters(newFilters)
  }

  const handleExport = () => {
    const dataToExport = filteredClients.map((client) => ({
      'ID Cliente': client.id,
      Nombre: client.name,
      Teléfono: client.phone,
      Documento: client.document_id || 'N/A',
      Dirección: client.address || 'N/A',
      'Total Préstamos': client.total_credits,
      'Monto Total Préstamos': formatCurrency(client.total_amount),
      'Saldo Pendiente': formatCurrency(client.total_balance),
      'Email Gestor': client.user_email || 'N/A',
      'Fecha Creación': formatDate(client.created_at)
    }))
    exportToExcel(dataToExport, { filename: 'clientes_recaudopro', sheetName: 'Clientes' })
  }

  const columns: Column<ClientWithCredits>[] = [
    { key: 'name', header: 'Nombre' },
    { key: 'phone', header: 'Teléfono' },
    { key: 'document_id', header: 'Documento', render: (client) => client.document_id || '-' },
    { key: 'total_credits', header: 'Total Préstamos' },
    {
      key: 'total_amount',
      header: 'Monto Total',
      render: (client) => formatCurrency(client.total_amount)
    },
    {
      key: 'total_balance',
      header: 'Saldo Pendiente',
      render: (client) => (
        <span
          className={
            client.total_balance === 0
              ? 'text-green-600 font-semibold'
              : 'text-red-600 font-semibold'
          }
        >
          {formatCurrency(client.total_balance)}
        </span>
      )
    },
    {
      key: 'user_email',
      header: 'Email Gestor',
      render: (client) => client.user_email || 'Sin asignar'
    },
    {
      key: 'created_at',
      header: 'Fecha Creación',
      render: (client) => formatDate(client.created_at)
    }
  ]

  const availableClients = useMemo(() => {
    return clients.map((c) => ({ id: c.id, name: c.name }))
  }, [clients])

  if (!currentBusinessId) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-gray-600">No hay business_id disponible. Por favor, inicia sesión.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full space-y-6">
      <div className="flex-shrink-0 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Clientes</h1>
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleExport} disabled={filteredClients.length === 0}>
            <Download className="w-4 h-4 mr-2" />
            Exportar a Excel
          </Button>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Cliente
          </Button>
        </div>
      </div>

      <div className="flex-shrink-0">
        <FiltersBar
          onFilterChange={handleFilterChange}
          availableEmails={availableEmails}
          availableClients={availableClients}
        />
      </div>

      <div className="flex-1 min-h-0">
        <DynamicTable
          data={filteredClients}
          columns={columns}
          isLoading={isLoading}
          error={error}
          emptyMessage="No hay clientes disponibles"
        />
      </div>
    </div>
  )
}
