export interface User {
  id: string
  email: string
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
}

export interface SignInRequest {
  businessId: string
  email: string
  password: string
}

export interface SignInResponse {
  user: User
  success: boolean
}

export interface CreateUserRequest {
  email: string
  password: string
  name?: string
  phone?: string
  employee_code?: string
  role: 'admin' | 'cobrador' | 'supervisor'
  commission_percentage?: number
  is_active?: boolean
}


