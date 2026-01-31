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
import { cn } from '@/shared/utils/cn'
import { Calendar, Filter, X } from 'lucide-react'
import { useEffect, useState } from 'react'

// Tonos alineados con login y panel (fondo #1a2436, superficies #2D3748, acento #2563EB)
const cardDark = 'bg-[#0f171a] border-gray-600 text-gray-200'
const inputDark =
  'bg-[#0f171a] border-gray-600 text-white placeholder:text-gray-400 data-[placeholder]:text-gray-400 focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]'
const labelDark = 'text-gray-200'
const selectContentDark = 'bg-[#0f171a] border-gray-600 text-gray-200'
const selectItemAll = 'data-[highlighted]:bg-[#2563EB]/40 text-blue-200'
const selectItemDark = 'data-[highlighted]:bg-[#2563EB]/40 text-blue-200'
const btnClear = 'border-gray-600 text-gray-300 hover:bg-[#0f171a]/10 hover:text-white'

export interface FilterValues {
  userId: string | undefined
  startDate?: string
  endDate?: string
  userEmail?: string
  clientId?: string
  payment_method?: string
  clientName?: string | undefined
}

interface FiltersBarProps {
  onFilterChange: (filters: FilterValues) => void
  availableUsers?: Array<{ id: string; name: string }>
  availableEmails?: string[]
  availableClients?: Array<{ id: string; name: string }>
  showDateFilter?: boolean
  showUserFilter?: boolean
  showClientFilter?: boolean
  showPaymentMethodFilter?: boolean
  isRecaudoPage?: boolean
}

export default function FiltersBar({
  onFilterChange,
  availableUsers: _availableUsers,
  availableEmails: _availableEmails,
  availableClients = [],
  showDateFilter = true,
  showUserFilter: _showUserFilter = true,
  showClientFilter = true,
  showPaymentMethodFilter = true,
  isRecaudoPage = false
}: FiltersBarProps) {
  const [filters, setFilters] = useState<FilterValues>({
    startDate: undefined,
    endDate: undefined,
    userId: undefined,
    clientId: undefined,
    payment_method: undefined
  })

  // Sincronizar estado inicial con el padre para que "Todos" (sin filtros) muestre datos desde el primer load
  useEffect(() => {
    onFilterChange({
      startDate: undefined,
      endDate: undefined,
      userId: undefined,
      clientId: undefined,
      payment_method: undefined
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
      userId: undefined,
      clientId: undefined,
      payment_method: undefined
    }
    setFilters(clearedFilters)
    onFilterChange(clearedFilters)
  }

  const hasActiveFilters =
    filters.startDate ||
    filters.endDate ||
    filters.userId ||
    filters.clientId ||
    filters.payment_method

  return (
    <Card className={cn('mb-6', cardDark)}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold text-white">
            <Filter className="w-5 h-5 text-[#2563EB]" aria-hidden />
            Filtros
          </CardTitle>
          {hasActiveFilters && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleClearFilters}
              className={btnClear}
              aria-label="Limpiar todos los filtros"
            >
              <X className="w-4 h-4 mr-1" aria-hidden="true" />
              Limpiar
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {showDateFilter && (
            <>
              <div className="space-y-2">
                <Label htmlFor="startDate" className={cn('flex items-center gap-1.5', labelDark)}>
                  <Calendar className="w-4 h-4 text-gray-400" aria-hidden />
                  Fecha Inicio
                </Label>
                <Input
                  id="startDate"
                  type="date"
                  value={filters.startDate ?? ''}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                  className={inputDark}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate" className={cn('flex items-center gap-1.5', labelDark)}>
                  <Calendar className="w-4 h-4 text-gray-400" aria-hidden />
                  Fecha Fin
                </Label>
                <Input
                  id="endDate"
                  type="date"
                  value={filters.endDate ?? ''}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                  className={inputDark}
                  aria-label="Fecha de fin para filtrar"
                />
              </div>
            </>
          )}

          {showClientFilter && availableClients.length > 0 && (
            <div className="space-y-1">
              <Label htmlFor="clientId" className={labelDark}>
                Cliente
              </Label>
              <Select
                value={filters.clientId || '__all__'}
                onValueChange={(value) => handleFilterChange('clientId', value)}
              >
                <SelectTrigger id="clientId" className={inputDark}>
                  <SelectValue placeholder="Todos los clientes" />
                </SelectTrigger>
                <SelectContent className={selectContentDark}>
                  <SelectItem value="__all__" className={selectItemAll}>
                    Todos los clientes
                  </SelectItem>
                  {availableClients.map((client) => (
                    <SelectItem key={client.id} value={client.id} className={selectItemDark}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {showPaymentMethodFilter && isRecaudoPage && (
            <div className="space-y-1">
              <Label htmlFor="payment_method" className={labelDark}>
                Método de Pago
              </Label>
              <Select
                value={filters.payment_method || '__all__'}
                onValueChange={(value) => handleFilterChange('payment_method', value)}
              >
                <SelectTrigger id="payment_method" className={inputDark}>
                  <SelectValue placeholder="Todos los métodos de pago" />
                </SelectTrigger>
                <SelectContent className={selectContentDark}>
                  <SelectItem value="__all__" className={selectItemAll}>
                    Todos los métodos de pago
                  </SelectItem>
                  <SelectItem value="cash" className={selectItemDark}>
                    Efectivo
                  </SelectItem>
                  <SelectItem value="transfer" className={selectItemDark}>
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
