import { IDashboardRepository } from '../../domain/port'
import { DashboardStats, DashboardStatsRequest, DailyCollectionData } from '../../domain/models'
import { apiClient } from '@/shared/config/api'

type CollectionRow = { amount: number; payment_date: string; payment_method?: string | null }
type CreditRow = { client_id: string; total_balance: number; overdue_installments: number }

/**
 * Calcula las estadísticas del dashboard a partir de:
 * - GET /api/collections?businessId=&startDate=&endDate=
 * - GET /api/credits?businessId=
 * - GET /api/clients?business_code= o business_id= (solo business; Total de Clientes)
 */
export class DashboardRepository implements IDashboardRepository {
  async getDashboardStats(request: DashboardStatsRequest): Promise<DashboardStats> {
    if (!request.businessId) {
      throw new Error('businessId es requerido para obtener estadísticas del dashboard')
    }

    const businessId = request.businessId
    const startDate = request.startDate
    const endDate = request.endDate
    const now = new Date()

    // 1. Recaudos del período
    let collections: CollectionRow[] = []
    try {
      const params = new URLSearchParams({ businessId })
      if (startDate) params.set('startDate', startDate.toISOString())
      if (endDate) params.set('endDate', endDate.toISOString())
      const data = await apiClient.get<CollectionRow[]>(`/api/collections?${params.toString()}`)
      collections = Array.isArray(data) ? data : []
    } catch {
      collections = []
    }

    // 2. Créditos del negocio
    let credits: CreditRow[] = []
    try {
      const data = await apiClient.get<CreditRow[]>(`/api/credits?businessId=${encodeURIComponent(businessId)}`)
      credits = Array.isArray(data) ? data : []
    } catch {
      credits = []
    }

    // 3. Total de clientes: GET /api/clients. Según Swagger solo business_code es necesario; no se envían user_id/user_number.
    let totalClientsFromCredits = 0
    {
      const getClientId = (r: Record<string, unknown>): string =>
        String(r.client_id ?? r.clientId ?? '').trim()
      totalClientsFromCredits = new Set(
        credits.map((c) => getClientId(c as Record<string, unknown>)).filter(Boolean)
      ).size
    }
    let totalClients = totalClientsFromCredits
    const hasBusiness = request.businessCode || businessId
    if (hasBusiness) {
      try {
        const params = new URLSearchParams()
        if (request.businessCode) params.set('business_code', request.businessCode)
        else params.set('business_id', businessId)
        const clients = await apiClient.get<unknown[]>(`/api/clients?${params.toString()}`)
        if (Array.isArray(clients)) totalClients = clients.length
      } catch {
        // mantener totalClientsFromCredits
      }
    }

    // --- Recaudos: totales y por método ---
    let totalCollected = 0
    let cashCollection = 0
    let transactionCollection = 0
    let cashCount = 0
    let transactionCount = 0
    const dailyDataMap: Record<string, number> = {}
    const dailyCashMap: Record<string, number> = {}
    const dailyTransactionMap: Record<string, number> = {}

    for (const c of collections) {
      const amount = Number(c.amount) || 0
      totalCollected += amount
      const pm = (c.payment_method || '').toLowerCase()
      if (pm === 'efectivo') {
        cashCollection += amount
        cashCount++
      } else if (pm === 'transacción' || pm === 'transaccion') {
        transactionCollection += amount
        transactionCount++
      }
      const d = c.payment_date ? new Date(c.payment_date) : null
      if (d) {
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
        dailyDataMap[key] = (dailyDataMap[key] || 0) + amount
        if (pm === 'efectivo') dailyCashMap[key] = (dailyCashMap[key] || 0) + amount
        if (pm === 'transacción' || pm === 'transaccion') dailyTransactionMap[key] = (dailyTransactionMap[key] || 0) + amount
      }
    }

    // --- Créditos ---
    const totalCredits = credits.length
    const activeCredits = credits.filter((c) => (Number(c.total_balance) || 0) > 0).length
    const clientsInArrears = credits.filter((c) => (Number(c.overdue_installments) || 0) > 0 && (Number(c.total_balance) || 0) > 0).length

    const upToDatePercentage = activeCredits > 0 ? ((activeCredits - clientsInArrears) / activeCredits) * 100 : 0
    const overduePercentage = Math.max(0, 100 - upToDatePercentage)

    // --- daily/weekly/monthly (derivados del período) ---
    let dailyCollection = 0
    let weeklyCollection = totalCollected
    let monthlyCollection = totalCollected
    if (startDate && endDate) {
      const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
      if (daysDiff <= 1) {
        dailyCollection = totalCollected
        weeklyCollection = 0
        monthlyCollection = 0
      } else if (daysDiff <= 7) {
        dailyCollection = 0
        monthlyCollection = 0
      } else {
        dailyCollection = 0
        weeklyCollection = 0
      }
    }

    // --- weeklyCollectionData ---
    let weeklyCollectionData: DailyCollectionData[] = []
    const dayLabels = ['L', 'M', 'X', 'J', 'V', 'S', 'D']

    if (startDate && endDate) {
      const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

      if (daysDiff <= 1) {
        const k = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-${String(startDate.getDate()).padStart(2, '0')}`
        weeklyCollectionData = [{
          day: startDate.getDate(),
          label: 'Hoy',
          amount: dailyDataMap[k] || 0,
          cash: dailyCashMap[k] || 0,
          transaction: dailyTransactionMap[k] || 0,
        }]
      } else if (daysDiff <= 7) {
        for (let i = 0; i < 7; i++) {
          const d = new Date(startDate)
          d.setDate(d.getDate() + i)
          const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
          weeklyCollectionData.push({
            day: d.getDay() === 0 ? 7 : d.getDay(),
            label: dayLabels[i] || String(i + 1),
            amount: dailyDataMap[k] || 0,
            cash: dailyCashMap[k] || 0,
            transaction: dailyTransactionMap[k] || 0,
          })
        }
      } else {
        let cur = new Date(startDate)
        while (cur < endDate && cur <= today) {
          const k = `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, '0')}-${String(cur.getDate()).padStart(2, '0')}`
          weeklyCollectionData.push({
            day: cur.getDate(),
            label: String(cur.getDate()),
            amount: dailyDataMap[k] || 0,
            cash: dailyCashMap[k] || 0,
            transaction: dailyTransactionMap[k] || 0,
          })
          cur.setDate(cur.getDate() + 1)
        }
      }
    } else {
      for (let i = 1; i <= 7; i++) {
        weeklyCollectionData.push({ day: i, label: dayLabels[i - 1] || String(i), amount: 0, cash: 0, transaction: 0 })
      }
    }

    return {
      dailyCollection,
      weeklyCollection,
      monthlyCollection,
      activeCredits,
      clientsInArrears,
      totalCollected,
      upToDatePercentage,
      overduePercentage,
      cashCollection,
      transactionCollection,
      cashCount,
      transactionCount,
      weeklyCollectionData,
      totalClients,
      totalCredits,
    }
  }
}
