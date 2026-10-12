const groupThousands = (digits: string) => digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.')

/**
 * Número → texto del campo: "2.000.000" o, si tiene centavos, "7.023.888,88". 0 → "" (campo vacío).
 */
export function formatThousands(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value) || value === 0) return ''
  const [integer, decimals] = Math.abs(value).toFixed(2).split('.')
  const sign = value < 0 ? '-' : ''
  return `${sign}${groupThousands(integer)}${decimals === '00' ? '' : `,${decimals}`}`
}

/**
 * Lo que el usuario escribe → texto con puntos de miles, respetando la coma decimal (máx. 2
 * decimales): "2000000" → "2.000.000", "7023888,8" → "7.023.888,8". Los puntos que escribe se ignoran.
 */
export function formatMoneyTyping(text: string): string {
  const [rawInteger, ...rest] = text.replace(/[^\d,]/g, '').split(',')
  const integer = rawInteger.replace(/^0+(?=\d)/, '')
  const grouped = integer ? groupThousands(integer) : rest.length ? '0' : ''
  return rest.length ? `${grouped},${rest.join('').slice(0, 2)}` : grouped
}

/** Texto del campo ("7.023.888,88", "$ 2.000.000") → número. Sin dígitos → 0. */
export function parseMoneyInput(text: string): number {
  const [integer, decimals = ''] = text.replace(/[^\d,]/g, '').split(',')
  const value = Number(`${integer || '0'}.${decimals.slice(0, 2) || '0'}`)
  return Number.isFinite(value) ? value : 0
}
