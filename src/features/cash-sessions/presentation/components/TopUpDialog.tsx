import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { MoneyInput } from '@/shared/components/MoneyInput/MoneyInput'
import { formatCurrency } from '@/shared/utils/date'
import { Loader2 } from 'lucide-react'
import { useState } from 'react'
import { CashSession } from '../../domain/models'

interface TopUpDialogProps {
  /** Caja a recargar; null = diálogo cerrado. */
  session: CashSession | null
  collectorName: string
  isSubmitting: boolean
  onConfirm: (amount: number) => void
  onClose: () => void
}

/** Recargar la caja abierta de un cobrador: el monto se suma a su caja inicial. */
export function TopUpDialog({ session, collectorName, isSubmitting, onConfirm, onClose }: TopUpDialogProps) {
  const [value, setValue] = useState(0)
  const isValid = value > 0

  const close = () => {
    setValue(0)
    onClose()
  }

  return (
    <Dialog open={session !== null} onOpenChange={(open) => !open && close()}>
      <DialogContent className="max-w-md p-6">
        <DialogHeader>
          <DialogTitle>Recargar caja</DialogTitle>
          <DialogDescription className="pt-2 leading-relaxed">
            Se suma a la caja inicial de {collectorName} (hoy {formatCurrency(session?.initial_balance ?? 0)}).
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault()
            if (isValid) onConfirm(value)
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="top_up_amount">Monto a enviar</Label>
            <MoneyInput id="top_up_amount" autoFocus value={value} onValueChange={setValue} placeholder="0" />
            {isValid && (
              <p className="text-xs text-muted-foreground">
                Nueva caja inicial: {formatCurrency((session?.initial_balance ?? 0) + value)}
              </p>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={close}>Cancelar</Button>
            <Button type="submit" disabled={!isValid || isSubmitting}>
              {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : 'Recargar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
