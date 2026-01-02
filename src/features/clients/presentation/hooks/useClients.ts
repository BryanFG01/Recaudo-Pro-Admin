import { useMemo } from 'react'
import useSWR from 'swr'
import { ClientService } from '../../domain/services/ClientService'
import { ClientRepository } from '../../infrastructure/repositories/ClientRepository'
import {
  buildGetClientsUseCase,
  buildGetClientByIdUseCase,
  buildSearchClientsUseCase,
  buildCreateClientUseCase,
  buildUpdateClientUseCase,
} from '../../application/useCases'
import { CreateClientRequest, UpdateClientRequest } from '../../domain/models'
import { useAuthStore } from '@/features/auth/presentation/store/authStore'

export const useClients = () => {
  const { user } = useAuthStore()

  const clientService = useMemo(() => {
    const repository = new ClientRepository()
    return new ClientService(repository)
  }, [])

  const getClientsUseCase = useMemo(
    () => buildGetClientsUseCase(clientService),
    [clientService]
  )

  const getClientByIdUseCase = useMemo(
    () => buildGetClientByIdUseCase(clientService),
    [clientService]
  )

  const searchClientsUseCase = useMemo(
    () => buildSearchClientsUseCase(clientService),
    [clientService]
  )

  const createClientUseCase = useMemo(
    () => buildCreateClientUseCase(clientService),
    [clientService]
  )

  const updateClientUseCase = useMemo(
    () => buildUpdateClientUseCase(clientService),
    [clientService]
  )

  const { data, error, isLoading, mutate } = useSWR(
    user ? 'clients' : null,
    () => getClientsUseCase()
  )

  const createClient = async (request: CreateClientRequest) => {
    if (!user?.business_id) {
      throw new Error('Usuario no tiene negocio asignado')
    }
    const result = await createClientUseCase(request, user.business_id)
    mutate()
    return result
  }

  const updateClient = async (request: UpdateClientRequest) => {
    const result = await updateClientUseCase(request)
    mutate()
    return result
  }

  const searchClients = async (query: string) => {
    return searchClientsUseCase(query)
  }

  return {
    clients: data || [],
    error,
    isLoading,
    refetch: mutate,
    createClient,
    updateClient,
    searchClients,
    getClientById: getClientByIdUseCase,
  }
}


