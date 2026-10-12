import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { cn } from '@/shared/utils/cn'
import type { ConfirmDialogState } from '@/shared/hooks/useConfirm'

/** Diálogo de confirmación del panel (reemplaza window.confirm). Se controla con useConfirm. */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  destructive = false,
  onResult
}: ConfirmDialogState) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onResult(false)}>
      <DialogContent className="max-w-md p-6">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription className="pt-2 leading-relaxed">{description}</DialogDescription>}
        </DialogHeader>
        <DialogFooter className="gap-2 pt-2">
          <Button type="button" variant="outline" onClick={() => onResult(false)}>
            {cancelLabel}
          </Button>
          <Button
            type="button"
            autoFocus
            onClick={() => onResult(true)}
            className={cn(destructive && 'bg-error text-white hover:bg-error/90')}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
