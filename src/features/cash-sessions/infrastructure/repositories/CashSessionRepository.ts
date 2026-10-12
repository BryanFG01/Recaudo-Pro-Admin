import { apiClient } from '@/shared/config/api'
import {
  CashSession,
  CashSessionEvent,
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
        caja_actual: toNum(item.caja_actual),
        cash_session_id: String(item.cash_session_id ?? ''),
        status: item.status === 'closed' ? 'closed' : 'open',
        closed_at: typeof item.closed_at === 'string' ? item.closed_at : null,
        closing_balance: item.closing_balance == null ? null : toNum(item.closing_balance),
        total_retiros_pendientes: toNum(item.total_retiros_pendientes)
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

  /** POST /api/cash-sessions/open — abre la caja del cobrador (o la reabre si es de hoy). */
  async open(userId: string): Promise<CashSession> {
    return apiClient.post<CashSession>('/api/cash-sessions/open', { user_id: userId })
  }

  /** POST /api/cash-sessions/{id}/close — cierra la caja guardando su caja final. */
  async close(id: string): Promise<CashSession> {
    return apiClient.post<CashSession>(`/api/cash-sessions/${encodeURIComponent(id)}/close`, {})
  }

  /** POST /api/cash-sessions/{id}/top-up — recarga: el monto se suma a la caja inicial. */
  async topUp(id: string, amount: number): Promise<CashSession> {
    return apiClient.post<CashSession>(`/api/cash-sessions/${encodeURIComponent(id)}/top-up`, { amount })
  }

  /** GET /api/cash-sessions/{id}/events — aperturas y cierres (más reciente primero). */
  async getEvents(id: string): Promise<CashSessionEvent[]> {
    const raw = await apiClient.get<unknown>(`/api/cash-sessions/${encodeURIComponent(id)}/events`)
    if (!Array.isArray(raw)) return []
    return raw.map((e: Record<string, unknown>) => ({
      id: String(e.id ?? ''),
      cash_session_id: String(e.cash_session_id ?? ''),
      actor_id: String(e.actor_id ?? ''),
      actor_role: String(e.actor_role ?? ''),
      event: (['close', 'reopen', 'top_up'] as const).find((k) => k === e.event) ?? 'open',
      balance: toNum(e.balance),
      created_at: String(e.created_at ?? '')
    }))
  }
}
