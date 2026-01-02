export interface DashboardStats {
  dailyCollection: number
  weeklyCollection: number
  monthlyCollection: number
  activeCredits: number
  clientsInArrears: number
  totalCollected: number
  upToDatePercentage: number
  overduePercentage: number
  cashCollection: number
  transactionCollection: number
  cashCount: number
  transactionCount: number
  weeklyCollectionData: DailyCollectionData[]
  totalClients: number
}

export interface DailyCollectionData {
  day: number
  label: string
  amount: number
  cash: number
  transaction: number
}

export interface DashboardStatsRequest {
  startDate?: Date
  endDate?: Date
  businessId?: string
}


