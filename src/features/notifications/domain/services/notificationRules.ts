import { AppNotification } from '../models/Notification'

/** Qué pantallas deben recargarse al llegar un aviso. */
export type RefreshTopic = 'withdrawals' | 'cash'

const TOPICS: Record<string, RefreshTopic[]> = {
  withdrawal_requested: ['withdrawals', 'cash'],
  expense_registered: ['withdrawals', 'cash'],
  cash_opened: ['cash'],
  cash_closed: ['cash']
}

export const topicsOf = (n: AppNotification): RefreshTopic[] => TOPICS[n.type] ?? []

/** Avisos aún no vistos (id mayor al último visto). */
export const countUnseen = (items: AppNotification[], seenId: number): number =>
  items.filter((n) => n.id > seenId).length

/** Une avisos nuevos a la lista (sin repetir), del más reciente al más antiguo, con tope. */
export function mergeNewest(current: AppNotification[], incoming: AppNotification[], max = 30): AppNotification[] {
  const byId = new Map(current.map((n) => [n.id, n]))
  for (const n of incoming) byId.set(n.id, n)
  return [...byId.values()].sort((a, b) => b.id - a.id).slice(0, max)
}

/** Clave por negocio del último aviso visto (localStorage). */
export const seenKey = (businessId: string) => `recaudo:notifications:seen:${businessId}`
