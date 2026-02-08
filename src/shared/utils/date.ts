import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export const formatDate = (date: string | Date, formatStr: string = 'dd/MM/yyyy'): string => {
  return format(new Date(date), formatStr, { locale: es })
}

export const formatDateTime = (date: string | Date): string => {
  return format(new Date(date), 'dd/MM/yyyy HH:mm', { locale: es })
}

export const formatCurrency = (amount: number | null | undefined): string => {
  const value = amount != null && !Number.isNaN(Number(amount)) ? Number(amount) : 0
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}


