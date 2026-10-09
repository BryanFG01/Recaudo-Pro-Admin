import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card } from '@/components/ui/card'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table'
import { RefreshCw, Search, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/shared/utils/cn'
import { ReactNode, useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'

export interface Column<T> {
  key: string
  header: string
  render?: (item: T) => ReactNode
  sortable?: boolean
  className?: string
  isNumeric?: boolean
  fixed?: 'left' | 'right'
}

interface DynamicTableProps<T> {
  data: T[]
  columns: Column<T>[]
  isLoading?: boolean
  error?: string | null
  emptyMessage?: string
  onRowClick?: (item: T) => void
  className?: string
  /** @deprecated El diseño es único (DESIGN.MD); se mantiene por compatibilidad. */
  variant?: 'default' | 'premium-dark'
  rowsPerPage?: number
}

const visiblePages = (total: number, current: number): number[] =>
  Array.from({ length: total }, (_, i) => i + 1)
    .filter(p => p === 1 || p === total || Math.abs(p - current) <= 1)

export default function DynamicTable<T extends Record<string, any>>({
  data,
  columns,
  isLoading = false,
  error = null,
  emptyMessage = 'No hay datos disponibles',
  onRowClick,
  className,
  rowsPerPage = 10
}: Readonly<DynamicTableProps<T>>) {
  const [currentPage, setCurrentPage] = useState(1)

  const totalPages = Math.ceil(data.length / rowsPerPage)

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage
    return data.slice(start, start + rowsPerPage)
  }, [data, currentPage, rowsPerPage])

  if (isLoading) {
    return (
      <Card className={cn('flex h-[400px] flex-col items-center justify-center gap-4', className)}>
        <RefreshCw className="size-8 animate-spin text-foreground" />
        <p className="text-sm text-muted-foreground">Cargando datos...</p>
      </Card>
    )
  }

  if (error) {
    return (
      <Alert
        variant="destructive"
        className={cn('rounded-card border-0 bg-error/10 text-error', className)}
        role="alert"
        aria-live="assertive"
      >
        <AlertDescription className="text-sm">{error}</AlertDescription>
      </Alert>
    )
  }

  if (data.length === 0) {
    return (
      <Card className={cn('flex h-[400px] flex-col items-center justify-center p-12 text-center', className)}>
        <div className="mb-6 flex size-14 items-center justify-center rounded-tag bg-secondary">
          <Search className="size-6 text-muted-foreground" />
        </div>
        <p className="max-w-[280px] text-sm leading-relaxed text-muted-foreground">
          {emptyMessage}
        </p>
      </Card>
    )
  }

  return (
    <Card className={cn('relative flex h-full flex-col overflow-hidden', className)}>
      <div className="custom-scrollbar relative flex-1 overflow-auto">
        <Table role="table" aria-label="Tabla de datos">
          <TableHeader className="sticky top-0 z-30 bg-secondary">
            <TableRow className="border-none hover:bg-transparent">
              {columns.map((column, idx) => {
                const isLast = idx === columns.length - 1
                return (
                  <TableHead
                    key={column.key}
                    className={cn(
                      'h-12 whitespace-nowrap px-6 text-sm font-medium text-muted-foreground',
                      column.className,
                      isLast && 'sticky right-0 z-50 border-l border-border bg-secondary'
                    )}
                    scope="col"
                  >
                    {column.header}
                  </TableHead>
                )
              })}
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-border">
            {paginatedData.map((item, index) => (
              <TableRow
                key={index}
                onClick={() => onRowClick?.(item)}
                className={cn('group/row border-none transition-colors hover:bg-secondary/70', onRowClick && 'cursor-pointer')}
                role={onRowClick ? 'button' : 'row'}
              >
                {columns.map((column, colIndex) => {
                  const isLast = colIndex === columns.length - 1
                  return (
                    <TableCell
                      key={`${index}-${column.key}`}
                      className={cn(
                        'whitespace-nowrap px-6 py-4 text-[13px] transition-colors',
                        colIndex === 0 ? 'font-medium text-foreground' : 'text-muted-foreground',
                        column.isNumeric && 'text-right tabular-nums text-foreground',
                        column.className,
                        isLast && 'sticky right-0 z-20 border-l border-border bg-card group-hover/row:bg-secondary'
                      )}
                    >
                      {column.render ? column.render(item) : String(item[column.key] ?? '')}
                    </TableCell>
                  )
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Paginación */}
      <div className="flex items-center justify-between border-t border-border bg-card px-6 py-4">
        <p className="text-sm tabular-nums text-muted-foreground">
          Mostrando {Math.min(data.length, (currentPage - 1) * rowsPerPage + 1)}-{Math.min(data.length, currentPage * rowsPerPage)} de {data.length}
        </p>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={currentPage === 1}
            className="h-9 px-3 disabled:opacity-30"
            aria-label="Página anterior"
          >
            <ChevronLeft className="size-4" />
          </Button>

          <div className="flex items-center gap-1">
            {visiblePages(totalPages, currentPage).map((p, i, arr) => {
              const prev = arr[i - 1]
              return (
                <div key={p} className="flex items-center gap-1">
                  {prev && p - prev > 1 && (
                    <span className="px-1 tabular-nums text-xs text-muted-foreground">...</span>
                  )}
                  <button
                    onClick={() => setCurrentPage(p)}
                    className={cn(
                      'size-9 rounded-lg text-sm font-medium tabular-nums transition-colors',
                      currentPage === p
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                    )}
                  >
                    {p}
                  </button>
                </div>
              )
            })}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="h-9 px-3 disabled:opacity-30"
            aria-label="Página siguiente"
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>
    </Card>
  )
}
