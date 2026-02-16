import { apiClient } from '@/shared/config/api'
import {
  CashSession,
  CashSessionFlow,
  CreateCashSessionRequest,
  DailySummaryResponse,
  UpdateCashSessionRequest
} from '../../domain/models'
import { ICashSessionRepository } from '../../domain/port'

function toNum(v: unknown): number {
  if (typeof v === 'number' && !Number.isNaN(v)) return v
  const n = Number(v)
  return Number.isNaN(n) ? 0 : n
}

function normalizeFlow(raw: Record<string, unknown>): CashSessionFlow {
  return {
    cash_session_id: String(raw.cash_session_id ?? raw.cashSessionId ?? ''),
    business_id: String(raw.business_id ?? raw.businessId ?? ''),
    user_id: String(raw.user_id ?? raw.userId ?? ''),
    session_date: String(raw.session_date ?? raw.sessionDate ?? ''),
    initial_balance: toNum(raw.initial_balance ?? raw.initialBalance),
    allowed_to_withdraw: raw.allowed_to_withdraw === true || raw.allowedToWithdraw === true,
    session_created_at: typeof raw.session_created_at === 'string' ? raw.session_created_at : (raw.sessionCreatedAt as string) ?? undefined,
    session_updated_at: typeof raw.session_updated_at === 'string' ? raw.session_updated_at : (raw.sessionUpdatedAt as string) ?? undefined,
    total_credits: toNum(raw.total_credits ?? raw.totalCredits),
    total_collected: toNum(raw.total_collected ?? raw.totalCollected),
    total_withdrawals_approved: toNum(raw.total_withdrawals_approved ?? raw.totalWithdrawalsApproved),
    caja_inicial_restante: toNum(raw.caja_inicial_restante ?? raw.cajaInicialRestante),
    total_recaudo_mostrado: toNum(raw.total_recaudo_mostrado ?? raw.totalRecaudoMostrado),
    saldo_disponible: toNum(raw.saldo_disponible ?? raw.saldoDisponible),
    efectivo_en_caja: toNum(raw.efectivo_en_caja ?? raw.efectivoEnCaja)
  }
}

export class CashSessionRepository implements ICashSessionRepository {
  /**
   * POST /api/cash-sessions — crea una sesión de caja con saldo inicial.
   * La caja es por usuario: user_id es requerido; solo una sesión por usuario por día
   * (varios cobradores pueden tener sesión el mismo día en el mismo negocio).
   * Si ya existe sesión para ese usuario y fecha, el backend responde 400.
   * Body: business_id, business_code (opc.), user_id, session_date (YYYY-MM-DD),
   * initial_balance, allowed_to_withdraw.
   */
  async create(request: CreateCashSessionRequest): Promise<CashSession> {
    const body: Record<string, unknown> = {
      business_id: request.business_id,
      user_id: request.user_id,
      session_date: request.session_date,
      initial_balance: Number(request.initial_balance),
      allowed_to_withdraw: request.allowed_to_withdraw ?? true
    }
    if (request.business_code != null && request.business_code !== '') {
      body.business_code = request.business_code
    }
    return apiClient.post<CashSession>('/api/cash-sessions', body)
  }

  async update(id: string, request: UpdateCashSessionRequest): Promise<CashSession> {
    return apiClient.patch<CashSession>(`/api/cash-sessions/${id}`, request)
  }

  async getById(id: string): Promise<CashSession | null> {
    try {
      return await apiClient.get<CashSession>(`/api/cash-sessions/${id}`)
    } catch {
      return null
    }
  }

  async getByBusinessId(businessId: string): Promise<CashSession[]> {
    try {
      const params = new URLSearchParams({ business_id: businessId })
      const data = await apiClient.get<CashSession[]>(`/api/cash-sessions?${params.toString()}`)
      return Array.isArray(data) ? data : []
    } catch {
      return []
    }
  }

  /** GET /api/cash-sessions/user/{userId} — sesiones de caja del usuario */
  async getByUserId(userId: string): Promise<CashSession[]> {
    try {
      const data = await apiClient.get<CashSession[]>(
        `/api/cash-sessions/user/${encodeURIComponent(userId)}`
      )
      return Array.isArray(data) ? data : []
    } catch {
      return []
    }
  }

  /** GET /api/cash-sessions/flow/{id} — flujo/seguimiento de saldo de la sesión */
  async getFlow(id: string): Promise<CashSessionFlow | null> {
    try {
      const raw = await apiClient.get<Record<string, unknown>>(
        `/api/cash-sessions/flow/${encodeURIComponent(id)}`
      )
      return raw && typeof raw === 'object' ? normalizeFlow(raw) : null
    } catch {
      return null
    }
  }

  /** GET /api/cash-sessions/daily-summary/user/{userId} — resumen diario por usuario */
  async getDailySummaryByUser(userId: string): Promise<DailySummaryResponse | null> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const raw: any = await apiClient.get(
        `/api/cash-sessions/daily-summary/user/${encodeURIComponent(userId)}`
      )
      if (!raw || typeof raw !== 'object') return null
      const items = Array.isArray(raw.items) ? raw.items.map((item: any) => ({
        user_id: String(item.user_id ?? ''),
        business_id: String(item.business_id ?? ''),
        session_date: String(item.session_date ?? ''),
        initial_balance: toNum(item.initial_balance),
        saldo_dia_anterior: toNum(item.saldo_dia_anterior),
        total_ingresos: toNum(item.total_ingresos),
        total_recaudo: toNum(item.total_recaudo),
        total_ventas: toNum(item.total_ventas),
        total_retiros: toNum(item.total_retiros),
        total_gastos: toNum(item.total_gastos),
        caja_actual: toNum(item.caja_actual)
      })) : []
      const t = raw.totals ?? {}
      return {
        items,
        totals: {
          total_ingresos: toNum(t.total_ingresos),
          total_recaudo: toNum(t.total_recaudo),
          total_ventas: toNum(t.total_ventas),
          total_retiros: toNum(t.total_retiros),
          total_gastos: toNum(t.total_gastos),
          caja_actual: toNum(t.caja_actual)
        }
      }
    } catch {
      return null
    }
  }

  /** DELETE /api/cash-sessions/{id} — id: UUID de la sesión de caja */
  async delete(id: string): Promise<void> {
    await apiClient.delete<void>(`/api/cash-sessions/${encodeURIComponent(id)}`)
  }
}
