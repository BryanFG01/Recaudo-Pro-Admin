import { ICollectionRepository, CollectionWithUserEmail } from '../port'
import { CreateCollectionRequest } from '../models'
import { CollectionFilters } from '@/shared/types/filters'

export class CollectionService {
  constructor(private readonly repository: ICollectionRepository) {}

  async getCollections() {
    return this.repository.getCollections()
  }

  async getRecentCollections(limit: number = 10) {
    if (limit <= 0) {
      throw new Error('El límite debe ser mayor a cero')
    }
    return this.repository.getRecentCollections(limit)
  }

  async getCollectionsByClientId(clientId: string) {
    if (!clientId) {
      throw new Error('ID de cliente es requerido')
    }
    return this.repository.getCollectionsByClientId(clientId)
  }

  async getCollectionsByCreditId(creditId: string) {
    if (!creditId) {
      throw new Error('ID de crédito es requerido')
    }
    return this.repository.getCollectionsByCreditId(creditId)
  }

  async createCollection(
    request: CreateCollectionRequest,
    businessId: string,
    userId: string
  ) {
    if (!request.credit_id) {
      throw new Error('ID de crédito es requerido')
    }

    if (!request.client_id) {
      throw new Error('ID de cliente es requerido')
    }

    if (!request.amount || request.amount <= 0) {
      throw new Error('El monto debe ser mayor a cero')
    }

    if (!request.payment_date) {
      throw new Error('La fecha de pago es requerida')
    }

    if (!businessId) {
      throw new Error('ID de negocio es requerido')
    }

    if (!userId) {
      throw new Error('ID de usuario es requerido')
    }

    return this.repository.createCollection(request, businessId, userId)
  }

  async getCollectionsWithFilters(filters: CollectionFilters): Promise<CollectionWithUserEmail[]> {
    if (!filters.businessId) {
      throw new Error('ID de negocio es requerido')
    }
    return this.repository.getCollectionsWithFilters(filters)
  }
}


