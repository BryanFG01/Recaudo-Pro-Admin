import { useMemo } from 'react'
import useSWR from 'swr'
import { DashboardService } from '../../domain/services/DashboardService'
import { DashboardRepository } from '../../infrastructure/repositories/DashboardRepository'
import { buildGetDashboardStatsUseCase } from '../../application/useCases'
import { DashboardStatsRequest } from '../../domain/models'

export const useDashboard = (request: DashboardStatsRequest) => {
  // Instanciar Repository y Service
  const dashboardService = useMemo(() => {
    const repository = new DashboardRepository()
    return new DashboardService(repository)
  }, [])

  // Construir Use Case
  const getDashboardStatsUseCase = useMemo(
    () => buildGetDashboardStatsUseCase(dashboardService),
    [dashboardService]
  )

  // Usar SWR para data fetching
  const { data, error, isLoading, mutate } = useSWR(
    ['dashboard-stats', request],
    () => getDashboardStatsUseCase(request)
  )

  return {
    stats: data,
    error,
    isLoading,
    refetch: mutate,
  }
}


