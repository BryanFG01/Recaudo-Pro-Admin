import { LoadingScreen } from '@/shared/components/LoadingScreen/LoadingScreen'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { cn } from '@/shared/utils/cn'
import { User } from '@/features/auth/domain/models'
import { useAuth } from '@/features/auth/presentation/hooks/useAuth'
import { useAuthStore } from '@/features/auth/presentation/store/authStore'
import { CreditRepository } from '@/features/credits/infrastructure/repositories/CreditRepository'
import { CreditService } from '@/features/credits/domain/services/CreditService'
import { CreditSummary } from '@/features/credits/domain/models'
import { Column, DynamicTable } from '@/shared/components/DynamicTable'
import { formatCurrency } from '@/shared/utils/date'
import { exportToExcel } from '@/shared/utils/excel'
import { Download, Filter } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { ClientWithCredits } from '../../domain/models'
import { ClientService } from '../../domain/services/ClientService'
import { ClientRepository } from '../../infrastructure/repositories/ClientRepository'


export default function AdminClientsPage() {
  const { user, businessId, businessCode } = useAuthStore()
  const { getUsersByBusinessId } = useAuth()
  const [clients, setClients] = useState<ClientWithCredits[]>([])
  const [filteredClients, setFilteredClients] = useState<ClientWithCredits[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedEmail, setSelectedEmail] = useState<string>('')
  const [availableEmails, setAvailableEmails] = useState<string[]>([])
  const [usersList, setUsersList] = useState<User[]>([])

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
  }, [currentBusinessId, user?.id, businessCode])

  const loadUsers = async () => {
    if (!currentBusinessId) return
    try {
      const users = await getUsersByBusinessId(currentBusinessId)
      setUsersList(users)
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

  useEffect(() => {
    if (selectedEmail) {
      setFilteredClients(clients.filter((c) => c.user_email === selectedEmail))
    } else {
      setFilteredClients(clients)
    }
  }, [selectedEmail, clients])

  const loadClients = async () => {
    if (!currentBusinessId || !user?.id) return

    setIsLoading(true)
    setError(null)

    try {
      const [clientsFromApi, credits] = await Promise.all([
        clientService.getClientsWithCredits(
          currentBusinessId,
          user.id,
          undefined,
          businessCode ?? undefined,
          user.number ?? undefined
        ),
        creditService.getCreditsByBusinessId(currentBusinessId)
      ])

      // Saldos reales desde GET /api/credits/summary/:id (la lista a veces trae total_balance en 0)
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

      // Enriquecer cada cliente con totales de sus créditos (desde summary: total_paid sube y total_balance baja al abonar)
      const enriched: ClientWithCredits[] = clientsFromApi.map((client) => {
        const clientCredits = credits.filter((c) => c.client_id === client.id)
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

      // Extraer emails únicos para el filtro
      const emails = [...new Set(enriched.map((c) => c.user_email).filter(Boolean))] as string[]
      setAvailableEmails(emails)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar clientes')
    } finally {
      setIsLoading(false)
    }
  }

  const handleExport = () => {
    const exportData = filteredClients.map((client) => {
      const saldo = client.total_balance != null && !Number.isNaN(Number(client.total_balance)) ? Number(client.total_balance) : 0
      const pagado = client.total_paid != null && !Number.isNaN(Number(client.total_paid)) ? Number(client.total_paid) : 0
      return {
      Nombre: client.name,
      Teléfono: client.phone,
      'Asignado a': client.user_id
        ? (userNameById[client.user_id] ?? client.user_email ?? 'N/A')
        : client.user_email || 'N/A',
      'Total Préstamos': client.total_credits,
      'Monto Total': formatCurrency(client.total_amount),
      'Total pagado': formatCurrency(pagado),
      'Saldo Pendiente': formatCurrency(saldo),
      Documento: client.document_id || 'N/A'
    }
    })

    exportToExcel(exportData, {
      filename: `clientes_${new Date().toISOString().split('T')[0]}`,
      sheetName: 'Clientes'
    })
  }

  const columns: Column<ClientWithCredits>[] = [
    {
      key: 'name',
      header: 'Nombre',
      className: 'font-black tracking-tight',
      render: (client) => (
        <span className="text-foreground font-black uppercase text-sm">{client.name}</span>
      )
    },
    {
      key: 'phone',
      header: 'Teléfono',
      className: 'text-muted-foreground/60 font-medium'
    },
    {
      key: 'user_id',
      header: 'Asignado a',
      render: (client) => (
        <span className="text-[11px] font-black uppercase tracking-widest text-info/80 bg-info/5 px-2.5 py-1 rounded-lg border border-info/10">
          {client.user_id
            ? (userNameById[client.user_id] ?? client.user_email ?? 'Sin asignar')
            : client.user_email || 'Sin asignar'}
        </span>
      )
    },
    {
      key: 'document_id',
      header: 'Documento',
      className: 'text-muted-foreground/40 font-mono text-[11px]',
      render: (client) => client.document_id || 'N/A'
    },
    {
      key: 'total_credits',
      header: 'Préstamos',
      className: 'text-center',
      render: (client) => (
        <span className="size-8 inline-flex items-center justify-center rounded-full bg-muted/30 border border-border/50 text-xs font-black">
            {client.total_credits}
        </span>
      )
    },
    {
      key: 'total_amount',
      header: 'Monto Total',
      isNumeric: true,
      render: (client) => (
        <span className="font-bold text-foreground tracking-tight">
            {formatCurrency(client.total_amount)}
        </span>
      )
    },
    {
      key: 'total_paid',
      header: 'Monto Pagado',
      isNumeric: true,
      render: (client) => {
        const value = client.total_paid != null && !Number.isNaN(Number(client.total_paid)) ? Number(client.total_paid) : 0
        return (
          <span className="font-bold text-success tracking-tight">
            {formatCurrency(value)}
          </span>
        )
      }
    },
    {
      key: 'total_balance',
      header: 'Saldo Pendiente',
      isNumeric: true,
      render: (client) => {
        const balance = client.total_balance != null && !Number.isNaN(Number(client.total_balance)) ? Number(client.total_balance) : 0
        return (
          <span
            className={cn(
              'px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all duration-300',
              balance === 0 
                ? 'bg-success/5 text-success border-success/20' 
                : 'bg-error/5 text-error border-error/20'
            )}
          >
            {formatCurrency(balance)}
          </span>
        )
      }
    }
  ]

  if (!currentBusinessId || !user?.id || isLoading) {
    return <LoadingScreen message="Sincronizando Módulo Administrativo" />
  }

  return (
    <div className="flex flex-col h-full space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-700">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border/10 pb-6 mb-2">
        <div className="space-y-1">
          <h1 className="text-3xl font-black tracking-tight text-foreground uppercase">Administración de Clientes</h1>
          <p className="text-sm font-semibold text-muted-foreground/70 uppercase tracking-widest">
            Gestiona y visualiza la salud financiera de tu cartera
          </p>
        </div>
        <Button
          onClick={handleExport}
          disabled={filteredClients.length === 0}
          className="h-11 px-6 font-bold uppercase tracking-[0.1em] text-[11px] border-border hover:bg-accent rounded-xl"
          variant="outline"
        >
          <Download className="w-4 h-4 mr-2" />
          Exportar XLS
        </Button>
      </div>

      <div className="bg-card/40 border border-border/40 rounded-3xl p-6 backdrop-blur-xl shadow-2xl">
          <div className="flex gap-6 items-end flex-wrap">
            <div className="flex-1 min-w-[240px] space-y-3">
              <Label htmlFor="emailFilter" className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-muted-foreground/60">
                <Filter className="w-3.5 h-3.5 text-primary" aria-hidden />
                Filtros Avanzados
              </Label>
              <Select
                value={selectedEmail || '__all__'}
                onValueChange={(v) => setSelectedEmail(v === '__all__' ? '' : v)}
              >
                <SelectTrigger id="emailFilter" className="bg-muted/20 border border-border/50 text-foreground placeholder:text-muted-foreground focus:bg-card focus:ring-2 focus:ring-primary/20 focus:border-primary h-11 rounded-xl">
                  <SelectValue placeholder="Seleccionar colaborador" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border shadow-2xl rounded-xl">
                  <SelectItem value="__all__" className="text-foreground/70 focus:bg-accent focus:text-foreground">
                    Todos los colaboradores
                  </SelectItem>
                  {availableEmails.map((email) => (
                    <SelectItem key={email} value={email} className="text-foreground/70 focus:bg-accent focus:text-foreground">
                      {email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2 bg-muted/20 px-4 py-2.5 rounded-xl border border-border/50">
                <div className="size-1.5 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(56,189,248,0.5)]" />
                <p className="text-[10px] font-bold uppercase text-muted-foreground/60 tracking-widest">
                {selectedEmail ? `RESULTADOS FILTRADOS: ${filteredClients.length}` : `MOSTRANDO TODOS: ${clients.length}`}
                </p>
            </div>
          </div>
      </div>

      <DynamicTable
        data={filteredClients}
        columns={columns}
        isLoading={isLoading}
        error={error}
        emptyMessage="No hay clientes disponibles"
        className="rounded-3xl"
        variant="premium-dark"
      />
    </div>
  )
}
