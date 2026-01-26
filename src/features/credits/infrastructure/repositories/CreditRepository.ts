import { ICreditRepository, CreditWithUserEmail } from '../../domain/port'
import { Credit, CreateCreditRequest, UpdateCreditRequest } from '../../domain/models'
import { CreditFilters } from '@/shared/types/filters'
import { apiClient } from '@/shared/config/api'

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
      business_id: businessId,
    })
  }

  async updateCredit(request: UpdateCreditRequest, businessId: string): Promise<Credit> {
    const { id, ...updates } = request
    return apiClient.patch<Credit>(`/api/credits/${encodeURIComponent(id)}`, {
      ...updates,
      business_id: businessId,
    })
  }

  async getCreditsWithFilters(filters: CreditFilters): Promise<CreditWithUserEmail[]> {
    const params = new URLSearchParams()
    params.set('businessId', filters.businessId)
    if (filters.clientId) params.set('clientId', filters.clientId)
    if (filters.startDate) params.set('startDate', filters.startDate instanceof Date ? filters.startDate.toISOString() : String(filters.startDate))
    if (filters.endDate) params.set('endDate', filters.endDate instanceof Date ? filters.endDate.toISOString() : String(filters.endDate))
    if (filters.userEmail) params.set('userEmail', filters.userEmail)

    const data = await apiClient.get<CreditWithUserEmail[]>(`/api/credits?${params.toString()}`)
    return data || []
  }
}
