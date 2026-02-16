import { useCallback, useMemo } from 'react'
import { CashSessionService } from '../../domain/services/CashSessionService'
import { CashSessionRepository } from '../../infrastructure/repositories/CashSessionRepository'
import {
  buildCreateCashSessionUseCase,
  buildUpdateCashSessionUseCase,
  buildGetCashSessionByIdUseCase,
  buildGetCashSessionsByBusinessIdUseCase,
  buildGetCashSessionsByUserIdUseCase,
  buildGetCashSessionFlowUseCase,
  buildGetDailySummaryByUserUseCase,
  buildDeleteCashSessionUseCase
} from '../../application/useCases'
import {
  CreateCashSessionRequest,
  UpdateCashSessionRequest
} from '../../domain/models'

export function useCashSessions() {
  const service = useMemo(() => {
    const repository = new CashSessionRepository()
    return new CashSessionService(repository)
  }, [])

  const createCashSessionFn = useMemo(
    () => buildCreateCashSessionUseCase(service),
    [service]
  )
  const updateCashSessionFn = useMemo(
    () => buildUpdateCashSessionUseCase(service),
    [service]
  )
  const getCashSessionByIdFn = useMemo(
    () => buildGetCashSessionByIdUseCase(service),
    [service]
  )
  const getCashSessionsByBusinessIdFn = useMemo(
    () => buildGetCashSessionsByBusinessIdUseCase(service),
    [service]
  )
  const getCashSessionsByUserIdFn = useMemo(
    () => buildGetCashSessionsByUserIdUseCase(service),
    [service]
  )
  const getCashSessionFlowFn = useMemo(
    () => buildGetCashSessionFlowUseCase(service),
    [service]
  )
  const getDailySummaryByUserFn = useMemo(
    () => buildGetDailySummaryByUserUseCase(service),
    [service]
  )
  const deleteCashSessionFn = useMemo(
    () => buildDeleteCashSessionUseCase(service),
    [service]
  )

  const createCashSession = useCallback(
    (request: CreateCashSessionRequest) => createCashSessionFn(request),
    [createCashSessionFn]
  )
  const updateCashSession = useCallback(
    (id: string, request: UpdateCashSessionRequest) => updateCashSessionFn(id, request),
    [updateCashSessionFn]
  )
  const getCashSessionById = useCallback(
    (id: string) => getCashSessionByIdFn(id),
    [getCashSessionByIdFn]
  )
  const getCashSessionsByBusinessId = useCallback(
    (businessId: string) => getCashSessionsByBusinessIdFn(businessId),
    [getCashSessionsByBusinessIdFn]
  )
  const getCashSessionsByUserId = useCallback(
    (userId: string) => getCashSessionsByUserIdFn(userId),
    [getCashSessionsByUserIdFn]
  )
  const getCashSessionFlow = useCallback(
    (id: string) => getCashSessionFlowFn(id),
    [getCashSessionFlowFn]
  )
  const getDailySummaryByUser = useCallback(
    (userId: string) => getDailySummaryByUserFn(userId),
    [getDailySummaryByUserFn]
  )
  const deleteCashSession = useCallback(
    (id: string) => deleteCashSessionFn(id),
    [deleteCashSessionFn]
  )

  return {
    createCashSession,
    updateCashSession,
    getCashSessionById,
    getCashSessionsByBusinessId,
    getCashSessionsByUserId,
    getCashSessionFlow,
    getDailySummaryByUser,
    deleteCashSession
  }
}
