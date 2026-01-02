import { Button } from '@/components/ui/button'
import { useAuth } from '@/features/auth/presentation/hooks/useAuth'
import { useAuthStore } from '@/features/auth/presentation/store/authStore'
import { useClients } from '@/features/clients/presentation/hooks/useClients'
import { Column, DynamicTable } from '@/shared/components/DynamicTable'
import FiltersBar, { FilterValues } from '@/shared/components/Filters/FiltersBar'
import { CollectionFilters } from '@/shared/types/filters'
import { formatCurrency, formatDateTime } from '@/shared/utils/date'
import { exportToExcel } from '@/shared/utils/excel'
import { Download, Plus } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { CollectionWithUserEmail } from '../../domain/port'
import { CollectionService } from '../../domain/services/CollectionService'
import { CollectionRepository } from '../../infrastructure/repositories/CollectionRepository'

export default function CollectionsPage() {
  const { businessId, user } = useAuthStore()
  const { getUsersByBusinessId } = useAuth()
  const { clients } = useClients()
  const [filteredCollections, setFilteredCollections] = useState<CollectionWithUserEmail[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [availableEmails, setAvailableEmails] = useState<string[]>([])
  const [filters, setFilters] = useState<FilterValues>({})

  const currentBusinessId = user?.business_id || businessId

  const collectionService = useMemo(() => {
    const repository = new CollectionRepository()
    return new CollectionService(repository)
  }, [])

  useEffect(() => {
    if (currentBusinessId) {
      loadUsers()
      loadCollections()
    }
  }, [currentBusinessId])

  useEffect(() => {
    if (currentBusinessId) {
      loadCollections()
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

  const loadCollections = async () => {
    if (!currentBusinessId) return

    setIsLoading(true)
    setError(null)

    try {
      const collectionFilters: CollectionFilters = {
        businessId: currentBusinessId,
        startDate: filters.startDate,
        endDate: filters.endDate,
        userEmail: filters.userEmail || undefined,
        clientId: filters.clientId || undefined,
        payment_method: filters.payment_method || undefined
      }

      const data = await collectionService.getCollectionsWithFilters(collectionFilters)
      setFilteredCollections(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar recaudos')
    } finally {
      setIsLoading(false)
    }
  }

  const handleFilterChange = (newFilters: FilterValues) => {
    setFilters(newFilters)
  }

  const handleExport = () => {
    const dataToExport = filteredCollections.map((collection) => {
      const client = clients.find((c) => c.id === collection.client_id)
      return {
        'ID Recaudo': collection.id,
        Cliente: client?.name || collection.client_id,
        Monto: formatCurrency(collection.amount),
        'Fecha de Pago': formatDateTime(collection.payment_date),
        'Método de Pago': collection.payment_method || 'N/A',
        Referencia: collection.transaction_reference || 'N/A',
        'Email Vendedor': collection.user_email || 'N/A',
        Notas: collection.notes || 'N/A'
      }
    })
    exportToExcel(dataToExport, { filename: 'recaudos_recaudopro', sheetName: 'Recaudos' })
  }

  const enrichedCollections = useMemo(() => {
    return filteredCollections.map((collection) => {
      const client = clients.find((c) => c.id === collection.client_id)
      return {
        ...collection,
        clientName: client?.name || collection.client_id
      }
    })
  }, [filteredCollections, clients])

  const columns: Column<CollectionWithUserEmail & { clientName?: string }>[] = [
    {
      key: 'clientName',
      header: 'Cliente',
      render: (collection) => (
        <span className="font-medium">
          {(collection as any).clientName || collection.client_id}
        </span>
      )
    },
    {
      key: 'user_email',
      header: 'Email Vendedor',
      render: (collection) => (
        <span className="text-sm text-gray-600">{collection.user_email || 'Sin asignar'}</span>
      )
    },
    {
      key: 'amount',
      header: 'Monto',
      render: (collection) => formatCurrency(collection.amount)
    },
    {
      key: 'payment_date',
      header: 'Fecha de Pago',
      render: (collection) => formatDateTime(collection.payment_date)
    },
    {
      key: 'payment_method',
      header: 'Método de Pago',
      render: (collection) => {
        const method = collection.payment_method
        if (!method) return '-'
        return (
          <span
            className={`px-2 py-1 rounded text-xs font-medium ${
              method.toLowerCase() === 'efectivo'
                ? 'bg-green-100 text-green-800'
                : 'bg-blue-100 text-blue-800'
            }`}
          >
            {method}
          </span>
        )
      }
    },
    {
      key: 'transaction_reference',
      header: 'Referencia',
      render: (collection) => collection.transaction_reference || '-'
    },
    {
      key: 'notes',
      header: 'Notas',
      render: (collection) => (
        <span className="text-sm text-gray-600">{collection.notes || '-'}</span>
      )
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
        <h1 className="text-3xl font-bold text-gray-900">Recaudos</h1>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={handleExport}
            disabled={filteredCollections.length === 0}
          >
            <Download className="w-4 h-4 mr-2" />
            Exportar a Excel
          </Button>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Recaudo
          </Button>
        </div>
      </div>

      <div className="flex-shrink-0">
        <FiltersBar
          onFilterChange={handleFilterChange}
          availableEmails={availableEmails}
          availableClients={availableClients}
          showPaymentMethodFilter={true}
          isRecaudoPage={true}
        />
      </div>

      <div className="flex-1 min-h-0">
        <DynamicTable
          data={enrichedCollections}
          columns={columns}
          isLoading={isLoading}
          error={error}
          emptyMessage="No hay recaudos disponibles"
        />
      </div>
    </div>
  )
}
