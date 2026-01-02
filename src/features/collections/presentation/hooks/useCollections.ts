import { useMemo } from 'react'
import useSWR from 'swr'
import { CollectionService } from '../../domain/services/CollectionService'
import { CollectionRepository } from '../../infrastructure/repositories/CollectionRepository'
import {
  buildGetCollectionsUseCase,
  buildGetRecentCollectionsUseCase,
  buildGetCollectionsByClientIdUseCase,
  buildGetCollectionsByCreditIdUseCase,
  buildCreateCollectionUseCase,
} from '../../application/useCases'
import { CreateCollectionRequest } from '../../domain/models'
import { useAuthStore } from '@/features/auth/presentation/store/authStore'

export const useCollections = () => {
  const { user } = useAuthStore()

  const collectionService = useMemo(() => {
    const repository = new CollectionRepository()
    return new CollectionService(repository)
  }, [])

  const getCollectionsUseCase = useMemo(
    () => buildGetCollectionsUseCase(collectionService),
    [collectionService]
  )

  const getRecentCollectionsUseCase = useMemo(
    () => buildGetRecentCollectionsUseCase(collectionService),
    [collectionService]
  )

  const getCollectionsByClientIdUseCase = useMemo(
    () => buildGetCollectionsByClientIdUseCase(collectionService),
    [collectionService]
  )

  const getCollectionsByCreditIdUseCase = useMemo(
    () => buildGetCollectionsByCreditIdUseCase(collectionService),
    [collectionService]
  )

  const createCollectionUseCase = useMemo(
    () => buildCreateCollectionUseCase(collectionService),
    [collectionService]
  )

  const { data, error, isLoading, mutate } = useSWR(
    user ? 'collections' : null,
    () => getCollectionsUseCase()
  )

  const createCollection = async (request: CreateCollectionRequest) => {
    if (!user?.business_id || !user?.id) {
      throw new Error('Usuario no tiene negocio o ID asignado')
    }
    const result = await createCollectionUseCase(request, user.business_id, user.id)
    mutate()
    return result
  }

  return {
    collections: data || [],
    error,
    isLoading,
    refetch: mutate,
    createCollection,
    getRecentCollections: getRecentCollectionsUseCase,
    getCollectionsByClientId: getCollectionsByClientIdUseCase,
    getCollectionsByCreditId: getCollectionsByCreditIdUseCase,
  }
}


