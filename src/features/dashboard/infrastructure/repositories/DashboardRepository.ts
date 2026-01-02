import { IDashboardRepository } from '../../domain/port'
import { DashboardStats, DashboardStatsRequest, DailyCollectionData } from '../../domain/models'
import { supabase } from '@/shared/config/supabase'

export class DashboardRepository implements IDashboardRepository {
  async getDashboardStats(request: DashboardStatsRequest): Promise<DashboardStats> {
    if (!request.businessId) {
      throw new Error('businessId es requerido para obtener estadísticas del dashboard')
    }

    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000)
    const weekStart = new Date(todayStart)
    weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1)
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

    // Recaudos del día
    let dailyQuery = supabase
      .from('collections')
      .select('amount, payment_method')
      .eq('business_id', request.businessId)
      .gte('payment_date', todayStart.toISOString())
      .lt('payment_date', todayEnd.toISOString())
    
    const { data: dailyData } = await dailyQuery

    const dailyCollection = (dailyData || []).reduce((sum, item) => sum + (item.amount as number), 0)

    // Recaudos de la semana
    const { data: weeklyData } = await supabase
      .from('collections')
      .select('amount, payment_method, payment_date')
      .eq('business_id', request.businessId)
      .gte('payment_date', weekStart.toISOString())

    let weeklyCollection = 0
    let weeklyCash = 0
    let weeklyTransaction = 0
    let weeklyCashCount = 0
    let weeklyTransactionCount = 0
    const weeklyDataMap: Record<number, number> = {}

    weeklyData?.forEach(item => {
      const amount = item.amount as number
      weeklyCollection += amount
      const date = new Date(item.payment_date as string)
      const weekday = date.getDay() === 0 ? 7 : date.getDay()
      weeklyDataMap[weekday] = (weeklyDataMap[weekday] || 0) + amount

      const paymentMethod = (item.payment_method as string)?.toLowerCase()
      if (paymentMethod === 'efectivo') {
        weeklyCash += amount
        weeklyCashCount++
      } else if (paymentMethod === 'transacción' || paymentMethod === 'transaccion') {
        weeklyTransaction += amount
        weeklyTransactionCount++
      }
    })

    // Recaudos del mes
    const { data: monthlyData } = await supabase
      .from('collections')
      .select('amount, payment_method')
      .eq('business_id', request.businessId)
      .gte('payment_date', monthStart.toISOString())

    const monthlyCollection = (monthlyData || []).reduce((sum, item) => sum + (item.amount as number), 0)

    // Créditos activos
    const { data: creditsData } = await supabase
      .from('credits')
      .select('id, overdue_installments, client_id')
      .eq('business_id', request.businessId)
      .gt('total_balance', 0)

    const activeCredits = creditsData?.length || 0
    const clientsInArrears = creditsData?.filter(c => (c.overdue_installments as number) > 0).length || 0
    const uniqueClients = new Set(creditsData?.map(c => c.client_id as string) || []).size

    const upToDatePercentage = activeCredits > 0 
      ? ((activeCredits - clientsInArrears) / activeCredits) * 100 
      : 0

    // Calcular datos por período
    let totalCollected = weeklyCollection
    let cashCollection = weeklyCash
    let transactionCollection = weeklyTransaction
    let cashCount = weeklyCashCount
    let transactionCount = weeklyTransactionCount
    let dailyCollectionData: DailyCollectionData[] = []

    if (request.startDate && request.endDate) {
      const { data: periodData } = await supabase
        .from('collections')
        .select('amount, payment_method, payment_date')
        .eq('business_id', request.businessId)
        .gte('payment_date', request.startDate.toISOString())
        .lt('payment_date', request.endDate.toISOString())
        .order('payment_date', { ascending: true })

      totalCollected = 0
      cashCollection = 0
      transactionCollection = 0
      cashCount = 0
      transactionCount = 0

      const dailyDataMap: Record<string, number> = {}
      const dailyCashMap: Record<string, number> = {}
      const dailyTransactionMap: Record<string, number> = {}

      periodData?.forEach(item => {
        const amount = item.amount as number
        totalCollected += amount
        const date = new Date(item.payment_date as string)
        const dayKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
        
        dailyDataMap[dayKey] = (dailyDataMap[dayKey] || 0) + amount

        const paymentMethod = (item.payment_method as string)?.toLowerCase()
        if (paymentMethod === 'efectivo') {
          cashCollection += amount
          cashCount++
          dailyCashMap[dayKey] = (dailyCashMap[dayKey] || 0) + amount
        } else if (paymentMethod === 'transacción' || paymentMethod === 'transaccion') {
          transactionCollection += amount
          transactionCount++
          dailyTransactionMap[dayKey] = (dailyTransactionMap[dayKey] || 0) + amount
        }
      })

      const daysDiff = Math.ceil((request.endDate.getTime() - request.startDate.getTime()) / (1000 * 60 * 60 * 24))
      const dayLabels = ['L', 'M', 'X', 'J', 'V', 'S', 'D']

      if (daysDiff === 1) {
        const todayKey = `${request.startDate.getFullYear()}-${String(request.startDate.getMonth() + 1).padStart(2, '0')}-${String(request.startDate.getDate()).padStart(2, '0')}`
        dailyCollectionData = [{
          day: request.startDate.getDate(),
          label: 'Hoy',
          amount: dailyDataMap[todayKey] || 0,
          cash: dailyCashMap[todayKey] || 0,
          transaction: dailyTransactionMap[todayKey] || 0,
        }]
      } else if (daysDiff <= 7) {
        for (let i = 0; i < 7; i++) {
          const currentDate = new Date(request.startDate)
          currentDate.setDate(currentDate.getDate() + i)
          const dayKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`
          dailyCollectionData.push({
            day: currentDate.getDay() === 0 ? 7 : currentDate.getDay(),
            label: dayLabels[i],
            amount: dailyDataMap[dayKey] || 0,
            cash: dailyCashMap[dayKey] || 0,
            transaction: dailyTransactionMap[dayKey] || 0,
          })
        }
      } else {
        let currentDate = new Date(request.startDate)
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        while (currentDate < request.endDate && currentDate <= today) {
          const dayKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`
          dailyCollectionData.push({
            day: currentDate.getDate(),
            label: String(currentDate.getDate()),
            amount: dailyDataMap[dayKey] || 0,
            cash: dailyCashMap[dayKey] || 0,
            transaction: dailyTransactionMap[dayKey] || 0,
          })
          currentDate.setDate(currentDate.getDate() + 1)
          if (currentDate > today) break
        }
      }
    } else {
      const dayLabels = ['L', 'M', 'X', 'J', 'V', 'S', 'D']
      for (let i = 1; i <= 7; i++) {
        dailyCollectionData.push({
          day: i,
          label: dayLabels[i - 1],
          amount: weeklyDataMap[i] || 0,
          cash: 0,
          transaction: 0,
        })
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
      overduePercentage: 100 - upToDatePercentage,
      cashCollection,
      transactionCollection,
      cashCount,
      transactionCount,
      weeklyCollectionData: dailyCollectionData,
      totalClients: uniqueClients,
    }
  }
}


