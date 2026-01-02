import { AuthService } from '../../domain/services/AuthService'
import { SignInRequest, SignInResponse, User } from '../../domain/models'

export const buildSignInUseCase = (service: AuthService) => {
  return async (request: SignInRequest): Promise<SignInResponse> => {
    return service.signInWithEmail(request)
  }
}

export const buildGetCurrentUserUseCase = (service: AuthService) => {
  return async (): Promise<User | null> => {
    return service.getCurrentUser()
  }
}

export const buildSignOutUseCase = (service: AuthService) => {
  return async (): Promise<void> => {
    return service.signOut()
  }
}

export const buildResetPasswordUseCase = (service: AuthService) => {
  return async (email: string): Promise<void> => {
    return service.resetPassword(email)
  }
}


