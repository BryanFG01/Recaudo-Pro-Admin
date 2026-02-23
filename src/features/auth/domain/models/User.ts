export interface User {
  id: string
  /** Nombre(s) del usuario. */
  first_name?: string | null
  document_number?: string | null
  /** Puede ser null si el backend no lo tiene (ej. usuario creado sin email). */
  email: string | null
  name: string | null
  avatar_url: string | null
  business_id: string
  employee_code: string | null
  phone: string | null
  role: 'admin' | 'cobrador' | 'supervisor'
  commission_percentage: number | null
  is_active: boolean
  created_at: string
  updated_at: string
  /** Número/código de usuario (ej. USR001). El backend puede incluirlo. */
  number?: string | null
}

export interface SignInRequest {
  email: string
  password: string
  /** Para elegir el usuario del negocio cuando el API devuelve un array. UUID o id del negocio. */
  businessId?: string
  /** Código de negocio (ej. ARG01) para matchear si el API devuelve business_id como código. */
  businessCode?: string
}

export interface SignInResponse {
  user: User
  token: string
  success: boolean
}

export interface CreateUserRequest {
  email: string
  password: string
  role: 'admin' | 'cobrador' | 'supervisor'
  /** Código/número de usuario (ej: USR001) */
  number?: string
  name?: string
  first_name?: string
  second_name?: string
  first_last_name?: string
  second_last_name?: string
  document_type?: string
  document_number?: string
  document_file_url?: string
  phone?: string
  address?: string
  residence_country?: string
  residence_city?: string
  work_country?: string
  business_code?: string
  employee_code?: string
  commission_percentage?: number
  is_active?: boolean
}
