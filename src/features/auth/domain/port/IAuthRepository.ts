import { User, SignInRequest, SignInResponse, CreateUserRequest } from '../models'

export interface IAuthRepository {
  signInWithEmail(request: SignInRequest): Promise<SignInResponse>
  getUsersByBusinessId(businessId: string): Promise<User[]>
  getCurrentUser(): Promise<User | null>
  signOut(): Promise<void>
  resetPassword(email: string): Promise<void>
  createUser(request: CreateUserRequest, businessId: string): Promise<User>
}


