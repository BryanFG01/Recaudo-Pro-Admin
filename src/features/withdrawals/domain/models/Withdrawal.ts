export interface Withdrawal {
  id: string
  cash_session_id: string
  user_id: string
  amount: number
  reason: string | null
  is_approved: boolean
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

export interface UpdateWithdrawalApprovalRequest {
  is_approved: boolean
}
