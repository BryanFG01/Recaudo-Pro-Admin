import { Button } from '@/components/ui/button'
import { Card, CardHeader } from '@/components/ui/card'
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
import { Calendar, ChevronDown, ChevronUp, Filter, X } from 'lucide-react'
import { useEffect, useState } from 'react'

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

const containerStyle = 'bg-[#0f171a]/40 border-white/5 backdrop-blur-md shadow-2xl'
const inputStyle = 'bg-white/[0.03] border-white/5 text-white placeholder:text-muted-foreground/40 focus:ring-primary/50 focus:border-primary/50'
const labelStyle = 'text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mb-2 block'

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

  useEffect(() => {
    onFilterChange({
      startDate: undefined,
      endDate: undefined,
      userId: undefined,
      clientId: undefined,
      payment_method: undefined
    })
  }, [])

  const handleFilterChange = (key: keyof FilterValues, value: string) => {
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

  const [collapsed, setCollapsed] = useState(false)

  return (
    <Card className={cn('mb-8 border transition-all duration-500 overflow-hidden group', containerStyle)}>
      <CardHeader className="p-0 border-b border-white/5">
        <div className="flex items-center justify-between px-6 py-4">
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            className="flex items-center gap-3 group/btn"
          >
            <div className="p-2 rounded-lg bg-primary/10 border border-primary/20 text-primary group-hover/btn:scale-110 transition-transform">
              <Filter className="w-4 h-4" />
            </div>
            <div className="text-left">
              <h3 className="text-sm font-bold text-white tracking-tight">Filtros Avanzados</h3>
              <p className="text-[10px] text-muted-foreground/60 font-medium uppercase tracking-wider">
                {hasActiveFilters ? 'Filtros aplicados' : 'Sin filtros activos'}
              </p>
            </div>
            {collapsed ? (
              <ChevronDown className="w-4 h-4 text-muted-foreground/40" />
            ) : (
              <ChevronUp className="w-4 h-4 text-muted-foreground/40" />
            )}
          </button>
          
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearFilters}
              className="h-8 text-[10px] font-bold uppercase tracking-widest text-error hover:bg-error/10 hover:text-error"
            >
              <X className="w-3 h-3 mr-1.5" />
              Limpiar Todo
            </Button>
          )}
        </div>
      </CardHeader>

      <div
        className={cn(
          'transition-all duration-300 ease-in-out px-6',
          collapsed ? 'max-h-0 opacity-0' : 'max-h-[500px] opacity-100 py-6'
        )}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {showDateFilter && (
            <>
              <div className="space-y-1">
                <Label htmlFor="startDate" className={labelStyle}>Desde</Label>
                <div 
                  className="relative cursor-pointer group/input"
                  onClick={() => (document.getElementById('startDate') as HTMLInputElement)?.showPicker()}
                >
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40 pointer-events-none group-hover/input:text-primary transition-colors" />
                  <Input
                    id="startDate"
                    type="date"
                    value={filters.startDate ?? ''}
                    onChange={(e) => handleFilterChange('startDate', e.target.value)}
                    className={cn(inputStyle, "pl-10 h-11 cursor-pointer")}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="endDate" className={labelStyle}>Hasta</Label>
                <div 
                  className="relative cursor-pointer group/input"
                  onClick={() => (document.getElementById('endDate') as HTMLInputElement)?.showPicker()}
                >
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40 pointer-events-none group-hover/input:text-primary transition-colors" />
                  <Input
                    id="endDate"
                    type="date"
                    value={filters.endDate ?? ''}
                    onChange={(e) => handleFilterChange('endDate', e.target.value)}
                    className={cn(inputStyle, "pl-10 h-11 cursor-pointer")}
                  />
                </div>
              </div>
            </>
          )}

          {showClientFilter && availableClients.length > 0 && (
            <div className="space-y-1">
              <Label htmlFor="clientId" className={labelStyle}>Cliente</Label>
              <Select
                value={filters.clientId || '__all__'}
                onValueChange={(value) => handleFilterChange('clientId', value)}
              >
                <SelectTrigger id="clientId" className={cn(inputStyle, "h-11")}>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent className="bg-[#0f171a] border-white/10 text-white shadow-2xl">
                  <SelectItem value="__all__" className="focus:bg-primary/20 focus:text-white">Todos</SelectItem>
                  {availableClients.map((client) => (
                    <SelectItem key={client.id} value={client.id} className="focus:bg-primary/20 focus:text-white">
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {showPaymentMethodFilter && isRecaudoPage && (
            <div className="space-y-1">
              <Label htmlFor="payment_method" className={labelStyle}>Método</Label>
              <Select
                value={filters.payment_method || '__all__'}
                onValueChange={(value) => handleFilterChange('payment_method', value)}
              >
                <SelectTrigger id="payment_method" className={cn(inputStyle, "h-11")}>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent className="bg-[#0f171a] border-white/10 text-white shadow-2xl">
                  <SelectItem value="__all__" className="focus:bg-primary/20 focus:text-white">Todos</SelectItem>
                  <SelectItem value="cash" className="focus:bg-primary/20 focus:text-white">Efectivo</SelectItem>
                  <SelectItem value="transfer" className="focus:bg-primary/20 focus:text-white">Transacción</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}
