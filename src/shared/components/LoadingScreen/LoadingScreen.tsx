import { RefreshCw } from 'lucide-react'
import { cn } from '@/shared/utils/cn'

interface LoadingScreenProps {
  message?: string
  className?: string
  fullHeight?: boolean
}

export function LoadingScreen({ 
  message = "Cargando datos del sistema...", 
  className,
  fullHeight = true
}: LoadingScreenProps) {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center gap-6 animate-in fade-in duration-700",
      fullHeight ? "min-h-[60vh]" : "py-12",
      className
    )}>
      <div className="relative">
        <div className="absolute inset-0 blur-2xl bg-primary/20 rounded-full animate-pulse" />
        <RefreshCw className="size-12 animate-spin text-primary/60 relative z-10" />
      </div>
      <p className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.3em] animate-pulse">
        {message}
      </p>
    </div>
  )
}
