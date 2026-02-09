import { IWithdrawalRepository } from '../port'
import { Withdrawal, UpdateWithdrawalApprovalRequest } from '../models'

export class WithdrawalService {
  constructor(private readonly repository: IWithdrawalRepository) {}

  async getByUserId(userId: string): Promise<Withdrawal[]> {
    if (!userId) throw new Error('user_id es requerido')
    return this.repository.getByUserId(userId)
  }

  async getAll(): Promise<Withdrawal[]> {
    return this.repository.getAll()
  }

  async getAllByBusinessId(businessId: string): Promise<Withdrawal[]> {
    if (!businessId) return []
    return this.repository.getAllByBusinessId(businessId)
  }

  async updateApproval(
    id: string,
    request: UpdateWithdrawalApprovalRequest
  ): Promise<Withdrawal> {
    if (!id) throw new Error('ID de retiro es requerido')
    return this.repository.updateApproval(id, request)
  }
}
