export interface CashSession {
  id: string
  business_id: string
  business_code?: string
  user_id: string
  session_date: string
  initial_balance: number
  allowed_to_withdraw: boolean
  created_at?: string
  updated_at?: string
}

export interface CreateCashSessionRequest {
  business_id: string
  business_code?: string
  user_id: string
  session_date: string
  initial_balance: number
  allowed_to_withdraw: boolean
}

export interface UpdateCashSessionRequest {
  session_date?: string
  initial_balance?: number
  allowed_to_withdraw?: boolean
}
