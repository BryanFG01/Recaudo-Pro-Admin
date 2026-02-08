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

/** Respuesta de GET /api/credits/summary/:id — resumen detallado del crédito */
export interface CreditSummary {
  id: string
  client_id: string
  business_id: string
  total_amount: number
  installment_amount: number
  total_installments: number
  total_interest: number
  interest_rate: number
  end_date: string | null
  next_due_date: string | null
  created_at: string
  updated_at: string
  cash_session_id: string | null
  total_installments_created: number
  paid_installments: number
  overdue_installments: number
  pending_installments: number
  partial_installments: number
  total_paid: number
  total_balance: number
  last_payment_amount: number | null
  last_payment_date: string | null
  next_pending_due_date: string | null
  credit_status: string
}


