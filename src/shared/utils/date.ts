import { format } from 'date-fns'
import { es } from 'date-fns/locale'

const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/

/**
 * Convierte a Date. Una fecha sin hora ("2026-10-12", ej. session_date) es un día del calendario:
 * se toma en hora local. `new Date("2026-10-12")` la lee como medianoche UTC, y en Colombia (UTC−5)
 * se mostraba el día anterior.
 */
export function toDate(date: string | Date): Date {
  if (date instanceof Date) return date
  const dateOnly = DATE_ONLY.exec(date)
  return dateOnly ? new Date(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3])) : new Date(date)
}

export const formatDate = (date: string | Date, formatStr: string = 'dd/MM/yyyy'): string => {
  return format(toDate(date), formatStr, { locale: es })
}

export const formatDateTime = (date: string | Date): string => {
  return format(toDate(date), 'dd/MM/yyyy HH:mm', { locale: es })
}

/**
 * Pesos colombianos redondeados al peso: "$ 3.223.889" (no "$ 3.223.888,88"). Mismo criterio que la
 * app móvil y los avisos, para no confundir al cliente final con centavos.
 */
export const formatCurrency = (amount: number | null | undefined): string => {
  const value = amount != null && !Number.isNaN(Number(amount)) ? Number(amount) : 0
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}


