import { CreditFilters } from '@/shared/types/filters'
import { CreateCreditRequest, Credit, UpdateCreditRequest } from '../models'

export interface CreditWithUserEmail extends Credit {
  /** ID del usuario responsable (para mostrar nombre). */
  user_id?: string | null
  user_email?: string | null

}

export interface ICreditRepository {
  getCredits(): Promise<Credit[]>
  /** GET /api/credits/business/{businessId} — créditos del negocio (puede incluir user_id). */
  getCreditsByBusinessId(businessId: string): Promise<CreditWithUserEmail[]>
  getCreditsByClientId(clientId: string): Promise<Credit[]>
  getCreditById(id: string): Promise<Credit | null>
  getCreditsWithFilters(filters: CreditFilters): Promise<CreditWithUserEmail[]> 
  createCredit(request: CreateCreditRequest, businessId: string): Promise<Credit>
  updateCredit(request: UpdateCreditRequest, businessId: string): Promise<Credit>
}
