import { Withdrawal } from '../models'

/** applied: ya resta de la caja · pending: retiro esperando aprobación · rejected: no resta. */
export type WithdrawalStatus = 'applied' | 'pending' | 'rejected'

const LEGACY_EXPENSE_PREFIX = '[GASTO] '

/** Gasto: por tipo, o por el prefijo "[GASTO]" de los registros anteriores al tipo. */
export const isExpense = (w: Withdrawal): boolean =>
  w.kind === 'expense' || (w.reason ?? '').startsWith(LEGACY_EXPENSE_PREFIX.trim())

/** El gasto resta al registrarse y el retiro al aprobarse; rechazado nunca resta. */
export function withdrawalStatus(w: Withdrawal): WithdrawalStatus {
  if (w.is_rejected) return 'rejected'
  if (w.is_approved || isExpense(w)) return 'applied'
  return 'pending'
}

/** Motivo sin el prefijo "[GASTO] " de los registros anteriores. */
export const displayReason = (w: Withdrawal): string => (w.reason ?? '').replace(LEGACY_EXPENSE_PREFIX, '')

/** Se decide (aprobar o rechazar) lo que aún no se revisó; lo aprobado o rechazado queda finalizado. */
export const canReject = (w: Withdrawal): boolean => !w.is_rejected && !w.is_approved

/**
 * Falta la revisión del administrador: retiros sin aprobar y gastos sin aprobar. El gasto ya resta de
 * la caja; aprobarlo solo deja constancia de que se revisó.
 */
export const needsReview = (w: Withdrawal): boolean => !w.is_rejected && !w.is_approved

export const countPending = (list: Withdrawal[]): number => list.filter(needsReview).length
