import { useMemo } from 'react'
import { ClientService } from '../../domain/services/ClientService'
import { ClientRepository } from '../../infrastructure/repositories/ClientRepository'
import {
  buildGetClientByIdUseCase,
  buildCreateClientUseCase,
  buildUpdateClientUseCase,
  buildDeleteClientUseCase,
} from '../../application/useCases'
import { CreateClientRequest } from '../../domain/models'
import { useAuthStore } from '@/features/auth/presentation/store/authStore'

/** Acciones sobre clientes. Los listados los cargan las páginas con sus filtros. */
export const useClients = () => {
  const { user } = useAuthStore()

  const clientService = useMemo(() => new ClientService(new ClientRepository()), [])
  const getClientById = useMemo(() => buildGetClientByIdUseCase(clientService), [clientService])
  const createClientUseCase = useMemo(() => buildCreateClientUseCase(clientService), [clientService])
  const updateClient = useMemo(() => buildUpdateClientUseCase(clientService), [clientService])
  const deleteClient = useMemo(() => buildDeleteClientUseCase(clientService), [clientService])

  const createClient = async (request: CreateClientRequest) => {
    if (!user?.business_id) throw new Error('Usuario no tiene negocio asignado')
    return createClientUseCase(request, user.business_id)
  }

  return { createClient, updateClient, deleteClient, getClientById }
}
