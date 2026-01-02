import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Calendar, Filter, X } from 'lucide-react'
import { useState } from 'react'

export interface FilterValues {
  startDate?: string
  endDate?: string
  userEmail?: string
  clientId?: string
  payment_method?: string
}

interface FiltersBarProps {
  onFilterChange: (filters: FilterValues) => void
  availableEmails: string[]
  availableClients?: Array<{ id: string; name: string }>
  showDateFilter?: boolean
  showUserFilter?: boolean
  showClientFilter?: boolean
  showPaymentMethodFilter?: boolean
  isRecaudoPage?: boolean
}

export default function FiltersBar({
  onFilterChange,
  availableEmails,
  availableClients = [],
  showDateFilter = true,
  showUserFilter = true,
  showClientFilter = true,
  showPaymentMethodFilter = true,
  isRecaudoPage = false
}: FiltersBarProps) {
  const [filters, setFilters] = useState<FilterValues>({
    startDate: undefined,
    endDate: undefined,
    userEmail: undefined,
    clientId: undefined,
    payment_method: undefined
  })

  const handleFilterChange = (key: keyof FilterValues, value: string) => {
    // Convertir valor especial "__all__" a undefined
    const normalizedValue = value === '__all__' ? undefined : value
    const newFilters = { ...filters, [key]: normalizedValue }
    setFilters(newFilters)
    onFilterChange(newFilters)
  }

  const handleClearFilters = () => {
    const clearedFilters: FilterValues = {
      startDate: undefined,
      endDate: undefined,
      userEmail: undefined,
      clientId: undefined,
      payment_method: undefined
    }
    setFilters(clearedFilters)
    onFilterChange(clearedFilters)
  }

  const hasActiveFilters =
    filters.startDate ||
    filters.endDate ||
    filters.userEmail ||
    filters.clientId ||
    filters.payment_method

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtros
          </CardTitle>
          {hasActiveFilters && (
            <Button variant="outline" size="sm" onClick={handleClearFilters}>
              <X className="w-4 h-4 mr-1" />
              Limpiar
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {showDateFilter && (
            <>
              <div className="space-y-2">
                <Label htmlFor="startDate" className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  Fecha Inicio
                </Label>
                <Input
                  id="startDate"
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate" className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  Fecha Fin
                </Label>
                <Input
                  id="endDate"
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                />
              </div>
            </>
          )}

          {showUserFilter && (
            <div className="space-y-2 ">
              <Label htmlFor="userEmail" className="flex items-center gap-1">
                Vendedor (Email)
              </Label>
              <Select
                value={filters.userEmail || '__all__'}
                onValueChange={(value) => handleFilterChange('userEmail', value)}
              >
                <SelectTrigger id="userEmail">
                  <SelectValue placeholder="Todos los vendedores" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem
                    value="__all__"
                    className="flex items-center gap-1 bg-blue-300 text-white hover:bg-blue-400"
                  >
                    Todos los vendedores
                  </SelectItem>
                  {availableEmails.map((email) => (
                    <SelectItem key={email} value={email}>
                      {email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {showClientFilter && availableClients.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="clientId" className="flex items-center gap-1">
                Cliente
              </Label>
              <Select
                value={filters.clientId || '__all__'}
                onValueChange={(value) => handleFilterChange('clientId', value)}
              >
                <SelectTrigger id="clientId">
                  <SelectValue placeholder="Todos los clientes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem
                    value="__all__"
                    className="flex items-center gap-1 bg-blue-300 text-white hover:bg-blue-400"
                  >
                    Todos los clientes
                  </SelectItem>
                  {availableClients.map((client) => (
                    <SelectItem
                      key={client.id}
                      value={client.id}
                      className="flex items-center gap-1 hover:bg-blue-100 bg-white"
                    >
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* medoto de pago  solo para recaudos*/}
          {showPaymentMethodFilter && isRecaudoPage && (
            <div className="space-y-2">
              <Label htmlFor="payment_method" className="flex items-center gap-1">
                Método de Pago
              </Label>
              <Select
                value={filters.payment_method || '__all__'}
                onValueChange={(value) => handleFilterChange('payment_method', value)}
              >
                <SelectTrigger id="payment_method">
                  <SelectValue placeholder="Todos los métodos de pago" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem
                    value="__all__"
                    className="flex items-center gap-1 bg-blue-300 text-white hover:bg-blue-400"
                  >
                    Todos los métodos de pago
                  </SelectItem>
                  <SelectItem
                    value="cash"
                    className="flex items-center gap-1 hover:bg-blue-100 bg-white"
                  >
                    Efectivo
                  </SelectItem>
                  <SelectItem
                    value="transfer"
                    className="flex items-center gap-1 hover:bg-blue-100 bg-white"
                  >
                    Transacción
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
