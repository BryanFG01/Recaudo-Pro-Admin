import { IClientRepository } from '../../domain/port'
import { Client, CreateClientRequest, UpdateClientRequest } from '../../domain/models'
import { ClientWithCredits } from '../../domain/models/ClientWithCredits'
import { ClientFilters } from '@/shared/types/filters'
import { apiClient } from '@/shared/config/api'

export class ClientRepository implements IClientRepository {
  /**
   * GET /api/clients: el Swagger indica que solo business_code es necesario para traer clientes.
   * user_id/user_number son opcionales; si no se envían, el backend devuelve todos los del negocio.
   * userEmail se aplica en el cliente tras la respuesta.
   */
  async getClientsWithCredits(
    businessId: string,
    _userId: string,
    userEmail?: string,
    businessCode?: string,
    _userNumber?: string
  ): Promise<ClientWithCredits[]> {
    try {
      const params = new URLSearchParams()
      if (businessCode) params.set('business_code', businessCode)
      else params.set('business_id', businessId)
      const clients = await apiClient.get<ClientWithCredits[]>(`/api/clients?${params.toString()}`)

      if (userEmail) {
        return (clients || []).filter((c) => c.user_email === userEmail)
      }
      return clients || []
    } catch (error) {
      throw new Error(`Error al obtener clientes con créditos: ${error instanceof Error ? error.message : 'Error desconocido'}`)
    }
  }
  async getClients(): Promise<Client[]> {
    try {
      // TODO: Necesitamos el businessId para obtener clientes
      // Por ahora retornamos array vacío, pero esto debería requerir businessId
      return []
    } catch (error) {
      throw new Error(`Error al obtener clientes: ${error instanceof Error ? error.message : 'Error desconocido'}`)
    }
  }

  async getClientById(id: string): Promise<Client | null> {
    try {
      const client = await apiClient.get<Client>(`/api/clients/${encodeURIComponent(id)}`)
      return client
    } catch (error) {
      // Si el cliente no existe, retornar null
      if (error instanceof Error && error.message.includes('404')) {
        return null
      }
      throw new Error(`Error al obtener cliente: ${error instanceof Error ? error.message : 'Error desconocido'}`)
    }
  }

  async searchClients(query: string): Promise<Client[]> {
    try {
      // TODO: El backend debería tener un endpoint de búsqueda
      // Por ahora retornamos array vacío
      return []
    } catch (error) {
      throw new Error(`Error al buscar clientes: ${error instanceof Error ? error.message : 'Error desconocido'}`)
    }
  }

  /**
   * POST /api/clients
   * Body: name, phone, document_id?, address?, latitude?, longitude?, business_id, business_code?, user_id?, user_number?
   */
  async createClient(request: CreateClientRequest, businessId: string): Promise<Client> {
    try {
      const clientData: Record<string, unknown> = {
        name: request.name,
        phone: request.phone,
        document_id: request.document_id ?? undefined,
        address: request.address ?? undefined,
        latitude: request.latitude ?? undefined,
        longitude: request.longitude ?? undefined,
        business_id: businessId,
      }
      if (request.business_code != null) clientData.business_code = request.business_code
      if (request.user_id != null) clientData.user_id = request.user_id
      if (request.user_number != null) clientData.user_number = request.user_number

      const client = await apiClient.post<Client>('/api/clients', clientData)
      return client
    } catch (error) {
      throw new Error(`Error al crear cliente: ${error instanceof Error ? error.message : 'Error desconocido'}`)
    }
  }

  /**
   * PATCH /api/clients/{id}
   * Body parcial: name?, phone?, document_id?, address?, latitude?, longitude?, business_code?, user_id?, user_number?
   */
  async updateClient(request: UpdateClientRequest): Promise<Client> {
    try {
      const { id, ...updates } = request
      const client = await apiClient.patch<Client>(`/api/clients/${encodeURIComponent(id)}`, updates)
      return client
    } catch (error) {
      throw new Error(`Error al actualizar cliente: ${error instanceof Error ? error.message : 'Error desconocido'}`)
    }
  }

  /**
   * DELETE /api/clients/{id}
   */
  async deleteClient(id: string): Promise<void> {
    try {
      await apiClient.delete(`/api/clients/${encodeURIComponent(id)}`)
    } catch (error) {
      throw new Error(`Error al eliminar cliente: ${error instanceof Error ? error.message : 'Error desconocido'}`)
    }
  }

  /**
   * GET /api/clients: según Swagger solo business_code es necesario para traer la data.
   * Se prioriza business_code; si no está, se usa business_id. No se envían user_id/user_number.
   */
  async getClientsWithFilters(filters: ClientFilters): Promise<ClientWithCredits[]> {
    try {
      const params = new URLSearchParams()
      if (filters.businessCode) params.set('business_code', filters.businessCode)
      else if (filters.businessId) params.set('business_id', filters.businessId)
      const clients = await apiClient.get<ClientWithCredits[]>(`/api/clients?${params.toString()}`)

      let filteredClients = clients || []

      // Aplicar filtros solo cuando hay valor no vacío; "__all__" se trata como "Todos" (sin filtro)
      const has = (v: string | Date | undefined) =>
        v != null && (typeof v !== 'string' || v !== '__all__') && String(v).trim() !== ''
      if (has(filters.clientId)) {
        filteredClients = filteredClients.filter((c: ClientWithCredits) => c.id === filters.clientId)
      }
      if (has(filters.startDate)) {
        const from = new Date(filters.startDate as string | Date)
        if (!Number.isNaN(from.getTime())) {
          filteredClients = filteredClients.filter((c: ClientWithCredits) => new Date(c.created_at || 0) >= from)
        }
      }
      if (has(filters.endDate)) {
        const to = new Date(filters.endDate as string | Date)
        if (!Number.isNaN(to.getTime())) {
          filteredClients = filteredClients.filter((c: ClientWithCredits) => new Date(c.created_at || 0) <= to)
        }
      }
      if (has(filters.userEmail)) {
        filteredClients = filteredClients.filter((c: ClientWithCredits) => c.user_email === filters.userEmail)
      }

      return filteredClients
    } catch (error) {
      throw new Error(`Error al obtener clientes con filtros: ${error instanceof Error ? error.message : 'Error desconocido'}`)
    }
  }
}


