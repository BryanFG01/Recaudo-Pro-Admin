import { DashboardService } from '../../domain/services/DashboardService'
import { DashboardStats, DashboardStatsRequest } from '../../domain/models'

export const buildGetDashboardStatsUseCase = (service: DashboardService) => {
  return async (request: DashboardStatsRequest): Promise<DashboardStats> => {
    return service.getDashboardStats(request)
  }
}


