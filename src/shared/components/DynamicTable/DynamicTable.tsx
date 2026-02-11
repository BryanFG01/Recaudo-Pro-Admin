import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table'
import { cn } from '@/shared/utils/cn'
import { ReactNode } from 'react'

export interface Column<T> {
  key: string
  header: string
  render?: (item: T) => ReactNode
  sortable?: boolean
  className?: string
  isNumeric?: boolean
}

interface DynamicTableProps<T> {
  data: T[]
  columns: Column<T>[]
  isLoading?: boolean
  error?: string | null
  emptyMessage?: string
  onRowClick?: (item: T) => void
  className?: string
}

export default function DynamicTable<T extends Record<string, any>>({
  data,
  columns,
  isLoading = false,
  error = null,
  emptyMessage = 'No hay datos disponibles',
  onRowClick,
  className
}: DynamicTableProps<T>) {
  const containerStyle = 'bg-card border-border backdrop-blur-sm'

  if (isLoading) {
    return (
      <Card className={cn('flex flex-col h-full overflow-hidden border', containerStyle, className)}>
        <div className="p-6 space-y-4" role="status" aria-live="polite">
          <div className="flex gap-4 mb-4">
            {columns.map((col) => (
              <Skeleton key={col.key} className="h-6 flex-1" />
            ))}
          </div>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="flex gap-4">
              {columns.map((col) => (
                <Skeleton key={col.key} className="h-4 flex-1 opacity-50" />
              ))}
            </div>
          ))}
        </div>
        <span className="sr-only">Cargando datos de la tabla...</span>
      </Card>
    )
  }

  if (error) {
    return (
      <Alert
        variant="destructive"
        className={cn('bg-error/10 border-error/20 text-error shadow-lg', className)}
        role="alert"
        aria-live="assertive"
      >
        <AlertDescription className="font-medium">{error}</AlertDescription>
      </Alert>
    )
  }

  if (data.length === 0) {
    return (
      <Card className={cn('flex flex-col h-full items-center justify-center p-20 border', containerStyle, className)}>
        <div className="text-center space-y-3">
          <div className="inline-flex p-3 rounded-full bg-muted border border-border mb-2">
            <svg className="w-6 h-6 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.58 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.58 4 8 4s8-1.79 8-4M4 7c0-2.21 3.58-4 8-4s8 1.79 8 4m0 5c0 2.21-3.58 4-8 4s-8-1.79-8-4" />
            </svg>
          </div>
          <p className="text-sm font-semibold text-muted-foreground tracking-tight">{emptyMessage}</p>
        </div>
      </Card>
    )
  }

  return (
    <Card className={cn('flex flex-col h-full overflow-hidden border shadow-xl relative group', containerStyle, className)}>
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-border to-transparent pointer-events-none" />
      
      <div
        className="overflow-x-auto overflow-y-auto flex-1 custom-scrollbar"
        style={{ maxHeight: 'calc(100vh - 350px)' }}
      >
        <Table role="table" aria-label="Tabla de datos">
          <TableHeader className="sticky top-0 z-20 bg-muted/80 backdrop-blur-md shadow-sm border-b border-border">
            <TableRow className="hover:bg-transparent border-b border-border">
              {columns.map((column) => (
                <TableHead
                  key={column.key}
                  className={cn(
                    'h-12 px-4 text-[10px] uppercase font-black tracking-[0.15em] text-muted-foreground transition-colors',
                    column.className
                  )}
                  scope="col"
                >
                  {column.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((item, index) => (
              <TableRow
                key={index}
                onClick={() => onRowClick?.(item)}
                className={cn(
                  'border-b border-border transition-all duration-200 hover:bg-accent/50',
                  onRowClick && 'cursor-pointer active:scale-[0.99] active:bg-accent'
                )}
                role={onRowClick ? 'button' : 'row'}
                tabIndex={onRowClick ? 0 : undefined}
                onKeyDown={(e) => {
                  if (onRowClick && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault()
                    onRowClick(item)
                  }
                }}
              >
                {columns.map((column, colIndex) => (
                  <TableCell
                    key={`${index}-${column.key}`}
                    className={cn(
                      'px-4 py-3.5 text-sm font-medium transition-colors',
                      colIndex === 0 ? 'text-foreground' : 'text-muted-foreground',
                      column.isNumeric && 'tabular-nums font-bold text-foreground tracking-tight',
                      column.className
                    )}
                  >
                    {column.render ? column.render(item) : String(item[column.key] ?? '')}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      
      <div className="absolute inset-x-0 bottom-0 h-4 bg-gradient-to-t from-card to-transparent pointer-events-none" />
    </Card>
  )
}
