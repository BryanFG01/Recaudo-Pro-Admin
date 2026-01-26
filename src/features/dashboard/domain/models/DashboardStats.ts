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
  /** Total de clientes (con al menos un crédito en el negocio) */
  totalClients: number
  /** Total de créditos en el negocio */
  totalCredits: number
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
  /** Para GET /api/clients. user_number tiene prioridad si se envía. */
  userId?: string
  /** Código del negocio (ej. ARG01). Prioridad sobre businessId en /api/clients. */
  businessCode?: string
  /** Número del usuario (ej. ARGCOBRADOR1). Prioridad sobre userId en /api/clients. */
  userNumber?: string
}


