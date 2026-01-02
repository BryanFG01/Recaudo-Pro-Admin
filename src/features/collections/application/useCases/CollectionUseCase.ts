import { CollectionService } from '../../domain/services/CollectionService'
import { Collection, CreateCollectionRequest } from '../../domain/models'

export const buildGetCollectionsUseCase = (service: CollectionService) => {
  return async (): Promise<Collection[]> => {
    return service.getCollections()
  }
}

export const buildGetRecentCollectionsUseCase = (service: CollectionService) => {
  return async (limit: number = 10): Promise<Collection[]> => {
    return service.getRecentCollections(limit)
  }
}

export const buildGetCollectionsByClientIdUseCase = (service: CollectionService) => {
  return async (clientId: string): Promise<Collection[]> => {
    return service.getCollectionsByClientId(clientId)
  }
}

export const buildGetCollectionsByCreditIdUseCase = (service: CollectionService) => {
  return async (creditId: string): Promise<Collection[]> => {
    return service.getCollectionsByCreditId(creditId)
  }
}

export const buildCreateCollectionUseCase = (service: CollectionService) => {
  return async (
    request: CreateCollectionRequest,
    businessId: string,
    userId: string
  ): Promise<Collection> => {
    return service.createCollection(request, businessId, userId)
  }
}


