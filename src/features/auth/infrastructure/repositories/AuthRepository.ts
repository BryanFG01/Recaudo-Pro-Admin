import { apiClient, ApiError } from '@/shared/config/api'
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
   * - businessCode en la URL (viene del paso 1, ej. ARG01, Quantim).
   * - Body: { email, password }.
   * Respuesta 201: { user?: {...} } o array o objeto con id. Acepta snake_case y camelCase.
   */
  async signInWithEmail(request: SignInRequest): Promise<SignInResponse> {
    try {
      const code = request.businessCode?.trim()
      if (!code) throw new Error('Código de negocio es requerido para iniciar sesión.')

      const body = {
        email: request.email.trim(),
        password: request.password
      }

      let res: unknown
      let responseToken = ''
      try {
        const raw = await apiClient.post<unknown>(
          `/api/super-admins/${encodeURIComponent(code)}/users-by-credentials`,
          body
        )
        const rawObj = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : null
        if (rawObj && typeof rawObj.token === 'string') {
          responseToken = rawObj.token
          res = rawObj.user ?? raw
        } else {
          res = raw
        }
      } catch (postErr) {
        if (postErr instanceof ApiError && postErr.status === 401) {
          throw new Error('Correo o contraseña incorrectos.')
        }
        throw postErr
      }

      const raw = (r: unknown): Record<string, unknown> | null =>
        r && typeof r === 'object' && r !== null ? (r as Record<string, unknown>) : null

      const pick = (o: Record<string, unknown>, key: string, alt?: string): unknown =>
        o[key] ?? (alt ? o[alt] : undefined)

      const toBackendUser = (o: Record<string, unknown>) => ({
        id: String(pick(o, 'id') ?? ''),
        number: pick(o, 'number') as string | undefined,
        name: (pick(o, 'name') as string | null) ?? null,
        role: String(pick(o, 'role') ?? 'admin'),
        phone: (pick(o, 'phone') as string | null) ?? null,
        employee_code: (pick(o, 'employee_code', 'employeeCode') as string | null) ?? null,
        is_active: pick(o, 'is_active', 'isActive') === true,
        business_id: String(pick(o, 'business_id', 'businessId') ?? ''),
        created_at: pick(o, 'created_at', 'createdAt') as string | undefined,
        updated_at: pick(o, 'updated_at', 'updatedAt') as string | undefined
      })

      let list: ReturnType<typeof toBackendUser>[] = []
      const obj = raw(res)
      if (Array.isArray(res)) {
        list = (res as Record<string, unknown>[]).map((item) => toBackendUser(item))
      } else if (obj) {
        if (obj.user && typeof obj.user === 'object' && obj.user !== null) {
          list = [toBackendUser(obj.user as Record<string, unknown>)]
        } else if (obj.data && typeof obj.data === 'object' && obj.data !== null) {
          const data = obj.data
          list = Array.isArray(data)
            ? (data as Record<string, unknown>[]).map((item) => toBackendUser(item))
            : [toBackendUser(data as Record<string, unknown>)]
        } else if ('id' in obj && obj.id) {
          list = [toBackendUser(obj)]
        }
      }

      const businessIdFromRequest = request.businessId ?? request.businessCode ?? code ?? ''

      if (list.length === 0) {
        // Respuesta vacía []: super admin sin usuarios; permitir entrar para crear usuarios
        const user: User = {
          id: `super-${request.email.trim()}`,
          email: request.email.trim(),
          name: null,
          avatar_url: null,
          business_id: businessIdFromRequest,
          employee_code: null,
          phone: null,
          role: 'admin',
          commission_percentage: null,
          is_active: true,
          created_at: '',
          updated_at: ''
        }
        return { user, token: responseToken, success: true }
      }

      const chosen = list[0]
      if (!chosen.id) throw new Error('La respuesta del servidor no incluye el usuario')

      const chosenBusinessId = chosen.business_id || businessIdFromRequest

      const user: User = {
        id: chosen.id,
        email: request.email.trim(),
        name: chosen.name ?? null,
        avatar_url: null,
        business_id: chosenBusinessId,
        employee_code: chosen.employee_code ?? null,
        phone: chosen.phone ?? null,
        role: (chosen.role as User['role']) || 'admin',
        commission_percentage: null,
        is_active: chosen.is_active,
        created_at: chosen.created_at ?? '',
        updated_at: chosen.updated_at ?? ''
      }
      return { user, token: responseToken, success: true }
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        throw new Error('Correo o contraseña incorrectos.')
      }
      throw error
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

      type ApiUser = User & { password?: unknown; firstName?: string | null }
      const raw = await apiClient.get<ApiUser[]>(
        `/api/users/business/${encodeURIComponent(cleanBusinessId)}`
      )
      const list = Array.isArray(raw) ? raw : []
      // Normalizar first_name (API puede enviar first_name o firstName) y quitar password
      return list.map(({ password: password, firstName, ...u }) => {
        const user = u as User
        return {
          ...user,
          password: password ?? null,
          first_name: user.first_name ?? firstName ?? null
        }
      })
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
        `Error al actualizar estado: ${
          error instanceof Error ? error.message : 'Error desconocido'
        }`
      )
    }
  }
}
