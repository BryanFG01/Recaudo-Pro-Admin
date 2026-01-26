import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAuthStore } from '@/features/auth/presentation/store/authStore'
import { Column, DynamicTable } from '@/shared/components/DynamicTable'
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
    if (currentBusinessId && user?.id) {
      loadClients()
    }
  }, [currentBusinessId, user?.id, businessCode])

  useEffect(() => {
    if (selectedEmail) {
      setFilteredClients(clients.filter(c => c.user_email === selectedEmail))
    } else {
      setFilteredClients(clients)
    }
  }, [selectedEmail, clients])

  const loadClients = async () => {
    if (!currentBusinessId || !user?.id) return

    setIsLoading(true)
    setError(null)

    try {
      const data = await clientService.getClientsWithCredits(currentBusinessId, user.id, undefined, businessCode ?? undefined, user.number ?? undefined)
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
          <span className={balance > 0 ? 'text-red-300 font-semibold' : 'text-green-300 font-semibold'}>
            {formatCurrency(balance)}
          </span>
        )
      },
    },
    {
      key: 'user_email',
      header: 'Email Gestor',
      render: (client) => (
        <span className="text-sm text-gray-300">{client.user_email || 'N/A'}</span>
      ),
    },
  ]

  if (!currentBusinessId || !user?.id) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">
          {!user?.id ? 'No hay sesión de usuario. Por favor, inicia sesión.' : 'No tienes un negocio asignado.'}
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

