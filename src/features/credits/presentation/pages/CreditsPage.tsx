import { useState, useEffect, useMemo } from 'react'
import { useAuthStore } from '@/features/auth/presentation/store/authStore'
import { useAuth } from '@/features/auth/presentation/hooks/useAuth'
import { CreditService } from '../../domain/services/CreditService'
import { CreditRepository } from '../../infrastructure/repositories/CreditRepository'
import { CreditWithUserEmail } from '../../domain/port'
import { DynamicTable, Column } from '@/shared/components/DynamicTable'
import FiltersBar, { FilterValues } from '@/shared/components/Filters/FiltersBar'
import { Button } from '@/components/ui/button'
import { Download, Plus } from 'lucide-react'
import { exportToExcel } from '@/shared/utils/excel'
import { formatDate, formatCurrency } from '@/shared/utils/date'
import { CreditFilters } from '@/shared/types/filters'

export default function CreditsPage() {
  const { businessId, user } = useAuthStore()
  const { getUsersByBusinessId } = useAuth()
  const [filteredCredits, setFilteredCredits] = useState<CreditWithUserEmail[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [availableEmails, setAvailableEmails] = useState<string[]>([])
  const [filters, setFilters] = useState<FilterValues>({})

  const currentBusinessId = user?.business_id || businessId

  const creditService = useMemo(() => {
    const repository = new CreditRepository()
    return new CreditService(repository)
  }, [])

  useEffect(() => {
    if (currentBusinessId) {
      console.log('✅ Business ID disponible:', currentBusinessId)
      loadUsers()
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
      const emails = users.map(u => u.email).filter(Boolean) as string[]
      setAvailableEmails(emails)
    } catch (err) {
      console.error('Error al cargar usuarios:', err)
    }
  }

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
        userEmail: filters.userEmail || undefined,
        clientId: filters.clientId || undefined,
      }

      console.log('📤 Enviando filtros:', creditFilters)
      const data = await creditService.getCreditsWithFilters(creditFilters)
      console.log('✅ Créditos cargados:', data.length, 'con emails:', data.filter(c => c.user_email).length)
      
      if (data.length === 0) {
        console.warn('⚠️ No se encontraron créditos. Verifica:')
        console.warn('  1. Que existan créditos en la tabla credits con business_id:', currentBusinessId)
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
    const dataToExport = filteredCredits.map(credit => ({
      'ID Crédito': credit.id,
      'ID Cliente': credit.client_id,
      'Monto Total': formatCurrency(credit.total_amount),
      'Saldo Restante': formatCurrency(credit.total_balance),
      'Valor Cuota': formatCurrency(credit.installment_amount),
      'Cuotas Pagadas': `${credit.paid_installments} / ${credit.total_installments}`,
      'Cuotas Atrasadas': credit.overdue_installments,
      'Próxima Fecha': credit.next_due_date ? formatDate(credit.next_due_date) : 'N/A',
      'Email Vendedor': credit.user_email || 'N/A',
      'Método de Pago': (credit as any).payment_method || 'N/A',
      'Fecha Creación': formatDate(credit.created_at),
    }))
    exportToExcel(dataToExport, { filename: 'creditos_recaudopro', sheetName: 'Créditos' })
  }

  const columns: Column<CreditWithUserEmail>[] = [
    {
      key: 'client_id',
      header: 'Cliente ID',
    },
    {
      key: 'user_email',
      header: 'Email Vendedor',
      render: (credit) => (
        <span className="text-sm text-gray-600 font-medium">
          {credit.user_email || 'Sin asignar'}
        </span>
      ),
    },
    {
      key: 'payment_method',
      header: 'Método de Pago',
      render: (credit) => {
        const method = (credit as any).payment_method
        if (!method) return <span className="text-gray-400">-</span>
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
      },
    },
    {
      key: 'total_amount',
      header: 'Monto Total',
      render: (credit) => formatCurrency(credit.total_amount),
    },
    {
      key: 'total_balance',
      header: 'Saldo Restante',
      render: (credit) => {
        const balance = credit.total_balance
        return (
          <span className={balance === 0 ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
            {formatCurrency(balance)}
          </span>
        )
      },
    },
    {
      key: 'installment_amount',
      header: 'Valor Cuota',
      render: (credit) => formatCurrency(credit.installment_amount),
    },
    {
      key: 'paid_installments',
      header: 'Cuotas Pagadas',
      render: (credit) => (
        <span>
          {credit.paid_installments} / {credit.total_installments}
        </span>
      ),
    },
    {
      key: 'overdue_installments',
      header: 'Cuotas Atrasadas',
      render: (credit) => {
        const overdue = credit.overdue_installments
        return (
          <span className={overdue > 0 ? 'text-red-600 font-semibold' : ''}>
            {overdue}
          </span>
        )
      },
    },
    {
      key: 'next_due_date',
      header: 'Próxima Fecha',
      render: (credit) =>
        credit.next_due_date ? formatDate(credit.next_due_date) : '-',
    },
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
      <div className="flex-shrink-0 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Créditos</h1>
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleExport} disabled={filteredCredits.length === 0}>
            <Download className="w-4 h-4 mr-2" />
            Exportar a Excel
          </Button>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Crédito
          </Button>
        </div>
      </div>

      <div className="flex-shrink-0">
        <FiltersBar
          onFilterChange={handleFilterChange}
          availableEmails={availableEmails}
          showClientFilter={false}
        />
      </div>

      <div className="flex-1 min-h-0">
        <DynamicTable
          data={filteredCredits}
          columns={columns}
          isLoading={isLoading}
          error={error}
          emptyMessage="No hay créditos disponibles"
        />
      </div>
    </div>
  )
}
