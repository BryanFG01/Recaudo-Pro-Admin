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
  variant?: 'default' | 'premium-dark'
  rowsPerPage?: number
}

export default function DynamicTable<T extends Record<string, any>>({
  data,
  columns,
  isLoading = false,
  error = null,
  emptyMessage = 'No hay datos disponibles',
  onRowClick,
  className,
  variant = 'default',
  rowsPerPage: initialRowsPerPage = 10
}: DynamicTableProps<T>) {
  const isDark = variant === 'premium-dark'
  const [currentPage, setCurrentPage] = useState(1)
  const rowsPerPage = initialRowsPerPage

  const totalPages = Math.ceil(data.length / rowsPerPage)
  
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage
    return data.slice(start, start + rowsPerPage)
  }, [data, currentPage, rowsPerPage])

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  if (isLoading) {
    return (
      <Card className={cn(
        'flex flex-col h-[400px] items-center justify-center gap-4 transition-all duration-700',
        isDark ? 'bg-card/50 backdrop-blur-xl border-none shadow-2xl rounded-2xl' : 'bg-card border-border/50 shadow-lg rounded-2xl',
        className
      )}>
        <div className="relative">
          <div className="absolute inset-0 blur-xl bg-primary/20 rounded-full animate-pulse" />
          <RefreshCw className="size-10 animate-spin text-primary/60 relative z-10" />
        </div>
        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] animate-pulse">Sincronizando tabla...</p>
      </Card>
    )
  }

  if (error) {
    return (
      <Alert
        variant="destructive"
        className={cn('bg-error/10 border-error/20 text-error shadow-2xl rounded-2xl', className)}
        role="alert"
        aria-live="assertive"
      >
        <AlertDescription className="font-bold text-[11px] uppercase tracking-widest">{error}</AlertDescription>
      </Alert>
    )
  }

  if (data.length === 0) {
    return (
      <Card className={cn(
        'flex flex-col h-[400px] items-center justify-center p-12 text-center transition-all duration-700',
        isDark ? 'bg-card/50 backdrop-blur-xl border-none shadow-2xl rounded-2xl' : 'bg-card border-border/50 shadow-lg rounded-2xl',
        className
      )}>
        <div className="size-16 rounded-3xl bg-muted/20 flex items-center justify-center mb-6 border border-border/10">
          <Search className="size-7 text-muted-foreground/30" />
        </div>
        <p className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.3em] max-w-[240px] leading-relaxed">
          {emptyMessage}
        </p>
      </Card>
    )
  }

  return (
    <Card className={cn('flex flex-col h-full overflow-hidden border-none bg-card/50 backdrop-blur-xl shadow-2xl rounded-2xl relative group', className)}>
      <div className="relative flex-1 overflow-auto custom-scrollbar">
        <Table role="table" aria-label="Tabla de datos">
          <TableHeader className={cn(
            "sticky top-0 z-30 transition-colors",
            isDark 
              ? "bg-zinc-100/95 dark:bg-[#18181b]/95 backdrop-blur-xl border-b border-border/50 dark:border-white/5" 
              : "bg-white/95 backdrop-blur-xl border-b border-border/50"
          )}>
            <TableRow className="hover:bg-transparent border-none">
              {columns.map((column, idx) => {
                const isLast = idx === columns.length - 1;
                return (
                  <TableHead
                    key={column.key}
                    className={cn(
                      'h-12 px-6 text-[10px] font-black uppercase tracking-widest transition-colors whitespace-nowrap',
                      isDark ? 'text-muted-foreground/60' : 'text-muted-foreground/70',
                      column.className,
                      isLast && cn(
                        'sticky right-0 z-50 shadow-[-12px_0_15px_-10px_rgba(0,0,0,0.1)] dark:shadow-[-12px_0_15px_-10px_rgba(0,0,0,0.5)] border-l border-border/50 dark:border-white/5',
                        isDark ? 'bg-zinc-100 dark:bg-[#18181b]' : 'bg-white'
                      )
                    )}
                    scope="col"
                  >
                    {column.header}
                  </TableHead>
                );
              })}
            </TableRow>
          </TableHeader>
          <TableBody className={cn("divide-y", isDark ? "divide-border/20" : "divide-border/10")}>
            {paginatedData.map((item, index) => (
              <TableRow
                key={index}
                onClick={() => onRowClick?.(item)}
                className={cn(
                  'border-none transition-colors group/row',
                  isDark ? 'hover:bg-white/[0.02]' : 'hover:bg-muted/30',
                  onRowClick && 'cursor-pointer'
                )}
                role={onRowClick ? 'button' : 'row'}
              >
                {columns.map((column, colIndex) => {
                  const isLast = colIndex === columns.length - 1;
                  return (
                    <TableCell
                      key={`${index}-${column.key}`}
                      className={cn(
                        'px-6 py-4 text-[13px] transition-colors whitespace-nowrap',
                        isDark 
                          ? (colIndex === 0 ? 'text-foreground font-black tracking-tight' : 'text-foreground/80 font-medium') 
                          : (colIndex === 0 ? 'text-foreground font-black tracking-tight' : 'text-muted-foreground/80 font-medium'),
                        column.isNumeric && 'tabular-nums font-black tracking-tighter text-right',
                        column.className,
                        isLast && cn(
                            'sticky right-0 z-20 shadow-[-12px_0_15_rgba(0,0,0,0.1)] dark:shadow-[-12px_0_15px_-10px_rgba(0,0,0,0.5)] border-l border-border/50 dark:border-white/5',
                            isDark 
                              ? 'bg-card group-hover/row:bg-muted/50 dark:bg-[#121214] dark:group-hover/row:bg-[#1a1a1c]' 
                              : 'bg-white group-hover/row:bg-muted/30'
                        )
                      )}
                    >
                      {column.render ? column.render(item) : String(item[column.key] ?? '')}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Footer Estático para Paginación */}
      <div className={cn(
        "flex items-center justify-between px-6 py-4 border-t",
        isDark ? "bg-card/80 dark:bg-[#18181b]/80 border-border/50 dark:border-white/5" : "bg-white/80 border-border/50"
      )}>
        <div className="flex flex-col">
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                Mostrando {Math.min(data.length, (currentPage - 1) * rowsPerPage + 1)}-{Math.min(data.length, currentPage * rowsPerPage)} de {data.length}
            </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className={cn(
                "h-9 px-3 border-white/5 bg-white/[0.03] text-white hover:bg-white/[0.08] disabled:opacity-30",
                !isDark && "border-border/50 bg-muted/20 text-foreground hover:bg-muted/40"
            )}
          >
            <ChevronLeft className="size-4" />
          </Button>
          
          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
              .map((p, i, arr) => {
                const prev = arr[i - 1];
                return (
                  <div key={p} className="flex items-center gap-1">
                    {prev && p - prev > 1 && (
                      <span className="text-muted-foreground/40 px-1 font-black text-[10px]">...</span>
                    )}
                    <button
                      onClick={() => handlePageChange(p)}
                      className={cn(
                        "size-9 rounded-xl text-[10px] font-black transition-all duration-300",
                        currentPage === p 
                          ? "bg-primary text-white shadow-lg shadow-primary/20" 
                          : isDark
                            ? "text-muted-foreground hover:bg-muted/50 dark:hover:bg-white/5 hover:text-foreground dark:hover:text-white"
                            : "text-muted-foreground hover:bg-muted/30 hover:text-foreground"
                      )}
                    >
                      {p}
                    </button>
                  </div>
                );
              })}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={cn(
                "h-9 px-3 border-white/5 bg-white/[0.03] text-white hover:bg-white/[0.08] disabled:opacity-30",
                !isDark && "border-border/50 bg-muted/20 text-foreground hover:bg-muted/40"
            )}
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>
    </Card>
  )
}
