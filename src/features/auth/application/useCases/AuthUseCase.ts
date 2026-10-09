import { AuthService } from '../../domain/services/AuthService'
import { SignInRequest, SignInResponse } from '../../domain/models'

export const buildSignInUseCase = (service: AuthService) => {
  return async (request: SignInRequest): Promise<SignInResponse> => {
    return service.signInWithEmail(request)
  }
}

export const buildSignOutUseCase = (service: AuthService) => {
  return async (): Promise<void> => {
    return service.signOut()
  }
}
