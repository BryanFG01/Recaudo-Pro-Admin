export type CashSessionStatus = 'open' | 'closed'

export interface CashSession {
  id: string
  business_id: string
  business_code?: string
  user_id: string
  session_date: string
  initial_balance: number
  allowed_to_withdraw: boolean
  /** Abierta: acepta cobros, ventas, gastos y retiros. Cerrada: guardó su caja final. */
  status: CashSessionStatus
  closed_at?: string | null
  /** Caja final al cerrar (será la caja inicial de la siguiente). */
  closing_balance?: number | null
  created_at?: string
  updated_at?: string
}

/** Apertura, cierre o reapertura de una caja (GET /api/cash-sessions/{id}/events). */
export interface CashSessionEvent {
  id: string
  cash_session_id: string
  actor_id: string
  actor_role: string
  event: 'open' | 'close' | 'reopen' | 'top_up'
  /** Caja en ese momento (en una recarga: el monto recargado). */
  balance: number
  created_at: string
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
  cash_session_id: string
  status: CashSessionStatus
  closed_at: string | null
  closing_balance: number | null
  /** Retiros esperando aprobación (aún no restan). */
  total_retiros_pendientes: number
}

/** Totales de la caja actual (la más reciente) */
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
