import { LoadingScreen } from '@/shared/components/LoadingScreen/LoadingScreen'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/features/auth/presentation/store/authStore'
import { Client } from '@/features/clients/domain/models'
import { ClientRepository } from '@/features/clients/infrastructure/repositories/ClientRepository'
import { Column, DynamicTable } from '@/shared/components/DynamicTable'
import FiltersBar, { FilterValues } from '@/shared/components/Filters/FiltersBar'
import { CollectionFilters } from '@/shared/types/filters'
import { cn } from '@/shared/utils/cn'
import { formatCurrency, formatDateTime } from '@/shared/utils/date'
import { exportToExcel } from '@/shared/utils/excel'
import { Download, Pencil } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { CollectionWithUserEmail } from '../../domain/port'
import { CollectionService } from '../../domain/services/CollectionService'
import { CollectionRepository } from '../../infrastructure/repositories/CollectionRepository'
import { EditCollectionModal } from '../components/EditCollectionModal'

export default function CollectionsPage() {
  const { businessId, businessCode, user } = useAuthStore()
  const [filteredCollections, setFilteredCollections] = useState<CollectionWithUserEmail[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isFirstLoad, setIsFirstLoad] = useState(true)
  const [isClientsLoading, setIsClientsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [clientsList, setClientsList] = useState<Client[]>([])
  const [editingCollection, setEditingCollection] = useState<CollectionWithUserEmail | null>(null)
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

  const loadClients = async () => {
    if (!currentBusinessId) return
    setIsClientsLoading(true)
    try {
      const repo = new ClientRepository()
      const clients = await repo.getClientsWithFilters({
        businessId: currentBusinessId,
        businessCode: businessCode ?? undefined,
        userId: user?.id || ''
      })
      setClientsList(clients as any)
    } catch (err) {
      console.error('Error al cargar catálogo de clientes:', err)
    } finally {
      setIsClientsLoading(false)
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
        clientId: filters.clientId || undefined,
        payment_method: normalizePaymentMethodForApi(filters.payment_method)
      }

      const data = await collectionService.getCollectionsWithFilters(collectionFilters)

      let filtered = data.filter((c) => c.business_id === currentBusinessId)

      if (filters.clientId?.trim()) {
        filtered = filtered.filter((c) => (c.client_id || '').trim() === filters.clientId?.trim())
      }
      if (filters.payment_method?.trim()) {
        const expectedPm = normalizePaymentMethodForApi(filters.payment_method)
        if (expectedPm) {
          filtered = filtered.filter((c) => {
            const m = (c.payment_method || '').toLowerCase().trim()
            const e = expectedPm.toLowerCase().trim()
            if (e === 'efectivo') return m === 'efectivo'
            if (e === 'transferencia') return ['transferencia', 'transfer', 'transacción', 'transaccion'].includes(m)
            return m === e
          })
        }
      }

      setFilteredCollections(filtered)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar recaudos')
    } finally {
      setIsLoading(false)
      setIsFirstLoad(false)
    }
  }

  useEffect(() => {
    if (currentBusinessId) {
      loadClients()
      loadCollections()
    }
  }, [currentBusinessId, filters])

  const handleFilterChange = (newFilters: FilterValues) => {
    setFilters(newFilters)
  }

  function normalizePaymentMethodForApi(value: string | undefined): string | undefined {
    if (!value) return undefined
    const v = value.toLowerCase()
    if (v === 'cash') return 'efectivo'
    if (v === 'transfer') return 'transferencia'
    return value
  }

  const handleExport = () => {
    const dataToExport = filteredCollections.map((collection: any) => {
      const clientName = collection.clients?.name || collection.client_name || clientNameById[collection.client_id] || collection.name || collection.client_id
      return {
        Cliente: clientName,
        Monto: formatCurrency(collection.amount),
        'Fecha de Pago': formatDateTime(collection.payment_date),
        'Método de Pago': collection.payment_method || 'N/A',
        Referencia: collection.transaction_reference || 'N/A'
      }
    })
    exportToExcel(dataToExport, { filename: 'recaudos_recaudopro', sheetName: 'Recaudos' })
  }

  const clientNameById = useMemo(() => {
    const map: Record<string, string> = {}
    clientsList.forEach((c) => { if (c.id) map[c.id] = c.name?.trim() || 'Sin nombre' })
    return map
  }, [clientsList])

  const availableClients = useMemo(() => clientsList.map((c) => ({ id: c.id, name: c.name?.trim() || 'Sin nombre' })), [clientsList])

  const columns: Column<CollectionWithUserEmail>[] = [
    { key: 'client_id', header: 'Cliente', className: 'font-bold', render: (collection: any) => {
        const clientName = collection.clients?.name || collection.client_name || clientNameById[collection.client_id]
        return <span className="text-sm text-info font-bold">{clientName || collection.name || collection.client_id || '-'}</span>
    }},
    { key: 'amount', header: 'Monto', isNumeric: true, render: (collection) => formatCurrency(collection.amount) },
    { key: 'payment_date', header: 'Fecha Pago', className: 'text-muted-foreground/60', render: (collection) => formatDateTime(collection.payment_date) },
    { key: 'payment_method', header: 'Método', className: 'text-center', render: (collection) => {
        const method = collection.payment_method?.toLowerCase()
        if (!method) return '-'
        return <span className={cn('px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest inline-flex items-center gap-2 transition-all duration-300', method === 'efectivo' ? 'bg-success/10 text-success border border-success/20 shadow-[0_0_15px_-5px_theme(colors.success)]' : 'bg-primary/10 text-primary border border-primary/20 shadow-[0_0_15px_-5px_theme(colors.primary)]')}><span className={cn('w-1.5 h-1.5 rounded-full animate-pulse', method === 'efectivo' ? 'bg-success' : 'bg-primary')} />{method}</span>
    }},
    { key: 'transaction_reference', header: 'Referencia', className: 'font-mono text-[10px] text-muted-foreground/40', render: (collection) => collection.transaction_reference || '-' },
    { key: 'id', header: '', className: 'w-10 text-center', render: (collection) => <button type="button" onClick={(e) => { e.stopPropagation(); setEditingCollection(collection); }} className="p-1.5 rounded-md text-muted-foreground/40 hover:text-primary hover:bg-primary/10 transition-colors" title="Editar recaudo"><Pencil className="w-3.5 h-3.5" /></button> }
  ]

  if (!currentBusinessId || (isLoading && isFirstLoad)) {
    return <LoadingScreen message="Sincronizando Registro de Recaudos" />
  }

  return (
    <div className="flex flex-col h-full space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white min-w-0">Registro de Recaudos</h1>
          <p className="text-sm text-muted-foreground/60">Flujo histórico de entradas y abonos a capital por cliente.</p>
        </div>
        <div className="flex flex-wrap gap-2 sm:gap-3">
          <Button onClick={handleExport} variant="outline" disabled={filteredCollections.length === 0} className="min-h-[44px] px-6 border-white/5 bg-white/[0.03] text-white hover:bg-white/[0.08] hover:border-white/10 shadow-xl transition-all font-bold uppercase tracking-widest text-[10px]"><Download className="w-4 h-4 mr-2" aria-hidden="true" />Exportar XLS</Button>
        </div>
      </div>
      <div className="flex-shrink-0">
        <FiltersBar onFilterChange={handleFilterChange} availableClients={availableClients} showUserFilter={false} showPaymentMethodFilter={true} isRecaudoPage={true} />
      </div>
      <div className="flex-1 min-h-0">
        <DynamicTable data={isClientsLoading ? [] : filteredCollections} columns={columns} isLoading={isLoading || isClientsLoading} error={error} emptyMessage="No se han registrado recaudos en este período" variant="premium-dark" className="rounded-3xl" />
      </div>
      <EditCollectionModal collection={editingCollection} clientName={editingCollection?.client_id ? clientNameById[editingCollection.client_id] : undefined} isOpen={!!editingCollection} onClose={() => setEditingCollection(null)} onSuccess={loadCollections} />
    </div>
  )
}
