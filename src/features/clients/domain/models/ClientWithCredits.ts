export interface ClientWithCredits {
  id: string
  name: string
  phone: string
  document_id: string | null
  address: string | null
  business_id: string
  created_at: string
  updated_at: string
  // Información agregada de créditos
  total_credits: number
  total_amount: number
  total_balance: number
  user_email: string | null // Email del usuario que más ha gestionado este cliente
}

