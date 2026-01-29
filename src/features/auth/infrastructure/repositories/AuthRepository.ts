import { apiClient } from '@/shared/config/api'
import { CreateUserRequest, SignInRequest, SignInResponse, User } from '../../domain/models'
import { IAuthRepository } from '../../domain/port'

interface Business {
  id: string
  code: string
  name?: string
}

export class AuthRepository implements IAuthRepository {
  /**
   * Obtiene negocio por código.
   * GET /api/businesses/code/{code}
   * Solo recibe code en la ruta (sin body ni query).
   */
  async getBusinessByCode(code: string): Promise<Business> {
    try {
      const cleanCode = code.trim()
      if (!cleanCode) throw new Error('El código de negocio no puede estar vacío')
      const business = await apiClient.get<Business>(
        `/api/businesses/code/${encodeURIComponent(cleanCode)}`
      )
      return business
    } catch (error) {
      throw new Error(
        `Error al buscar negocio: ${error instanceof Error ? error.message : 'Error desconocido'}`
      )
    }
  }
  /**
   * Inicio de sesión super-admin.
   * POST /api/super-admins/{businessCode}/users-by-credentials
   * - businessCode en la URL (viene del paso 1, ej. ARG01, NEG003).
   * - Body: { email, password }.
   * Respuesta: array o un usuario { id, number, name, role, phone, employee_code, is_active, business_id }.
   */
  async signInWithEmail(request: SignInRequest): Promise<SignInResponse> {
    try {
      const code = request.businessCode?.trim()
      if (!code) throw new Error('Código de negocio es requerido para iniciar sesión.')

      const path = `/api/super-admins/${encodeURIComponent(code)}/users-by-credentials`
      const res = await apiClient.post<unknown>(path, {
        email: request.email.trim(),
        password: request.password
      })

      type BackendUser = {
        id: string
        number?: string
        name: string | null
        role: string
        phone?: string | null
        employee_code?: string | null
        is_active: boolean
        business_id: string
      }
      const list: BackendUser[] = Array.isArray(res)
        ? (res as BackendUser[])
        : res && typeof res === 'object' && 'id' in res
          ? [res as BackendUser]
          : []
      if (list.length === 0) throw new Error('La respuesta del servidor no incluye el usuario')

      const matches = (u: BackendUser) =>
        (request.businessId && u.business_id === request.businessId) ||
        (request.businessCode && u.business_id === request.businessCode)
      const chosen =
        request.businessId || request.businessCode ? (list.find(matches) ?? list[0]) : list[0]

      const user: User = {
        id: chosen.id,
        email: request.email.trim(),
        name: chosen.name ?? null,
        avatar_url: null,
        business_id: chosen.business_id,
        employee_code: chosen.employee_code ?? null,
        phone: chosen.phone ?? null,
        role: chosen.role as User['role'],
        commission_percentage: null,
        is_active: chosen.is_active,
        created_at: (chosen as { created_at?: string }).created_at ?? '',
        updated_at: (chosen as { updated_at?: string }).updated_at ?? ''
      }
      return { user, success: true }
    } catch (error) {
      const msg = error instanceof Error ? error.message : ''
      // No exponer detalles internos, URLs ni mensajes del backend al usuario
      if (/unauthorized|401|403|forbidden|credenciales|incorrecto/i.test(msg)) {
        throw new Error('Correo o contraseña incorrectos.')
      }
      throw new Error('Error al iniciar sesión. Intentá de nuevo.')
    }
  }

  /**
   * GET /api/users/business/{businessId}
   * businessId: UUID o código (ej. ARG01). Se elimina password de la respuesta por seguridad.
   */
  async getUsersByBusinessId(businessId: string): Promise<User[]> {
    try {
      const cleanBusinessId = businessId.trim()
      if (!cleanBusinessId) {
        throw new Error('ID de negocio no puede estar vacío')
      }

      type ApiUser = User & { password?: unknown }
      const raw = await apiClient.get<ApiUser[]>(
        `/api/users/business/${encodeURIComponent(cleanBusinessId)}`
      )
      const list = Array.isArray(raw) ? raw : []
      // No guardar password en el estado: el backend no debería enviarlo en listados
      return list.map(({ password: _p, ...u }) => u as User)
    } catch (error) {
      throw new Error(
        `Error al obtener usuarios: ${error instanceof Error ? error.message : 'Error desconocido'}`
      )
    }
  }

  async getUserById(id: string): Promise<User> {
    try {
      const user = await apiClient.get<User>(`/api/users/${encodeURIComponent(id)}`)
      return user
    } catch (error) {
      throw new Error(
        `Error al obtener usuario: ${error instanceof Error ? error.message : 'Error desconocido'}`
      )
    }
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      // TODO: Implementar obtención de usuario actual desde el backend
      // Esto dependerá de cómo el backend maneje la autenticación
      return null
    } catch (error) {
      return null
    }
  }

  async signOut(): Promise<void> {
    // TODO: Implementar cierre de sesión con el backend
  }

  async resetPassword(_email: string): Promise<void> {
    // TODO: Implementar reset de contraseña con el backend
  }

  /**
   * POST /api/users
   * Body: CreateUserRequest + business_id.
   * Campos soportados: email, password, role, number, name, first_name, second_name,
   * first_last_name, second_last_name, document_type, document_number, document_file_url,
   * phone, address, residence_country, residence_city, work_country, business_code,
   * employee_code, commission_percentage, is_active, business_id.
   */
  async createUser(request: CreateUserRequest, businessId: string): Promise<User> {
    try {
      const userData = { ...request, business_id: businessId }
      const user = await apiClient.post<User>('/api/users', userData)
      return user
    } catch (error) {
      throw new Error(
        `Error al crear usuario: ${error instanceof Error ? error.message : 'Error desconocido'}`
      )
    }
  }

  /**
   * DELETE /api/users/{id}
   */
  async deleteUser(id: string): Promise<void> {
    try {
      await apiClient.delete(`/api/users/${encodeURIComponent(id)}`)
    } catch (error) {
      throw new Error(
        `Error al eliminar usuario: ${error instanceof Error ? error.message : 'Error desconocido'}`
      )
    }
  }

  /**
   * PATCH /api/users/{identifier}
   * identifier = user.id (UUID). Body: { is_active: true | false }.
   */
  async updateUserActive(identifier: string, isActive: boolean): Promise<User> {
    try {
      const clean = identifier.trim()
      if (!clean) throw new Error('El identificador (id) del usuario es requerido')
      const user = await apiClient.patch<User>(`/api/users/${encodeURIComponent(clean)}`, {
        is_active: isActive
      })
      return user
    } catch (error) {
      throw new Error(
        `Error al actualizar estado: ${error instanceof Error ? error.message : 'Error desconocido'}`
      )
    }
  }
}
