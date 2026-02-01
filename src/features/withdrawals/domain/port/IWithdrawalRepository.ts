import { Withdrawal, UpdateWithdrawalApprovalRequest } from '../models'

export interface IWithdrawalRepository {
  getByUserId(userId: string): Promise<Withdrawal[]>
  getAll(): Promise<Withdrawal[]>
  updateApproval(id: string, request: UpdateWithdrawalApprovalRequest): Promise<Withdrawal>
}
