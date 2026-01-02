import { ICreditRepository, CreditWithUserEmail } from '../port'
import { CreateCreditRequest, UpdateCreditRequest } from '../models'
import { CreditFilters } from '@/shared/types/filters'

export class CreditService {
  constructor(private readonly repository: ICreditRepository) {}

  async getCredits() {
    return this.repository.getCredits()
  }

  async getCreditsByClientId(clientId: string) {
    if (!clientId) {
      throw new Error('ID de cliente es requerido')
    }
    return this.repository.getCreditsByClientId(clientId)
  }

  async getCreditById(id: string) {
    if (!id) {
      throw new Error('ID de crédito es requerido')
    }
    return this.repository.getCreditById(id)
  }

  async createCredit(request: CreateCreditRequest, businessId: string) {
    if (!request.client_id) {
      throw new Error('ID de cliente es requerido')
    }

    if (!request.total_amount || request.total_amount <= 0) {
      throw new Error('El monto total debe ser mayor a cero')
    }

    if (!request.installment_amount || request.installment_amount <= 0) {
      throw new Error('El monto de la cuota debe ser mayor a cero')
    }

    if (!request.total_installments || request.total_installments <= 0) {
      throw new Error('El número de cuotas debe ser mayor a cero')
    }

    if (request.installment_amount * request.total_installments > request.total_amount * 1.1) {
      throw new Error('La suma de las cuotas no puede exceder el monto total en más del 10%')
    }

    if (!businessId) {
      throw new Error('ID de negocio es requerido')
    }

    return this.repository.createCredit(request, businessId)
  }

  async updateCredit(request: UpdateCreditRequest, businessId: string) {
    if (!request.id) {
      throw new Error('ID de crédito es requerido')
    }

    if (request.total_balance !== undefined && request.total_balance < 0) {
      throw new Error('El saldo total no puede ser negativo')
    }

    if (!businessId) {
      throw new Error('ID de negocio es requerido')
    }

    return this.repository.updateCredit(request, businessId)
  }

  async getCreditsWithFilters(filters: CreditFilters): Promise<CreditWithUserEmail[]> {
    if (!filters.businessId) {
      throw new Error('ID de negocio es requerido')
    }
    return this.repository.getCreditsWithFilters(filters)
  }
}


