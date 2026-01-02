import { useState, useEffect, useMemo } from 'react'
import { DynamicTable, Column } from '@/shared/components/DynamicTable'
import { ClientWithCredits } from '../../domain/models'
import { ClientService } from '../../domain/services/ClientService'
import { ClientRepository } from '../../infrastructure/repositories/ClientRepository'
import { useAuthStore } from '@/features/auth/presentation/store/authStore'
import { exportToExcel } from '@/shared/utils/excel'
import { Button } from '@/components/ui/button'
import { Download, Filter } from 'lucide-react'

export default function AdminClientsPage() {
  const { user, businessId } = useAuthStore()
  const [clients, setClients] = useState<ClientWithCredits[]>([])
  const [filteredClients, setFilteredClients] = useState<ClientWithCredits[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedEmail, setSelectedEmail] = useState<string>('')
  const [availableEmails, setAvailableEmails] = useState<string[]>([])

  const currentBusinessId = user?.business_id || businessId

  const clientService = useMemo(() => {
    const repository = new ClientRepository()
    return new ClientService(repository)
  }, [])

  useEffect(() => {
    if (currentBusinessId) {
      loadClients()
    }
  }, [currentBusinessId])

  useEffect(() => {
    if (selectedEmail) {
      setFilteredClients(clients.filter(c => c.user_email === selectedEmail))
    } else {
      setFilteredClients(clients)
    }
  }, [selectedEmail, clients])

  const loadClients = async () => {
    if (!currentBusinessId) return

    setIsLoading(true)
    setError(null)

    try {
      const data = await clientService.getClientsWithCredits(currentBusinessId)
      setClients(data)
      
      // Extraer emails únicos para el filtro
      const emails = [...new Set(data.map(c => c.user_email).filter(Boolean))] as string[]
      setAvailableEmails(emails)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar clientes')
    } finally {
      setIsLoading(false)
    }
  }

  const handleExport = () => {
    const exportData = filteredClients.map(client => ({
      'Nombre': client.name,
      'Teléfono': client.phone,
      'Total Préstamos': client.total_credits,
      'Monto Total': client.total_amount,
      'Cuanto Debe': client.total_balance,
      'Email Gestor': client.user_email || 'N/A',
      'Documento': client.document_id || 'N/A',
    }))

    exportToExcel(exportData, {
      filename: `clientes_${new Date().toISOString().split('T')[0]}`,
      sheetName: 'Clientes',
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const columns: Column<ClientWithCredits>[] = [
    {
      key: 'name',
      header: 'Nombre',
      className: 'font-medium',
    },
    {
      key: 'phone',
      header: 'Teléfono',
    },
    {
      key: 'total_credits',
      header: 'Total Préstamos',
      render: (client) => (
        <span className="font-semibold">{client.total_credits}</span>
      ),
    },
    {
      key: 'total_amount',
      header: 'Monto Total',
      render: (client) => formatCurrency(client.total_amount),
    },
    {
      key: 'total_balance',
      header: 'Cuanto Debe',
      render: (client) => {
        const balance = client.total_balance
        return (
          <span className={balance > 0 ? 'text-red-600 font-semibold' : 'text-green-600 font-semibold'}>
            {formatCurrency(balance)}
          </span>
        )
      },
    },
    {
      key: 'user_email',
      header: 'Email Gestor',
      render: (client) => (
        <span className="text-sm text-gray-600">{client.user_email || 'N/A'}</span>
      ),
    },
  ]

  if (!user?.business_id) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No tienes un negocio asignado</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Administración de Clientes</h1>
        <Button
          onClick={handleExport}
          disabled={filteredClients.length === 0}
          className="flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          Exportar a Excel
        </Button>
      </div>

      <div className="flex gap-4 items-end">
        <div className="flex-1">
          <label htmlFor="emailFilter" className="block text-sm font-medium text-gray-700 mb-2">
            Filtrar por Email
          </label>
          <div className="relative">
            <Filter className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
            <select
              id="emailFilter"
              value={selectedEmail}
              onChange={(e) => setSelectedEmail(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Todos los emails</option>
              {availableEmails.map(email => (
                <option key={email} value={email}>{email}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="text-sm text-gray-600">
          Mostrando {filteredClients.length} de {clients.length} clientes
        </div>
      </div>

      <DynamicTable
        data={filteredClients}
        columns={columns}
        isLoading={isLoading}
        error={error}
        emptyMessage="No hay clientes disponibles"
      />
    </div>
  )
}

