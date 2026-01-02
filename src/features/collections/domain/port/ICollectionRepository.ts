import { Collection, CreateCollectionRequest } from '../models'
import { CollectionFilters } from '@/shared/types/filters'

export interface CollectionWithUserEmail extends Collection {
  user_email?: string | null
}

export interface ICollectionRepository {
  getCollections(): Promise<Collection[]>
  getRecentCollections(limit?: number): Promise<Collection[]>
  getCollectionsByClientId(clientId: string): Promise<Collection[]>
  getCollectionsByCreditId(creditId: string): Promise<Collection[]>
  getCollectionsWithFilters(filters: CollectionFilters): Promise<CollectionWithUserEmail[]>
  createCollection(request: CreateCollectionRequest, businessId: string, userId: string): Promise<Collection>
}


