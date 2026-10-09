import { Client, CreateClientRequest, UpdateClientRequest } from '../models'
import { ClientWithCredits } from '../models/ClientWithCredits'
import { ClientFilters } from '@/shared/types/filters'

export interface IClientRepository {
  getClientsWithCredits(businessId: string, userId: string, userEmail?: string, businessCode?: string, userNumber?: string): Promise<ClientWithCredits[]>
  getClientsWithFilters(filters: ClientFilters): Promise<ClientWithCredits[]>
  getClientById(id: string): Promise<Client | null>
  createClient(request: CreateClientRequest, businessId: string): Promise<Client>
  updateClient(request: UpdateClientRequest): Promise<Client>
  deleteClient(id: string): Promise<void>
}
