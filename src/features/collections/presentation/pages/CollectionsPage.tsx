import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/features/auth/presentation/store/authStore'
import { Client } from '@/features/clients/domain/models'
import { ClientRepository } from '@/features/clients/infrastructure/repositories/ClientRepository'
import { Column, DynamicTable } from '@/shared/components/DynamicTable'
import FiltersBar, { FilterValues } from '@/shared/components/Filters/FiltersBar'
import { CollectionFilters } from '@/shared/types/filters'
import { formatCurrency, formatDateTime } from '@/shared/utils/date'
import { exportToExcel } from '@/shared/utils/excel'
import { Download } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { CollectionWithUserEmail } from '../../domain/port'
import { CollectionService } from '../../domain/services/CollectionService'
import { CollectionRepository } from '../../infrastructure/repositories/CollectionRepository'

export default function CollectionsPage() {
  const { businessId, businessCode, user } = useAuthStore()
  const [filteredCollections, setFilteredCollections] = useState<CollectionWithUserEmail[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [clientsList, setClientsList] = useState<Client[]>([])
  const [filters, setFilters] = useState<FilterValues>({
    userId: undefined,
    startDate: undefined,
    endDate: undefined,
    clientId: undefined,
    payment_method: undefined
  })

  const currentBusinessId = user?.business_id || businessId

  const collectionService = useMemo(() => {
    const repository = new CollectionRepository()
    return new CollectionService(repository)
  }, [])

  useEffect(() => {
    if (currentBusinessId) {
      loadClients()
      loadCollections()
    }
  }, [currentBusinessId])

  useEffect(() => {
    if (currentBusinessId) {
      loadCollections()
    }
  }, [filters, currentBusinessId])

  const loadClients = async () => {
    if (!currentBusinessId) return
    try {
      const repo = new ClientRepository()
      const clients = await repo.getClientsWithCredits(
        currentBusinessId,
        user?.id ?? '',
        undefined,
        businessCode ?? undefined
      )
      setClientsList(clients as unknown as Client[])
    } catch (err) {
      console.error('Error al cargar clientes:', err)
    }
  }

  /** Mapa client_id -> nombre del cliente (para columna Cliente del crédito). */
  const clientNameById = useMemo(() => {
    const map: Record<string, string> = {}
    clientsList.forEach((c) => {
      if (c.id) map[c.id] = c.name?.trim() || 'Sin nombre'
    })
    return map
  }, [clientsList])

  const loadCollections = async () => {
    if (!currentBusinessId) return

    setIsLoading(true)
    setError(null)

    try {
      const collectionFilters: CollectionFilters = {
        businessId: currentBusinessId,
        startDate: filters.startDate,
        endDate: filters.endDate,
        clientId: filters.clientId || undefined,
        payment_method: normalizePaymentMethodForApi(filters.payment_method)
      }

      let data = await collectionService.getCollectionsWithFilters(collectionFilters)

      // Filtrado en cliente por si el backend no aplica clientId o payment_method
      if (filters.clientId?.trim()) {
        data = data.filter((c) => (c.client_id || '').trim() === filters.clientId?.trim())
      }
      if (filters.payment_method?.trim()) {
        const expectedPm = normalizePaymentMethodForApi(filters.payment_method)
        if (expectedPm) {
          data = data.filter((c) => matchPaymentMethod(c.payment_method, expectedPm))
        }
      }

      setFilteredCollections(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar recaudos')
    } finally {
      setIsLoading(false)
    }
  }

  /** Compara payment_method del recaudo con el valor esperado (efectivo | transferencia). */
  function matchPaymentMethod(
    collectionMethod: string | null | undefined,
    expected: string
  ): boolean {
    if (!collectionMethod) return false
    const m = collectionMethod.toLowerCase().trim()
    const e = expected.toLowerCase().trim()
    if (e === 'efectivo') return m === 'efectivo'
    if (e === 'transferencia')
      return ['transferencia', 'transfer', 'transacción', 'transaccion'].includes(m)
    return m === e
  }

  const handleFilterChange = (newFilters: FilterValues) => {
    setFilters(newFilters)
  }

  /** Normaliza método de pago para el API: cash->efectivo, transfer->transferencia. */
  function normalizePaymentMethodForApi(value: string | undefined): string | undefined {
    if (!value) return undefined
    const v = value.toLowerCase()
    if (v === 'cash') return 'efectivo'
    if (v === 'transfer') return 'transferencia'
    return value
  }

  const handleExport = () => {
    const dataToExport = filteredCollections.map((collection) => ({
      // 'ID Recaudo': collection.id,
      Cliente: collection.client_id
        ? clientNameById[collection.client_id] ?? collection.name ?? '-'
        : collection.name ?? '-',
      Monto: formatCurrency(collection.amount),
      'Fecha de Pago': formatDateTime(collection.payment_date),
      'Método de Pago': collection.payment_method || 'N/A',
      Referencia: collection.transaction_reference || 'N/A',
      Notas: collection.notes || 'N/A'
    }))
    exportToExcel(dataToExport, { filename: 'recaudos_recaudopro', sheetName: 'Recaudos' })
  }

  const columns: Column<CollectionWithUserEmail>[] = [
    {
      key: 'client_id',
      header: 'Cliente',
      className: 'font-medium',
      render: (collection) => (
        <span className="text-sm text-gray-200 font-medium">
          {collection.client_id
            ? clientNameById[collection.client_id] ?? collection.name ?? '-'
            : collection.name ?? '-'}
        </span>
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

  const availableClients = useMemo(
    () => clientsList.map((c) => ({ id: c.id, name: c.name?.trim() || 'Sin nombre' })),
    [clientsList]
  )

  if (!currentBusinessId) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-gray-600">No hay business_id disponible. Por favor, inicia sesión.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full space-y-6">
      <div className="flex-shrink-0 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl sm:text-3xl font-bold text-white min-w-0">Recaudos</h1>
        <div className="flex flex-wrap gap-2 sm:gap-3">
          <Button
            onClick={handleExport}
            variant="outline"
            disabled={filteredCollections.length === 0}
            className="min-h-[44px] border-gray-600 text-gray-300 bg-[#2D3748] hover:bg-white/10 hover:border-gray-500 hover:text-white"
          >
            <Download className="w-4 h-4 mr-2 shrink-0" />
            Exportar a Excel
          </Button>
        </div>
      </div>

      <div className="flex-shrink-0">
        <FiltersBar
          onFilterChange={handleFilterChange}
          availableClients={availableClients}
          showUserFilter={false}
          showPaymentMethodFilter={true}
          isRecaudoPage={true}
        />
      </div>

      <div className="flex-1 min-h-0">
        <DynamicTable
          data={filteredCollections}
          columns={columns}
          isLoading={isLoading}
          error={error}
          emptyMessage="No hay recaudos disponibles"
        />
      </div>
    </div>
  )
}
