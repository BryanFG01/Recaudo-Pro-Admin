import { Credit, CreateCreditRequest, UpdateCreditRequest } from '../models'
import { CreditFilters } from '@/shared/types/filters'

export interface CreditWithUserEmail extends Credit {
  user_email?: string | null
  payment_method?: string | null // Método de pago más reciente
}

export interface ICreditRepository {
  getCredits(): Promise<Credit[]>
  getCreditsByClientId(clientId: string): Promise<Credit[]>
  getCreditById(id: string): Promise<Credit | null>
  getCreditsWithFilters(filters: CreditFilters): Promise<CreditWithUserEmail[]>
  createCredit(request: CreateCreditRequest, businessId: string): Promise<Credit>
  updateCredit(request: UpdateCreditRequest, businessId: string): Promise<Credit>
}


