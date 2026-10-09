import { apiClient, ApiError } from '@/shared/config/api'
import { CreateUserRequest, SignInRequest, SignInResponse, User } from '../../domain/models'
import { IAuthRepository } from '../../domain/port'

interface Business {
  id: string
  code: string
  name?: string
}

/** Respuesta de /api/session/login (route handler de Next; los tokens quedan en cookies). */
interface SessionLoginResponse {
  super_admin: { id: string; email: string; business_code: string }
}

interface SuperAdminProfile {
  name?: string | null
  phone?: string | null
  avatar_url?: string | null
  is_active?: boolean
  created_at?: string
  updated_at?: string | null
}

export class AuthRepository implements IAuthRepository {
  /** GET /api/businesses/code/{code} (público): paso 1 del login. */
  async getBusinessByCode(code: string): Promise<Business> {
    const cleanCode = code.trim()
    if (!cleanCode) throw new Error('El código de negocio no puede estar vacío')
    try {
      return await apiClient.get<Business>(`/api/businesses/code/${encodeURIComponent(cleanCode)}`)
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        throw new Error(`No se encontró un negocio con el código: ${cleanCode}`)
      }
      throw new Error(`Error al buscar negocio: ${error instanceof Error ? error.message : 'Error desconocido'}`)
    }
  }

  /**
   * Login del super admin. El route handler /api/session/login guarda los tokens en cookies
   * httpOnly y devuelve solo los datos del administrador.
   */
  async signInWithEmail(request: SignInRequest): Promise<SignInResponse> {
    let session: SessionLoginResponse
    try {
      session = await apiClient.post<SessionLoginResponse>('/api/session/login', {
        businessCode: request.businessCode.trim(),
        email: request.email.trim(),
        password: request.password
      })
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) throw new Error('Correo o contraseña incorrectos.')
      if (error instanceof ApiError && error.status === 429) {
        throw new Error('Demasiados intentos. Espera un minuto e inténtalo de nuevo.')
      }
      throw error
    }

    const admin = session.super_admin
    const profile = await this.getSuperAdminProfile(admin.id)
    const user: User = {
      id: admin.id,
      email: admin.email,
      name: profile?.name ?? null,
      avatar_url: profile?.avatar_url ?? null,
      business_id: request.businessId,
      employee_code: null,
      phone: profile?.phone ?? null,
      role: 'super_admin',
      commission_percentage: null,
      is_active: profile?.is_active ?? true,
      created_at: profile?.created_at ?? '',
      updated_at: profile?.updated_at ?? ''
    }
    return { user }
  }

  /** Nombre y datos del administrador para mostrar en el panel (opcional: si falla, se sigue). */
  private async getSuperAdminProfile(id: string): Promise<SuperAdminProfile | null> {
    try {
      return await apiClient.get<SuperAdminProfile>(`/api/super-admins/${encodeURIComponent(id)}`)
    } catch {
      return null
    }
  }

  /** POST /api/session/logout: revoca la sesión en el backend y borra las cookies. */
  async signOut(): Promise<void> {
    await fetch('/api/session/logout', { method: 'POST' }).catch(() => undefined)
  }

  /** GET /api/users/business/{businessId} (UUID o código). La API nunca devuelve contraseñas. */
  async getUsersByBusinessId(businessId: string): Promise<User[]> {
    const cleanBusinessId = businessId.trim()
    if (!cleanBusinessId) throw new Error('ID de negocio no puede estar vacío')
    try {
      const list = await apiClient.get<User[]>(`/api/users/business/${encodeURIComponent(cleanBusinessId)}`)
      return Array.isArray(list) ? list : []
    } catch (error) {
      throw new Error(`Error al obtener usuarios: ${error instanceof Error ? error.message : 'Error desconocido'}`)
    }
  }

  /**
   * POST /api/users. Campos: email, password, role, number, name, first_name, second_name,
   * first_last_name, second_last_name, document_type, document_number, document_file_url,
   * phone, address, residence_country, residence_city, work_country, business_code,
   * employee_code, commission_percentage, is_active, business_id.
   */
  async createUser(request: CreateUserRequest, businessId: string): Promise<User> {
    try {
      return await apiClient.post<User>('/api/users', { ...request, business_id: businessId })
    } catch (error) {
      throw new Error(`Error al crear usuario: ${error instanceof Error ? error.message : 'Error desconocido'}`)
    }
  }

  /** DELETE /api/users/{id} */
  async deleteUser(id: string): Promise<void> {
    try {
      await apiClient.delete(`/api/users/${encodeURIComponent(id)}`)
    } catch (error) {
      throw new Error(`Error al eliminar usuario: ${error instanceof Error ? error.message : 'Error desconocido'}`)
    }
  }

  /** PATCH /api/users/{id} con { is_active }. Desactivar a un usuario cierra sus sesiones en el backend. */
  async updateUserActive(identifier: string, isActive: boolean): Promise<User> {
    const clean = identifier.trim()
    if (!clean) throw new Error('El identificador (id) del usuario es requerido')
    try {
      return await apiClient.patch<User>(`/api/users/${encodeURIComponent(clean)}`, { is_active: isActive })
    } catch (error) {
      throw new Error(`Error al actualizar estado: ${error instanceof Error ? error.message : 'Error desconocido'}`)
    }
  }
}
