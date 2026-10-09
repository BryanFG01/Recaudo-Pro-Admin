import { ClientService } from '../../domain/services/ClientService'
import { CreateClientRequest, UpdateClientRequest, Client } from '../../domain/models'

export const buildGetClientByIdUseCase = (service: ClientService) => {
  return async (id: string): Promise<Client | null> => {
    return service.getClientById(id)
  }
}

export const buildCreateClientUseCase = (service: ClientService) => {
  return async (request: CreateClientRequest, businessId: string): Promise<Client> => {
    return service.createClient(request, businessId)
  }
}

export const buildUpdateClientUseCase = (service: ClientService) => {
  return async (request: UpdateClientRequest): Promise<Client> => {
    return service.updateClient(request)
  }
}

export const buildDeleteClientUseCase = (service: ClientService) => {
  return async (id: string): Promise<void> => {
    return service.deleteClient(id)
  }
}
