import { Button } from '@/components/ui/button'
import { User } from '@/features/auth/domain/models'
import { useAuth } from '@/features/auth/presentation/hooks/useAuth'
import { useAuthStore } from '@/features/auth/presentation/store/authStore'
import { Client } from '@/features/clients/domain/models'
import { ClientRepository } from '@/features/clients/infrastructure/repositories/ClientRepository'
import { Column, DynamicTable } from '@/shared/components/DynamicTable'
import FiltersBar, { FilterValues } from '@/shared/components/Filters/FiltersBar'
import { CreditFilters } from '@/shared/types/filters'
import { formatCurrency, formatDate } from '@/shared/utils/date'
import { exportToExcel } from '@/shared/utils/excel'
import { Download, Plus } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { CreditWithUserEmail } from '../../domain/port'
import { CreditService } from '../../domain/services/CreditService'
import { CreditRepository } from '../../infrastructure/repositories/CreditRepository'

export default function CreditsPage() {
  const { businessId, businessCode, user } = useAuthStore()
  const { getUsersByBusinessId } = useAuth()
  const [filteredCredits, setFilteredCredits] = useState<CreditWithUserEmail[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [, setUsersList] = useState<User[]>([])
  const [clientsList, setClientsList] = useState<Client[]>([])
  const [filters, setFilters] = useState<FilterValues>({ userId: undefined })

  const currentBusinessId = user?.business_id || businessId

  const creditService = useMemo(() => {
    const repository = new CreditRepository()
    return new CreditService(repository)
  }, [])

  useEffect(() => {
    if (currentBusinessId) {
      console.log('✅ Business ID disponible:', currentBusinessId)
      loadUsers()
      loadClients()
      loadCredits()
    } else {
      console.warn('⚠️ No hay business_id disponible')
    }
  }, [currentBusinessId])

  useEffect(() => {
    if (currentBusinessId) {
      console.log('🔄 Filtros cambiaron, recargando créditos')
      loadCredits()
    }
  }, [filters, currentBusinessId])

  const loadUsers = async () => {
    if (!currentBusinessId) return
    try {
      const users = await getUsersByBusinessId(currentBusinessId)
      setUsersList(users)
    } catch (err) {
      console.error('Error al cargar usuarios:', err)
    }
  }

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

  /** Mapa client_id -> nombre del cliente (para pintar en columna Cliente). */
  const clientNameById = useMemo(() => {
    const map: Record<string, string> = {}
    clientsList.forEach((c) => {
      if (c.id) map[c.id] = c.name?.trim() || 'Sin nombre'
    })
    return map
  }, [clientsList])

  /** Opciones para filtro por nombre del cliente (id + name para el dropdown). */
  const availableClients = useMemo(
    () => clientsList.map((c) => ({ id: c.id, name: c.name?.trim() || 'Sin nombre' })),
    [clientsList]
  )

  /** Créditos a mostrar: filtro por responsable (userId) cuando aplica. */
  const displayedCredits = useMemo(() => {
    if (!filters.userId) return filteredCredits
    return filteredCredits.filter((c) => c.user_id === filters.userId)
  }, [filteredCredits, filters.userId])

  const loadCredits = async () => {
    if (!currentBusinessId) {
      console.warn('⚠️ No hay business_id disponible')
      return
    }

    console.log('🔄 Cargando créditos para business_id:', currentBusinessId)
    setIsLoading(true)
    setError(null)

    try {
      const creditFilters: CreditFilters = {
        businessId: currentBusinessId,
        startDate: filters.startDate,
        endDate: filters.endDate,
        clientId: filters.clientId || undefined
      }

      console.log('📤 Enviando filtros:', creditFilters)
      const data = await creditService.getCreditsWithFilters(creditFilters)
      console.log('✅ Créditos cargados:', data.length)

      if (data.length === 0) {
        console.warn('⚠️ No se encontraron créditos. Verifica:')
        console.warn(
          '  1. Que existan créditos en la tabla credits con business_id:',
          currentBusinessId
        )
        console.warn('  2. Que las políticas RLS permitan la lectura')
      }

      setFilteredCredits(data)
    } catch (err) {
      console.error('❌ Error al cargar créditos:', err)
      setError(err instanceof Error ? err.message : 'Error al cargar créditos')
    } finally {
      setIsLoading(false)
    }
  }

  const handleFilterChange = (newFilters: FilterValues) => {
    setFilters(newFilters)
  }

  const handleExport = () => {
    const dataToExport = displayedCredits.map((credit) => ({
      'ID Crédito': credit.id,
      Cliente: credit.client_id ? clientNameById[credit.client_id] ?? credit.client_id : '-',
      'Monto Total': formatCurrency(credit.total_amount),
      'Saldo Restante': formatCurrency(credit.total_balance),
      'Valor Cuota': formatCurrency(credit.installment_amount),
      'Cuotas Pagadas': `${credit.paid_installments} / ${credit.total_installments}`,
      'Cuotas Atrasadas': credit.overdue_installments,
      'Próxima Fecha': credit.next_due_date ? formatDate(credit.next_due_date) : 'N/A',
      'Fecha Creación': formatDate(credit.created_at)
    }))
    exportToExcel(dataToExport, { filename: 'creditos_recaudopro', sheetName: 'Créditos' })
  }

  const columns: Column<CreditWithUserEmail>[] = [
    {
      key: 'client_id',
      header: 'Cliente',
      render: (credit) => (
        <span className="text-sm text-gray-200 font-medium">
          {credit.client_id ? clientNameById[credit.client_id] ?? credit.client_id : '-'}
        </span>
      )
    },
    {
      key: 'total_amount',
      header: 'Monto Total',
      render: (credit) => formatCurrency(credit.total_amount)
    },
    {
      key: 'total_balance',
      header: 'Saldo Restante',
      render: (credit) => {
        const balance = credit.total_balance
        return (
          <span
            className={
              balance === 0 ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'
            }
          >
            {formatCurrency(balance)}
          </span>
        )
      }
    },
    {
      key: 'installment_amount',
      header: 'Valor Cuota',
      render: (credit) => formatCurrency(credit.installment_amount)
    },
    {
      key: 'paid_installments',
      header: 'Cuotas Pagadas',
      render: (credit) => (
        <span>
          {credit.paid_installments} / {credit.total_installments}
        </span>
      )
    },
    {
      key: 'overdue_installments',
      header: 'Cuotas Atrasadas',
      render: (credit) => {
        const overdue = credit.overdue_installments
        return <span className={overdue > 0 ? 'text-red-600 font-semibold' : ''}>{overdue}</span>
      }
    },
    {
      key: 'next_due_date',
      header: 'Próxima Fecha',
      render: (credit) => (credit.next_due_date ? formatDate(credit.next_due_date) : '-')
    }
  ]

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
        <h1 className="text-2xl sm:text-3xl font-bold text-white min-w-0">Créditos</h1>
        <div className="flex flex-wrap gap-2 sm:gap-3">
          <Button
            variant="outline"
            onClick={handleExport}
            disabled={displayedCredits.length === 0}
            className="min-h-[44px] border-gray-600 text-gray-300 bg-[#2D3748] hover:bg-white/10 hover:border-gray-500 hover:text-white"
          >
            <Download className="w-4 h-4 mr-2 shrink-0" />
            Exportar a Excel
          </Button>
          <Button className="min-h-[44px] bg-[#2563EB] hover:bg-[#1d4ed8] text-white border-0">
            <Plus className="w-4 h-4 mr-2 shrink-0" />
            Nuevo Crédito
          </Button>
        </div>
      </div>

      <div className="flex-shrink-0">
        <FiltersBar
          onFilterChange={handleFilterChange}
          availableClients={availableClients}
          showClientFilter={true}
        />
      </div>

      <div className="flex-1 min-h-0">
        <DynamicTable
          data={displayedCredits}
          columns={columns}
          isLoading={isLoading}
          error={error}
          emptyMessage="No hay créditos disponibles"
        />
      </div>
    </div>
  )
}
