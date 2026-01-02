import { ClientService } from '../../domain/services/ClientService'
import { CreateClientRequest, UpdateClientRequest, Client } from '../../domain/models'

export const buildGetClientsUseCase = (service: ClientService) => {
  return async (): Promise<Client[]> => {
    return service.getClients()
  }
}

export const buildGetClientByIdUseCase = (service: ClientService) => {
  return async (id: string): Promise<Client | null> => {
    return service.getClientById(id)
  }
}

export const buildSearchClientsUseCase = (service: ClientService) => {
  return async (query: string): Promise<Client[]> => {
    return service.searchClients(query)
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


