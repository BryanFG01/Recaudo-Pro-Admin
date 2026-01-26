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
  /** Código del negocio (ej: ARG01). */
  business_code?: string | null
  /** ID del usuario asignado como gestor. */
  user_id?: string | null
  /** Número del usuario (ej: ARGCOBRADOR1). */
  user_number?: string | null
}

export interface UpdateClientRequest extends Partial<CreateClientRequest> {
  id: string
}


