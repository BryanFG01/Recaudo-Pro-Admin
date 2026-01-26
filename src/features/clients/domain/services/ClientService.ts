import { IClientRepository } from '../port'
import { CreateClientRequest, UpdateClientRequest } from '../models'
import { ClientWithCredits } from '../models'
import { ClientFilters } from '@/shared/types/filters'

export class ClientService {
  constructor(private readonly repository: IClientRepository) {}

  async getClients() {
    return this.repository.getClients()
  }

  async getClientsWithCredits(businessId: string, userId: string, userEmail?: string, businessCode?: string, userNumber?: string): Promise<ClientWithCredits[]> {
    if (!businessId) throw new Error('business_id es requerido')
    if (!userId) throw new Error('user_id es requerido para obtener clientes del negocio')
    return this.repository.getClientsWithCredits(businessId, userId, userEmail, businessCode, userNumber)
  }

  async getClientById(id: string) {
    if (!id) {
      throw new Error('ID de cliente es requerido')
    }
    return this.repository.getClientById(id)
  }

  async searchClients(query: string) {
    if (!query || query.trim().length === 0) {
      throw new Error('La búsqueda no puede estar vacía')
    }
    return this.repository.searchClients(query.trim())
  }

  async createClient(request: CreateClientRequest, businessId: string) {
    if (!request.name || request.name.trim().length === 0) {
      throw new Error('El nombre es requerido')
    }

    if (!request.phone || request.phone.trim().length === 0) {
      throw new Error('El teléfono es requerido')
    }

    if (!businessId) {
      throw new Error('ID de negocio es requerido')
    }

    return this.repository.createClient(request, businessId)
  }

  async updateClient(request: UpdateClientRequest) {
    if (!request.id) {
      throw new Error('ID de cliente es requerido')
    }

    if (request.name && request.name.trim().length === 0) {
      throw new Error('El nombre no puede estar vacío')
    }

    return this.repository.updateClient(request)
  }

  async deleteClient(id: string): Promise<void> {
    if (!id || id.trim().length === 0) {
      throw new Error('ID de cliente es requerido')
    }
    await this.repository.deleteClient(id)
  }

  async getClientsWithFilters(filters: ClientFilters): Promise<ClientWithCredits[]> {
    if (!filters.businessId) throw new Error('ID de negocio es requerido')
    if (!filters.userId) throw new Error('ID de usuario (user_id) es requerido para obtener clientes del negocio')
    return this.repository.getClientsWithFilters(filters)
  }
}


