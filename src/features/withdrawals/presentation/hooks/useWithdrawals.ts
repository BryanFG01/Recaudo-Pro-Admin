import { useCallback, useMemo } from 'react'
import { WithdrawalService } from '../../domain/services/WithdrawalService'
import { WithdrawalRepository } from '../../infrastructure/repositories/WithdrawalRepository'
import {
  buildGetWithdrawalsByUserIdUseCase,
  buildGetAllWithdrawalsByBusinessIdUseCase,
  buildUpdateWithdrawalApprovalUseCase
} from '../../application/useCases'
import { UpdateWithdrawalApprovalRequest } from '../../domain/models'

export function useWithdrawals() {
  const service = useMemo(() => {
    const repository = new WithdrawalRepository()
    return new WithdrawalService(repository)
  }, [])

  const getByUserIdFn = useMemo(() => buildGetWithdrawalsByUserIdUseCase(service), [service])
  const getAllByBusinessIdFn = useMemo(() => buildGetAllWithdrawalsByBusinessIdUseCase(service), [service])
  const updateApprovalFn = useMemo(() => buildUpdateWithdrawalApprovalUseCase(service), [service])

  const getWithdrawalsByUserId = useCallback(
    (userId: string) => getByUserIdFn(userId),
    [getByUserIdFn]
  )
  const getAllWithdrawalsByBusinessId = useCallback(
    (businessId: string) => getAllByBusinessIdFn(businessId),
    [getAllByBusinessIdFn]
  )
  const updateWithdrawalApproval = useCallback(
    (id: string, request: UpdateWithdrawalApprovalRequest) => updateApprovalFn(id, request),
    [updateApprovalFn]
  )

  return {
    getWithdrawalsByUserId,
    getAllWithdrawalsByBusinessId,
    updateWithdrawalApproval
  }
}
