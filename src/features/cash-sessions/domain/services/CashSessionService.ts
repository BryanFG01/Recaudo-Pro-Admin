import { ICashSessionRepository } from '../port'
import {
  CashSession,
  CreateCashSessionRequest,
  UpdateCashSessionRequest
} from '../models'

export class CashSessionService {
  constructor(private readonly repository: ICashSessionRepository) {}

  async create(request: CreateCashSessionRequest): Promise<CashSession> {
    if (!request.business_id) throw new Error('business_id es requerido')
    if (!request.user_id) throw new Error('user_id es requerido')
    if (!request.session_date) throw new Error('session_date es requerido')
    if (typeof request.initial_balance !== 'number' || request.initial_balance < 0)
      throw new Error('initial_balance debe ser un número mayor o igual a 0')
    return this.repository.create(request)
  }

  async update(id: string, request: UpdateCashSessionRequest): Promise<CashSession> {
    if (!id) throw new Error('ID de sesión es requerido')
    return this.repository.update(id, request)
  }

  async getById(id: string): Promise<CashSession | null> {
    if (!id) throw new Error('ID de sesión es requerido')
    return this.repository.getById(id)
  }

  async getByBusinessId(businessId: string): Promise<CashSession[]> {
    if (!businessId) throw new Error('business_id es requerido')
    return this.repository.getByBusinessId(businessId)
  }

  async getByUserId(userId: string): Promise<CashSession[]> {
    if (!userId) throw new Error('user_id es requerido')
    return this.repository.getByUserId(userId)
  }

  async delete(id: string): Promise<void> {
    if (!id) throw new Error('ID de sesión es requerido')
    return this.repository.delete(id)
  }
}
