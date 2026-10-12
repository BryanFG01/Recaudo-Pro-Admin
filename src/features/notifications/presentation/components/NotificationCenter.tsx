import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { useAuthStore } from '@/features/auth/presentation/store/authStore'
import { cn } from '@/shared/utils/cn'
import { formatDateTime } from '@/shared/utils/date'
import { Bell, X } from 'lucide-react'
import { createPortal } from 'react-dom'
import { AppNotification } from '../../domain/models/Notification'
import { useNotificationFeed } from '../hooks/useNotificationFeed'

/** Campana con los avisos del negocio + avisos emergentes cuando llega algo nuevo. */
export function NotificationCenter() {
  const { user, businessId } = useAuthStore()
  const { items, toasts, unseen, seenId, markAllSeen, dismissToast } = useNotificationFeed(
    (user?.business_id || businessId) ?? ''
  )

  return (
    <>
      <DropdownMenu onOpenChange={(open) => open && markAllSeen()}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="relative rounded-lg" aria-label="Avisos">
            <Bell className="size-5" />
            {unseen > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-5 h-5 px-1 rounded-full bg-error text-white text-[11px] font-bold flex items-center justify-center">
                {unseen > 9 ? '9+' : unseen}
              </span>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-96 max-h-[70vh] overflow-y-auto">
          <DropdownMenuLabel>Avisos</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {items.length === 0 && <p className="px-3 py-6 text-center text-sm text-muted-foreground">Sin avisos</p>}
          {items.map((n) => (
            <NotificationRow key={n.id} notification={n} isNew={n.id > seenId} />
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <NotificationToasts toasts={toasts} onDismiss={dismissToast} />
    </>
  )
}

/**
 * Avisos emergentes abajo a la derecha. Van en un portal al <body>: la cabecera usa backdrop-blur,
 * que hace que un elemento "fixed" adentro se posicione respecto a ella y quede recortado arriba.
 */
function NotificationToasts({ toasts, onDismiss }: { toasts: AppNotification[]; onDismiss: (id: number) => void }) {
  if (typeof document === 'undefined') return null
  return createPortal(
    <div className="fixed bottom-6 right-6 z-50 flex w-96 max-w-[calc(100vw-2rem)] flex-col gap-3" aria-live="polite">
      {toasts.map((n) => (
        <div key={n.id} className="rounded-2xl border border-border bg-card p-4 shadow-xl animate-in fade-in slide-in-from-bottom-4">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <p className="text-sm font-semibold">{n.title}</p>
              <p className="text-sm text-muted-foreground">{n.body}</p>
            </div>
            <button type="button" onClick={() => onDismiss(n.id)} className="text-muted-foreground hover:text-foreground" aria-label="Cerrar aviso">
              <X className="size-4" />
            </button>
          </div>
        </div>
      ))}
    </div>,
    document.body
  )
}

function NotificationRow({ notification: n, isNew }: { notification: AppNotification; isNew: boolean }) {
  return (
    <div className={cn('px-3 py-2.5 border-b border-border/40 last:border-0', isNew && 'bg-primary/5')}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold">{n.title}</p>
        {isNew && <span className="size-2 rounded-full bg-error shrink-0" />}
      </div>
      <p className="text-sm text-muted-foreground">{n.body}</p>
      <p className="text-xs text-muted-foreground/60 mt-0.5">{formatDateTime(n.created_at)}</p>
    </div>
  )
}
