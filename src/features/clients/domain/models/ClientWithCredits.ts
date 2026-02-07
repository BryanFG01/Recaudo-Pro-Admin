import { Client } from './Client'

export interface ClientWithCredits extends Client {
  /** ID del usuario asignado al cliente (ej. cobrador/gestor). */
  user_id?: string | null
  // Información agregada de créditos
  total_credits: number
  total_amount: number
  total_balance: number
  user_email: string | null // Email del usuario que más ha gestionado este cliente
}
