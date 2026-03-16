import { LoadingScreen } from '@/shared/components/LoadingScreen/LoadingScreen'
import { Button } from '@/components/ui/button'
import { User } from '@/features/auth/domain/models'
import { useAuth } from '@/features/auth/presentation/hooks/useAuth'
import { useAuthStore } from '@/features/auth/presentation/store/authStore'
import { Client } from '@/features/clients/domain/models'
import { ClientRepository } from '@/features/clients/infrastructure/repositories/ClientRepository'
import { Column, DynamicTable } from '@/shared/components/DynamicTable'
import FiltersBar, { FilterValues } from '@/shared/components/Filters/FiltersBar'
import { CreditFilters } from '@/shared/types/filters'
import { cn } from '@/shared/utils/cn'
import { formatCurrency, formatDate } from '@/shared/utils/date'
import { exportToExcel } from '@/shared/utils/excel'
import { Download, Pencil } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Credit, CreditSummary } from '../../domain/models'
import { CreditWithUserEmail } from '../../domain/port'
import { CreditService } from '../../domain/services/CreditService'
import { CreditRepository } from '../../infrastructure/repositories/CreditRepository'
import { EditCreditModal } from '../components/EditCreditModal'

export default function CreditsPage() {
  const { businessId, businessCode, user } = useAuthStore()
  const { getUsersByBusinessId } = useAuth()
  const [filteredCredits, setFilteredCredits] = useState<CreditWithUserEmail[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isFirstLoad, setIsFirstLoad] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [, setUsersList] = useState<User[]>([])
  const [clientsList, setClientsList] = useState<Client[]>([])
  const [filters, setFilters] = useState<FilterValues>({ userId: undefined })

  // State for Edit Modal
  const [selectedCredit, setSelectedCredit] = useState<Credit | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  /** Saldos desde GET /api/credits/summary/:id */
  const [summaryByCreditId, setSummaryByCreditId] = useState<Record<string, CreditSummary>>({})
  const enrichmentAbortControllerRef = useRef<AbortController | null>(null)

  const currentBusinessId = user?.business_id || businessId

  const creditService = useMemo(() => {
    const repository = new CreditRepository()
    return new CreditService(repository)
  }, [])

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

  const loadCredits = async () => {
    if (!currentBusinessId) return

    setIsLoading(true)
    setError(null)

    if (enrichmentAbortControllerRef.current) {
        enrichmentAbortControllerRef.current.abort()
    }
    const controller = new AbortController()
    enrichmentAbortControllerRef.current = controller

    try {
      const creditFilters: CreditFilters = {
        businessId: currentBusinessId,
        startDate: filters.startDate,
        endDate: filters.endDate,
        clientId: filters.clientId || undefined
      }

      const data = await creditService.getCreditsWithFilters(creditFilters)
      setFilteredCredits(data)
      setIsLoading(false)
      setIsFirstLoad(false)

      const CONCURRENCY = 6
      const ids = data.map((c) => c.id).filter(Boolean)
      
      for (let i = 0; i < ids.length; i += CONCURRENCY) {
        if (controller.signal.aborted) break
        const chunk = ids.slice(i, i + CONCURRENCY)
        const results = await Promise.all(
          chunk.map(async (id) => {
            try {
              const s = await creditService.getCreditSummary(id)
              return { id, summary: s }
            } catch {
              return { id, summary: null }
            }
          })
        )
        if (!controller.signal.aborted) {
            setSummaryByCreditId(prev => {
                const next = { ...prev }
                results.forEach(({ id, summary }) => {
                    if (summary) next[id] = summary
                })
                return next
            })
        }
      }
    } catch (err) {
      console.error('❌ Error al cargar créditos:', err)
      setError(err instanceof Error ? err.message : 'Error al cargar créditos')
      setIsLoading(false)
      setIsFirstLoad(false)
    }
  }

  useEffect(() => {
    if (currentBusinessId) {
      loadUsers()
      loadClients()
      loadCredits()
    }
  }, [currentBusinessId, filters])

  const clientNameById = useMemo(() => {
    const map: Record<string, string> = {}
    clientsList.forEach((c) => {
      if (c.id) map[c.id] = c.name?.trim() || 'Sin nombre'
    })
    return map
  }, [clientsList])

  const availableClients = useMemo(
    () => clientsList.map((c) => ({ id: c.id, name: c.name?.trim() || 'Sin nombre' })),
    [clientsList]
  )

  const displayedCredits = useMemo(() => {
    if (!filters.userId) return filteredCredits
    return filteredCredits.filter((c) => c.user_id === filters.userId)
  }, [filteredCredits, filters.userId])

  const handleFilterChange = (newFilters: FilterValues) => {
    setFilters(newFilters)
  }

  const handleExport = () => {
    const dataToExport = displayedCredits.map((credit) => {
      const s = summaryByCreditId[credit.id]
      const totalPaid = s?.total_paid != null && !Number.isNaN(Number(s.total_paid)) ? Number(s.total_paid) : 0
      const saldo = s?.total_balance ?? credit.total_balance
      const saldoNum = saldo != null && !Number.isNaN(Number(saldo)) ? Number(saldo) : 0
      const paid = s?.paid_installments ?? credit.paid_installments
      const total = s?.total_installments ?? credit.total_installments
      const overdue = s?.overdue_installments ?? credit.overdue_installments
      return {
      'ID Crédito': credit.id,
      Cliente: credit.client_id ? clientNameById[credit.client_id] ?? credit.client_id : '-',
      'Monto Total': formatCurrency(credit.total_amount),
      'Tasa interés': credit.interest_rate != null ? `${Number(credit.interest_rate)}%` : '-',
      'Total con interés': credit.total_interest != null ? formatCurrency(credit.total_interest) : '-',
      'Total pagado': formatCurrency(totalPaid),
      'Saldo Restante': formatCurrency(saldoNum),
      'Valor Cuota': formatCurrency(credit.installment_amount),
      'Cuotas Pagadas': `${paid} / ${total}`,
      'Cuotas Atrasadas': overdue,
      'Próxima Fecha': credit.next_due_date ? formatDate(credit.next_due_date) : 'N/A',
      'Fecha Creación': formatDate(credit.created_at)
    }
    })
    exportToExcel(dataToExport, { filename: 'creditos_recaudopro', sheetName: 'Créditos' })
  }

  const handleEditClick = (credit: Credit) => {
    setSelectedCredit(credit)
    setIsEditModalOpen(true)
  }

  const columns: Column<CreditWithUserEmail>[] = [
    {
      key: 'client_id',
      header: 'Cliente',
      className: 'font-bold',
      render: (credit) => (
        <span className="text-sm text-info font-bold">
          {credit.client_id ? clientNameById[credit.client_id] ?? credit.client_id : '-'}
        </span>
      )
    },
    {
      key: 'total_amount',
      header: 'Monto Total',
      isNumeric: true,
      render: (credit) => formatCurrency(credit.total_amount)
    },
    {
      key: 'interest_rate',
      header: 'Interés',
      isNumeric: true,
      render: (credit) => (
        <span className="text-muted-foreground/60 font-bold">
          {credit.interest_rate != null ? `${Number(credit.interest_rate)}%` : '-'}
        </span>
      )
    },
    {
      key: 'total_interest',
      header: 'Valor Final',
      isNumeric: true,
      render: (credit) => (
        <span className="text-foreground font-extrabold">
          {credit.total_interest != null ? formatCurrency(credit.total_interest) : '-'}
        </span>
      )
    },
    {
      key: 'total_paid',
      header: 'Total pagado',
      isNumeric: true,
      render: (credit) => {
        const raw = summaryByCreditId[credit.id]?.total_paid
        const value = raw != null && !Number.isNaN(Number(raw)) ? Number(raw) : 0
        return <span className="font-mono font-semibold text-success">{formatCurrency(value)}</span>
      }
    },
    {
      key: 'total_balance',
      header: 'Saldo Pendiente',
      isNumeric: true,
      render: (credit) => {
        const raw = summaryByCreditId[credit.id]?.total_balance ?? credit.total_balance
        const balance = raw != null && !Number.isNaN(Number(raw)) ? Number(raw) : 0
        return (
          <span className={cn(
              'px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest transition-all duration-300',
              balance === 0 
                ? 'bg-success/10 text-success border border-success/20 shadow-[0_0_15px_-5px_theme(colors.success)]' 
                : 'bg-error/10 text-error border border-error/20 shadow-[0_0_15px_-5px_theme(colors.error)]'
            )}>
            {formatCurrency(balance)}
          </span>
        )
      }
    },
    {
      key: 'installment_amount',
      header: 'Valor Cuota',
      isNumeric: true,
      render: (credit) => formatCurrency(credit.installment_amount)
    },
    {
      key: 'paid_installments',
      header: 'Progreso',
      className: 'text-center',
      render: (credit) => {
        const s = summaryByCreditId[credit.id]
        const paid = s?.paid_installments ?? credit.paid_installments
        const total = s?.total_installments ?? credit.total_installments
        const pct = total > 0 ? Math.min(100, (paid / total) * 100) : 0
        return (
          <div className="flex flex-col items-center gap-2 min-w-[80px]">
            <span className="text-[10px] font-black tabular-nums text-foreground/80 tracking-widest">
              {paid} / {total}
            </span>
            <div className="w-full h-1.5 bg-muted/30 rounded-full overflow-hidden border border-white/5">
              <div className="h-full bg-primary shadow-[0_0_8px_rgba(var(--primary),0.5)] transition-all duration-500" style={{ width: `${pct}%` }} />
            </div>
          </div>
        )
      }
    },
    {
      key: 'overdue_installments',
      header: 'Mora',
      isNumeric: true,
      render: (credit) => {
        const overdue = summaryByCreditId[credit.id]?.overdue_installments ?? credit.overdue_installments
        return <span className={cn("tabular-nums font-black", (overdue ?? 0) > 0 ? 'text-error' : 'text-muted-foreground/20')}>{overdue ?? 0}</span>
      }
    },
    {
      key: 'next_due_date',
      header: 'Vencimiento',
      className: 'text-muted-foreground/50 text-[11px]',
      render: (credit) => (credit.next_due_date ? formatDate(credit.next_due_date) : '-')
    },
    {
      key: 'id',
      header: '',
      className: 'w-10 text-center',
      render: (credit) => (
        <button type="button" onClick={(e) => { e.stopPropagation(); handleEditClick(credit as Credit); }} className="p-1.5 rounded-md text-muted-foreground/40 hover:text-primary hover:bg-primary/10 transition-colors" title="Editar crédito">
          <Pencil className="w-3.5 h-3.5" />
        </button>
      )
    }
  ]

  if (!currentBusinessId || (isLoading && isFirstLoad)) {
    return <LoadingScreen message="Sincronizando Cartera de Créditos" />
  }

  return (
    <div className="flex flex-col h-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground min-w-0">Gestión de Créditos</h1>
          <p className="text-sm text-muted-foreground/60">Monitorea el estado de los préstamos, cuotas y niveles de recaudo.</p>
        </div>
        <div className="flex flex-wrap gap-2 sm:gap-3">
          <Button variant="outline" onClick={handleExport} disabled={displayedCredits.length === 0} className="min-h-[44px] px-6 shadow-xl transition-all font-bold uppercase tracking-widest text-[10px]">
            <Download className="w-4 h-4 mr-2" />
            Exportar XLS
          </Button>
        </div>
      </div>

      <div className="flex-shrink-0">
        <FiltersBar onFilterChange={handleFilterChange} availableClients={availableClients} showClientFilter={true} />
      </div>

      <div className="flex-1 min-h-0">
        <DynamicTable data={displayedCredits} columns={columns} isLoading={isLoading} error={error} emptyMessage="No hay créditos encontrados para este período" variant="premium-dark" className="rounded-3xl" />
      </div>

      <EditCreditModal isOpen={isEditModalOpen} credit={selectedCredit} onClose={() => setIsEditModalOpen(false)} onSuccess={loadCredits} />
    </div>
  )
}
