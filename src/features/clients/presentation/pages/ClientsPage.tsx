import { Button } from '@/components/ui/button'
import { User } from '@/features/auth/domain/models'
import { useAuth } from '@/features/auth/presentation/hooks/useAuth'
import { useAuthStore } from '@/features/auth/presentation/store/authStore'
import { CreditRepository } from '@/features/credits/infrastructure/repositories/CreditRepository'
import { Column, DynamicTable } from '@/shared/components/DynamicTable'
import FiltersBar, { FilterValues } from '@/shared/components/Filters/FiltersBar'
import { ClientFilters } from '@/shared/types/filters'
import { formatCurrency, formatDate } from '@/shared/utils/date'
import { exportToExcel } from '@/shared/utils/excel'
import { Download } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { ClientWithCredits } from '../../domain/models'
import { ClientService } from '../../domain/services/ClientService'
import { ClientRepository } from '../../infrastructure/repositories/ClientRepository'

export default function ClientsPage() {
  const { businessId, businessCode, user } = useAuthStore()
  const { getUsersByBusinessId } = useAuth()
  const [clients, setClients] = useState<ClientWithCredits[]>([])
  const [filteredClients, setFilteredClients] = useState<ClientWithCredits[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [availableEmails, setAvailableEmails] = useState<string[]>([])
  const [usersList, setUsersList] = useState<User[]>([])
  const [filters, setFilters] = useState<FilterValues>({ userId: undefined })

  const currentBusinessId = user?.business_id || businessId

  const clientService = useMemo(() => {
    const repository = new ClientRepository()
    return new ClientService(repository)
  }, [])

  const creditRepository = useMemo(() => new CreditRepository(), [])

  useEffect(() => {
    if (currentBusinessId && user?.id) {
      loadUsers()
      loadClients()
    }
  }, [currentBusinessId, user?.id])

  useEffect(() => {
    if (currentBusinessId && user?.id) {
      loadClients()
    }
  }, [filters, currentBusinessId, user?.id])

  const loadUsers = async () => {
    if (!currentBusinessId) return
    try {
      const users = await getUsersByBusinessId(currentBusinessId)
      setUsersList(users)
      const emails = users.map((u) => u.email).filter(Boolean) as string[]
      setAvailableEmails(emails)
    } catch (err) {
      console.error('Error al cargar usuarios:', err)
    }
  }

  /** Mapa user_id -> nombre del usuario asignado al cliente (para columna "Asignado a"). */
  const userNameById = useMemo(() => {
    const map: Record<string, string> = {}
    usersList.forEach((u) => {
      if (u.id) map[u.id] = u.name?.trim() || u.email || 'Sin nombre'
    })
    return map
  }, [usersList])

  const loadClients = async () => {
    if (!currentBusinessId || !user?.id) return

    setIsLoading(true)
    setError(null)

    try {
      // "__all__" y vacíos se tratan como "Todos" (sin filtro)
      const hasVal = (v: string | undefined) =>
        v != null && v !== '__all__' && String(v).trim() !== ''
      const clientFilters: ClientFilters = {
        businessId: currentBusinessId,
        businessCode: businessCode || undefined,
        userId: user.id,
        userNumber: user?.number ?? undefined,
        startDate: hasVal(filters.startDate) ? filters.startDate : undefined,
        endDate: hasVal(filters.endDate) ? filters.endDate : undefined,
        userEmail: hasVal(filters.userEmail) ? filters.userEmail : undefined,
        clientId: hasVal(filters.clientId) ? filters.clientId : undefined
      }

      const [clientsFromApi, credits] = await Promise.all([
        clientService.getClientsWithFilters(clientFilters),
        creditRepository.getCreditsByBusinessId(currentBusinessId)
      ])

      // Enriquecer cada cliente con totales de sus créditos (total préstamos, monto total, saldo pendiente)
      const enriched: ClientWithCredits[] = clientsFromApi.map((client) => {
        const clientCredits = credits.filter((c) => c.client_id === client.id)
        const total_amount = clientCredits.reduce((s, c) => s + (c.total_amount ?? 0), 0)
        const total_balance = clientCredits.reduce((s, c) => s + (c.total_balance ?? 0), 0)
        return {
          ...client,
          total_credits: clientCredits.length,
          total_amount,
          total_balance
        }
      })

      setClients(enriched)
      setFilteredClients(enriched)
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
      'Asignado a': client.user_id
        ? (userNameById[client.user_id] ?? client.user_email ?? 'N/A')
        : client.user_email || 'N/A',
      Documento: client.document_id || 'N/A',
      Dirección: client.address || 'N/A',
      'Total Préstamos': client.total_credits,
      'Monto Total Préstamos': formatCurrency(client.total_amount),
      'Saldo Pendiente': formatCurrency(client.total_balance),
      'Fecha Creación': formatDate(client.created_at)
    }))
    exportToExcel(dataToExport, { filename: 'clientes_recaudopro', sheetName: 'Clientes' })
  }

  const columns: Column<ClientWithCredits>[] = [
    { key: 'name', header: 'Nombre' },
    { key: 'phone', header: 'Teléfono' },
    {
      key: 'user_id',
      header: 'Asignado a',
      render: (client) => (
        <span className="text-sm text-gray-200 font-medium">
          {client.user_id
            ? (userNameById[client.user_id] ?? client.user_email ?? 'Sin asignar')
            : client.user_email || 'Sin asignar'}
        </span>
      )
    },
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
              ? 'text-green-300 font-semibold'
              : 'text-red-300 font-semibold'
          }
        >
          {formatCurrency(client.total_balance)}
        </span>
      )
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

  if (!currentBusinessId || !user?.id) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-gray-400">
          {!user?.id
            ? 'No hay sesión de usuario. Por favor, inicia sesión.'
            : 'No hay business_id disponible. Por favor, inicia sesión.'}
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full space-y-6">
      <div className="flex-shrink-0 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Clientes</h1>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={handleExport}
            disabled={filteredClients.length === 0}
            className="border-gray-600 text-gray-300 bg-[#2D3748] hover:bg-white/10 hover:border-gray-500 hover:text-white"
            aria-label="Exportar clientes a Excel"
          >
            <Download className="w-4 h-4 mr-2" aria-hidden="true" />
            Exportar a Excel
          </Button>
          {/* <Button
            className="bg-[#2563EB] hover:bg-[#1d4ed8] text-white border-0"
            aria-label="Crear nuevo cliente"
          >
            <Plus className="w-4 h-4 mr-2" aria-hidden="true" />
            Nuevo Cliente
          </Button> */}
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
