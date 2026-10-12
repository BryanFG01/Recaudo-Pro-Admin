/** withdrawal: retiro (resta al aprobarse) · expense: gasto (resta al registrarse). */
export type WithdrawalKind = 'withdrawal' | 'expense'

export interface Withdrawal {
  id: string
  cash_session_id: string
  user_id: string
  amount: number
  reason: string | null
  is_approved: boolean
  kind: WithdrawalKind
  /** Rechazado por un administrador: no resta de la caja. */
  is_rejected: boolean
  created_at?: string
  updated_at?: string
}

export interface CreateWithdrawalRequest {
  cash_session_id: string
  user_id: string
  amount: number
  reason?: string | null
  is_approved?: boolean
}

/** Aprobar ({ is_approved: true }) o rechazar ({ is_rejected: true }). */
export interface UpdateWithdrawalApprovalRequest {
  is_approved?: boolean
  is_rejected?: boolean
}
