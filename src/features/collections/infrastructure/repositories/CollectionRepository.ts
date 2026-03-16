import { apiClient } from '@/shared/config/api'
import { CollectionFilters } from '@/shared/types/filters'
import { Collection, CreateCollectionRequest, UpdateCollectionRequest } from '../../domain/models'
import { CollectionWithUserEmail, ICollectionRepository } from '../../domain/port'

/**
 * Recaudos vía API del backend. El backend debe exponer:
 * - GET /api/collections
 * - GET /api/collections?limit=
 * - GET /api/collections?clientId=
 * - GET /api/collections?creditId=
 * - GET /api/collections?businessId=&business_id=&userId=&user_id=&clientId=&startDate=&endDate=&payment_method=&userEmail=
 * - POST /api/collections (body: CreateCollectionRequest + business_id, user_id)
 */
export class CollectionRepository implements ICollectionRepository {
  async getCollections(): Promise<Collection[]> {
    const data = await apiClient.get<Collection[]>('/api/collections')
    return data || []
  }

  async getRecentCollections(limit: number = 10): Promise<Collection[]> {
    const data = await apiClient.get<Collection[]>(`/api/collections?limit=${limit}`)
    return data || []
  }

  async getCollectionsByClientId(clientId: string): Promise<Collection[]> {
    const params = new URLSearchParams({ clientId })
    const data = await apiClient.get<Collection[]>(`/api/collections?${params.toString()}`)
    return data || []
  }

  async getCollectionsByCreditId(creditId: string): Promise<Collection[]> {
    const params = new URLSearchParams({ creditId })
    const data = await apiClient.get<Collection[]>(`/api/collections?${params.toString()}`)
    return data || []
  }

  async createCollection(
    request: CreateCollectionRequest,
    businessId: string,
    userId: string
  ): Promise<Collection> {
    return apiClient.post<Collection>('/api/collections', {
      ...request,
      business_id: businessId,
      user_id: userId,
    })
  }

  async updateCollection(request: UpdateCollectionRequest): Promise<Collection> {
    const { id, ...updates } = request
    return apiClient.patch<Collection>(`/api/collections/${encodeURIComponent(id)}`, updates)
  }

  async getCollectionsWithFilters(filters: CollectionFilters): Promise<CollectionWithUserEmail[]> {
    const params = new URLSearchParams()
    params.set('businessId', filters.businessId)
    if (filters.userId?.trim()) {
      params.set('userId', filters.userId.trim())
    }
    if (filters.clientId?.trim()) {
      params.set('clientId', filters.clientId.trim())
    }
    if (filters.startDate) params.set('startDate', filters.startDate instanceof Date ? filters.startDate.toISOString() : String(filters.startDate))
    if (filters.endDate) params.set('endDate', filters.endDate instanceof Date ? filters.endDate.toISOString() : String(filters.endDate))
    if (filters.payment_method?.trim()) {
      params.set('paymentMethod', filters.payment_method.trim())
    }
    if (filters.userEmail?.trim()) params.set('userEmail', filters.userEmail.trim())

    const data = await apiClient.get<CollectionWithUserEmail[]>(`/api/collections?${params.toString()}`)
    return data || []
  }
}
