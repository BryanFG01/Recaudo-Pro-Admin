import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency, formatDate, formatDateTime } from '@/shared/utils/date'
import { Loader2, X } from 'lucide-react'
import { CashSession, CashSessionEvent } from '../../domain/models'
import { EVENT_LABEL, ROLE_LABEL } from '../../domain/services/cashSessionRules'

interface CashSessionHistoryProps {
  session: CashSession
  /** null mientras carga. */
  events: CashSessionEvent[] | null
  /** Nombre del cobrador por id (null si quien actuó fue un administrador). */
  userName: (id: string) => string | null
  onClose: () => void
}

/** Historial de apertura, cierre y reapertura de una caja (quién, cuándo y con qué saldo). */
export function CashSessionHistory({ session, events, userName, onClose }: CashSessionHistoryProps) {
  return (
    <Card className="mt-6 border bg-card border-border">
      <CardHeader className="flex flex-row items-center justify-between border-b border-border pb-3">
        <CardTitle className="text-sm font-bold text-muted-foreground">
          Historial de la caja del {formatDate(session.session_date || '')}
        </CardTitle>
        <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </CardHeader>
      <CardContent className="pt-4">
        {events === null && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
        {events?.length === 0 && <p className="text-xs text-muted-foreground">Sin aperturas ni cierres registrados.</p>}
        <ul className="space-y-2">
          {events?.map((e) => (
            <li key={e.id} className="flex items-center justify-between text-sm">
              <span>
                <span className="font-semibold">{EVENT_LABEL[e.event]}</span>{' '}
                <span className="text-muted-foreground">
                  · {userName(e.actor_id) ?? ROLE_LABEL[e.actor_role] ?? e.actor_role} · {formatDateTime(e.created_at)}
                </span>
              </span>
              <span className="tabular-nums font-semibold">{formatCurrency(e.balance)}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
