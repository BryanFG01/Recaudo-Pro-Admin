import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
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

// Mismos tonos que FiltersBar y login (panel oscuro)
const cardDark = 'bg-[#2D3748] border-gray-600 text-gray-200'
const inputDark =
  'bg-[#2D3748] border-gray-600 text-white data-[placeholder]:text-gray-400 focus:ring-2 focus:ring-[#2563EB] focus-visible:ring-2 focus-visible:ring-[#2563EB]'
const labelDark = 'text-gray-200'
const selectContentDark = 'bg-[#2D3748] border-gray-600 text-gray-200'
const selectItemAll = 'data-[highlighted]:bg-[#2563EB]/40 text-blue-200'
const selectItemDark = 'text-gray-200 data-[highlighted]:bg-white/10'

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
      className: 'font-medium'
    },
    {
      key: 'phone',
      header: 'Teléfono'
    },
    {
      key: 'total_credits',
      header: 'Total Préstamos',
      render: (client) => <span className="font-semibold">{client.total_credits}</span>
    },
    {
      key: 'total_amount',
      header: 'Monto Total',
      render: (client) => formatCurrency(client.total_amount)
    },
    {
      key: 'total_paid',
      header: 'Total pagado',
      render: (client) => (
        <span className="font-semibold text-green-300">
          {formatCurrency(client.total_paid != null && !Number.isNaN(Number(client.total_paid)) ? client.total_paid : 0)}
        </span>
      )
    },
    {
      key: 'total_balance',
      header: 'Saldo Pendiente',
      render: (client) => {
        const raw = client.total_balance
        const balance = raw != null && !Number.isNaN(Number(raw)) ? Number(raw) : 0
        return (
          <span
            className={balance > 0 ? 'text-red-300 font-semibold' : 'text-green-300 font-semibold'}
          >
            {formatCurrency(balance)}
          </span>
        )
      }
    },
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
    }
  ]

  if (!currentBusinessId || !user?.id) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">
          {!user?.id
            ? 'No hay sesión de usuario. Por favor, inicia sesión.'
            : 'No tienes un negocio asignado.'}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Administración de Clientes</h1>
        <Button
          onClick={handleExport}
          disabled={filteredClients.length === 0}
          className="flex items-center gap-2 border-gray-600 text-gray-300 hover:bg-white/10 hover:border-gray-500 hover:text-white"
        >
          <Download className="w-4 h-4" />
          Exportar a Excel
        </Button>
      </div>

      <Card className={cardDark}>
        <CardContent className="pt-6">
          <div className="flex gap-4 items-end flex-wrap">
            <div className="flex-1 min-w-[200px] space-y-2">
              <Label htmlFor="emailFilter" className={`flex items-center gap-1.5 ${labelDark}`}>
                <Filter className="w-4 h-4 text-[#2563EB]" aria-hidden />
                Filtrar por nombre
              </Label>
              <Select
                value={selectedEmail || '__all__'}
                onValueChange={(v) => setSelectedEmail(v === '__all__' ? '' : v)}
              >
                <SelectTrigger id="emailFilter" className={inputDark}>
                  <SelectValue placeholder="Todos los nombres" />
                </SelectTrigger>
                <SelectContent className={selectContentDark}>
                  <SelectItem value="__all__" className={selectItemAll}>
                    Todos los nombres
                  </SelectItem>
                  {availableEmails.map((email) => (
                    <SelectItem key={email} value={email} className={selectItemDark}>
                      {email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <p className="text-sm text-gray-400 shrink-0">
              Mostrando {filteredClients.length} de {clients.length} clientes
            </p>
          </div>
        </CardContent>
      </Card>

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
