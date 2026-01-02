export interface Client {
  id: string
  name: string
  phone: string
  document_id: string | null
  address: string | null
  latitude: number | null
  longitude: number | null
  business_id: string
  created_at: string
  updated_at: string
}

export interface CreateClientRequest {
  name: string
  phone: string
  document_id?: string | null
  address?: string | null
  latitude?: number | null
  longitude?: number | null
}

export interface UpdateClientRequest extends Partial<CreateClientRequest> {
  id: string
}


