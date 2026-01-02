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
  if (isLoading) {
    return (
      <Card className={cn('flex flex-col h-full', className)}>
        <CardContent className="p-6">
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex gap-4">
                {columns.map((col) => (
                  <Skeleton key={col.key} className="h-4 flex-1" />
                ))}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive" className={className}>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  if (data.length === 0) {
    return (
      <Card className={cn('flex flex-col h-full', className)}>
        <CardContent className="p-12 text-center">
          <p className="text-muted-foreground">{emptyMessage}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn('flex flex-col h-full overflow-hidden', className)}>
      <div
        className="overflow-x-auto overflow-y-auto flex-1"
        style={{ maxHeight: 'calc(100vh - 350px)' }}
      >
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-muted/50">
            <TableRow>
              {columns.map((column) => (
                <TableHead key={column.key} className={cn('uppercase', column.className)}>
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
                className={cn(onRowClick && 'cursor-pointer')}
              >
                {columns.map((column) => (
                  <TableCell key={column.key} className={cn('whitespace-nowrap', column.className)}>
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
