import { IDashboardRepository } from '../port'
import { DashboardStats, DashboardStatsRequest } from '../models'

export class DashboardService {
  constructor(private readonly repository: IDashboardRepository) {}

  async getDashboardStats(request: DashboardStatsRequest): Promise<DashboardStats> {
    // Validaciones de negocio
    if (!request.businessId) {
      throw new Error('ID de negocio es requerido')
    }

    if (request.startDate && request.endDate) {
      if (request.startDate > request.endDate) {
        throw new Error('La fecha de inicio debe ser anterior a la fecha de fin')
      }
    }

    return this.repository.getDashboardStats(request)
  }
}


