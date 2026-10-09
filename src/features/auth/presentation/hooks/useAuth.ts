import { useCallback, useMemo } from 'react'
import { buildSignInUseCase, buildSignOutUseCase } from '../../application/useCases'
import { CreateUserRequest, SignInRequest } from '../../domain/models'
import { AuthService } from '../../domain/services/AuthService'
import { AuthRepository } from '../../infrastructure/repositories/AuthRepository'
import { useAuthStore } from '../store/authStore'

const errorText = (error: unknown, fallback: string) => (error instanceof Error ? error.message : fallback)

export const useAuth = () => {
  const { user, setUser, signOut: clearStore } = useAuthStore()

  const repository = useMemo(() => new AuthRepository(), [])
  const authService = useMemo(() => new AuthService(repository), [repository])
  const signInUseCase = useMemo(() => buildSignInUseCase(authService), [authService])
  const signOutUseCase = useMemo(() => buildSignOutUseCase(authService), [authService])

  // useCallback para que no dispare efectos en las páginas que dependen de esta función
  const getUsersByBusinessId = useCallback(
    (businessId: string) => authService.getUsersByBusinessId(businessId),
    [authService]
  )

  const getBusinessByCode = (code: string) => repository.getBusinessByCode(code)

  const signIn = async (request: SignInRequest) => {
    try {
      const { user: signedIn } = await signInUseCase(request)
      setUser(signedIn)
      return { success: true, error: null }
    } catch (error) {
      return { success: false, error: errorText(error, 'Error al iniciar sesión') }
    }
  }

  /** Cierra la sesión en el backend y limpia los datos locales. */
  const signOut = useCallback(async () => {
    await signOutUseCase()
    clearStore()
  }, [signOutUseCase, clearStore])

  const createUser = async (request: CreateUserRequest, businessId: string) => {
    try {
      const created = await authService.createUser(request, businessId)
      return { success: true, error: null, user: created }
    } catch (error) {
      return { success: false, error: errorText(error, 'Error al crear usuario'), user: null }
    }
  }

  const deleteUser = async (id: string) => {
    try {
      await authService.deleteUser(id)
      return { success: true, error: null }
    } catch (error) {
      return { success: false, error: errorText(error, 'Error al eliminar usuario') }
    }
  }

  const updateUserActive = async (identifier: string, isActive: boolean) => {
    try {
      const updated = await authService.updateUserActive(identifier, isActive)
      return { success: true, error: null, user: updated }
    } catch (error) {
      return { success: false, error: errorText(error, 'Error al actualizar estado'), user: null }
    }
  }

  return {
    user,
    signIn,
    signOut,
    getUsersByBusinessId,
    getBusinessByCode,
    createUser,
    deleteUser,
    updateUserActive
  }
}
