import { apiClient } from '@/shared/config/api'
import { CreditFilters } from '@/shared/types/filters'
import { CreateCreditRequest, Credit, UpdateCreditRequest } from '../../domain/models'
import { CreditWithUserEmail, ICreditRepository } from '../../domain/port'

/**
 * Créditos vía API del backend. El backend debe exponer:
 * - GET /api/credits
 * - GET /api/credits?clientId=
 * - GET /api/credits/:id
 * - GET /api/credits?businessId=&clientId=&startDate=&endDate=&userEmail= (devuelve CreditWithUserEmail[])
 * - POST /api/credits (body: CreateCreditRequest + business_id)
 * - PATCH /api/credits/:id (body: campos a actualizar)
 */
export class CreditRepository implements ICreditRepository {
  async getCredits(): Promise<Credit[]> {
    const data = await apiClient.get<Credit[]>('/api/credits')
    return data || []
  }

  async getCreditsByBusinessId(businessId: string): Promise<CreditWithUserEmail[]> {
    const data = await apiClient.get<CreditWithUserEmail[]>(
      `/api/credits/business/${encodeURIComponent(businessId)}`
    )
    return data || []
  }

  async getCreditsByClientId(clientId: string): Promise<Credit[]> {
    const params = new URLSearchParams({ clientId })
    const data = await apiClient.get<Credit[]>(`/api/credits?${params.toString()}`)
    return data || []
  }

  async getCreditById(id: string): Promise<Credit | null> {
    try {
      return await apiClient.get<Credit>(`/api/credits/${encodeURIComponent(id)}`)
    } catch (e) {
      if (e instanceof Error && e.message.includes('404')) return null
      throw e
    }
  }

  async createCredit(request: CreateCreditRequest, businessId: string): Promise<Credit> {
    return apiClient.post<Credit>('/api/credits', {
      ...request,
      business_id: businessId
    })
  }

  async updateCredit(request: UpdateCreditRequest, businessId: string): Promise<Credit> {
    const { id, ...updates } = request
    return apiClient.patch<Credit>(`/api/credits/${encodeURIComponent(id)}`, {
      ...updates,
      business_id: businessId
    })
  }

  async getCreditsWithFilters(filters: CreditFilters): Promise<CreditWithUserEmail[]> {
    const all = await this.getCreditsByBusinessId(filters.businessId)
    let result = all
    if (filters.clientId) result = result.filter((c) => c.client_id === filters.clientId)
    if (filters.startDate) {
      const start =
        typeof filters.startDate === 'string' ? new Date(filters.startDate) : filters.startDate
      result = result.filter((c) => new Date(c.created_at) >= start)
    }
    if (filters.endDate) {
      const end = typeof filters.endDate === 'string' ? new Date(filters.endDate) : filters.endDate
      result = result.filter((c) => new Date(c.created_at) <= end)
    }
    // Filtro por userEmail se aplica en la página usando user_id y lista de usuarios
    return result
  }
}
