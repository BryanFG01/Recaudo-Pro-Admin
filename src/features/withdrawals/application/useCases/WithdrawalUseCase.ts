import { WithdrawalService } from '../../domain/services/WithdrawalService'
import { Withdrawal, UpdateWithdrawalApprovalRequest } from '../../domain/models'

export const buildGetWithdrawalsByUserIdUseCase = (service: WithdrawalService) => {
  return async (userId: string): Promise<Withdrawal[]> => {
    return service.getByUserId(userId)
  }
}

export const buildGetAllWithdrawalsUseCase = (service: WithdrawalService) => {
  return async (): Promise<Withdrawal[]> => {
    return service.getAll()
  }
}

export const buildUpdateWithdrawalApprovalUseCase = (service: WithdrawalService) => {
  return async (
    id: string,
    request: UpdateWithdrawalApprovalRequest
  ): Promise<Withdrawal> => {
    return service.updateApproval(id, request)
  }
}
