import { CashSessionService } from '../../domain/services/CashSessionService'
import {
  CashSession,
  CashSessionFlow,
  CreateCashSessionRequest,
  DailySummaryResponse,
  UpdateCashSessionRequest
} from '../../domain/models'

export const buildCreateCashSessionUseCase = (service: CashSessionService) => {
  return async (request: CreateCashSessionRequest): Promise<CashSession> => {
    return service.create(request)
  }
}

export const buildUpdateCashSessionUseCase = (service: CashSessionService) => {
  return async (id: string, request: UpdateCashSessionRequest): Promise<CashSession> => {
    return service.update(id, request)
  }
}

export const buildGetCashSessionByIdUseCase = (service: CashSessionService) => {
  return async (id: string): Promise<CashSession | null> => {
    return service.getById(id)
  }
}

export const buildGetCashSessionsByBusinessIdUseCase = (service: CashSessionService) => {
  return async (businessId: string): Promise<CashSession[]> => {
    return service.getByBusinessId(businessId)
  }
}

export const buildGetCashSessionsByUserIdUseCase = (service: CashSessionService) => {
  return async (userId: string): Promise<CashSession[]> => {
    return service.getByUserId(userId)
  }
}

export const buildGetCashSessionFlowUseCase = (service: CashSessionService) => {
  return async (id: string): Promise<CashSessionFlow | null> => {
    return service.getFlow(id)
  }
}

export const buildGetDailySummaryByUserUseCase = (service: CashSessionService) => {
  return async (userId: string): Promise<DailySummaryResponse | null> => {
    return service.getDailySummaryByUser(userId)
  }
}

export const buildDeleteCashSessionUseCase = (service: CashSessionService) => {
  return async (id: string): Promise<void> => {
    return service.delete(id)
  }
}
