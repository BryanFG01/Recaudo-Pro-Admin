export interface CashSession {
  id: string
  business_id: string
  business_code?: string
  user_id: string
  session_date: string
  initial_balance: number
  allowed_to_withdraw: boolean
  created_at?: string
  updated_at?: string
}

export interface CreateCashSessionRequest {
  business_id: string
  business_code?: string
  user_id: string
  session_date: string
  initial_balance: number
  allowed_to_withdraw: boolean
}

export interface UpdateCashSessionRequest {
  session_date?: string
  initial_balance?: number
  allowed_to_withdraw?: boolean
}

/** Item individual del resumen diario por usuario */
export interface DailySummaryItem {
  user_id: string
  business_id: string
  session_date: string
  initial_balance: number
  saldo_dia_anterior: number
  total_ingresos: number
  total_recaudo: number
  total_ventas: number
  total_retiros: number
  total_gastos: number
  caja_actual: number
}

/** Totales acumulados del resumen diario */
export interface DailySummaryTotals {
  total_ingresos: number
  total_recaudo: number
  total_ventas: number
  total_retiros: number
  total_gastos: number
  caja_actual: number
}

/** Respuesta de GET /api/cash-sessions/daily-summary/user/{userId} */
export interface DailySummaryResponse {
  items: DailySummaryItem[]
  totals: DailySummaryTotals
}

/** Respuesta de GET /api/cash-sessions/flow/{id} — seguimiento de saldo de una sesión */
export interface CashSessionFlow {
  cash_session_id: string
  business_id: string
  user_id: string
  session_date: string
  initial_balance: number
  allowed_to_withdraw: boolean
  session_created_at?: string
  session_updated_at?: string
  total_credits: number
  total_collected: number
  total_withdrawals_approved: number
  caja_inicial_restante: number
  total_recaudo_mostrado: number
  saldo_disponible: number
  efectivo_en_caja: number
}
