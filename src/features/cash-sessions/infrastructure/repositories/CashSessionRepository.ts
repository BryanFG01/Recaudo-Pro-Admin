import { apiClient } from '@/shared/config/api'
import {
  CashSession,
  CreateCashSessionRequest,
  UpdateCashSessionRequest
} from '../../domain/models'
import { ICashSessionRepository } from '../../domain/port'

export class CashSessionRepository implements ICashSessionRepository {
  /**
   * POST /api/cash-sessions
   * Body esperado por el backend: business_id (UUID), business_code, user_id (UUID),
   * session_date (YYYY-MM-DD), initial_balance (number), allowed_to_withdraw (boolean).
   */
  async create(request: CreateCashSessionRequest): Promise<CashSession> {
    const body: Record<string, unknown> = {
      business_id: request.business_id,
      user_id: request.user_id,
      session_date: request.session_date,
      initial_balance: Number(request.initial_balance),
      allowed_to_withdraw: request.allowed_to_withdraw ?? true
    }
    if (request.business_code != null && request.business_code !== '') {
      body.business_code = request.business_code
    }
    return apiClient.post<CashSession>('/api/cash-sessions', body)
  }

  async update(id: string, request: UpdateCashSessionRequest): Promise<CashSession> {
    return apiClient.patch<CashSession>(`/api/cash-sessions/${id}`, request)
  }

  async getById(id: string): Promise<CashSession | null> {
    try {
      return await apiClient.get<CashSession>(`/api/cash-sessions/${id}`)
    } catch {
      return null
    }
  }

  async getByBusinessId(businessId: string): Promise<CashSession[]> {
    try {
      const params = new URLSearchParams({ business_id: businessId })
      const data = await apiClient.get<CashSession[]>(`/api/cash-sessions?${params.toString()}`)
      return Array.isArray(data) ? data : []
    } catch {
      return []
    }
  }

  async getByUserId(userId: string): Promise<CashSession[]> {
    try {
      const data = await apiClient.get<CashSession[]>(`/api/cash-sessions?user_id=${encodeURIComponent(userId)}`)
      return Array.isArray(data) ? data : []
    } catch {
      return []
    }
  }

  /** DELETE /api/cash-sessions/{id} — id: UUID de la sesión de caja */
  async delete(id: string): Promise<void> {
    await apiClient.delete<void>(`/api/cash-sessions/${encodeURIComponent(id)}`)
  }
}
