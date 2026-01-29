import { CreateUserRequest, SignInRequest, SignInResponse, User } from '../models'

export interface IAuthRepository {
  signInWithEmail(request: SignInRequest): Promise<SignInResponse>
  getUsersByBusinessId(businessId: string): Promise<User[]>
  getCurrentUser(): Promise<User | null>
  signOut(): Promise<void>
  resetPassword(email: string): Promise<void>
  createUser(request: CreateUserRequest, businessId: string): Promise<User>
  deleteUser(id: string): Promise<void>
  /** PATCH /api/users/{identifier} con body { is_active }. identifier = user.id (UUID). */
  updateUserActive(identifier: string, isActive: boolean): Promise<User>
}
