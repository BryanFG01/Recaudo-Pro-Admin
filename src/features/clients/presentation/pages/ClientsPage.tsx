import { Button } from '@/components/ui/button'
import { User } from '@/features/auth/domain/models'
import { useAuth } from '@/features/auth/presentation/hooks/useAuth'
import { useAuthStore } from '@/features/auth/presentation/store/authStore'
import { CreditRepository } from '@/features/credits/infrastructure/repositories/CreditRepository'
import { CreditService } from '@/features/credits/domain/services/CreditService'
import { CreditSummary } from '@/features/credits/domain/models'
import { Column, DynamicTable } from '@/shared/components/DynamicTable'
import FiltersBar, { FilterValues } from '@/shared/components/Filters/FiltersBar'
import { ClientFilters } from '@/shared/types/filters'
import { formatCurrency, formatDate } from '@/shared/utils/date'
import { exportToExcel } from '@/shared/utils/excel'
import { Download, Pencil } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { ClientWithCredits } from '../../domain/models'
import { ClientService } from '../../domain/services/ClientService'
import { ClientRepository } from '../../infrastructure/repositories/ClientRepository'
import { EditClientModal } from '../components/EditClientModal'

export default function ClientsPage() {
  const { businessId, businessCode, user } = useAuthStore()
  const { getUsersByBusinessId } = useAuth()
  const [clients, setClients] = useState<ClientWithCredits[]>([])
  const [filteredClients, setFilteredClients] = useState<ClientWithCredits[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [availableEmails, setAvailableEmails] = useState<string[]>([])
  const [usersList, setUsersList] = useState<User[]>([])
  const [editingClient, setEditingClient] = useState<ClientWithCredits | null>(null)
  const [filters, setFilters] = useState<FilterValues>({ userId: undefined })

  const currentBusinessId = user?.business_id || businessId

  const clientService = useMemo(() => {
    const repository = new ClientRepository()
    return new ClientService(repository)
  }, [])

  const creditService = useMemo(() => {
    const repo = new CreditRepository()
    return new CreditService(repo)
  }, [])

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
        creditService.getCreditsByBusinessId(currentBusinessId)
      ])

      // Saldos reales desde GET /api/credits/summary/:id (la lista trae total_balance en 0)
      const summaryByCreditId: Record<string, CreditSummary> = {}
      const CONCURRENCY = 6
      const creditIds = credits.map((c) => c.id).filter(Boolean)
      for (let i = 0; i < creditIds.length; i += CONCURRENCY) {
        const chunk = creditIds.slice(i, i + CONCURRENCY)
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
        results.forEach(({ id, summary }) => {
          if (summary) summaryByCreditId[id] = summary
        })
      }

      // Enriquecer cada cliente con totales de sus créditos (saldo pendiente desde summary)
      const normalizedId = (id: string | null | undefined) => (id != null ? String(id).trim().toLowerCase() : '')
      const enriched: ClientWithCredits[] = clientsFromApi.map((client) => {
        const clientIdNorm = normalizedId(client.id)
        const clientCredits = credits.filter((c) => normalizedId(c.client_id) === clientIdNorm)
        const total_amount = clientCredits.reduce((s, c) => s + (c.total_amount ?? 0), 0)
        let total_paid = 0
        let total_balance = 0
        clientCredits.forEach((c) => {
          const s = summaryByCreditId[c.id]
          const paid = s?.total_paid != null && !Number.isNaN(Number(s.total_paid)) ? Number(s.total_paid) : 0
          const balance = s?.total_balance != null && !Number.isNaN(Number(s.total_balance))
            ? Number(s.total_balance)
            : (c.total_balance != null && !Number.isNaN(Number(c.total_balance)) ? Number(c.total_balance) : 0)
          total_paid += paid
          total_balance += balance
        })
        return {
          ...client,
          total_credits: clientCredits.length,
          total_amount,
          total_paid,
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
    const dataToExport = filteredClients.map((client) => {
      const saldo = client.total_balance != null && !Number.isNaN(Number(client.total_balance)) ? Number(client.total_balance) : 0
      const pagado = client.total_paid != null && !Number.isNaN(Number(client.total_paid)) ? Number(client.total_paid) : 0
      return {
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
      'Total pagado': formatCurrency(pagado),
      'Saldo Pendiente': formatCurrency(saldo),
      'Fecha Creación': formatDate(client.created_at)
    }
    })
    exportToExcel(dataToExport, { filename: 'clientes_recaudopro', sheetName: 'Clientes' })
  }

  const columns: Column<ClientWithCredits>[] = [
    { key: 'name', header: 'Nombre', className: 'font-bold' },
    { key: 'phone', header: 'Teléfono', className: 'text-muted-foreground/60' },
    {
      key: 'user_id',
      header: 'Asignado a',
      render: (client) => (
        <span className="text-sm text-info font-semibold">
          {client.user_id
            ? (userNameById[client.user_id] ?? client.user_email ?? 'Sin asignar')
            : client.user_email || 'Sin asignar'}
        </span>
      )
    },
    { key: 'document_id', header: 'Documento', render: (client) => client.document_id || '-' },
    { key: 'total_credits', header: 'Total Préstamos', isNumeric: true },
    {
      key: 'total_amount',
      header: 'Monto Total',
      isNumeric: true,
      render: (client) => formatCurrency(client.total_amount)
    },
    {
      key: 'total_paid',
      header: 'Total pagado',
      isNumeric: true,
      render: (client) => (
        <span className="font-semibold text-success">
          {formatCurrency(client.total_paid != null && !Number.isNaN(Number(client.total_paid)) ? client.total_paid : 0)}
        </span>
      )
    },
    {
      key: 'total_balance',
      header: 'Saldo Pendiente',
      isNumeric: true,
      render: (client) => {
        const raw = client.total_balance
        const balance = raw != null && !Number.isNaN(Number(raw)) ? Number(raw) : 0
        return (
          <span
            className={
              balance === 0 ? 'text-success font-black' : 'text-error font-black'
            }
          >
            {formatCurrency(balance)}
          </span>
        )
      }
    },
    {
      key: 'created_at',
      header: 'Fecha Creación',
      className: 'text-muted-foreground/50',
      render: (client) => formatDate(client.created_at)
    },
    {
      key: 'id',
      header: '',
      className: 'w-10 text-center',
      render: (client) => (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            setEditingClient(client)
          }}
          className="p-1.5 rounded-md text-muted-foreground/40 hover:text-primary hover:bg-primary/10 transition-colors"
          title="Editar cliente"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
      )
    }
  ]

  const availableClients = useMemo(() => {
    return clients.map((c) => ({ id: c.id, name: c.name }))
  }, [clients])

  if (!currentBusinessId || !user?.id) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-muted-foreground">
          {!user?.id
            ? 'No hay sesión de usuario. Por favor, inicia sesión.'
            : 'No hay business_id disponible. Por favor, inicia sesión.'}
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground min-w-0">Administración de Clientes</h1>
          <p className="text-sm text-muted-foreground/60">Gestiona y visualiza la salud financiera de tu cartera de clientes.</p>
        </div>
        <div className="flex flex-wrap gap-2 sm:gap-3">
          <Button
            variant="outline"
            onClick={handleExport}
            disabled={filteredClients.length === 0}
            className="min-h-[44px] px-6 shadow-xl transition-all font-bold uppercase tracking-widest text-[10px]"
            aria-label="Exportar clientes a Excel"
          >
            <Download className="w-4 h-4 mr-2" aria-hidden="true" />
            Exportar XLS
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

      <EditClientModal
        client={editingClient}
        isOpen={!!editingClient}
        onClose={() => setEditingClient(null)}
        onSuccess={loadClients}
        totalAmount={editingClient?.total_amount}
        totalBalance={editingClient?.total_balance}
      />
    </div>
  )
}
