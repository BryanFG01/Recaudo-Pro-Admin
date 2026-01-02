export interface Collection {
  id: string
  credit_id: string
  client_id: string
  amount: number
  payment_date: string
  notes: string | null
  user_id: string
  payment_method: string | null
  transaction_reference: string | null
  business_id: string
  created_at: string
  name: string
}

export interface CollectionWithClient extends Collection {
  clientName?: string
}

export interface CreateCollectionRequest {
  credit_id: string
  client_id: string
  amount: number
  payment_date: string
  notes?: string | null
  payment_method?: string | null
  transaction_reference?: string | null
}
