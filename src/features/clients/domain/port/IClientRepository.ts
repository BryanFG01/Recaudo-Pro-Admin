import { Client, CreateClientRequest, UpdateClientRequest } from '../models'
import { ClientWithCredits } from '../models/ClientWithCredits'
import { ClientFilters } from '@/shared/types/filters'

export interface IClientRepository {
  getClients(): Promise<Client[]>
  getClientsWithCredits(businessId: string, userEmail?: string): Promise<ClientWithCredits[]>
  getClientsWithFilters(filters: ClientFilters): Promise<ClientWithCredits[]>
  getClientById(id: string): Promise<Client | null>
  searchClients(query: string): Promise<Client[]>
  createClient(request: CreateClientRequest, businessId: string): Promise<Client>
  updateClient(request: UpdateClientRequest): Promise<Client>
}


