import { CreditService } from '../../domain/services/CreditService'
import { Credit, CreateCreditRequest, UpdateCreditRequest } from '../../domain/models'

export const buildGetCreditsUseCase = (service: CreditService) => {
  return async (): Promise<Credit[]> => {
    return service.getCredits()
  }
}

export const buildGetCreditsByClientIdUseCase = (service: CreditService) => {
  return async (clientId: string): Promise<Credit[]> => {
    return service.getCreditsByClientId(clientId)
  }
}

export const buildGetCreditByIdUseCase = (service: CreditService) => {
  return async (id: string): Promise<Credit | null> => {
    return service.getCreditById(id)
  }
}

export const buildCreateCreditUseCase = (service: CreditService) => {
  return async (request: CreateCreditRequest, businessId: string): Promise<Credit> => {
    return service.createCredit(request, businessId)
  }
}

export const buildUpdateCreditUseCase = (service: CreditService) => {
  return async (request: UpdateCreditRequest, businessId: string): Promise<Credit> => {
    return service.updateCredit(request, businessId)
  }
}


