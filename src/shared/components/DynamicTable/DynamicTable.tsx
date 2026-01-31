import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent } from '@/components/ui/card'
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
  const cardDark = 'bg-[#0f171a] border-gray-600 text-gray-200'

  if (isLoading) {
    return (
      <Card className={cn('flex flex-col h-full', cardDark, className)}>
        <CardContent className="p-6">
          <div className="space-y-3" role="status" aria-live="polite">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex gap-4">
                {columns.map((col) => (
                  <Skeleton key={col.key} className="h-4 flex-1 bg-gray-600" />
                ))}
              </div>
            ))}
          </div>
          <span className="sr-only">Cargando datos de la tabla...</span>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Alert
        variant="destructive"
        className={cn('bg-red-900/50 border-red-700/60 text-red-200', className)}
        role="alert"
        aria-live="assertive"
      >
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  if (data.length === 0) {
    return (
      <Card className={cn('flex flex-col h-full', cardDark, className)}>
        <CardContent className="p-12 text-center">
          <p className="text-gray-400">{emptyMessage}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn('flex flex-col h-full overflow-hidden', cardDark, className)}>
      <div
        className="overflow-x-auto overflow-y-auto flex-1"
        style={{ maxHeight: 'calc(100vh - 350px)' }}
      >
        <Table role="table" aria-label="Tabla de datos">
          <TableHeader className="sticky top-0 z-10 bg-[#1a2436] border-b border-gray-600">
            <TableRow className="border-gray-700 hover:bg-transparent">
              {columns.map((column) => (
                <TableHead
                  key={column.key}
                  className={cn('uppercase text-gray-400 font-medium', column.className)}
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
                className={cn('border-gray-700 hover:bg-white/5', onRowClick && 'cursor-pointer')}
                role={onRowClick ? 'button' : 'row'}
                tabIndex={onRowClick ? 0 : undefined}
                onKeyDown={(e) => {
                  if (onRowClick && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault()
                    onRowClick(item)
                  }
                }}
                aria-label={
                  onRowClick ? `Fila ${index + 1}, hacer clic para ver detalles` : undefined
                }
              >
                {columns.map((column) => (
                  <TableCell
                    key={column.key}
                    className={cn('whitespace-nowrap text-gray-200', column.className)}
                  >
                    {column.render ? column.render(item) : String(item[column.key] ?? '')}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  )
}
