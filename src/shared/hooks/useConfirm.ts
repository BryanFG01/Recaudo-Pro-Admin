import { useCallback, useRef, useState } from 'react'

export interface ConfirmOptions {
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  /** Acción destructiva (borrar): el botón de confirmar va en rojo. */
  destructive?: boolean
}

export interface ConfirmDialogState extends ConfirmOptions {
  open: boolean
  onResult: (confirmed: boolean) => void
}

/**
 * Confirmación con el diálogo del panel en lugar de window.confirm.
 * Uso: `const { confirm, dialogProps } = useConfirm()`, luego `if (!(await confirm({...}))) return`
 * y renderizar `<ConfirmDialog {...dialogProps} />` una vez en la página.
 */
export function useConfirm() {
  const [options, setOptions] = useState<ConfirmOptions | null>(null)
  const resolver = useRef<((confirmed: boolean) => void) | null>(null)

  const confirm = useCallback((next: ConfirmOptions) => {
    // Si había otra pregunta abierta, se responde "no" antes de abrir la nueva
    resolver.current?.(false)
    setOptions(next)
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve
    })
  }, [])

  const onResult = useCallback((confirmed: boolean) => {
    resolver.current?.(confirmed)
    resolver.current = null
    setOptions(null)
  }, [])

  const dialogProps: ConfirmDialogState = { title: '', ...options, open: options !== null, onResult }
  return { confirm, dialogProps }
}
