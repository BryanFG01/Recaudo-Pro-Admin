import { CashSession, CashSessionEvent, DailySummaryItem } from '../models'

/**
 * Totales de las cajas actuales de los cobradores. Cuadra con la caja de cada uno:
 * Σ caja actual = Σ caja inicial + ingresos − egresos.
 */
export function summarizeCashBoxes(items: DailySummaryItem[]) {
  const sum = (pick: (i: DailySummaryItem) => number) => items.reduce((acc, i) => acc + (pick(i) || 0), 0)
  const ingresos = sum((i) => i.total_recaudo)
  const egresos = sum((i) => i.total_ventas + i.total_retiros + i.total_gastos)
  return {
    totalSaldo: sum((i) => i.caja_actual),
    totalIngresos: ingresos,
    totalEgresos: egresos,
    balanceNeto: ingresos - egresos
  }
}

/**
 * De dónde salió la caja inicial: la caja final de la caja anterior (con ese dinero arrancó) más lo
 * que envió el administrador (al abrir o con "Recargar").
 */
export function initialBreakdown(item: DailySummaryItem) {
  const fromPrevious = Math.min(item.saldo_dia_anterior || 0, item.initial_balance || 0)
  return { fromPrevious, sentByAdmin: Math.max((item.initial_balance || 0) - fromPrevious, 0) }
}

/** Cerrada: la caja final es la caja inicial con la que arranca la próxima apertura. */
export const nextInitialBalance = (item: DailySummaryItem): number => item.closing_balance ?? item.caja_actual

/** Fecha local YYYY-MM-DD (no UTC: en Colombia, después de las 7 p. m. UTC ya es el día siguiente). */
export function localDateISO(date: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

/** Caja abierta del cobrador (como máximo hay una). */
export const findOpenSession = (sessions: CashSession[], userId: string): CashSession | undefined =>
  sessions.find((s) => s.user_id === userId && s.status === 'open')

/**
 * Caja final de la última caja cerrada del cobrador: con ese dinero arranca su próxima caja
 * (la API le suma lo que envíe el administrador al abrirla).
 */
export function lastClosingBalance(sessions: CashSession[], userId: string): number {
  const latest = sessions
    .filter((s) => s.user_id === userId)
    .sort((a, b) => `${b.session_date}|${b.created_at ?? ''}`.localeCompare(`${a.session_date}|${a.created_at ?? ''}`))[0]
  return latest?.status === 'closed' ? latest.closing_balance ?? 0 : 0
}

/** ¿Es la caja más reciente de su cobrador? Solo esa se puede volver a abrir. */
export function isLatestOfUser(sessions: CashSession[], session: CashSession): boolean {
  const key = (s: CashSession) => `${s.session_date ?? ''}|${s.created_at ?? ''}`
  return !sessions.some((s) => s.user_id === session.user_id && s.id !== session.id && key(s) > key(session))
}

/** Se puede abrir si no tiene otra abierta y es su última caja (reabre si es de hoy, si no crea una nueva). */
export const canOpen = (sessions: CashSession[], session: CashSession): boolean =>
  session.status === 'closed' && !findOpenSession(sessions, session.user_id) && isLatestOfUser(sessions, session)

export const EVENT_LABEL: Record<CashSessionEvent['event'], string> = {
  open: 'Abrió',
  close: 'Cerró',
  reopen: 'Reabrió',
  top_up: 'Recargó'
}

export const ROLE_LABEL: Record<string, string> = {
  cobrador: 'cobrador',
  supervisor: 'supervisor',
  admin: 'administrador',
  super_admin: 'administrador'
}
