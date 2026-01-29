import { useMemo } from 'react'
import {
  buildGetCurrentUserUseCase,
  buildResetPasswordUseCase,
  buildSignInUseCase,
  buildSignOutUseCase
} from '../../application/useCases'
import { CreateUserRequest, SignInRequest } from '../../domain/models'
import { AuthService } from '../../domain/services/AuthService'
import { AuthRepository } from '../../infrastructure/repositories/AuthRepository'
import { useAuthStore } from '../store/authStore'

export const useAuth = () => {
  const { user, setUser, signOut: signOutStore } = useAuthStore()

  // Instanciar Repository y Service
  const authService = useMemo(() => {
    const repository = new AuthRepository()
    return new AuthService(repository)
  }, [])

  // Construir Use Cases
  const signInUseCase = useMemo(() => buildSignInUseCase(authService), [authService])

  const getCurrentUserUseCase = useMemo(
    () => buildGetCurrentUserUseCase(authService),
    [authService]
  )

  const signOutUseCase = useMemo(() => buildSignOutUseCase(authService), [authService])

  const resetPasswordUseCase = useMemo(() => buildResetPasswordUseCase(authService), [authService])

  // Handlers
  const getUsersByBusinessId = async (businessId: string) => {
    try {
      return await authService.getUsersByBusinessId(businessId)
    } catch (error) {
      throw error
    }
  }

  const getBusinessByCode = async (code: string) => {
    try {
      const repository = new AuthRepository()
      return await repository.getBusinessByCode(code)
    } catch (error) {
      throw error
    }
  }
  const signIn = async (request: SignInRequest) => {
    try {
      const response = await signInUseCase(request)
      setUser(response.user)
      // No sobrescribir businessId: debe mantenerse el del Código de negocio ingresado
      // en el paso 1. response.user.business_id puede ser de otro negocio (ej. NEG003).
      return { success: true, error: null }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error al iniciar sesión'
      }
    }
  }

  const signOut = async () => {
    try {
      await signOutUseCase()
      signOutStore()
      return { success: true, error: null }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error al cerrar sesión'
      }
    }
  }

  const loadCurrentUser = async () => {
    try {
      const currentUser = await getCurrentUserUseCase()
      if (currentUser) {
        setUser(currentUser)
      }
      return currentUser
    } catch (error) {
      return null
    }
  }

  const resetPassword = async (email: string) => {
    try {
      await resetPasswordUseCase(email)
      return { success: true, error: null }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error al resetear contraseña'
      }
    }
  }

  const createUser = async (request: CreateUserRequest, businessId: string) => {
    try {
      const user = await authService.createUser(request, businessId)
      return { success: true, error: null, user }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error al crear usuario',
        user: null
      }
    }
  }

  const deleteUser = async (id: string) => {
    try {
      await authService.deleteUser(id)
      return { success: true, error: null }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error al eliminar usuario'
      }
    }
  }

  const updateUserActive = async (identifier: string, isActive: boolean) => {
    try {
      const updated = await authService.updateUserActive(identifier, isActive)
      return { success: true, error: null, user: updated }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error al actualizar estado',
        user: null
      }
    }
  }

  return {
    user,
    signIn,
    signOut,
    loadCurrentUser,
    resetPassword,
    getUsersByBusinessId,
    getBusinessByCode,
    createUser,
    deleteUser,
    updateUserActive
  }
}
