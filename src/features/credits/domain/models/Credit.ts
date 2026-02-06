export interface Credit {
  id: string
  client_id: string
  document_id?: string
  user_number?: string
  total_amount: number
  /** Tasa de interés (ej. 5.5 = 5.5%). */
  interest_rate?: number | null
  /** Monto de interés calculado. */
  total_interest?: number | null
  installment_amount: number
  total_installments: number
  paid_installments: number
  overdue_installments: number
  total_balance: number
  last_payment_amount: number | null
  last_payment_date: string | null
  next_due_date: string | null
  business_id: string
  business_code?: string
  created_at: string
  updated_at: string
}

export interface CreateCreditRequest {
  client_id: string
  document_id?: string
  user_number?: string
  total_amount: number
  installment_amount: number
  total_installments: number
  next_due_date?: string | null
  business_id?: string
  business_code?: string
  interest_rate?: number
  total_interest?: number
}

export interface UpdateCreditRequest {
  id: string
  client_id?: string
  document_id?: string
  user_number?: string
  total_amount?: number
  installment_amount?: number
  total_installments?: number
  paid_installments?: number
  total_balance?: number
  last_payment_amount?: number | null
  last_payment_date?: string | null
  overdue_installments?: number
  next_due_date?: string | null
  interest_rate?: number | null
  total_interest?: number | null
  business_code?: string
}


