import {
  CashSession,
  CreateCashSessionRequest,
  UpdateCashSessionRequest
} from '../models'

export interface ICashSessionRepository {
  create(request: CreateCashSessionRequest): Promise<CashSession>
  update(id: string, request: UpdateCashSessionRequest): Promise<CashSession>
  getById(id: string): Promise<CashSession | null>
  getByBusinessId(businessId: string): Promise<CashSession[]>
  getByUserId(userId: string): Promise<CashSession[]>
  delete(id: string): Promise<void>
}
