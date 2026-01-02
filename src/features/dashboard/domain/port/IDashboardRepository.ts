import { DashboardStats, DashboardStatsRequest } from '../models'

export interface IDashboardRepository {
  getDashboardStats(request: DashboardStatsRequest): Promise<DashboardStats>
}


