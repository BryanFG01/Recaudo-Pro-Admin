import { IAuthRepository } from '../port'
import { SignInRequest, SignInResponse, User, CreateUserRequest } from '../models'

export class AuthService {
  constructor(private readonly repository: IAuthRepository) {}

  async getUsersByBusinessId(businessId: string): Promise<User[]> {
    if (!businessId) {
      throw new Error('ID de negocio es requerido')
    }

    return this.repository.getUsersByBusinessId(businessId)
  }

  async signInWithEmail(request: SignInRequest): Promise<SignInResponse> {
    if (!request.email?.trim() || !request.password) {
      throw new Error('Email y contraseña son requeridos')
    }

    if (!this.isValidEmail(request.email)) {
      throw new Error('Email inválido')
    }

    return this.repository.signInWithEmail(request)
  }

  async getCurrentUser(): Promise<User | null> {
    return this.repository.getCurrentUser()
  }

  async signOut(): Promise<void> {
    return this.repository.signOut()
  }

  async resetPassword(email: string): Promise<void> {
    if (!email) {
      throw new Error('Email es requerido')
    }

    if (!this.isValidEmail(email)) {
      throw new Error('Email inválido')
    }

    return this.repository.resetPassword(email)
  }

  async createUser(request: CreateUserRequest, businessId: string): Promise<User> {
    if (!request.email) {
      throw new Error('Email es requerido')
    }

    if (!this.isValidEmail(request.email)) {
      throw new Error('Email inválido')
    }

    if (!request.password || request.password.length < 6) {
      throw new Error('La contraseña debe tener al menos 6 caracteres')
    }

    if (!request.role) {
      throw new Error('El rol es requerido')
    }

    if (!businessId) {
      throw new Error('ID de negocio es requerido')
    }

    if (request.commission_percentage !== undefined) {
      if (request.commission_percentage < 0 || request.commission_percentage > 100) {
        throw new Error('El porcentaje de comisión debe estar entre 0 y 100')
      }
    }

    return this.repository.createUser(request, businessId)
  }

  async deleteUser(id: string): Promise<void> {
    if (!id || !id.trim()) throw new Error('ID de usuario es requerido')
    return this.repository.deleteUser(id.trim())
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }
}


