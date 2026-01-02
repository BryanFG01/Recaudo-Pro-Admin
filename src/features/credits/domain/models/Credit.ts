export interface Credit {
  id: string
  client_id: string
  total_amount: number
  installment_amount: number
  total_installments: number
  paid_installments: number
  overdue_installments: number
  total_balance: number
  last_payment_amount: number | null
  last_payment_date: string | null
  next_due_date: string | null
  business_id: string
  created_at: string
  updated_at: string
}

export interface CreateCreditRequest {
  client_id: string
  total_amount: number
  installment_amount: number
  total_installments: number
  next_due_date?: string | null
}

export interface UpdateCreditRequest {
  id: string
  paid_installments?: number
  total_balance?: number
  last_payment_amount?: number | null
  last_payment_date?: string | null
  overdue_installments?: number
  next_due_date?: string | null
}


