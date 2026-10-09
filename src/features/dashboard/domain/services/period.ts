/** ¿La fecha del recaudo cae en el período [desde, hasta)? Sin período, cuenta todo. */
export function isInPeriod(paymentDate: string | undefined, startDate?: Date, endDate?: Date): boolean {
  if (!startDate && !endDate) return true
  const time = paymentDate ? new Date(paymentDate).getTime() : Number.NaN
  if (Number.isNaN(time)) return false
  return (!startDate || time >= startDate.getTime()) && (!endDate || time < endDate.getTime())
}

/** Lunes de la semana de `today` a las 00:00 (el domingo cuenta como último día de la semana). */
export function startOfWeek(today: Date): Date {
  const monday = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7))
  return monday
}
