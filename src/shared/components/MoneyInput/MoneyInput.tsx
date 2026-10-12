import { Input } from '@/components/ui/input'
import { cn } from '@/shared/utils/cn'
import { formatMoneyTyping, formatThousands, parseMoneyInput } from '@/shared/utils/money'
import { useEffect, useState, type ComponentProps } from 'react'

type MoneyInputProps = Omit<ComponentProps<typeof Input>, 'value' | 'onChange' | 'type'> & {
  value: number
  onValueChange: (value: number) => void
}

/**
 * Campo de dinero con puntos de miles mientras se escribe ($ 2.000.000) para no confundir
 * 200.000 con 2.000.000. Respeta los centavos con coma (7.023.888,88). Entrega el número.
 */
export function MoneyInput({ value, onValueChange, className, ...props }: MoneyInputProps) {
  const [text, setText] = useState(() => formatThousands(value))

  // Si el valor cambia desde afuera (ej. al empezar a editar otra caja), se muestra ese valor
  useEffect(() => {
    if (parseMoneyInput(text) !== value) setText(formatThousands(value))
    // eslint-disable-next-line react-hooks/exhaustive-deps -- solo reacciona a cambios externos del valor
  }, [value])

  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
      <Input
        {...props}
        type="text"
        inputMode="decimal"
        autoComplete="off"
        value={text}
        onChange={(e) => {
          const next = formatMoneyTyping(e.target.value)
          setText(next)
          onValueChange(parseMoneyInput(next))
        }}
        className={cn('pl-7 tabular-nums', className)}
      />
    </div>
  )
}
